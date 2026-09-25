import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Color, DoubleSide, Plane, Vector3, type Group, type Material, type Mesh, type MeshStandardMaterial, type Side } from 'three'
import { PARTS } from '../data/parts'
import { useStore } from '../store'
import { sim } from '../sim'
import { registerPart } from './registry'

export type V3 = [number, number, number]

const WHITE = new Color('#ffffff')
const cutAxis = new Vector3()
const cutPoint = new Vector3()
const toCamera = new Vector3()
const HOVER_COLOR = new Color('#f59e0b')
const CUTAWAY_OPACITY = 0.2
const GHOST_OPACITY = 0.06

/**
 * Cara de corte. Con el plano de sección activo, la malla se dibuja por ambos
 * lados y lo que se ve “por dentro” (caras traseras) es la superficie cortada.
 * - solid: pieza maciza (bloque, culata) → rayado como en los planos técnicos.
 * - shell: carcasa hueca (caja, cárter, carrocería) → su interior en sombra.
 */
export type SectionStyle = 'solid' | 'shell'

// Se inyecta antes del tone mapping, así que los colores van en espacio lineal.
const CAP_GLSL: Record<SectionStyle, string> = {
  solid: /* glsl */ `
    if (!gl_FrontFacing) {
      float stripe = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 9.0));
      gl_FragColor = vec4(mix(vec3(0.26, 0.018, 0.006), vec3(0.64, 0.07, 0.013), stripe), 1.0);
    }`,
  shell: /* glsl */ `
    if (!gl_FrontFacing) gl_FragColor = vec4(diffuseColor.rgb * 0.05, 1.0);`,
}

interface OwnedMaterial {
  own: Material
  baseOpacity: number
  baseTransparent: boolean
  baseSide: Side
  baseEmissive: Color
  baseEmissiveIntensity: number
}

/** Garantiza que la malla tenga su propio material (clonado) y recuerda sus valores base. */
function ownMaterial(mesh: Mesh, style: SectionStyle): (MeshStandardMaterial & OwnedMaterial) | null {
  if (Array.isArray(mesh.material)) return null
  const ud = mesh.userData as Partial<OwnedMaterial>
  if (ud.own !== mesh.material) {
    const clone = mesh.material.clone() as MeshStandardMaterial
    clone.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `${CAP_GLSL[style]}\n#include <tonemapping_fragment>`,
      )
    }
    clone.customProgramCacheKey = () => `corte-${style}`
    mesh.material = clone
    Object.assign(mesh.userData, {
      own: clone,
      baseOpacity: clone.opacity,
      baseTransparent: clone.transparent,
      baseSide: clone.side,
      baseEmissive: clone.emissive ? clone.emissive.clone() : new Color(0),
      baseEmissiveIntensity: clone.emissiveIntensity ?? 1,
    })
  }
  return Object.assign(mesh.material as MeshStandardMaterial, mesh.userData as OwnedMaterial)
}

interface PartProps {
  /** Clave en PARTS. Varias instancias pueden compartir id (se resaltan juntas). */
  id: string
  /** Desplazamiento en la vista explosionada (coordenadas del mundo, metros). */
  explode?: V3
  /** Carcasa: se vuelve translúcida o se corta según el modo de interior. */
  cutaway?: boolean
  /**
   * Cómo se ve la cara cortada. También activa el corte en piezas que no son carcasa (ej. carrocería).
   * 'translucent': en modo corte se vuelve translúcida en vez de cortarse (tubos que van a un costado).
   */
  section?: SectionStyle | 'translucent'
  /** Opacidad forzada (ej. carrocería en modo rayos X). */
  opacity?: number
  children: ReactNode
}

export function Part({ id, explode = [0, 0, 0], cutaway = false, section, opacity, children }: PartProps) {
  const ref = useRef<Group>(null)
  const camera = useThree((s) => s.camera)
  const system = PARTS[id].system
  const hidden = useStore((s) => s.hidden[system])
  const selected = useStore((s) => s.selected === id)
  const hovered = useStore((s) => s.hovered === id)
  const ghost = useStore((s) => s.isolate && s.selected !== null && s.selected !== id)
  const interior = useStore((s) => s.interior)

  const capStyle: SectionStyle = section === 'shell' ? 'shell' : 'solid'
  const sectionMode = interior === 'seccion'
  const sectioned = sectionMode && section !== 'translucent' && (cutaway || section !== undefined)
  const translucent = cutaway && (interior === 'translucido' || (sectionMode && section === 'translucent'))
  const baseOpacity = opacity ?? (translucent ? CUTAWAY_OPACITY : 1)
  const op = ghost ? GHOST_OPACITY : baseOpacity
  // Las piezas casi transparentes dejan pasar el clic a lo que hay detrás.
  const interactive = !hidden && op >= 0.5

  // Plano de corte propio: sigue a la pieza cuando se desarma.
  const plane = useMemo(() => new Plane(new Vector3(0, 0, -1), 0), [])
  const planes = useMemo(() => [plane], [plane])

  useEffect(() => registerPart(id, ref.current!), [id])

  // Sin dependencias a propósito: los hijos pueden cambiar de material al re-renderizar.
  useEffect(() => {
    ref.current?.traverse((obj) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh || mesh.userData.noHighlight) return
      const mat = ownMaterial(mesh, capStyle)
      if (!mat) return
      if (mat.emissive) {
        if (selected) {
          // Brilla en su propio color: no cambia colores que los textos mencionan (disco marrón, corona dorada…)
          mat.emissive.copy(mat.color).lerp(WHITE, 0.12)
          mat.emissiveIntensity = 0.55
        } else if (hovered) {
          mat.emissive.copy(HOVER_COLOR)
          mat.emissiveIntensity = 0.35
        } else {
          mat.emissive.copy(mat.baseEmissive)
          mat.emissiveIntensity = mat.baseEmissiveIntensity
        }
      }
      const transparent = mat.baseTransparent || op < 1
      const side = sectioned ? DoubleSide : mat.baseSide
      if (mat.transparent !== transparent || mat.side !== side) {
        mat.transparent = transparent
        mat.side = side
        mat.needsUpdate = true
      }
      mat.clippingPlanes = sectioned ? planes : null
      mat.opacity = mat.baseOpacity * op
      mat.depthWrite = !transparent
    })
  })

  useFrame(() => {
    const t = sim.explode
    ref.current?.position.set(explode[0] * t, explode[1] * t, explode[2] * t)
    const g = ref.current
    if (sectioned && g?.parent) {
      // Corta por el plano vertical que contiene el eje longitudinal (X local) del conjunto al que
      // pertenece la pieza, y quita siempre la mitad que da a la cámara. En un motor transversal,
      // X local es el cigüeñal, así que el corte sigue mostrando los cuatro cilindros.
      g.parent.updateWorldMatrix(true, false)
      cutAxis.set(0, 0, 1).transformDirection(g.parent.matrixWorld)
      cutPoint.set(0, 0, explode[2] * t).applyMatrix4(g.parent.matrixWorld)
      const side = toCamera.subVectors(camera.position, cutPoint).dot(cutAxis) >= 0 ? -1 : 1
      plane.setFromNormalAndCoplanarPoint(cutAxis.multiplyScalar(side), cutPoint)
    }
  })

  /** El rayo tocó la mitad que el corte ya quitó: el clic debe seguir hacia lo de atrás. */
  const cutAway = (p: Vector3) => sectioned && plane.distanceToPoint(p) < 0

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || cutAway(e.point)) return
    e.stopPropagation()
    useStore.getState().set({ hovered: id })
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (useStore.getState().hovered !== id) return
    useStore.getState().set({ hovered: null })
    document.body.style.cursor = 'auto'
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > 4 || cutAway(e.point)) return
    e.stopPropagation()
    useStore.getState().select(id)
  }

  return (
    <group ref={ref} visible={!hidden} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {children}
    </group>
  )
}

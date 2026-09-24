import { useEffect, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Color, type Group, type Material, type Mesh, type MeshStandardMaterial } from 'three'
import { PARTS } from '../data/parts'
import { useStore } from '../store'
import { sim } from '../sim'
import { registerPart } from './registry'

export type V3 = [number, number, number]

const SELECT_COLOR = new Color('#3b82f6')
const HOVER_COLOR = new Color('#f59e0b')
const CUTAWAY_OPACITY = 0.2
const GHOST_OPACITY = 0.06

interface OwnedMaterial {
  own: Material
  baseOpacity: number
  baseTransparent: boolean
  baseEmissive: Color
  baseEmissiveIntensity: number
}

/** Garantiza que la malla tenga su propio material (clonado) y recuerda sus valores base. */
function ownMaterial(mesh: Mesh): (MeshStandardMaterial & OwnedMaterial) | null {
  if (Array.isArray(mesh.material)) return null
  const ud = mesh.userData as Partial<OwnedMaterial>
  if (ud.own !== mesh.material) {
    const clone = mesh.material.clone() as MeshStandardMaterial
    mesh.material = clone
    Object.assign(mesh.userData, {
      own: clone,
      baseOpacity: clone.opacity,
      baseTransparent: clone.transparent,
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
  /** Se vuelve translúcida con el modo Corte, para ver el interior. */
  cutaway?: boolean
  /** Opacidad forzada (ej. carrocería en modo rayos X). */
  opacity?: number
  children: ReactNode
}

export function Part({ id, explode = [0, 0, 0], cutaway = false, opacity, children }: PartProps) {
  const ref = useRef<Group>(null)
  const system = PARTS[id].system
  const hidden = useStore((s) => s.hidden[system])
  const selected = useStore((s) => s.selected === id)
  const hovered = useStore((s) => s.hovered === id)
  const ghost = useStore((s) => s.isolate && s.selected !== null && s.selected !== id)
  const cutMode = useStore((s) => s.cutaway)

  const baseOpacity = opacity ?? (cutaway && cutMode ? CUTAWAY_OPACITY : 1)
  const op = ghost ? GHOST_OPACITY : baseOpacity
  // Las piezas casi transparentes dejan pasar el clic a lo que hay detrás.
  const interactive = !hidden && op >= 0.5

  useEffect(() => registerPart(id, ref.current!), [id])

  // Sin dependencias a propósito: los hijos pueden cambiar de material al re-renderizar.
  useEffect(() => {
    ref.current?.traverse((obj) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh || mesh.userData.noHighlight) return
      const mat = ownMaterial(mesh)
      if (!mat) return
      if (mat.emissive) {
        if (selected) {
          mat.emissive.copy(SELECT_COLOR)
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
      if (mat.transparent !== transparent) {
        mat.transparent = transparent
        mat.needsUpdate = true
      }
      mat.opacity = mat.baseOpacity * op
      mat.depthWrite = !transparent
    })
  })

  useFrame(() => {
    const t = sim.explode
    ref.current?.position.set(explode[0] * t, explode[1] * t, explode[2] * t)
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
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
    if (!interactive || e.delta > 4) return
    e.stopPropagation()
    useStore.getState().select(id)
  }

  return (
    <group ref={ref} visible={!hidden} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {children}
    </group>
  )
}

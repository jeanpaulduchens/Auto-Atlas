import { useMemo } from 'react'
import { ExtrudeGeometry, Shape, type BufferGeometry } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useStore } from '../store'
import { CARS } from '../cars'
import { Part } from './Part'
import { M } from './materials'
import { FRONT_AXLE_X, REAR_AXLE_X } from './layout'

type P2 = [number, number]
const ARCH_R = 0.42
const SILL_Y = 0.3

/**
 * Une vértices y recalcula normales: la luz corre continua por los biseles en
 * vez de marcar cada faceta (se notaba en los reflejos de la pintura).
 */
function smooth(geo: BufferGeometry) {
  geo.deleteAttribute('normal')
  geo.deleteAttribute('uv')
  const merged = mergeVertices(geo, 1e-4)
  merged.computeVertexNormals()
  return merged
}

/** Extruye un perfil lateral (x, y) a lo ancho del auto, centrado en z=0. */
function extrudeProfile(build: (s: Shape) => void, width: number, bevel: number, smoothed = false) {
  const shape = new Shape()
  build(shape)
  const geo = new ExtrudeGeometry(shape, {
    depth: width - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 8,
    curveSegments: 32,
  })
  geo.translate(0, 0, -(width - 2 * bevel) / 2)
  return smoothed ? smooth(geo) : geo
}

function polygon(pts: P2[]) {
  return (s: Shape) => {
    s.moveTo(...pts[0])
    pts.slice(1).forEach((p) => s.lineTo(...p))
    s.closePath()
  }
}

function lowerBody(s: Shape) {
  s.moveTo(2.18, SILL_Y)
  s.lineTo(2.25, 0.45)
  s.quadraticCurveTo(2.27, 0.72, 2.02, 0.76)
  s.lineTo(1.2, 0.9)
  s.lineTo(0.55, 0.95)
  s.lineTo(-1.75, 0.99)
  s.lineTo(-2.08, 0.98)
  s.quadraticCurveTo(-2.24, 0.96, -2.24, 0.75)
  s.lineTo(-2.2, SILL_Y)
  s.lineTo(REAR_AXLE_X - ARCH_R, SILL_Y)
  s.absarc(REAR_AXLE_X, SILL_Y, ARCH_R, Math.PI, 0, true)
  s.lineTo(FRONT_AXLE_X - ARCH_R, SILL_Y)
  s.absarc(FRONT_AXLE_X, SILL_Y, ARCH_R, Math.PI, 0, true)
  s.closePath()
}

function cabin(s: Shape) {
  s.moveTo(0.6, 0.93)
  s.lineTo(0.02, 1.36)
  s.quadraticCurveTo(-0.1, 1.42, -0.3, 1.42)
  s.lineTo(-0.95, 1.41)
  s.quadraticCurveTo(-1.12, 1.4, -1.22, 1.32)
  s.lineTo(-1.8, 0.99)
  s.lineTo(-1.8, 0.93)
  s.closePath()
}

const FRONT_WINDOW: P2[] = [
  [0.5, 0.99],
  [0.03, 1.34],
  [-0.3, 1.375],
  [-0.42, 1.375],
  [-0.42, 0.99],
]
const REAR_WINDOW: P2[] = [
  [-0.49, 0.99],
  [-0.49, 1.375],
  [-0.95, 1.365],
  [-1.15, 1.31],
  [-1.64, 1.0],
]

/** Panel de vidrio sobre un tramo inclinado del perfil (parabrisas, luneta). */
function SlopeGlass({ a, b, width }: { a: P2; b: P2; width: number }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  // Normal hacia afuera (a la izquierda del sentido a→b, que recorre el perfil hacia atrás)
  const n: P2 = [-dy / len, dx / len]
  const flip = n[1] < 0 ? -1 : 1
  const off = 0.045
  return (
    <mesh
      position={[(a[0] + b[0]) / 2 + n[0] * off * flip, (a[1] + b[1]) / 2 + n[1] * off * flip, 0]}
      rotation={[0, 0, angle]}
      material={M.windowGlass}
    >
      <boxGeometry args={[len * 0.92, 0.008, width]} />
    </mesh>
  )
}

function CarBody() {
  const opacity = useStore((s) => s.bodyOpacity)
  const color = useStore((s) => CARS[s.car].paint)
  const paint = useMemo(() => {
    const m = M.paint.clone()
    m.color.set(color)
    return m
  }, [color])
  const geos = useMemo(
    () => ({
      lower: extrudeProfile(lowerBody, 1.76, 0.07, true),
      cabin: extrudeProfile(cabin, 1.46, 0.05, true),
      frontWin: extrudeProfile(polygon(FRONT_WINDOW), 1.49, 0),
      rearWin: extrudeProfile(polygon(REAR_WINDOW), 1.49, 0),
    }),
    [],
  )
  return (
    <Part id="carroceria" explode={[0, 1.9, 0]} opacity={opacity} section="shell">
      <mesh geometry={geos.lower} material={paint} />
      <mesh geometry={geos.cabin} material={paint} />
      <mesh geometry={geos.frontWin} material={M.windowGlass} />
      <mesh geometry={geos.rearWin} material={M.windowGlass} />
      <SlopeGlass a={[0.6, 0.93]} b={[0.02, 1.36]} width={1.3} />
      <SlopeGlass a={[-1.22, 1.32]} b={[-1.8, 0.99]} width={1.24} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[2.23, 0.64, s * 0.58]} rotation={[0, 0, -0.35]} material={M.headlight}>
            <boxGeometry args={[0.12, 0.08, 0.3]} />
          </mesh>
          <mesh position={[-2.26, 0.83, s * 0.6]} material={M.taillight}>
            <boxGeometry args={[0.04, 0.1, 0.3]} />
          </mesh>
          <mesh position={[0.46, 1.03, s * 0.84]} material={M.black}>
            <boxGeometry args={[0.1, 0.07, 0.1]} />
          </mesh>
        </group>
      ))}
      <mesh position={[2.25, 0.54, 0]} material={M.black}>
        <boxGeometry args={[0.04, 0.12, 0.72]} />
      </mesh>
      {[2.26, -2.25].map((x) => (
        <mesh key={x} position={[x, 0.37, 0]} material={M.black}>
          <boxGeometry args={[0.08, 0.12, 1.7]} />
        </mesh>
      ))}
    </Part>
  )
}

function Interior() {
  return (
    <Part id="habitaculo" explode={[0, 1.15, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[-0.3, 0, s * 0.36]}>
          <mesh position={[0, 0.6, 0]} material={M.seat}>
            <boxGeometry args={[0.46, 0.1, 0.46]} />
          </mesh>
          <mesh position={[-0.26, 0.9, 0]} rotation={[0, 0, -0.18]} material={M.seat}>
            <boxGeometry args={[0.1, 0.55, 0.44]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-1.15, 0.6, 0]} material={M.seat}>
        <boxGeometry args={[0.45, 0.1, 1.2]} />
      </mesh>
      <mesh position={[-1.4, 0.9, 0]} rotation={[0, 0, -0.2]} material={M.seat}>
        <boxGeometry args={[0.1, 0.52, 1.2]} />
      </mesh>
      <mesh position={[0.45, 0.88, 0]} material={M.black}>
        <boxGeometry args={[0.3, 0.14, 1.34]} />
      </mesh>
      {/* Volante (conducción a la izquierda) */}
      <group position={[0.22, 0.95, -0.36]} rotation={[0, 0, -0.45]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={M.black}>
          <torusGeometry args={[0.17, 0.016, 12, 40]} />
        </mesh>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.black}>
          <cylinderGeometry args={[0.02, 0.02, 0.24, 10]} />
        </mesh>
      </group>
    </Part>
  )
}

export function Body() {
  return (
    <>
      <CarBody />
      <Interior />
    </>
  )
}

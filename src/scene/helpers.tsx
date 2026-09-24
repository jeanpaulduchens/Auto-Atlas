import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CatmullRomCurve3,
  ExtrudeGeometry,
  Object3D,
  Path,
  Quaternion,
  Shape,
  TubeGeometry,
  Vector3,
  type Curve,
  type Group,
  type InstancedMesh,
  type Material,
} from 'three'
import { useStore } from '../store'
import { drive } from '../drive'
import { TAU, mod } from '../sim'
import type { V3 } from './Part'

const Y_AXIS = new Vector3(0, 1, 0)

/** Cilindro (o barra cuadrada) entre dos puntos. */
export function Beam({
  a,
  b,
  r = 0.02,
  box = false,
  material,
}: {
  a: V3
  b: V3
  r?: number
  box?: boolean
  material: Material
}) {
  const { position, quaternion, length } = useMemo(() => {
    const va = new Vector3(...a)
    const vb = new Vector3(...b)
    const dir = vb.clone().sub(va)
    const length = dir.length()
    return {
      position: va.clone().add(vb).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(Y_AXIS, dir.normalize()),
      length,
    }
  }, [...a, ...b])
  return (
    <mesh position={position} quaternion={quaternion} material={material}>
      {box ? <boxGeometry args={[r * 2, length, r * 2]} /> : <cylinderGeometry args={[r, r, length, 16]} />}
    </mesh>
  )
}

/** Grupo que gira sobre un eje según un ángulo leído cada frame. */
export function Spinner({
  angle,
  axis = 'x',
  position,
  children,
}: {
  angle: () => number
  axis?: 'x' | 'y' | 'z'
  position?: V3
  children: ReactNode
}) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation[axis] = angle()
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

/** Engranaje recto con dientes trapezoidales. Eje = Z (o X si axis='x'). */
export function gearGeometry(radius: number, teeth: number, thickness: number, axis: 'x' | 'z' = 'z') {
  const depth = Math.min(0.009, radius * 0.25)
  const rOut = radius + depth / 2
  const rIn = radius - depth / 2
  const step = TAU / teeth
  const shape = new Shape()
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const pts: [number, number][] = [
      [rIn, a],
      [rOut, a + step * 0.2],
      [rOut, a + step * 0.5],
      [rIn, a + step * 0.7],
    ]
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r
      const y = Math.sin(ang) * r
      if (i === 0 && k === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
  }
  shape.closePath()
  const hole = new Path()
  hole.absarc(0, 0, Math.min(radius * 0.3, 0.01), 0, TAU, true)
  shape.holes.push(hole)
  const geo = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 12 })
  geo.translate(0, 0, -thickness / 2)
  if (axis === 'x') geo.rotateY(Math.PI / 2)
  return geo
}

export function Gear({
  radius,
  teeth = Math.max(8, Math.round(radius * 420)),
  thickness = 0.022,
  axis = 'x',
  material,
  position,
}: {
  radius: number
  teeth?: number
  thickness?: number
  axis?: 'x' | 'z'
  material: Material
  position?: V3
}) {
  const geo = useMemo(() => gearGeometry(radius, teeth, thickness, axis), [radius, teeth, thickness, axis])
  return <mesh geometry={geo} material={material} position={position} />
}

/** Resorte helicoidal a lo largo de +Y. */
export function coilGeometry(radius: number, height: number, turns: number, wire: number) {
  const pts: Vector3[] = []
  const n = Math.ceil(turns * 24)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = t * turns * TAU
    pts.push(new Vector3(Math.cos(a) * radius, t * height, Math.sin(a) * radius))
  }
  return new TubeGeometry(new CatmullRomCurve3(pts), n, wire, 6, false)
}

export function Coil({ radius, height, turns, wire, material, position }: {
  radius: number
  height: number
  turns: number
  wire: number
  material: Material
  position?: V3
}) {
  const geo = useMemo(() => coilGeometry(radius, height, turns, wire), [radius, height, turns, wire])
  return <mesh geometry={geo} material={material} position={position} />
}

/** Envolvente convexa 2D (monotone chain). */
function convexHull(points: [number, number][]) {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

/** Correa cerrada que envuelve poleas en el plano YZ (geometría centrada en x=0). */
export function beltGeometry(pulleys: { y: number; z: number; r: number }[], thick = 0.004) {
  const pts: [number, number][] = []
  for (const p of pulleys) {
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU
      pts.push([p.z + Math.cos(a) * (p.r + thick), p.y + Math.sin(a) * (p.r + thick)])
    }
  }
  const hull = convexHull(pts).map(([z, y]) => new Vector3(0, y, z))
  const curve = new CatmullRomCurve3(hull, true, 'centripetal')
  return new TubeGeometry(curve, hull.length * 2, thick, 6, true)
}

/** Tubo a lo largo de una curva por puntos. */
export function Pipe({ points, r, material }: { points: V3[]; r: number; material: Material }) {
  const geo = useMemo(
    () => new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p))), points.length * 16, r, 12, false),
    [JSON.stringify(points), r],
  )
  return <mesh geometry={geo} material={material} />
}

const dummy = new Object3D()

/** Puntos que viajan por una curva para mostrar el flujo de un fluido (refrigerante, gases, combustible). */
export function FlowDots({
  curve,
  color,
  count = 24,
  size = 0.01,
  speed = 0.2,
}: {
  curve: Curve<Vector3>
  color: string
  count?: number
  size?: number
  speed?: number
}) {
  const ref = useRef<InstancedMesh>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const s = useStore.getState()
    mesh.visible = s.running
    if (!s.running) return
    const rpm = s.driveMode ? drive.rpm : s.rpm
    const factor = Math.min(6, Math.max(0.15, (rpm / 1000) * (s.slow / 0.05)))
    t.current += Math.min(dt, 0.05) * speed * factor
    for (let i = 0; i < count; i++) {
      curve.getPointAt(mod(i / count + t.current, 1), dummy.position)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} userData={{ noHighlight: true }} frustumCulled={false}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  )
}

export const curveThrough = (points: V3[]) => new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, 'centripetal')

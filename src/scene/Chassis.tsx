import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { BoxGeometry, LatheGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { sim } from '../sim'
import { Part } from './Part'
import { Beam, Coil, FlowDots, Pipe, Spinner, curveThrough } from './helpers'
import { EngineMounts } from './Engine'
import { M } from './materials'
import { DECK_Y, FRONT_AXLE_X, REAR_AXLE_X, TRACK_Z, WHEEL_Y } from './layout'

const WHEELS = [FRONT_AXLE_X, REAR_AXLE_X].flatMap((x) => [-1, 1].map((s) => ({ x, s })))

function tireGeometry() {
  const pts = [
    [0.2, -0.1],
    [0.285, -0.1],
    [0.303, -0.09],
    [0.31, -0.06],
    [0.31, 0.06],
    [0.303, 0.09],
    [0.285, 0.1],
    [0.2, 0.1],
  ].map(([r, y]) => new Vector2(r, y))
  const geo = new LatheGeometry(pts, 48)
  geo.rotateX(Math.PI / 2)
  return geo
}

/** Rayos de la llanta en una sola geometría; s = lado (−1 izquierda, 1 derecha). */
function spokesGeometry(s: number) {
  return mergeGeometries(
    Array.from({ length: 5 }, (_, k) => new BoxGeometry(0.035, 0.15, 0.02).translate(0, 0.125, s * 0.06).rotateZ((k / 5) * Math.PI * 2)),
  )
}

function Wheels() {
  const tire = useMemo(tireGeometry, [])
  const spokes = useMemo(() => ({ left: spokesGeometry(-1), right: spokesGeometry(1) }), [])
  return (
    <>
      {WHEELS.map(({ x, s }) => (
        <Part key={`${x}${s}`} id="ruedas" explode={[0, 0, s * 0.65]}>
          <Spinner angle={() => -sim.wheel} axis="z" position={[x, WHEEL_Y, s * TRACK_Z]}>
            <mesh geometry={tire} material={M.rubber} />
            <mesh rotation={[Math.PI / 2, 0, 0]} material={M.aluminum}>
              <cylinderGeometry args={[0.2, 0.2, 0.19, 40, 1, true]} />
            </mesh>
            <mesh position={[0, 0, s * 0.06]} rotation={[Math.PI / 2, 0, 0]} material={M.aluminum}>
              <cylinderGeometry args={[0.055, 0.055, 0.03, 24]} />
            </mesh>
            <mesh geometry={s > 0 ? spokes.right : spokes.left} material={M.aluminum} />
          </Spinner>
        </Part>
      ))}
    </>
  )
}

function Brakes() {
  return (
    <>
      {WHEELS.map(({ x, s }) => (
        <Part key={`${x}${s}`} id="frenos" explode={[0, 0, s * 0.4]}>
          <group position={[x, WHEEL_Y, s * (TRACK_Z - 0.05)]}>
            <Spinner angle={() => -sim.wheel} axis="z">
              <mesh rotation={[Math.PI / 2, 0, 0]} material={M.darkSteel}>
                <cylinderGeometry args={[0.15, 0.15, 0.02, 40]} />
              </mesh>
              <mesh position={[0, 0, s * 0.02]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.07, 0.07, 0.03, 24]} />
              </mesh>
            </Spinner>
            <mesh position={[-0.06, 0.12, 0]} rotation={[0, 0, 0.45]} material={M.red}>
              <boxGeometry args={[0.1, 0.05, 0.05]} />
            </mesh>
          </group>
        </Part>
      ))}
    </>
  )
}

function FrontSuspension() {
  const x = FRONT_AXLE_X
  return (
    <>
      {[-1, 1].map((s) => (
        <Part key={s} id="suspension-delantera" explode={[0, 0.15, s * 0.3]}>
          <Beam a={[x, 0.36, s * 0.6]} b={[x, 0.78, s * 0.54]} r={0.018} material={M.darkSteel} />
          <Coil radius={0.045} height={0.2} turns={6} wire={0.006} material={M.red} position={[x, 0.55, s * 0.565]} />
          <Beam a={[x, 0.24, s * 0.62]} b={[x - 0.15, 0.27, s * 0.3]} r={0.014} material={M.black} />
          <Beam a={[x, 0.24, s * 0.62]} b={[x + 0.15, 0.27, s * 0.3]} r={0.014} material={M.black} />
          <mesh position={[x, WHEEL_Y, s * 0.62]} material={M.castIron}>
            <boxGeometry args={[0.06, 0.16, 0.04]} />
          </mesh>
        </Part>
      ))}
    </>
  )
}

function RearSuspension() {
  const x = REAR_AXLE_X
  return (
    <>
      {[-1, 1].map((s) => (
        <Part key={s} id="suspension-trasera" explode={[0, 0.15, s * 0.3]}>
          <Coil radius={0.05} height={0.26} turns={6} wire={0.007} material={M.red} position={[x, 0.35, s * 0.48]} />
          <Beam a={[x - 0.12, 0.34, s * 0.56]} b={[x - 0.15, 0.68, s * 0.52]} r={0.015} material={M.darkSteel} />
          <Beam a={[x, 0.29, s * 0.45]} b={[x + 0.6, 0.34, s * 0.44]} r={0.014} material={M.black} />
        </Part>
      ))}
    </>
  )
}

function Frame() {
  return (
    <Part id="chasis" explode={[0, -0.5, 0]}>
      {[-1, 1].map((s) => (
        <Beam key={s} a={[-2.0, 0.36, s * 0.45]} b={[1.95, 0.36, s * 0.45]} r={0.03} box material={M.darkSteel} />
      ))}
      {[1.7, 0.15, -1.9].map((x) => (
        <Beam key={x} a={[x, 0.36, -0.45]} b={[x, 0.36, 0.45]} r={0.025} box material={M.darkSteel} />
      ))}
      <EngineMounts />
    </Part>
  )
}

function Battery() {
  return (
    <Part id="bateria" explode={[0.2, 0.55, 0.35]}>
      <RoundedBox args={[0.2, 0.17, 0.13]} radius={0.008} position={[1.58, 0.55, 0.45]} material={M.black} />
      {[
        { dx: -0.06, mat: M.red },
        { dx: 0.06, mat: M.black },
      ].map(({ dx, mat }) => (
        <mesh key={dx} position={[1.58 + dx, 0.645, 0.45]} material={mat}>
          <cylinderGeometry args={[0.012, 0.012, 0.025, 12]} />
        </mesh>
      ))}
    </Part>
  )
}

const FUEL_LINE: [number, number, number][] = [
  [-0.6, 0.3, -0.2],
  [0.2, 0.3, -0.2],
  [0.95, 0.35, -0.2],
  [1.08, DECK_Y + 0.05, -0.15],
  [1.1, DECK_Y + 0.09, -0.13],
]

function FuelTank() {
  const curve = useMemo(() => curveThrough(FUEL_LINE), [])
  return (
    <Part id="estanque" explode={[0, -0.35, -0.35]}>
      <RoundedBox args={[0.45, 0.18, 0.34]} radius={0.03} position={[-0.83, 0.35, -0.23]} material={M.fuelTank} />
      <Pipe points={FUEL_LINE} r={0.006} material={M.steel} />
      <FlowDots curve={curve} color="#f472b6" count={30} size={0.008} speed={0.12} />
    </Part>
  )
}

function Injection() {
  const y = DECK_Y + 0.09
  return (
    <Part id="inyeccion" explode={[0, 0.45, -0.25]}>
      <mesh position={[1.25, y, -0.13]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
        <cylinderGeometry args={[0.008, 0.008, 0.36, 10]} />
      </mesh>
      {[1.4, 1.3, 1.2, 1.1].map((x) => (
        <Beam key={x} a={[x, y, -0.13]} b={[x, DECK_Y + 0.055, -0.115]} r={0.006} material={M.black} />
      ))}
    </Part>
  )
}

export function Chassis() {
  return (
    <>
      <Wheels />
      <Brakes />
      <FrontSuspension />
      <RearSuspension />
      <Frame />
      <Battery />
      <FuelTank />
      <Injection />
    </>
  )
}

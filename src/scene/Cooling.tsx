import { useMemo } from 'react'
import { sim } from '../sim'
import { Part, type V3 } from './Part'
import { FlowDots, Pipe, Spinner, curveThrough } from './helpers'
import { M } from './materials'
import { DECK_Y } from './layout'

const RAD_X = 1.86
const RAD = { y0: 0.32, y1: 0.68, z: 0.3 }
const FAN = { x: 1.79, y: 0.5, r: 0.15 }

const UPPER_HOSE: V3[] = [
  [1.48, DECK_Y + 0.08, 0.06],
  [1.62, DECK_Y + 0.12, 0.14],
  [RAD_X - 0.03, RAD.y1 + 0.02, 0.22],
]
const LOWER_HOSE: V3[] = [
  [RAD_X - 0.03, RAD.y0 - 0.02, -0.22],
  [1.68, 0.36, -0.2],
  [1.5, 0.55, -0.16],
]

function Radiator() {
  const fins = 36
  return (
    <Part id="radiador" explode={[0.7, 0.25, 0]}>
      {Array.from({ length: fins }, (_, k) => (
        <mesh key={k} position={[RAD_X, (RAD.y0 + RAD.y1) / 2, -RAD.z + (k + 0.5) * ((2 * RAD.z) / fins)]} material={M.radiatorFin}>
          <boxGeometry args={[0.035, RAD.y1 - RAD.y0, 0.004]} />
        </mesh>
      ))}
      {[RAD.y0 - 0.02, RAD.y1 + 0.02].map((y) => (
        <mesh key={y} position={[RAD_X, y, 0]} material={M.black}>
          <boxGeometry args={[0.05, 0.04, 2 * RAD.z + 0.04]} />
        </mesh>
      ))}
      <mesh position={[RAD_X, RAD.y1 + 0.05, 0.1]} material={M.steel}>
        <cylinderGeometry args={[0.018, 0.018, 0.015, 16]} />
      </mesh>
    </Part>
  )
}

function Fan() {
  return (
    <Part id="ventilador" explode={[0.45, 0.25, 0]}>
      <mesh position={[FAN.x, FAN.y, 0]} rotation={[0, 0, Math.PI / 2]} material={M.black}>
        <cylinderGeometry args={[FAN.r + 0.012, FAN.r + 0.012, 0.04, 40, 1, true]} />
      </mesh>
      <mesh position={[FAN.x - 0.035, FAN.y, 0]} rotation={[0, 0, Math.PI / 2]} material={M.black}>
        <cylinderGeometry args={[0.04, 0.04, 0.05, 20]} />
      </mesh>
      <Spinner angle={() => sim.fan} position={[FAN.x, FAN.y, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.black}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
        </mesh>
        {Array.from({ length: 7 }, (_, k) => (
          <group key={k} rotation={[(k / 7) * Math.PI * 2, 0, 0]}>
            <mesh position={[0, 0.085, 0]} rotation={[0, 0.5, 0]} material={M.black}>
              <boxGeometry args={[0.004, 0.11, 0.05]} />
            </mesh>
          </group>
        ))}
      </Spinner>
    </Part>
  )
}

function Hoses() {
  const upper = useMemo(() => curveThrough(UPPER_HOSE), [])
  const lower = useMemo(() => curveThrough(LOWER_HOSE), [])
  return (
    <Part id="mangueras" explode={[0.5, 0.4, 0]}>
      <Pipe points={UPPER_HOSE} r={0.017} material={M.hose} />
      <Pipe points={LOWER_HOSE} r={0.017} material={M.hose} />
      <mesh position={UPPER_HOSE[0]} material={M.aluminum}>
        <sphereGeometry args={[0.025, 16, 16]} />
      </mesh>
      <FlowDots curve={upper} color="#ef4444" count={14} speed={0.18} />
      <FlowDots curve={lower} color="#38bdf8" count={14} speed={0.18} />
    </Part>
  )
}

export function Cooling() {
  return (
    <>
      <Radiator />
      <Fan />
      <Hoses />
    </>
  )
}

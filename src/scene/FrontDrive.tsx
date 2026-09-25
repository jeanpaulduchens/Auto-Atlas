import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { LatheGeometry, Vector2, type Group } from 'three'
import { sim } from '../sim'
import { useStore } from '../store'
import { CARS } from '../cars'
import { Part } from './Part'
import { Gear, Spinner } from './helpers'
import { M } from './materials'
import {
  ENGINE_FRAMES,
  FRONT_AXLE_X,
  FRONT_DIFF,
  TA_FINAL_X,
  TA_GEAR_X,
  TA_INPUT,
  TA_OUTPUT,
  TA_RING_R,
  WHEEL_Y,
} from './layout'

/*
 * Tracción delantera con motor transversal. El transeje (carcasa y ejes) se
 * modela en coordenadas del conjunto motor, igual que el embrague; el
 * diferencial y los semiejes, en coordenadas del auto, sobre el eje delantero.
 */

const MARCHAS = [1, 2, 3, 4, 5]
const CENTER_DIST = 0.1

function gearPair(gears: number[], n: number) {
  const R = gears[n]
  return { input: CENTER_DIST / (1 + R), output: (CENTER_DIST * R) / (1 + R) }
}

/** Radio del piñón de ataque: lo que falta para engranar con la corona. */
const OUTPUT_X = ENGINE_FRAMES.transversal.position[0] + TA_OUTPUT.z // eje secundario, en coordenadas del auto
const FINAL_PINION_R = Math.hypot(OUTPUT_X - FRONT_DIFF[0], TA_OUTPUT.y - FRONT_DIFF[1]) - TA_RING_R

/** Centro de la caja de satélites, un poco hacia adentro de la corona. */
const CARRIER_Z = FRONT_DIFF[2] + 0.045

// ── En coordenadas del conjunto motor ───────────────────────────

export function TransaxleCase() {
  return (
    <Part id="transeje" explode={[-0.35, 0.3, 0]} cutaway section="shell" sectionDepth={0.2}>
      <mesh position={[0.7825, 0.37, -0.075]} material={M.housing}>
        <boxGeometry args={[0.365, 0.32, 0.35]} />
      </mesh>
      {/* Campana del embrague */}
      <mesh position={[0.9975, TA_INPUT.y, TA_INPUT.z]} rotation={[0, 0, -Math.PI / 2]} material={M.housing}>
        <cylinderGeometry args={[0.155, 0.13, 0.065, 32, 1, true]} />
      </mesh>
    </Part>
  )
}

export function TransaxleShafts() {
  const gear = useStore((s) => s.gear)
  const gears = useStore((s) => CARS[s.car].gears)
  const sleeve = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = sleeve.current
    if (!g) return
    const n = useStore.getState().gear
    const target = n > 0 ? TA_GEAR_X[n] + 0.024 : (TA_GEAR_X[2] + TA_GEAR_X[3]) / 2
    g.position.x += (target - g.position.x) * Math.min(1, dt * 8)
    g.rotation.x = -sim.output
  })
  return (
    <Part id="transeje-ejes" explode={[-0.14, 0.12, 0]}>
      {/* Primario: engranajes fijos */}
      <Spinner angle={() => sim.input} position={[0, TA_INPUT.y, TA_INPUT.z]}>
        <mesh position={[0.805, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.37, 12]} />
        </mesh>
        {MARCHAS.map((n) => (
          <Gear key={n} radius={gearPair(gears, n).input} material={M.darkSteel} position={[TA_GEAR_X[n], 0, 0]} />
        ))}
      </Spinner>
      {/* Secundario con el piñón de ataque del diferencial */}
      <Spinner angle={() => -sim.output} position={[0, TA_OUTPUT.y, TA_OUTPUT.z]}>
        <mesh position={[0.785, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.33, 12]} />
        </mesh>
        <Gear radius={FINAL_PINION_R} teeth={11} thickness={0.02} material={M.steel} position={[TA_FINAL_X, 0, 0]} />
      </Spinner>
      {/* Engranajes locos del secundario: cada uno gira a su relación */}
      {MARCHAS.map((n) => (
        <Spinner key={n} angle={() => -sim.input / gears[n]} position={[0, TA_OUTPUT.y, TA_OUTPUT.z]}>
          <Gear radius={gearPair(gears, n).output} material={n === gear ? M.gold : M.steel} position={[TA_GEAR_X[n], 0, 0]} />
        </Spinner>
      ))}
      <group ref={sleeve} position={[(TA_GEAR_X[2] + TA_GEAR_X[3]) / 2, TA_OUTPUT.y, TA_OUTPUT.z]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.gold}>
          <cylinderGeometry args={[0.028, 0.028, 0.02, 24]} />
        </mesh>
      </group>
    </Part>
  )
}

// ── En coordenadas del auto ─────────────────────────────────────

export function FrontDifferential() {
  return (
    <Part id="diferencial-delantero" explode={[0, -0.1, 0.15]}>
      <Spinner angle={() => -sim.wheel} axis="z" position={FRONT_DIFF}>
        <Gear radius={TA_RING_R} teeth={34} thickness={0.018} axis="z" material={M.gold} />
        <group position={[0, 0, CARRIER_Z - FRONT_DIFF[2]]}>
          <mesh material={M.darkSteel}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 10]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[0, s * 0.03, 0]} rotation={[s > 0 ? 0 : Math.PI, 0, 0]} material={M.steel}>
                <coneGeometry args={[0.02, 0.016, 12]} />
              </mesh>
              <mesh position={[0, 0, s * 0.028]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.025, 0.025, 0.012, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      </Spinner>
    </Part>
  )
}

/** Fuelle de goma de la junta homocinética: lathe con pliegues, a lo largo de +Z desde el extremo grande. */
function bootGeometry(length: number, big: number, small: number, folds = 5) {
  const pts: Vector2[] = []
  const n = folds * 2
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const r = (big + (small - big) * t) * (i % 2 === 0 ? 1 : 0.78)
    pts.push(new Vector2(r, t * length))
  }
  const geo = new LatheGeometry(pts, 28)
  geo.rotateX(Math.PI / 2)
  return geo
}

const OUTER_Z = 0.64
const BOOT_L = 0.075

export function FrontHalfShafts() {
  const boot = useMemo(() => bootGeometry(BOOT_L, 0.034, 0.016), [])
  return (
    <>
      {[-1, 1].map((s) => {
        const inner = CARRIER_Z + s * 0.03 // sale del planetario del diferencial
        const outer = s * OUTER_Z
        const a = inner + s * (0.015 + BOOT_L)
        const b = outer - s * (0.02 + BOOT_L)
        return (
          <Part key={s} id="semiejes-delanteros" explode={[0, 0, s * 0.22]}>
            <Spinner angle={() => -sim.wheel} axis="z" position={[FRONT_AXLE_X, WHEEL_Y, 0]}>
              {/* Junta interior: vaso metálico + fuelle hacia afuera */}
              <mesh position={[0, 0, inner]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.034, 0.034, 0.03, 20]} />
              </mesh>
              <mesh geometry={boot} position={[0, 0, inner + s * 0.015]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={M.rubber} />
              {/* Eje */}
              <mesh position={[0, 0, (a + b) / 2]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.014, 0.014, Math.abs(b - a) + 0.02, 12]} />
              </mesh>
              {/* Junta exterior: fuelle hacia adentro + campana junto a la rueda */}
              <mesh geometry={boot} position={[0, 0, outer - s * 0.02]} rotation={[0, s > 0 ? Math.PI : 0, 0]} material={M.rubber} />
              <mesh position={[0, 0, outer - s * 0.01]} material={M.steel}>
                <sphereGeometry args={[0.034, 20, 16]} />
              </mesh>
            </Spinner>
          </Part>
        )
      })}
    </>
  )
}

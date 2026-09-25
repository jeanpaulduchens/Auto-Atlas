import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, ExtrudeGeometry, Shape, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { CYLINDERS, TAU, cycleAngle, sim, strokeOf, wrapPi } from '../sim'
import { Part } from './Part'
import { Beam, Gear, Pipe, Spinner, beltGeometry } from './helpers'
import { M } from './materials'
import {
  CAM_BASE_R,
  CAM_Y,
  CAM_Z,
  CRANK_R,
  CRANK_Y,
  CYL_X,
  DECK_Y,
  ENGINE_FRONT_X,
  ENGINE_REAR_X,
  HEAD_TOP,
  PISTON_R,
  PISTON_TOP,
  VALVE_DX,
  VALVE_LIFT,
  VALVE_Y,
  pinY,
} from './layout'

type CamSide = 'admision' | 'escape'

/** Ángulo del árbol de levas en que la leva del cilindro i alcanza su alzada máxima. */
function camPeak(i: number, side: CamSide) {
  const cycleAtPeak = side === 'admision' ? Math.PI / 2 : 3.5 * Math.PI
  return (CYLINDERS[i].offset + cycleAtPeak) / 2
}

/** Alzada de válvula, derivada del mismo perfil que la geometría de la leva. */
function valveLift(i: number, side: CamSide) {
  const d = wrapPi(sim.crank / 2 - camPeak(i, side))
  return Math.abs(d) < Math.PI / 4 ? VALVE_LIFT * Math.cos(2 * d) : 0
}

const TIMING_X = 1.5
const ACCESSORY_X = 1.545
const ALT = { y: 0.62, z: 0.17, r: 0.025 }
const PUMP = { y: 0.58, z: -0.13, r: 0.04 }
const CRANK_ACC_R = 0.05

// ── Bloque, culata, tapa, cárter ────────────────────────────────

function Block() {
  const cx = (ENGINE_FRONT_X + ENGINE_REAR_X) / 2
  const len = ENGINE_FRONT_X - ENGINE_REAR_X
  const bottom = CRANK_Y - 0.05
  return (
    <Part id="bloque" explode={[0, 0, -0.6]} cutaway>
      <mesh position={[cx, (bottom + DECK_Y) / 2, 0]} material={M.block}>
        <boxGeometry args={[len, DECK_Y - bottom, 0.17]} />
      </mesh>
      {CYL_X.map((x) => (
        <mesh key={x} position={[x, DECK_Y - 0.1, 0]} material={M.castIron}>
          <cylinderGeometry args={[PISTON_R + 0.003, PISTON_R + 0.003, 0.2, 32, 1, true]} />
        </mesh>
      ))}
    </Part>
  )
}

function Head() {
  const cx = (ENGINE_FRONT_X + ENGINE_REAR_X) / 2
  return (
    <Part id="culata" explode={[0, 0.3, 0]} cutaway>
      <mesh position={[cx, (DECK_Y + HEAD_TOP) / 2, 0]} material={M.block}>
        <boxGeometry args={[ENGINE_FRONT_X - ENGINE_REAR_X, HEAD_TOP - DECK_Y, 0.19]} />
      </mesh>
    </Part>
  )
}

function ValveCover() {
  const cx = (ENGINE_FRONT_X + ENGINE_REAR_X) / 2
  const top = CAM_Y + 0.05
  return (
    <Part id="tapa-valvulas" explode={[0, 0.85, 0]} cutaway section="shell">
      <RoundedBox
        args={[ENGINE_FRONT_X - ENGINE_REAR_X, top - HEAD_TOP, 0.2]}
        radius={0.02}
        position={[cx, (HEAD_TOP + top) / 2, 0]}
        material={M.valveCover}
      />
      <mesh position={[1.36, top + 0.008, -0.05]} material={M.black}>
        <cylinderGeometry args={[0.02, 0.02, 0.016, 20]} />
      </mesh>
    </Part>
  )
}

function OilPan() {
  const top = CRANK_Y - 0.05
  return (
    <Part id="carter" explode={[0, -0.18, 0]} cutaway section="shell">
      <RoundedBox args={[0.4, 0.12, 0.15]} radius={0.015} position={[1.25, top - 0.055, 0]} material={M.darkSteel} />
      <mesh position={[1.3, top - 0.12, 0]} material={M.steel}>
        <cylinderGeometry args={[0.008, 0.008, 0.012, 6]} />
      </mesh>
    </Part>
  )
}

// ── Conjunto móvil ──────────────────────────────────────────────

function Crankshaft() {
  const mains = [1.45, 1.35, 1.25, 1.15, 1.05]
  return (
    <Part id="ciguenal" explode={[0, -0.12, 0]}>
      <Spinner angle={() => sim.crank} position={[0, CRANK_Y, 0]}>
        {mains.map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
            <cylinderGeometry args={[0.017, 0.017, 0.07, 20]} />
          </mesh>
        ))}
        {CYLINDERS.map((c, i) => {
          const y = Math.cos(c.phase)
          const z = Math.sin(c.phase)
          return (
            <group key={i}>
              <mesh position={[CYL_X[i], CRANK_R * y, CRANK_R * z]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
                <cylinderGeometry args={[0.013, 0.013, 0.03, 16]} />
              </mesh>
              {[-0.017, 0.017].map((dx) => (
                <mesh key={dx} position={[CYL_X[i] + dx, 0.01 * y, 0.01 * z]} rotation={[c.phase, 0, 0]} material={M.darkSteel}>
                  <boxGeometry args={[0.008, 0.095, 0.055]} />
                </mesh>
              ))}
            </group>
          )
        })}
        {/* Nariz con poleas y brida trasera */}
        <mesh position={[1.51, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.09, 12]} />
        </mesh>
        <Gear radius={0.023} teeth={12} thickness={0.018} material={M.steel} position={[TIMING_X, 0, 0]} />
        <mesh position={[ACCESSORY_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
          <cylinderGeometry args={[CRANK_ACC_R, CRANK_ACC_R, 0.02, 32]} />
        </mesh>
        <mesh position={[ENGINE_REAR_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.035, 0.035, 0.012, 24]} />
        </mesh>
      </Spinner>
    </Part>
  )
}

const GAS_COLORS = [new Color('#60a5fa'), new Color('#2563eb'), new Color('#f97316'), new Color('#9ca3af')]
const FLAME = new Color('#fde047')

function Pistons() {
  const pistons = useRef<(Group | null)[]>([])
  const gas = useRef<(Mesh | null)[]>([])

  useFrame(() => {
    CYLINDERS.forEach((c, i) => {
      const y = pinY(sim.crank + c.phase)
      const piston = pistons.current[i]
      if (piston) piston.position.y = y

      // Gas en la cámara, coloreado según el tiempo del ciclo
      const g = gas.current[i]
      if (!g) return
      const top = y + PISTON_TOP
      const h = DECK_Y + 0.01 - top
      g.scale.y = h
      g.position.y = top + h / 2
      const cyc = cycleAngle(i)
      const k = strokeOf(cyc)
      const p = cyc / Math.PI - k // avance dentro del tiempo (0..1)
      const mat = g.material as MeshBasicMaterial
      if (k === 2) {
        // Al inicio de la explosión la llama emite más que el blanco, así brilla
        mat.color.copy(FLAME).lerp(GAS_COLORS[2], Math.min(1, p * 2)).multiplyScalar(1 + 2.5 * (1 - p))
        mat.opacity = 0.85 * (1 - p) + 0.15
      } else {
        mat.color.copy(GAS_COLORS[k])
        mat.opacity = k === 1 ? 0.25 + 0.35 * p : 0.25
      }
    })
  })

  return (
    <Part id="pistones">
      {CYLINDERS.map((_, i) => (
        <group key={i}>
          <group ref={(el) => void (pistons.current[i] = el)} position={[CYL_X[i], 0, 0]}>
            <mesh position={[0, 0.01, 0]} material={M.aluminum}>
              <cylinderGeometry args={[PISTON_R, PISTON_R, 0.05, 32]} />
            </mesh>
            {[0.027, 0.019].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={M.darkSteel}>
                <cylinderGeometry args={[PISTON_R + 0.0008, PISTON_R + 0.0008, 0.003, 32]} />
              </mesh>
            ))}
            <mesh rotation={[0, 0, Math.PI / 2]} material={M.steel}>
              <cylinderGeometry args={[0.008, 0.008, 0.06, 12]} />
            </mesh>
          </group>
          <mesh ref={(el) => void (gas.current[i] = el)} position={[CYL_X[i], DECK_Y, 0]} userData={{ noHighlight: true }}>
            <cylinderGeometry args={[PISTON_R - 0.001, PISTON_R - 0.001, 1, 24]} />
            <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </Part>
  )
}

function Rods() {
  const rods = useRef<(Group | null)[]>([])
  useFrame(() => {
    CYLINDERS.forEach((c, i) => {
      const g = rods.current[i]
      if (!g) return
      const th = sim.crank + c.phase
      const py = CRANK_Y + CRANK_R * Math.cos(th)
      const pz = CRANK_R * Math.sin(th)
      g.position.set(CYL_X[i], py, pz)
      g.rotation.x = Math.atan2(-pz, pinY(th) - py)
    })
  })
  const L = 0.13
  return (
    <Part id="bielas">
      {CYLINDERS.map((_, i) => (
        <group key={i} ref={(el) => void (rods.current[i] = el)}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
            <cylinderGeometry args={[0.019, 0.019, 0.018, 20]} />
          </mesh>
          <mesh position={[0, L / 2, 0]} material={M.darkSteel}>
            <boxGeometry args={[0.014, L - 0.02, 0.012]} />
          </mesh>
          <mesh position={[0, L, 0]} rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
            <cylinderGeometry args={[0.012, 0.012, 0.016, 16]} />
          </mesh>
        </group>
      ))}
    </Part>
  )
}

// ── Distribución ────────────────────────────────────────────────

/** Perfil de leva: círculo base + nariz hacia -Y, con alzada = VALVE_LIFT·cos(2d) en ±45°. */
function lobeGeometry() {
  const shape = new Shape()
  const n = 72
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * TAU
    const d = wrapPi(t + Math.PI / 2)
    const r = CAM_BASE_R + (Math.abs(d) < Math.PI / 4 ? VALVE_LIFT * Math.cos(2 * d) : 0)
    if (k === 0) shape.moveTo(Math.cos(t) * r, Math.sin(t) * r)
    else shape.lineTo(Math.cos(t) * r, Math.sin(t) * r)
  }
  const geo = new ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false })
  geo.translate(0, 0, -0.007)
  geo.rotateY(Math.PI / 2)
  return geo
}

function Camshaft({ side }: { side: CamSide }) {
  const lobe = useMemo(lobeGeometry, [])
  const z = side === 'admision' ? -CAM_Z : CAM_Z
  return (
    <Part id={`arbol-levas-${side}`} explode={[0, 0.55, side === 'admision' ? -0.15 : 0.15]}>
      <Spinner angle={() => sim.crank / 2} position={[0, CAM_Y, z]}>
        <mesh position={[1.265, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.009, 0.009, 0.47, 12]} />
        </mesh>
        {CYL_X.map((x, i) =>
          [-VALVE_DX, VALVE_DX].map((dx) => (
            <mesh key={`${i}${dx}`} geometry={lobe} position={[x + dx, 0, 0]} rotation={[-camPeak(i, side), 0, 0]} material={M.steel} />
          )),
        )}
        <Gear radius={0.046} teeth={24} thickness={0.018} material={M.steel} position={[TIMING_X, 0, 0]} />
      </Spinner>
    </Part>
  )
}

const STEM_LEN = CAM_Y - CAM_BASE_R - VALVE_Y

function Valves() {
  const valves = useRef<(Group | null)[]>([])
  const list = useMemo(
    () =>
      CYL_X.flatMap((x, i) =>
        (['admision', 'escape'] as CamSide[]).flatMap((side) =>
          [-VALVE_DX, VALVE_DX].map((dx) => ({ i, side, x: x + dx, z: side === 'admision' ? -CAM_Z : CAM_Z })),
        ),
      ),
    [],
  )
  useFrame(() => {
    list.forEach((v, k) => {
      const g = valves.current[k]
      if (g) g.position.y = VALVE_Y - valveLift(v.i, v.side)
    })
  })
  return (
    <Part id="valvulas" explode={[0, 0.4, 0]}>
      {list.map((v, k) => (
        <group key={k} ref={(el) => void (valves.current[k] = el)} position={[v.x, VALVE_Y, v.z]}>
          <mesh material={v.side === 'admision' ? M.steel : M.darkSteel}>
            <cylinderGeometry args={[0.016, 0.012, 0.004, 20]} />
          </mesh>
          <mesh position={[0, STEM_LEN / 2, 0]} material={M.steel}>
            <cylinderGeometry args={[0.0035, 0.0035, STEM_LEN, 8]} />
          </mesh>
          <mesh position={[0, STEM_LEN - 0.006, 0]} material={M.aluminum}>
            <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
          </mesh>
        </group>
      ))}
    </Part>
  )
}

function SparkPlugs() {
  const sparks = useRef<(Mesh | null)[]>([])
  useFrame(() => {
    CYLINDERS.forEach((_, i) => {
      const s = sparks.current[i]
      if (!s) return
      const c = cycleAngle(i)
      s.visible = c > 1.93 * Math.PI && c < 2.1 * Math.PI
    })
  })
  const top = CAM_Y + 0.07
  return (
    <Part id="bujias" explode={[0, 0.65, 0]}>
      {CYL_X.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, (DECK_Y + 0.01 + DECK_Y + 0.07) / 2, 0]} material={M.steel}>
            <cylinderGeometry args={[0.009, 0.009, 0.06, 6]} />
          </mesh>
          <mesh position={[0, (DECK_Y + 0.07 + top) / 2, 0]} material={M.ceramic}>
            <cylinderGeometry args={[0.007, 0.007, top - DECK_Y - 0.07, 12]} />
          </mesh>
          <mesh position={[0, top + 0.015, 0]} material={M.black}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
          </mesh>
          <mesh ref={(el) => void (sparks.current[i] = el)} position={[0, DECK_Y + 0.006, 0]} userData={{ noHighlight: true }}>
            <sphereGeometry args={[0.014, 12, 12]} />
            {/* Más blanco que el blanco (>1): el post-procesado la hace destellar */}
            <meshBasicMaterial color={[5, 4.2, 1.6]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </Part>
  )
}

function TimingBelt() {
  const geo = useMemo(
    () =>
      beltGeometry([
        { y: CRANK_Y, z: 0, r: 0.023 },
        { y: CAM_Y, z: -CAM_Z, r: 0.046 },
        { y: CAM_Y, z: CAM_Z, r: 0.046 },
      ]),
    [],
  )
  return (
    <Part id="correa-distribucion" explode={[0.3, 0, 0]}>
      <mesh geometry={geo} position={[TIMING_X, 0, 0]} scale={[4, 1, 1]} material={M.belt} />
    </Part>
  )
}

function AccessoryBelt() {
  const geo = useMemo(() => beltGeometry([{ y: CRANK_Y, z: 0, r: CRANK_ACC_R }, ALT, PUMP], 0.004), [])
  return (
    <Part id="correa-accesorios" explode={[0.45, 0, 0]}>
      <mesh geometry={geo} position={[ACCESSORY_X, 0, 0]} scale={[4, 1, 1]} material={M.belt} />
    </Part>
  )
}

function Alternator() {
  return (
    <Part id="alternador" explode={[0.15, 0.15, 0.5]}>
      <mesh position={[ACCESSORY_X - 0.05, ALT.y, ALT.z]} rotation={[0, 0, Math.PI / 2]} material={M.aluminum}>
        <cylinderGeometry args={[0.045, 0.045, 0.08, 24]} />
      </mesh>
      <Spinner angle={() => (sim.crank * CRANK_ACC_R) / ALT.r} position={[ACCESSORY_X, ALT.y, ALT.z]}>
        <Gear radius={ALT.r} teeth={10} thickness={0.02} material={M.darkSteel} />
      </Spinner>
    </Part>
  )
}

function WaterPump() {
  return (
    <Part id="bomba-agua" explode={[0.3, 0.1, -0.3]}>
      <mesh position={[ACCESSORY_X - 0.045, PUMP.y, PUMP.z]} rotation={[0, 0, Math.PI / 2]} material={M.aluminum}>
        <cylinderGeometry args={[0.03, 0.035, 0.06, 20]} />
      </mesh>
      <Spinner angle={() => (sim.crank * CRANK_ACC_R) / PUMP.r} position={[ACCESSORY_X, PUMP.y, PUMP.z]}>
        <Gear radius={PUMP.r} teeth={6} thickness={0.02} material={M.darkSteel} />
      </Spinner>
    </Part>
  )
}

function Flywheel() {
  return (
    <Part id="volante-motor" explode={[0, 0, 0.45]}>
      <Spinner angle={() => sim.crank} position={[1.01, CRANK_Y, 0]}>
        <Gear radius={0.13} teeth={64} thickness={0.022} material={M.steel} />
      </Spinner>
    </Part>
  )
}

const PLENUM: [number, number, number] = [1.25, DECK_Y - 0.01, -0.24]
/** Mariposa (cuerpo de aceleración) y caja del filtro de aire: el turbo se conecta a ellos. */
export const THROTTLE: [number, number, number] = [1.5, PLENUM[1], PLENUM[2]]
export const AIR_FILTER: [number, number, number] = [1.62, PLENUM[1] + 0.02, -0.44]

/** Con turbo, el filtro alimenta al compresor y la mariposa recibe el aire del intercooler. */
function Intake({ turbo }: { turbo: boolean }) {
  const plenum = PLENUM
  return (
    <Part id="admision" explode={[0, 0.3, -0.5]}>
      {CYL_X.map((x) => (
        <Pipe
          key={x}
          points={[
            [x, DECK_Y + 0.05, -0.095],
            [x, DECK_Y + 0.08, -0.17],
            [x, plenum[1] + 0.02, plenum[2] + 0.02],
          ]}
          r={0.016}
          material={M.aluminum}
        />
      ))}
      <mesh position={plenum} rotation={[0, 0, Math.PI / 2]} material={M.aluminum}>
        <cylinderGeometry args={[0.035, 0.035, 0.46, 20]} />
      </mesh>
      <mesh position={THROTTLE} rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 20]} />
      </mesh>
      {!turbo && (
        <Pipe
          points={[
            [1.52, plenum[1], plenum[2]],
            [1.58, plenum[1] + 0.02, -0.3],
            [1.62, plenum[1] + 0.02, -0.36],
          ]}
          r={0.028}
          material={M.hose}
        />
      )}
      <RoundedBox args={[0.22, 0.09, 0.2]} radius={0.015} position={AIR_FILTER} material={M.black} />
    </Part>
  )
}

export function Engine({ turbo = false }: { turbo?: boolean }) {
  return (
    <>
      <Block />
      <Head />
      <ValveCover />
      <OilPan />
      <Crankshaft />
      <Pistons />
      <Rods />
      <Camshaft side="admision" />
      <Camshaft side="escape" />
      <Valves />
      <SparkPlugs />
      <TimingBelt />
      <AccessoryBelt />
      <Alternator />
      <WaterPump />
      <Flywheel />
      <Intake turbo={turbo} />
    </>
  )
}

/** Soportes del motor al chasis, reutilizados por Chassis. */
export function EngineMounts() {
  return (
    <>
      {[-1, 1].map((s) => (
        <Beam key={s} a={[1.25, CRANK_Y + 0.02, s * 0.085]} b={[1.25, 0.37, s * 0.42]} r={0.018} box material={M.rubber} />
      ))}
    </>
  )
}

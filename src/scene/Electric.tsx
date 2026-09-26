import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderGeometry, MeshStandardMaterial, type Mesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TAU, sim } from '../sim'
import { Part, type V3 } from './Part'
import { FlowDots, Gear, Pipe, Spinner, curveThrough } from './helpers'
import { CvHalfShafts } from './FrontDrive'
import { M } from './materials'
import { EV_DIFF, EV_IDLER, EV_MOTOR, EV_PACK, EV_STAGE1_Z, REAR_AXLE_X } from './layout'

/*
 * Propulsión eléctrica con tracción trasera: batería bajo el piso, inversor,
 * motor con su eje paralelo al eje trasero y reductora de dos etapas hasta el
 * diferencial. Todo en coordenadas del auto.
 */

const HV = new MeshStandardMaterial({ color: '#f97316', roughness: 0.55, metalness: 0.1 }) // cables de alta tensión

// Reductora: la distancia entre centros fija los radios; cada etapa reduce 3:1
const STAGE1 = Math.hypot(EV_MOTOR.x - EV_IDLER.x, EV_MOTOR.y - EV_IDLER.y)
const STAGE2 = Math.hypot(EV_IDLER.x - EV_DIFF[0], EV_IDLER.y - EV_DIFF[1])
const PINION_R = STAGE1 / 4
const IDLER_BIG_R = (STAGE1 * 3) / 4
const IDLER_SMALL_R = STAGE2 / 4
const RING_R = (STAGE2 * 3) / 4
const STAGE2_Z = EV_DIFF[2]

const MOTOR_LEN = EV_MOTOR.z1 - EV_MOTOR.z0
const MOTOR_MID_Z = (EV_MOTOR.z0 + EV_MOTOR.z1) / 2
const COILS = 12
const POLE_PAIRS = 4

// ── Batería de tracción ─────────────────────────────────────────

/** Celdas cilíndricas agrupadas en 12 módulos, en una sola geometría. */
function cellsGeometry() {
  const cells: CylinderGeometry[] = []
  const modulesX = 6
  const modulesZ = 2
  const modW = (EV_PACK.x1 - EV_PACK.x0 - 0.08) / modulesX
  const modD = (2 * EV_PACK.z - 0.1) / modulesZ
  const perX = 6
  const perZ = 8
  const h = EV_PACK.y1 - EV_PACK.y0 - 0.05
  for (let mx = 0; mx < modulesX; mx++) {
    for (let mz = 0; mz < modulesZ; mz++) {
      const ox = EV_PACK.x0 + 0.04 + mx * modW
      const oz = -EV_PACK.z + 0.05 + mz * modD
      for (let i = 0; i < perX; i++) {
        for (let j = 0; j < perZ; j++) {
          const r = Math.min(modW / perX, modD / perZ) * 0.42
          cells.push(
            new CylinderGeometry(r, r, h, 8).translate(
              ox + ((i + 0.5) * modW) / perX,
              (EV_PACK.y0 + EV_PACK.y1) / 2,
              oz + ((j + 0.5) * modD) / perZ,
            ),
          )
        }
      }
    }
  }
  return mergeGeometries(cells)
}

function TractionBattery() {
  const cells = useMemo(cellsGeometry, [])
  const len = EV_PACK.x1 - EV_PACK.x0
  const cx = (EV_PACK.x0 + EV_PACK.x1) / 2
  const cy = (EV_PACK.y0 + EV_PACK.y1) / 2
  return (
    <>
      <Part id="bateria-traccion" explode={[0, -0.08, -0.9]} cutaway section="shell">
        <mesh position={[cx, cy, 0]} material={M.darkSteel}>
          <boxGeometry args={[len, EV_PACK.y1 - EV_PACK.y0, 2 * EV_PACK.z]} />
        </mesh>
      </Part>
      <Part id="bateria-traccion" explode={[0, -0.08, -0.9]}>
        <mesh geometry={cells} material={M.blue} />
        {/* Separadores entre módulos */}
        {Array.from({ length: 5 }, (_, k) => (
          <mesh key={k} position={[EV_PACK.x0 + 0.04 + ((k + 1) * (len - 0.08)) / 6, cy, 0]} material={M.black}>
            <boxGeometry args={[0.008, EV_PACK.y1 - EV_PACK.y0 - 0.02, 2 * EV_PACK.z - 0.04]} />
          </mesh>
        ))}
      </Part>
    </>
  )
}

// ── Inversor y cables de alta tensión ───────────────────────────

const INVERTER: V3 = [-1.1, 0.53, -0.08]
const DC_CABLES: V3[][] = [-0.05, 0.05].map((dz) => [
  [EV_PACK.x0 + 0.02, 0.26, -0.2 + dz],
  [-1.0, 0.27, -0.2 + dz],
  [-1.03, 0.45, -0.16 + dz],
  [INVERTER[0] + 0.08, INVERTER[1] - 0.02, INVERTER[2] - 0.05 + dz],
])
const PHASE_CABLES: V3[][] = [-0.05, 0, 0.05].map((dz) => [
  [INVERTER[0] - 0.08, INVERTER[1] - 0.03, INVERTER[2] + 0.1 + dz * 0.5],
  [EV_MOTOR.x - 0.02, 0.5, EV_MOTOR.z1 - 0.02 + dz * 0.3],
  [EV_MOTOR.x + dz * 0.6, EV_MOTOR.y + EV_MOTOR.r * 0.6, EV_MOTOR.z1 + 0.01],
])

function Inverter() {
  const dcFlow = useMemo(() => curveThrough(DC_CABLES[1]), [])
  return (
    <Part id="inversor" explode={[0.2, 0.45, -0.2]}>
      <mesh position={INVERTER} material={M.aluminum}>
        <boxGeometry args={[0.2, 0.09, 0.22]} />
      </mesh>
      {/* Aletas de enfriamiento */}
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} position={[INVERTER[0] - 0.08 + k * 0.032, INVERTER[1] + 0.055, INVERTER[2]]} material={M.aluminum}>
          <boxGeometry args={[0.006, 0.02, 0.2]} />
        </mesh>
      ))}
      {DC_CABLES.map((c, i) => (
        <Pipe key={`dc${i}`} points={c} r={0.011} material={HV} />
      ))}
      {PHASE_CABLES.map((c, i) => (
        <Pipe key={`ph${i}`} points={c} r={0.008} material={HV} />
      ))}
      <FlowDots curve={dcFlow} color="#fde047" count={16} size={0.009} speed={0.35} />
    </Part>
  )
}

// ── Motor ───────────────────────────────────────────────────────

/** Bobinas del estátor: se iluminan en secuencia, formando el campo magnético que arrastra al rotor. */
function StatorCoils() {
  const coils = useRef<(Mesh | null)[]>([])
  const mats = useMemo(
    () => Array.from({ length: COILS }, () => new MeshStandardMaterial({ color: '#b45309', metalness: 0.85, roughness: 0.35, emissive: '#fb923c' })),
    [],
  )
  useFrame(() => {
    // El campo gira un poco adelantado respecto del rotor: eso produce el par
    const field = -sim.output + 0.25
    mats.forEach((m, k) => {
      const a = (k / COILS) * TAU
      m.emissiveIntensity = 2.2 * Math.max(0, Math.cos(POLE_PAIRS * (a - field)))
    })
  })
  return (
    <>
      {mats.map((m, k) => (
        <group key={k} rotation={[0, 0, (k / COILS) * TAU]}>
          <mesh
            ref={(el) => void (coils.current[k] = el)}
            position={[0, EV_MOTOR.r * 0.72, 0]}
            material={m}
            userData={{ noHighlight: true }}
          >
            <boxGeometry args={[0.034, 0.03, MOTOR_LEN * 0.8]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Motor() {
  const pos: V3 = [EV_MOTOR.x, EV_MOTOR.y, MOTOR_MID_Z]
  return (
    <>
      {/* El grupo en el centro del motor: el corte lo parte por la mitad de su largo */}
      <group position={pos}>
        <Part id="motor-electrico" explode={[0.15, 0.25, -0.35]} cutaway section="shell">
          <mesh rotation={[Math.PI / 2, 0, 0]} material={M.aluminum}>
            <cylinderGeometry args={[EV_MOTOR.r, EV_MOTOR.r, MOTOR_LEN, 40]} />
          </mesh>
        </Part>
      </group>
      <Part id="motor-electrico" explode={[0.15, 0.25, -0.35]}>
        <group position={pos}>
          <StatorCoils />
          {/* Rotor con imanes de polos alternados (rojo norte, azul sur) */}
          <Spinner angle={() => -sim.output} axis="z">
            <mesh rotation={[Math.PI / 2, 0, 0]} material={M.darkSteel}>
              <cylinderGeometry args={[EV_MOTOR.r * 0.5, EV_MOTOR.r * 0.5, MOTOR_LEN * 0.85, 32]} />
            </mesh>
            {Array.from({ length: 2 * POLE_PAIRS }, (_, k) => (
              <group key={k} rotation={[0, 0, (k / (2 * POLE_PAIRS)) * TAU]}>
                <mesh position={[0, EV_MOTOR.r * 0.5, 0]} material={k % 2 ? M.blue : M.red}>
                  <boxGeometry args={[0.03, 0.012, MOTOR_LEN * 0.8]} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0, (EV_STAGE1_Z - MOTOR_MID_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
              <cylinderGeometry args={[0.012, 0.012, EV_STAGE1_Z - EV_MOTOR.z0, 12]} />
            </mesh>
          </Spinner>
        </group>
      </Part>
    </>
  )
}

// ── Reductora y diferencial ─────────────────────────────────────

function ReductionGear() {
  const hx0 = EV_DIFF[0] - RING_R - 0.03
  const hx1 = EV_MOTOR.x + PINION_R + 0.05
  const hy0 = EV_DIFF[1] - RING_R - 0.02
  const hy1 = EV_IDLER.y + IDLER_BIG_R + 0.02
  return (
    <>
      <group position={[0, 0, (EV_STAGE1_Z + STAGE2_Z) / 2]}>
        <Part id="reductora" explode={[-0.15, 0.25, 0.3]} cutaway section="shell">
          <mesh position={[(hx0 + hx1) / 2, (hy0 + hy1) / 2, 0]} material={M.housing}>
            <boxGeometry args={[hx1 - hx0, hy1 - hy0, STAGE2_Z - EV_STAGE1_Z + 0.08]} />
          </mesh>
        </Part>
      </group>
      <Part id="reductora" explode={[-0.15, 0.25, 0.3]}>
        {/* Piñón del motor */}
        <Spinner angle={() => -sim.output} axis="z" position={[EV_MOTOR.x, EV_MOTOR.y, EV_STAGE1_Z]}>
          <Gear radius={PINION_R} teeth={11} thickness={0.022} axis="z" material={M.steel} />
        </Spinner>
        {/* Eje intermedio: engranaje grande (1ª etapa) y chico (2ª etapa) */}
        <Spinner angle={() => sim.output / 3} axis="z" position={[EV_IDLER.x, EV_IDLER.y, 0]}>
          <Gear radius={IDLER_BIG_R} teeth={33} thickness={0.022} axis="z" material={M.darkSteel} position={[0, 0, EV_STAGE1_Z]} />
          <Gear radius={IDLER_SMALL_R} teeth={12} thickness={0.026} axis="z" material={M.steel} position={[0, 0, STAGE2_Z]} />
          <mesh position={[0, 0, (EV_STAGE1_Z + STAGE2_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
            <cylinderGeometry args={[0.012, 0.012, STAGE2_Z - EV_STAGE1_Z + 0.04, 12]} />
          </mesh>
        </Spinner>
        {/* Corona del diferencial: gira con las ruedas */}
        <Spinner angle={() => -sim.wheel} axis="z" position={EV_DIFF}>
          <Gear radius={RING_R} teeth={36} thickness={0.026} axis="z" material={M.gold} />
          <mesh position={[0, 0, 0.03]} material={M.darkSteel}>
            <sphereGeometry args={[0.045, 20, 16]} />
          </mesh>
        </Spinner>
      </Part>
    </>
  )
}

// ── Puerto de carga ─────────────────────────────────────────────

const PORT: V3 = [-1.62, 0.84, -0.87]

function ChargePort() {
  return (
    <Part id="puerto-carga" explode={[0, 1.9, 0]}>
      <mesh position={PORT} rotation={[Math.PI / 2, 0, 0]} material={M.black}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 24]} />
      </mesh>
      <mesh position={[PORT[0], PORT[1], PORT[2] - 0.016]} rotation={[Math.PI / 2, 0, 0]} material={M.chrome}>
        <torusGeometry args={[0.038, 0.004, 8, 24]} />
      </mesh>
    </Part>
  )
}

const CHARGE_CABLE: V3[] = [
  [PORT[0] + 0.01, PORT[1] - 0.02, PORT[2] + 0.05],
  [-1.45, 0.6, -0.72],
  [-1.1, 0.3, -0.55],
  [EV_PACK.x0 + 0.02, 0.24, -0.45],
]

export function ElectricDrive() {
  return (
    <>
      <TractionBattery />
      <Part id="bateria-traccion" explode={[0, -0.08, -0.9]}>
        <Pipe points={CHARGE_CABLE} r={0.012} material={HV} />
      </Part>
      <Inverter />
      <Motor />
      <ReductionGear />
      <CvHalfShafts id="semiejes-traseros" axleX={REAR_AXLE_X} carrierZ={EV_DIFF[2] + 0.03} />
      <ChargePort />
    </>
  )
}

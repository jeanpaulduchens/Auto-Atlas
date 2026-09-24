import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Quaternion, Vector3, type Group } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GEAR_RATIOS, sim } from '../sim'
import { useStore } from '../store'
import { Part, type V3 } from './Part'
import { Beam, Gear, Spinner } from './helpers'
import { M } from './materials'
import {
  CRANK_Y,
  DIFF_X,
  GEARBOX_COUNTER_Y,
  GEARBOX_OUT_X,
  GEAR_CENTER_DIST,
  GEAR_X,
  PINION_YOKE_X,
  TRACK_Z,
  WHEEL_Y,
} from './layout'

const INPUT_GEAR_X = 0.77
const CASE = { x0: 0.3, x1: 0.83, y0: 0.25, y1: 0.55 }

/** Radios de la pareja de engranajes de cada marcha (salida / intermediario). */
function gearPair(n: number) {
  const R = GEAR_RATIOS[n]
  return { out: (GEAR_CENTER_DIST * R) / (1 + R), counter: GEAR_CENTER_DIST / (1 + R) }
}

const MARCHAS = [1, 2, 3, 4, 5]

/** Dedos del resorte de diafragma, unidos en una sola geometría. */
function diaphragmGeometry() {
  return mergeGeometries(
    Array.from({ length: 12 }, (_, k) => new BoxGeometry(0.004, 0.07, 0.014).rotateX((k / 12) * Math.PI * 2).translate(-0.004, 0, 0)),
  )
}

function Clutch() {
  const diaphragm = useMemo(diaphragmGeometry, [])
  return (
    <Part id="embrague" explode={[0, 0, -0.45]}>
      {/* Plato de presión: gira siempre con el motor */}
      <Spinner angle={() => sim.crank} position={[0.97, CRANK_Y, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.12, 0.12, 0.016, 32, 1, true]} />
        </mesh>
        <mesh geometry={diaphragm} material={M.steel} />
      </Spinner>
      {/* Disco de fricción: gira con el eje primario (se detiene con el embrague pisado) */}
      <Spinner angle={() => sim.input} position={[0.992, CRANK_Y, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.friction}>
          <cylinderGeometry args={[0.1, 0.1, 0.008, 32]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.03, 0.03, 0.016, 16]} />
        </mesh>
      </Spinner>
    </Part>
  )
}

function GearboxCase() {
  const cx = (CASE.x0 + CASE.x1) / 2
  return (
    <Part id="caja-cambios" explode={[0, 0.45, 0.4]} cutaway section="shell">
      <mesh position={[cx, (CASE.y0 + CASE.y1) / 2, 0]} material={M.housing}>
        <boxGeometry args={[CASE.x1 - CASE.x0, CASE.y1 - CASE.y0, 0.22]} />
      </mesh>
      {/* Campana del embrague */}
      <mesh position={[0.925, CRANK_Y, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.housing}>
        <cylinderGeometry args={[0.15, 0.11, 0.19, 32, 1, true]} />
      </mesh>
    </Part>
  )
}

function InputShaft() {
  return (
    <Part id="eje-primario">
      <Spinner angle={() => sim.input} position={[0, CRANK_Y, 0]}>
        <mesh position={[0.88, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.23, 12]} />
        </mesh>
        <Gear radius={0.05} material={M.steel} position={[INPUT_GEAR_X, 0, 0]} />
      </Spinner>
    </Part>
  )
}

function Countershaft() {
  return (
    <Part id="eje-intermediario" explode={[0, -0.3, 0]}>
      <Spinner angle={() => -sim.input} position={[0, GEARBOX_COUNTER_Y, 0]}>
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 12]} />
        </mesh>
        <Gear radius={0.05} material={M.darkSteel} position={[INPUT_GEAR_X, 0, 0]} />
        {MARCHAS.map((n) => (
          <Gear key={n} radius={gearPair(n).counter} material={M.darkSteel} position={[GEAR_X[n], 0, 0]} />
        ))}
      </Spinner>
    </Part>
  )
}

function OutputShaft() {
  const gear = useStore((s) => s.gear)
  const sleeve = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = sleeve.current
    if (!g) return
    const n = useStore.getState().gear
    const target = n > 0 ? GEAR_X[n] + 0.028 : GEAR_X[2] + 0.035
    g.position.x += (target - g.position.x) * Math.min(1, dt * 8)
    g.rotation.x = sim.output
  })
  return (
    <Part id="eje-secundario" explode={[0, 0.25, 0]}>
      <Spinner angle={() => sim.output} position={[0, CRANK_Y, 0]}>
        <mesh position={[(GEARBOX_OUT_X + 0.765) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.765 - GEARBOX_OUT_X, 12]} />
        </mesh>
      </Spinner>
      {/* Engranajes locos: cada uno gira a input / relación, bloqueado o no */}
      {MARCHAS.map((n) => (
        <Spinner key={n} angle={() => sim.input / GEAR_RATIOS[n]} position={[0, CRANK_Y, 0]}>
          <Gear radius={gearPair(n).out} material={n === gear ? M.gold : M.steel} position={[GEAR_X[n], 0, 0]} />
        </Spinner>
      ))}
      <group ref={sleeve} position={[GEAR_X[2] + 0.035, CRANK_Y, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.gold}>
          <cylinderGeometry args={[0.03, 0.03, 0.022, 24]} />
        </mesh>
      </group>
    </Part>
  )
}

/** Posición de la palanca en el patrón H: [adelante/atrás, izquierda/derecha]. */
const H_PATTERN: Record<number, [number, number]> = {
  0: [0, 0],
  1: [-0.28, -0.2],
  2: [0.28, -0.2],
  3: [-0.28, 0],
  4: [0.28, 0],
  5: [-0.28, 0.2],
}

function Lever() {
  const pivot = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = pivot.current
    if (!g) return
    const [fz, fx] = H_PATTERN[useStore.getState().gear]
    const k = Math.min(1, dt * 10)
    g.rotation.z += (fz - g.rotation.z) * k
    g.rotation.x += (fx - g.rotation.x) * k
  })
  return (
    <Part id="palanca" explode={[0, 0.7, 0]}>
      <group ref={pivot} position={[0.52, CASE.y1 + 0.01, 0]}>
        <mesh position={[0, 0.2, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.008, 0.01, 0.4, 12]} />
        </mesh>
        <mesh position={[0, 0.41, 0]} material={M.black}>
          <sphereGeometry args={[0.03, 20, 20]} />
        </mesh>
        <mesh position={[0, 0.03, 0]} material={M.rubber}>
          <coneGeometry args={[0.05, 0.08, 16]} />
        </mesh>
      </group>
    </Part>
  )
}

function Driveshaft() {
  const a = new Vector3(GEARBOX_OUT_X, CRANK_Y, 0)
  const b = new Vector3(PINION_YOKE_X, WHEEL_Y, 0)
  const { quat, len } = useMemo(() => {
    const dir = b.clone().sub(a)
    return { len: dir.length(), quat: new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), dir.normalize()) }
  }, [])
  const joint = (x: number) => (
    <group position={[x, 0, 0]}>
      <mesh material={M.darkSteel}>
        <boxGeometry args={[0.012, 0.06, 0.012]} />
      </mesh>
      <mesh material={M.darkSteel}>
        <boxGeometry args={[0.012, 0.012, 0.06]} />
      </mesh>
    </group>
  )
  return (
    <Part id="cardan" explode={[0, -0.3, 0]}>
      <group position={a} quaternion={quat}>
        <Spinner angle={() => sim.output}>
          <mesh position={[len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
            <cylinderGeometry args={[0.028, 0.028, len - 0.06, 20]} />
          </mesh>
          {joint(0.012)}
          {joint(len - 0.012)}
        </Spinner>
      </group>
    </Part>
  )
}

function Differential() {
  return (
    <Part id="diferencial" explode={[0, 0.35, 0]}>
      {/* Piñón: gira con el cardán */}
      <Spinner angle={() => sim.output} position={[0, WHEEL_Y, 0]}>
        <mesh position={[(DIFF_X + 0.1 + PINION_YOKE_X) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, PINION_YOKE_X - DIFF_X - 0.1, 12]} />
        </mesh>
        <Gear radius={0.03} teeth={10} thickness={0.03} material={M.steel} position={[DIFF_X + 0.105, 0, 0]} />
      </Spinner>
      {/* Corona + caja de satélites: giran con las ruedas */}
      <Spinner angle={() => -sim.wheel} axis="z" position={[DIFF_X, WHEEL_Y, 0]}>
        <Gear radius={0.09} teeth={39} thickness={0.018} axis="z" material={M.gold} position={[0, 0, 0.04]} />
        <mesh material={M.darkSteel}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 10]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0, s * 0.035, 0]} material={M.steel}>
              <coneGeometry args={[0.022, 0.018, 12]} />
            </mesh>
            <mesh position={[0, 0, s * 0.03]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
              <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
            </mesh>
          </group>
        ))}
      </Spinner>
    </Part>
  )
}

function AxleHousing() {
  return (
    <Part id="puente-trasero" explode={[0, -0.3, 0]} cutaway section="shell">
      <mesh position={[DIFF_X, WHEEL_Y, 0]} scale={[1, 1, 0.8]} material={M.housing}>
        <sphereGeometry args={[0.13, 32, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <Beam key={s} a={[DIFF_X, WHEEL_Y, s * 0.09]} b={[DIFF_X, WHEEL_Y, s * 0.63]} r={0.035} material={M.housing} />
      ))}
    </Part>
  )
}

function HalfShafts() {
  return (
    <>
      {[-1, 1].map((s) => {
        const pos: V3 = [DIFF_X, WHEEL_Y, 0]
        return (
          <Part key={s} id="semiejes" explode={[0, 0, s * 0.25]}>
            <Spinner angle={() => -sim.wheel} axis="z" position={pos}>
              <mesh position={[0, 0, s * 0.36]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.014, 0.014, 0.62, 12]} />
              </mesh>
              <mesh position={[0, 0, s * (TRACK_Z - 0.08)]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
                <cylinderGeometry args={[0.05, 0.05, 0.012, 20]} />
              </mesh>
            </Spinner>
          </Part>
        )
      })}
    </>
  )
}

export function Drivetrain() {
  return (
    <>
      <Clutch />
      <GearboxCase />
      <InputShaft />
      <Countershaft />
      <OutputShaft />
      <Lever />
      <Driveshaft />
      <Differential />
      <AxleHousing />
      <HalfShafts />
    </>
  )
}

import { useMemo } from 'react'
import { BoxGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { sim } from '../sim'
import { Part, type V3 } from './Part'
import { FlowDots, Pipe, Spinner, curveThrough } from './helpers'
import { M } from './materials'
import { EXHAUST_COLLECTOR } from './Exhaust'
import { AIR_FILTER, THROTTLE } from './Engine'

/**
 * Turbocompresor montado a la salida del múltiple de escape (lado derecho del
 * motor), con su eje a lo largo del auto: turbina atrás, compresor adelante.
 */
const AXIS_Y = 0.48
const AXIS_Z = 0.3
const TURBINE_X = 1.13
const CENTER_X = 1.2
const COMPRESSOR_X = 1.27

const INTERCOOLER = { x: 2.02, y0: 0.17, y1: 0.33, z: 0.34 }

/** Tramo frío: del filtro de aire a la entrada del compresor, por delante del motor. */
export const COLD_PIPE: V3[] = [
  [AIR_FILTER[0] + 0.06, AIR_FILTER[1] - 0.04, AIR_FILTER[2] + 0.06],
  [1.68, 0.52, -0.1],
  [1.68, 0.5, 0.2],
  [1.48, 0.48, AXIS_Z],
  [COMPRESSOR_X + 0.08, AXIS_Y, AXIS_Z],
]
/** Tramo presurizado caliente: del compresor al intercooler. */
const HOT_CHARGE: V3[] = [
  [COMPRESSOR_X, AXIS_Y - 0.07, AXIS_Z + 0.05],
  [1.4, 0.34, 0.36],
  [1.8, 0.25, 0.36],
  [INTERCOOLER.x - 0.02, 0.25, INTERCOOLER.z + 0.03],
]
/** Tramo presurizado frío: del intercooler a la mariposa. */
const COOL_CHARGE: V3[] = [
  [INTERCOOLER.x - 0.02, 0.25, -INTERCOOLER.z - 0.03],
  [1.8, 0.25, -0.36],
  [1.6, 0.33, -0.36],
  [1.56, 0.5, -0.32],
  [THROTTLE[0] + 0.04, THROTTLE[1] - 0.01, THROTTLE[2] - 0.02],
]
/** Gases de escape: del colector del múltiple, alrededor de la turbina y afuera. */
const EXHAUST_THROUGH: V3[] = [
  EXHAUST_COLLECTOR,
  [TURBINE_X + 0.02, AXIS_Y - 0.07, AXIS_Z - 0.03],
  [TURBINE_X, AXIS_Y, AXIS_Z],
  [TURBINE_X - 0.07, AXIS_Y, AXIS_Z],
]

/** Rueda de álabes (turbina o compresor), con su eje a lo largo de X. */
function bladeWheel(blades: number, radius: number, length: number, twist: number) {
  return mergeGeometries(
    Array.from({ length: blades }, (_, k) =>
      new BoxGeometry(length, radius, 0.0035)
        .rotateY(twist)
        .translate(0, radius / 2 + 0.006, 0)
        .rotateX((k / blades) * Math.PI * 2),
    ),
  )
}

/** Carcasa en espiral: toroide más un cuerpo central, con el eje a lo largo de X. */
function Scroll({ x, radius, material }: { x: number; radius: number; material: typeof M.steel }) {
  return (
    <group position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh material={material}>
        <torusGeometry args={[radius, radius * 0.5, 16, 40]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={material}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, 0.05, 32]} />
      </mesh>
    </group>
  )
}

function TurboUnit() {
  const compressorWheel = useMemo(() => bladeWheel(10, 0.032, 0.03, 0.5), [])
  const turbineWheel = useMemo(() => bladeWheel(9, 0.028, 0.026, -0.55), [])
  return (
    // El grupo va en el eje del turbo: así el corte de sección lo parte justo por la mitad
    <group position={[0, AXIS_Y, AXIS_Z]}>
      <Part id="turbo" explode={[0, 0.2, 0.62]} cutaway section="solid">
        <Scroll x={TURBINE_X} radius={0.05} material={M.castIron} />
        <Scroll x={COMPRESSOR_X} radius={0.056} material={M.aluminum} />
        {/* Salida de la turbina y entrada del compresor */}
        <mesh position={[TURBINE_X - 0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.castIron}>
          <cylinderGeometry args={[0.034, 0.03, 0.04, 24, 1, true]} />
        </mesh>
        <mesh position={[COMPRESSOR_X + 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.aluminum}>
          <cylinderGeometry args={[0.036, 0.04, 0.05, 24, 1, true]} />
        </mesh>
        {/* Carcasa central, donde gira el eje sobre aceite */}
        <mesh position={[CENTER_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 20]} />
        </mesh>
        {/* Válvula de descarga (wastegate): actuador y varilla */}
        <mesh position={[CENTER_X + 0.02, 0.07, 0.06]} rotation={[0, 0, Math.PI / 2]} material={M.darkSteel}>
          <cylinderGeometry args={[0.022, 0.022, 0.03, 20]} />
        </mesh>
        <mesh position={[TURBINE_X + 0.03, 0.05, 0.06]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
        </mesh>
      </Part>
      {/* Eje y ruedas: misma pieza, pero sin cortarse (se ven girando dentro de la carcasa) */}
      <Part id="turbo" explode={[0, 0.2, 0.62]}>
        <Spinner angle={() => sim.turbo}>
          <mesh position={[CENTER_X, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
            <cylinderGeometry args={[0.005, 0.005, COMPRESSOR_X - TURBINE_X + 0.02, 8]} />
          </mesh>
          <mesh geometry={compressorWheel} position={[COMPRESSOR_X, 0, 0]} material={M.aluminum} />
          <mesh position={[COMPRESSOR_X + 0.012, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.aluminum}>
            <coneGeometry args={[0.01, 0.03, 12]} />
          </mesh>
          <mesh geometry={turbineWheel} position={[TURBINE_X, 0, 0]} material={M.castIron} />
        </Spinner>
      </Part>
    </group>
  )
}

function finsGeometry() {
  const fins = 30
  const h = INTERCOOLER.y1 - INTERCOOLER.y0
  return mergeGeometries(
    Array.from({ length: fins }, (_, k) =>
      new BoxGeometry(0.045, h, 0.004).translate(INTERCOOLER.x, (INTERCOOLER.y0 + INTERCOOLER.y1) / 2, -INTERCOOLER.z + ((k + 0.5) * 2 * INTERCOOLER.z) / fins),
    ),
  )
}

function Intercooler() {
  const fins = useMemo(finsGeometry, [])
  const yMid = (INTERCOOLER.y0 + INTERCOOLER.y1) / 2
  const h = INTERCOOLER.y1 - INTERCOOLER.y0
  return (
    <Part id="intercooler" explode={[0.55, -0.05, 0]}>
      <mesh geometry={fins} material={M.radiatorFin} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[INTERCOOLER.x, yMid, s * (INTERCOOLER.z + 0.02)]} material={M.aluminum}>
          <boxGeometry args={[0.06, h + 0.02, 0.04]} />
        </mesh>
      ))}
    </Part>
  )
}

function Ducts() {
  const curves = useMemo(
    () => ({
      cold: curveThrough(COLD_PIPE),
      hot: curveThrough(HOT_CHARGE),
      cool: curveThrough(COOL_CHARGE),
      exhaust: curveThrough(EXHAUST_THROUGH),
    }),
    [],
  )
  return (
    <Part id="ductos-turbo" explode={[0.2, 0.15, 0.2]} cutaway section="translucent">
      <Pipe points={COLD_PIPE} r={0.03} material={M.hose} />
      <Pipe points={HOT_CHARGE} r={0.024} material={M.aluminum} />
      <Pipe points={COOL_CHARGE} r={0.024} material={M.aluminum} />
      <FlowDots curve={curves.cold} color="#bfdbfe" count={18} speed={0.2} />
      <FlowDots curve={curves.hot} color="#fdba74" count={18} speed={0.3} />
      <FlowDots curve={curves.cool} color="#38bdf8" count={22} speed={0.3} />
      <FlowDots curve={curves.exhaust} color="#fb923c" count={8} size={0.012} speed={0.35} />
    </Part>
  )
}

export function Turbo() {
  return (
    <>
      <TurboUnit />
      <Intercooler />
      <Ducts />
    </>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Material } from 'three'
import { sim } from '../sim'
import { useStore } from '../store'
import { PLANET, RING_R } from '../cars'
import { PLANS, planetSpin, roleOf, type Member, type Role } from '../automatic'
import { Part, type V3 } from './Part'
import { Gear, Pipe, Spinner, bladeRingGeometry, ringGearGeometry } from './helpers'
import { M } from './materials'
import {
  AT_CONVERTER_X,
  AT_OUTPUT,
  AT_PLANET_X,
  AT_TRANSFER_X,
  CRANK_Y,
  ENGINE_FRAMES,
  FRONT_DIFF,
  TA_FINAL_X,
  TA_RING_R,
} from './layout'

/*
 * Transeje automático (tracción delantera). Todo en coordenadas del conjunto
 * motor, con el eje de entrada coaxial al cigüeñal (y = CRANK_Y, z = 0).
 * Colores del tren planetario según su rol en la marcha elegida:
 * dorado = recibe el giro del motor · rojo = frenado · azul = entrega el giro.
 */

const ROLE_MAT: Record<Role, Material> = {
  entrada: M.gold,
  frenado: M.red,
  salida: M.blue,
  libre: M.steel,
}
const useRole = (m: Member) => useStore((s) => roleOf(s.gear, m))

const AXIS: V3 = [0, CRANK_Y, 0]
const OUTPUT_AXIS: V3 = [0, AT_OUTPUT.y, AT_OUTPUT.z]
const OUTPUT_X = ENGINE_FRAMES.transversal.position[0] + AT_OUTPUT.z // en coordenadas del auto
const FINAL_PINION_R = Math.hypot(OUTPUT_X - FRONT_DIFF[0], AT_OUTPUT.y - FRONT_DIFF[1]) - TA_RING_R
const TRANSFER_R = Math.hypot(AT_OUTPUT.y - CRANK_Y, AT_OUTPUT.z) / 2

export function TorqueConverter() {
  const impeller = useMemo(() => bladeRingGeometry(18, 0.045, 0.106, 0.018, 0.4), [])
  const turbine = useMemo(() => bladeRingGeometry(18, 0.045, 0.106, 0.018, -0.4), [])
  const stator = useMemo(() => bladeRingGeometry(11, 0.03, 0.058, 0.014, 0.7), [])
  const x = AT_CONVERTER_X
  return (
    <>
      <Part id="convertidor-par" explode={[0.12, 0, 0.35]} cutaway section="shell">
        <group position={[x, CRANK_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={M.steel}>
            <torusGeometry args={[0.075, 0.042, 20, 48]} />
          </mesh>
        </group>
      </Part>
      {/* Ruedas internas: sin cortar, se ven girando dentro de la carcasa */}
      <Part id="convertidor-par" explode={[0.12, 0, 0.35]}>
        <Spinner angle={() => sim.crank} position={AXIS}>
          <mesh geometry={impeller} position={[x + 0.016, 0, 0]} material={M.aluminum} />
        </Spinner>
        <Spinner angle={() => sim.input} position={AXIS}>
          <mesh geometry={turbine} position={[x - 0.016, 0, 0]} material={M.gold} />
        </Spinner>
        <Spinner angle={() => sim.stator} position={AXIS}>
          <mesh geometry={stator} position={[x, 0, 0]} material={M.darkSteel} />
        </Spinner>
      </Part>
    </>
  )
}

export function AutoCase() {
  return (
    <Part id="caja-automatica" explode={[-0.35, 0.3, 0]} cutaway section="shell" sectionDepth={0.2}>
      <mesh position={[0.7725, 0.3725, -0.075]} material={M.housing}>
        <boxGeometry args={[0.345, 0.345, 0.37]} />
      </mesh>
      <mesh position={[0.9875, CRANK_Y, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.housing}>
        <cylinderGeometry args={[0.14, 0.13, 0.085, 32, 1, true]} />
      </mesh>
    </Part>
  )
}

function Planetary() {
  const sunRole = useRole('sol')
  const carrierRole = useRole('porta')
  const ringRole = useRole('corona')
  const ring = useMemo(() => ringGearGeometry(RING_R, RING_R + 0.01, 34, 0.05), [])
  const orbit = PLANET.sun + PLANET.planet
  const x = AT_PLANET_X
  return (
    <Part id="tren-planetario" explode={[-0.1, 0.35, 0]}>
      {/* Eje de entrada (turbina) */}
      <Spinner angle={() => sim.input} position={AXIS}>
        <mesh position={[0.805, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.011, 0.011, 0.29, 12]} />
        </mesh>
      </Spinner>
      {/* Sol, con su manguito hasta el freno */}
      <Spinner angle={() => sim.sun} position={AXIS}>
        <Gear radius={PLANET.sun} teeth={13} thickness={0.05} material={ROLE_MAT[sunRole]} position={[x, 0, 0]} />
        <mesh position={[x + 0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={ROLE_MAT[sunRole]}>
          <cylinderGeometry args={[0.017, 0.017, 0.06, 16]} />
        </mesh>
      </Spinner>
      {/* Portasatélites (brazos, para ver los satélites a través) con 3 satélites */}
      <Spinner angle={() => sim.carrier} position={AXIS}>
        {[-0.03, 0.03].map((dx) =>
          [0, 1, 2].map((k) => (
            <group key={`${dx}${k}`} rotation={[(k * Math.PI * 2) / 3, 0, 0]}>
              <mesh position={[x + dx, orbit / 2, 0]} material={ROLE_MAT[carrierRole]}>
                <boxGeometry args={[0.006, orbit + 0.02, 0.016]} />
              </mesh>
              <mesh position={[x, orbit, 0]} rotation={[0, 0, Math.PI / 2]} material={ROLE_MAT[carrierRole]}>
                <cylinderGeometry args={[0.005, 0.005, 0.066, 8]} />
              </mesh>
            </group>
          )),
        )}
        <mesh position={[x + 0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={ROLE_MAT[carrierRole]}>
          <cylinderGeometry args={[0.022, 0.022, 0.012, 20]} />
        </mesh>
        {[0, 1, 2].map((k) => (
          <group key={k} rotation={[(k * Math.PI * 2) / 3, 0, 0]}>
            <Spinner angle={() => planetSpin() - sim.carrier} position={[0, orbit, 0]}>
              <Gear radius={PLANET.planet} teeth={9} thickness={0.045} material={M.steel} position={[x, 0, 0]} />
            </Spinner>
          </group>
        ))}
      </Spinner>
      {/* Corona de dientes internos, con el tambor donde aprieta la cinta */}
      <Spinner angle={() => sim.ring} position={AXIS}>
        <mesh geometry={ring} position={[x, 0, 0]} material={ROLE_MAT[ringRole]} />
        <mesh position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={ROLE_MAT[ringRole]}>
          <cylinderGeometry args={[RING_R + 0.014, RING_R + 0.014, 0.07, 40, 1, true]} />
        </mesh>
      </Spinner>
    </Part>
  )
}

/** Paquete de discos de embrague/freno, con eje X. */
function DiscPack({ x, r, active, material }: { x: number; r: number; active: boolean; material: Material }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => (
        <mesh key={k} position={[x - 0.012 + k * 0.006, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={active ? material : k % 2 ? M.friction : M.darkSteel}>
          <cylinderGeometry args={[r, r, 0.004, 28]} />
        </mesh>
      ))}
    </>
  )
}

function BrakesAndClutches() {
  const applied = useStore((s) => PLANS[s.gear]?.applied ?? null)
  const x = AT_PLANET_X
  return (
    <Part id="frenos-embragues" explode={[-0.1, -0.05, 0.3]}>
      {/* Freno de cinta alrededor del tambor de la corona */}
      <mesh position={[x, CRANK_Y, 0]} rotation={[0, 0, Math.PI / 2]} material={applied === 'cinta' ? M.red : M.darkSteel}>
        <cylinderGeometry args={[RING_R + 0.02, RING_R + 0.02, 0.035, 40, 1, true]} />
      </mesh>
      {/* Freno del sol (discos contra la carcasa) */}
      <group position={AXIS}>
        <DiscPack x={x + 0.075} r={0.045} active={applied === 'freno-sol'} material={M.red} />
      </group>
      {/* Embrague directo: une sol y corona, todo gira junto */}
      <Spinner angle={() => sim.input} position={AXIS}>
        <DiscPack x={0.72} r={0.05} active={applied === 'embrague-directo'} material={M.gold} />
      </Spinner>
    </Part>
  )
}

function TransferAndOutput() {
  return (
    <Part id="eje-salida-automatica" explode={[-0.1, 0.05, -0.3]}>
      {/* Engranaje de transferencia en el eje de entrada: gira con la salida del tren */}
      <Spinner angle={() => sim.output} position={AXIS}>
        <Gear radius={TRANSFER_R} thickness={0.025} material={M.blue} position={[AT_TRANSFER_X, 0, 0]} />
      </Spinner>
      {/* Eje de salida con su engranaje y el piñón de ataque del diferencial */}
      <Spinner angle={() => -sim.output} position={OUTPUT_AXIS}>
        <mesh position={[0.79, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
        </mesh>
        <Gear radius={TRANSFER_R} thickness={0.025} material={M.steel} position={[AT_TRANSFER_X, 0, 0]} />
        <Gear radius={FINAL_PINION_R} teeth={11} thickness={0.02} material={M.steel} position={[TA_FINAL_X, 0, 0]} />
      </Spinner>
    </Part>
  )
}

function ValveBody() {
  return (
    <Part id="cuerpo-valvulas" explode={[0, -0.12, 0]}>
      <mesh position={[0.77, 0.185, -0.075]} material={M.aluminum}>
        <boxGeometry args={[0.3, 0.03, 0.3]} />
      </mesh>
      {[0.66, 0.73, 0.8, 0.87].map((sx) => (
        <mesh key={sx} position={[sx, 0.185, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={M.black}>
          <cylinderGeometry args={[0.011, 0.011, 0.04, 12]} />
        </mesh>
      ))}
    </Part>
  )
}

/** Todo lo que va dentro del marco del conjunto motor. */
export function AutoTransaxle() {
  return (
    <>
      <TorqueConverter />
      <AutoCase />
      <Planetary />
      <BrakesAndClutches />
      <TransferAndOutput />
      <ValveBody />
    </>
  )
}

/** Palanca selectora P-R-N-D en la consola, con su cable hacia el transeje. */
const SELECTOR_TILT = { P: -0.3, R: -0.12, N: 0.05, D: 0.22 }

export function Selector({ base, cable }: { base: V3; cable: V3[] }) {
  const pivot = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = pivot.current
    if (!g) return
    const target = useStore.getState().gear > 0 ? SELECTOR_TILT.D : SELECTOR_TILT.N
    g.rotation.z += (target - g.rotation.z) * Math.min(1, dt * 10)
  })
  return (
    <Part id="palanca-selectora" explode={[0, 0.6, 0]}>
      <mesh position={[base[0], base[1] + 0.005, base[2]]} material={M.black}>
        <boxGeometry args={[0.16, 0.012, 0.06]} />
      </mesh>
      {Object.values(SELECTOR_TILT).map((t) => (
        <mesh key={t} position={[base[0] - Math.sin(t) * 0.05, base[1] + 0.013, base[2] + 0.022]} material={M.chrome}>
          <boxGeometry args={[0.012, 0.004, 0.008]} />
        </mesh>
      ))}
      <group ref={pivot} position={base}>
        <mesh position={[0, 0.11, 0]} material={M.chrome}>
          <cylinderGeometry args={[0.009, 0.011, 0.22, 12]} />
        </mesh>
        <mesh position={[0, 0.235, 0]} material={M.black}>
          <boxGeometry args={[0.05, 0.05, 0.035]} />
        </mesh>
      </group>
      <Pipe points={cable} r={0.005} material={M.black} />
    </Part>
  )
}

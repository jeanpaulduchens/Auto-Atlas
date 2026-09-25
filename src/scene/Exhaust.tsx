import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { Part, type V3 } from './Part'
import { FlowDots, Pipe, curveThrough } from './helpers'
import { M } from './materials'
import { CYL_X, DECK_Y } from './layout'

export const EXHAUST_COLLECTOR: V3 = [1.2, 0.46, 0.2]
const COLLECTOR = EXHAUST_COLLECTOR

/** Tramo bajo el auto, común a todas las versiones a combustión. */
const UNDERBODY: V3[] = [
  [0.2, 0.2, 0.2],
  [-0.4, 0.2, 0.2],
  [-1.5, 0.2, 0.26],
  [-1.95, 0.22, 0.3],
  [-2.3, 0.22, 0.3],
]
/** Atmosférico: el tubo parte en el colector del múltiple. */
const PIPE_NA: V3[] = [COLLECTOR, [1.12, 0.3, 0.2], [0.95, 0.2, 0.2], ...UNDERBODY]
/** Turbo: parte a la salida de la turbina (downpipe). */
const PIPE_TURBO: V3[] = [[1.06, 0.48, 0.3], [0.98, 0.36, 0.27], [0.9, 0.22, 0.22], ...UNDERBODY]

function Manifold() {
  return (
    <Part id="multiple-escape" explode={[0, 0.1, 0.5]}>
      {CYL_X.map((x) => (
        <Pipe
          key={x}
          points={[
            [x, DECK_Y + 0.05, 0.095],
            [x, DECK_Y + 0.02, 0.17],
            [(x + COLLECTOR[0]) / 2, COLLECTOR[1] + 0.06, 0.2],
            COLLECTOR,
          ]}
          r={0.015}
          material={M.castIron}
        />
      ))}
    </Part>
  )
}

function Catalyst() {
  return (
    <Part id="catalizador" explode={[0, -0.1, 0.55]}>
      <mesh position={[0.3, 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
        <cylinderGeometry args={[0.055, 0.055, 0.32, 24]} />
      </mesh>
      {[0.12, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[0.025, 0.055, 0.05, 24]} />
        </mesh>
      ))}
    </Part>
  )
}

function PipeAndMuffler({ turbo }: { turbo: boolean }) {
  const pipe = turbo ? PIPE_TURBO : PIPE_NA
  const curve = useMemo(() => curveThrough(pipe), [pipe])
  return (
    <Part id="silenciador" explode={[0, -0.1, 0.55]} cutaway section="translucent">
      <Pipe points={pipe} r={0.022} material={M.darkSteel} />
      <RoundedBox args={[0.42, 0.12, 0.2]} radius={0.04} position={[-1.75, 0.22, 0.3]} material={M.steel} />
      <FlowDots curve={curve} color="#d6d3d1" count={46} size={0.011} speed={0.1} />
    </Part>
  )
}

export function Exhaust({ turbo = false }: { turbo?: boolean }) {
  return (
    <>
      <Manifold />
      <Catalyst />
      <PipeAndMuffler turbo={turbo} />
    </>
  )
}

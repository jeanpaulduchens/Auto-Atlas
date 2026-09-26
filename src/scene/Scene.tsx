import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Box3, NeutralToneMapping, Sphere, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { TAU, sim } from '../sim'
import { CARS, hasModule } from '../cars'
import { converterRatio, stepPlanetary } from '../automatic'
import { useStore, type CameraView } from '../store'
import { partBounds, systemBounds } from './registry'
import { Labels } from './Labels'
import { BACKGROUND, StudioFloor, StudioLights } from './Studio'

// El post-procesado va en un archivo aparte que solo se descarga en calidad alta
const Effects = lazy(() => import('./Effects'))
import { Body } from './Body'
import { Chassis, Injection } from './Chassis'
import { Cooling } from './Cooling'
import { Clutch, Drivetrain, Lever } from './Drivetrain'
import { Engine } from './Engine'
import { Exhaust, Manifold } from './Exhaust'
import { FrontDifferential, FrontHalfShafts, TransaxleCase, TransaxleShafts } from './FrontDrive'
import { AutoTransaxle, Selector } from './AutoTransmission'
import { ElectricDrive } from './Electric'
import { ENGINE_FRAMES, engineDirToWorld } from './layout'
import { Turbo } from './Turbo'

const HOME_TARGET = new Vector3(0.05, 0.55, 0.15)
const HOME_POSITION = new Vector3(4.9, 2.6, 5.9)

/**
 * En pantalla vertical (celular) el auto, que es largo, no cabe a lo ancho:
 * se abre el ángulo de la cámara y se aleja un poco (alejarla mucho la hundiría en la niebla).
 */
const PORTRAIT = window.innerWidth / window.innerHeight < 1
const FOV = PORTRAIT ? 58 : 38

/** Vista general. */
function homeView() {
  const back = PORTRAIT ? 1.6 : 1
  return {
    target: HOME_TARGET.clone(),
    position: HOME_TARGET.clone().add(HOME_POSITION.clone().sub(HOME_TARGET).multiplyScalar(back)),
  }
}
const HOME = homeView()

/** Cámara inicial opcional desde la URL: ?cam=x,y,z&target=x,y,z */
function vecParam(key: string, fallback: Vector3) {
  const v = new URLSearchParams(window.location.search).get(key)?.split(',').map(Number)
  return v?.length === 3 && v.every((n) => !Number.isNaN(n)) ? new Vector3(...v) : fallback
}
const START = { target: vecParam('target', HOME.target), position: vecParam('cam', HOME.position) }

/**
 * Avanza la simulación mecánica y la animación de explosión.
 * Con el motor apagado el canvas dibuja solo a pedido: cualquier cambio del
 * store o una animación en curso pide el siguiente frame con invalidate().
 */
function SimDriver() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => useStore.subscribe(() => invalidate()), [invalidate])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useStore.getState()
    const diff = s.explode - sim.explode
    if (Math.abs(diff) > 1e-4) {
      sim.explode += diff * Math.min(1, dt * 5)
      invalidate()
    } else {
      sim.explode = s.explode
    }
    if (!s.running) return
    const dCrank = (s.rpm / 60) * TAU * s.slow * dt
    const automatic = hasModule(s.car, 'caja-automatica')
    // Manual: el embrague une o separa. Automática: el convertidor de par desliza un poco
    const slip = automatic ? converterRatio(s.gear, s.rpm) : 1
    const dInput = automatic ? dCrank * slip : s.clutch ? 0 : dCrank
    if (automatic) {
      stepPlanetary(s.gear, dInput)
      // El estator queda quieto mientras multiplica el par y gira libre cuando bomba y turbina se igualan
      if (slip > 0.93) sim.stator += dCrank * 0.9
    }
    const car = CARS[s.car]
    const dOutput = s.gear > 0 ? dInput / car.gears[s.gear] : 0
    sim.crank += dCrank
    sim.input += dInput
    sim.output += dOutput
    sim.wheel += dOutput / car.finalDrive
    // El turbo gira mucho más rápido que el motor y acelera con las rpm (más gases de escape)
    if (hasModule(s.car, 'turbo')) sim.turbo += dCrank * 6 * Math.min(2.5, Math.max(0.35, s.rpm / 2500))
    sim.fan += (1800 / 60) * TAU * s.slow * dt
  })
  return null
}

/**
 * Lleva la cámara suavemente hacia la pieza seleccionada, el sistema activo,
 * una vista pedida por un recorrido o la vista general.
 */
function CameraRig() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  const nonce = useStore((s) => s.focusNonce)
  const view = useStore((s) => s.view)
  const goal = useRef<{ target: Vector3; position: Vector3 } | null>(null)
  const pending = useRef<CameraView | null>(null)

  useEffect(() => {
    if (!view) return
    if (view.cam && view.target) goal.current = { target: new Vector3(...view.target), position: new Vector3(...view.cam) }
    else pending.current = view // se encuadra cuando las piezas dejan de moverse
  }, [view])

  /** Posición que encuadra las piezas pedidas, mirando desde view.dir. */
  const frameGoal = (v: CameraView) => {
    const box = new Box3()
    for (const id of v.frame ?? []) {
      const b = partBounds(id)
      if (b) box.union(b)
    }
    if (box.isEmpty()) return null
    const sphere = box.getBoundingSphere(new Sphere())
    const cam = camera as PerspectiveCamera
    const vfov = (cam.fov * Math.PI) / 180
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect)
    const MARGIN = 1.3
    const dist = (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * MARGIN * (v.zoom ?? 1)
    // Bajar un poco el objetivo sube las piezas en pantalla y deja libre la tarjeta del recorrido
    const target = sphere.center.clone()
    target.y -= sphere.radius * 0.12
    const d = v.dir ?? [0.5, 0.4, 1]
    // Vistas del motor: la dirección se da respecto al motor y gira con él si es transversal
    const layout = CARS[useStore.getState().car].layout
    const dir = new Vector3(...(v.engineSpace ? engineDirToWorld(layout, d) : d)).normalize()
    return { target, position: target.clone().addScaledVector(dir, dist) }
  }

  useEffect(() => {
    if (nonce === 0 || !controls) return
    const { selected, activeSystem } = useStore.getState()
    const box = selected ? partBounds(selected) : activeSystem ? systemBounds(activeSystem) : null
    if (!box) {
      goal.current = homeView()
      return
    }
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3()).length()
    const dir = camera.position.clone().sub(controls.target).normalize()
    goal.current = { target: center, position: center.clone().add(dir.multiplyScalar(Math.max(0.7, size * 1.4))) }
  }, [nonce, controls, camera])

  useEffect(() => {
    if (!controls) return
    const cancel = () => (goal.current = null)
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controls])

  useEffect(() => {
    if (goal.current) invalidate()
  })

  useFrame((_, dt) => {
    if (pending.current && Math.abs(useStore.getState().explode - sim.explode) < 0.01) {
      goal.current = frameGoal(pending.current)
      pending.current = null
    }
    if (pending.current) invalidate()
    const g = goal.current
    if (!g || !controls) return
    const k = Math.min(1, dt * 4)
    invalidate()
    controls.target.lerp(g.target, k)
    camera.position.lerp(g.position, k)
    if (camera.position.distanceTo(g.position) < 0.005) goal.current = null
  })
  return null
}

/**
 * Sombra de contacto. Volver a dibujarla cuesta un render completo del auto,
 * así que se actualiza en vivo solo mientras las piezas se desplazan y, al
 * detenerse (o al ocultar un sistema), se dibuja una vez y queda fija.
 */
function GroundShadow() {
  const [live, setLive] = useState(false)
  const [version, setVersion] = useState(0)
  const hidden = useStore((s) => s.hidden)
  const car = useStore((s) => s.car)
  useEffect(() => setVersion((v) => v + 1), [hidden, car])
  useFrame(() => {
    const moving = Math.abs(useStore.getState().explode - sim.explode) > 1e-3
    if (moving === live) return
    setLive(moving)
    if (!moving) setVersion((v) => v + 1)
  })
  return (
    <ContactShadows
      key={live ? 'live' : `fija-${version}`}
      frames={live ? Infinity : 1}
      // Bajo cero a propósito: drei difumina con un plano en y = 0 que su cámara (mirando hacia arriba)
      // debe tener delante. Por encima de 0 el difuminado no se dibuja y la sombra queda vacía.
      position={[0, -0.002, 0]}
      opacity={0.75}
      scale={9}
      blur={2.5}
      far={2}
      resolution={512}
    />
  )
}

/** Cables de la palanca en tracción delantera: de la consola al transeje, adelante. */
const FWD_LEVER_BASE: [number, number, number] = [0.22, 0.47, 0]
const FWD_SHIFT_CABLES: [number, number, number][] = [
  [0.22, 0.46, 0],
  [0.55, 0.42, 0.05],
  [0.95, 0.44, 0.22],
  [1.26, 0.54, 0.34],
]

/**
 * Arma el auto con los módulos de la versión elegida. El motor, el embrague y
 * el transeje van dentro del marco del conjunto motor (girado 90° si es
 * transversal); lo demás, en coordenadas del auto.
 */
function CarModules() {
  const carId = useStore((s) => s.car)
  const car = CARS[carId]
  const has = (m: Parameters<typeof hasModule>[1]) => hasModule(carId, m)
  const turbo = has('turbo')
  const manual = has('caja-manual')
  const automatic = has('caja-automatica')
  const fwd = has('traccion-delantera')
  const rwd = has('traccion-trasera')
  const frame = ENGINE_FRAMES[car.layout]
  return (
    // key: al cambiar de versión se montan piezas nuevas (materiales, anclas de etiquetas, sombra)
    <group key={carId}>
      {has('combustion') && (
        <>
          <group position={frame.position} rotation-y={frame.rotationY}>
            <Engine turbo={turbo} />
            <Manifold />
            <Injection />
            {manual && <Clutch />}
            {manual && fwd && (
              <>
                <TransaxleCase />
                <TransaxleShafts />
              </>
            )}
            {automatic && fwd && <AutoTransaxle />}
          </group>
          <Cooling layout={car.layout} />
          <Exhaust turbo={turbo} layout={car.layout} />
        </>
      )}
      {turbo && <Turbo />}
      {rwd && <Drivetrain />}
      {fwd && (
        <>
          <FrontDifferential />
          <FrontHalfShafts />
          {manual && <Lever base={FWD_LEVER_BASE} length={0.32} cables={FWD_SHIFT_CABLES} />}
          {automatic && <Selector base={FWD_LEVER_BASE} cable={FWD_SHIFT_CABLES} />}
        </>
      )}
      {has('electrica') && <ElectricDrive />}
      <Chassis
        layout={car.layout}
        rear={has('electrica') ? 'independiente' : rwd ? 'rigido' : 'torsion'}
        combustion={has('combustion')}
      />
      <Body kind={car.body} />
    </group>
  )
}

export function Scene() {
  const select = useStore((s) => s.select)
  const highQuality = useStore((s) => s.quality === 'alta')
  const running = useStore((s) => s.running)
  return (
    <Canvas
      frameloop={running ? 'always' : 'demand'}
      camera={{ position: START.position.toArray(), fov: FOV, near: 0.05, far: 100 }}
      dpr={[1, 2]}
      onPointerMissed={(e) => e.type === 'click' && select(null)}
      onCreated={(state) => {
        // Solo en desarrollo: permite inspeccionar el renderer desde la consola (window.__atlas)
        if (import.meta.env.DEV) Object.assign(window, { __atlas: state })
        state.gl.localClippingEnabled = true // planos de corte por material (modo sección)
        state.gl.toneMapping = NeutralToneMapping // en calidad alta lo reemplaza el del post-procesado
      }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 9, 26]} />
      <StudioLights />

      <SimDriver />
      <CarModules />
      <Labels />

      <GroundShadow />
      <StudioFloor />
      <OrbitControls makeDefault target={START.target} enableDamping maxPolarAngle={Math.PI * 0.49} minDistance={0.3} maxDistance={14} />
      <CameraRig />
      {highQuality && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
    </Canvas>
  )
}

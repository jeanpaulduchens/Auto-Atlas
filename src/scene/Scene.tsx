import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from '@react-three/drei'
import { Box3, Sphere, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { FINAL_DRIVE, GEAR_RATIOS, TAU, sim } from '../sim'
import { useStore, type CameraView } from '../store'
import { partBounds, systemBounds } from './registry'
import { Labels } from './Labels'
import { Body } from './Body'
import { Chassis } from './Chassis'
import { Cooling } from './Cooling'
import { Drivetrain } from './Drivetrain'
import { Engine } from './Engine'
import { Exhaust } from './Exhaust'

const HOME = { target: new Vector3(-0.3, 0.6, 0.4), position: new Vector3(4.6, 2.6, 5.6) }

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
    const dInput = s.clutch ? 0 : dCrank
    const dOutput = s.gear > 0 ? dInput / GEAR_RATIOS[s.gear] : 0
    sim.crank += dCrank
    sim.input += dInput
    sim.output += dOutput
    sim.wheel += dOutput / FINAL_DRIVE
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
    const dir = new Vector3(...(v.dir ?? [0.5, 0.4, 1])).normalize()
    return { target, position: target.clone().addScaledVector(dir, dist) }
  }

  useEffect(() => {
    if (nonce === 0 || !controls) return
    const { selected, activeSystem } = useStore.getState()
    const box = selected ? partBounds(selected) : activeSystem ? systemBounds(activeSystem) : null
    if (!box) {
      goal.current = { target: HOME.target.clone(), position: HOME.position.clone() }
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
  useEffect(() => setVersion((v) => v + 1), [hidden])
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
      position={[0, 0.002, 0]}
      opacity={0.6}
      scale={9}
      blur={2.5}
      far={2}
      resolution={512}
    />
  )
}

export function Scene() {
  const select = useStore((s) => s.select)
  const running = useStore((s) => s.running)
  return (
    <Canvas
      frameloop={running ? 'always' : 'demand'}
      camera={{ position: START.position.toArray(), fov: 38, near: 0.05, far: 100 }}
      dpr={[1, 2]}
      onPointerMissed={(e) => e.type === 'click' && select(null)}
      onCreated={(state) => {
        // Solo en desarrollo: permite inspeccionar el renderer desde la consola (window.__atlas)
        if (import.meta.env.DEV) Object.assign(window, { __atlas: state })
        state.gl.localClippingEnabled = true // planos de corte por material (modo sección)
      }}
    >
      <color attach="background" args={['#0b0e14']} />
      <fog attach="fog" args={['#0b0e14', 14, 32]} />
      <hemisphereLight args={['#e0f2fe', '#1e293b', 0.7]} />
      <directionalLight position={[5, 8, 4]} intensity={2} />
      <directionalLight position={[-5, 4, -4]} intensity={0.7} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" color="#bae6fd" intensity={1.5} position={[0, 3, 6]} scale={3} />
      </Environment>

      <SimDriver />
      <Engine />
      <Drivetrain />
      <Cooling />
      <Exhaust />
      <Chassis />
      <Body />
      <Labels />

      <GroundShadow />
      <Grid
        position={[0, 0, 0]}
        cellSize={0.25}
        sectionSize={1}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={16}
        infiniteGrid
      />
      <OrbitControls makeDefault target={START.target} enableDamping maxPolarAngle={Math.PI * 0.49} minDistance={0.3} maxDistance={14} />
      <CameraRig />
    </Canvas>
  )
}

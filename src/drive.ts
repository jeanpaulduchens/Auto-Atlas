import { FINAL_DRIVE, GEAR_RATIOS, TAU, WHEEL_RADIUS } from './sim'
import { useStore } from './store'

export const IDLE_RPM = 850
export const REDLINE_RPM = 6500
const STALL_RPM = 350

const RAD_TO_RPM = 60 / TAU
const ENGINE_INERTIA = 0.25 // kg·m², motor + volante
const MASS = 1100 // kg
const EFFICIENCY = 0.9 // caja + diferencial
const CLUTCH_CAPACITY = 230 // N·m que el embrague transmite apretado del todo
const BRAKE_FORCE = 7000 // N
const DRAG = 0.36 // ½·ρ·Cd·A
const ROLLING = 130 // N
const SUBSTEP = 0.001 // s: el embrague patinando es rígido, necesita pasos cortos

/**
 * Estado físico del modo manejo, en tiempo real (la cámara lenta solo afecta
 * a lo que se dibuja). Vive fuera de React: se actualiza en cada frame.
 */
export const drive = {
  omega: IDLE_RPM / RAD_TO_RPM, // velocidad del motor, rad/s
  v: 0, // velocidad del auto, m/s
  throttle: 0, // 0..1
  brake: 0, // 0..1
  clutch: 1, // acople del embrague: 0 = pisado, 1 = suelto
  locked: false, // embrague sin patinar
  inputs: { throttle: false, brake: false, clutch: false },
  get rpm() {
    return this.omega * RAD_TO_RPM
  },
  get kmh() {
    return this.v * 3.6
  },
}

/** Curva de torque del motor (N·m) a plena carga. */
function maxTorque(rpm: number) {
  const x = (rpm - 4000) / 4500
  return Math.max(60, 150 * (1 - x * x))
}

const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step)

function substep(dt: number, gear: number, running: boolean) {
  const d = drive
  const rpm = d.rpm

  let torque: number
  if (running) {
    const idle = Math.min(0.4, Math.max(0, (IDLE_RPM - rpm) / 250)) // el ralentí se sostiene solo
    const throttle = rpm > REDLINE_RPM ? 0 : Math.max(d.throttle, idle) // corte de inyección
    torque = throttle * maxTorque(rpm) - (8 + 0.0035 * rpm) // menos fricción interna
  } else {
    torque = -(15 + 0.01 * rpm)
  }

  const moving = d.v > 0.01 ? 1 : 0
  const resist = moving * (DRAG * d.v * d.v + ROLLING + d.brake * BRAKE_FORCE)
  const k = gear > 0 ? (FINAL_DRIVE * GEAR_RATIOS[gear]) / WHEEL_RADIUS : 0 // rad/s del motor por m/s

  if (k > 0 && d.clutch > 0.02) {
    if (d.locked && d.clutch > 0.95) {
      // Motor y ruedas unidos: se aceleran juntos
      const a = (torque * k * EFFICIENCY - resist) / (MASS + ENGINE_INERTIA * k * k)
      d.v = Math.max(0, d.v + a * dt)
      d.omega = d.v * k
    } else {
      // Embrague patinando: transmite torque según cuánto está apretado
      d.locked = false
      const slip = d.omega - d.v * k
      const clutchTorque = d.clutch * CLUTCH_CAPACITY * Math.tanh(slip / 3)
      d.omega += ((torque - clutchTorque) / ENGINE_INERTIA) * dt
      d.v = Math.max(0, d.v + ((clutchTorque * k * EFFICIENCY - resist) / MASS) * dt)
      if (d.clutch > 0.95 && Math.abs(d.omega - d.v * k) < 2) d.locked = true
    }
  } else {
    d.locked = false
    d.omega += (torque / ENGINE_INERTIA) * dt
    d.v = Math.max(0, d.v - (resist / MASS) * dt)
  }
  d.omega = Math.max(0, d.omega)
}

/** Avanza la física un frame. Devuelve true si el motor se acaba de parar. */
export function stepDrive(dt: number, gear: number, running: boolean) {
  const d = drive
  d.throttle = approach(d.throttle, d.inputs.throttle ? 1 : 0, dt * 5)
  d.brake = approach(d.brake, d.inputs.brake ? 1 : 0, dt * 6)
  // Pisar es rápido; soltar toma ~0,6 s, y ahí es donde patina
  d.clutch = approach(d.clutch, d.inputs.clutch ? 0 : 1, dt * (d.inputs.clutch ? 8 : 1.6))

  const steps = Math.min(100, Math.ceil(dt / SUBSTEP))
  for (let i = 0; i < steps; i++) substep(dt / steps, gear, running)
  return running && d.rpm < STALL_RPM
}

export function resetDrive() {
  const running = useStore.getState().running
  Object.assign(drive, { omega: running ? IDLE_RPM / RAD_TO_RPM : 0, v: 0, throttle: 0, brake: 0, clutch: 1, locked: false })
  Object.assign(drive.inputs, { throttle: false, brake: false, clutch: false })
}

/** Cambia de marcha. En modo manejo exige el embrague pisado (salvo para ir a neutro). */
export function shiftTo(gear: number) {
  const s = useStore.getState()
  if (s.driveMode && gear !== 0 && drive.clutch > 0.3) {
    s.notify('Pisa el embrague para cambiar de marcha (Espacio)')
    return
  }
  drive.locked = false
  s.set({ gear })
}

export function toggleEngine() {
  const s = useStore.getState()
  if (s.running) {
    s.set({ running: false })
    return
  }
  if (s.driveMode && s.gear > 0 && drive.clutch > 0.3) {
    s.notify('Para arrancar, pon neutro o pisa el embrague')
    return
  }
  drive.omega = IDLE_RPM / RAD_TO_RPM
  drive.locked = false
  s.set({ running: true })
}

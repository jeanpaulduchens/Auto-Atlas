import { PLANET, RING_R } from './cars'
import { sim } from './sim'

/**
 * Caja automática simplificada a un tren planetario: sol, satélites en su
 * portasatélites y corona. Según la marcha, un embrague une una pieza al motor
 * (entrada), un freno sujeta otra (quieta) y la tercera entrega el giro (salida).
 * Todas cumplen la ecuación de Willis:  S·ω_sol + R·ω_corona = (S + R)·ω_porta
 */

export type Member = 'sol' | 'porta' | 'corona'
export type Role = 'entrada' | 'frenado' | 'salida' | 'libre'

interface GearPlan {
  input: Member | 'todo'
  held?: Member
  output: Member
  /** Qué freno o embrague está aplicado. */
  applied: 'cinta' | 'freno-sol' | 'embrague-directo' | null
}

export const PLANS: Record<number, GearPlan | null> = {
  0: null, // neutro: nada aplicado, el tren queda suelto
  1: { input: 'sol', held: 'corona', output: 'porta', applied: 'cinta' },
  2: { input: 'corona', held: 'sol', output: 'porta', applied: 'freno-sol' },
  3: { input: 'todo', output: 'porta', applied: 'embrague-directo' },
  4: { input: 'porta', held: 'sol', output: 'corona', applied: 'freno-sol' },
}

export function roleOf(gear: number, m: Member): Role {
  const plan = PLANS[gear]
  if (!plan) return 'libre'
  if (plan.input === 'todo' || plan.input === m) return 'entrada'
  if (plan.held === m) return 'frenado'
  if (plan.output === m) return 'salida'
  return 'libre'
}

const S = PLANET.sun
const R = RING_R

/** Avanza los ángulos del tren planetario para un giro dIn del eje de entrada (turbina). */
export function stepPlanetary(gear: number, dIn: number) {
  const plan = PLANS[gear]
  if (!plan) return
  let dSun = 0
  let dRing = 0
  let dCarrier = 0
  if (plan.input === 'todo') {
    dSun = dRing = dCarrier = dIn
  } else {
    const d: Record<Member, number | null> = { sol: null, porta: null, corona: null }
    d[plan.input] = dIn
    if (plan.held) d[plan.held] = 0
    // Despeja la pieza que falta con la ecuación de Willis
    if (d.sol === null) d.sol = ((S + R) * d.porta! - R * d.corona!) / S
    else if (d.corona === null) d.corona = ((S + R) * d.porta! - S * d.sol) / R
    else if (d.porta === null) d.porta = (S * d.sol + R * d.corona) / (S + R)
    dSun = d.sol!
    dRing = d.corona!
    dCarrier = d.porta!
  }
  sim.sun += dSun
  sim.ring += dRing
  sim.carrier += dCarrier
}

/** Ángulo propio de cada satélite (rueda sin deslizar sobre el sol). */
export const planetSpin = () => sim.carrier - (S / PLANET.planet) * (sim.sun - sim.carrier)

/**
 * Deslizamiento del convertidor de par: la turbina gira algo más lenta que la
 * bomba (el motor). A más rpm, menos deslizamiento; en 3ª y 4ª sobre 1.800 rpm
 * se cierra el embrague de bloqueo y giran juntas.
 */
export function converterRatio(gear: number, rpm: number) {
  if (gear === 0) return 0.97 // sin carga, la turbina casi acompaña a la bomba
  if (gear >= 3 && rpm > 1800) return 1
  return Math.min(0.95, 0.72 + 0.23 * Math.min(1, rpm / 3000))
}

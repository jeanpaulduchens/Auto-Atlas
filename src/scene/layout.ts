/**
 * Cotas generales (metros). Ejes: +X hacia adelante, +Y arriba, +Z hacia la derecha del conductor.
 * El motor está algo agrandado respecto a uno real para que se lean bien sus piezas.
 */
export const WHEEL_Y = 0.31
export const FRONT_AXLE_X = 1.3
export const REAR_AXLE_X = -1.3
export const TRACK_Z = 0.75

// Motor 4 en línea longitudinal
export const CRANK_Y = 0.42
export const CRANK_R = 0.04 // radio de la muñequilla (media carrera)
export const ROD_L = 0.13
export const CYL_X = [1.4, 1.3, 1.2, 1.1]
export const PISTON_R = 0.039
export const PISTON_TOP = 0.035 // desde el bulón hasta la cabeza del pistón
export const DECK_Y = CRANK_Y + CRANK_R + ROD_L + PISTON_TOP + 0.005
export const HEAD_TOP = DECK_Y + 0.11
export const CAM_Y = DECK_Y + 0.13
export const CAM_Z = 0.05 // admisión en -Z, escape en +Z
export const CAM_BASE_R = 0.018
export const VALVE_LIFT = 0.012
export const VALVE_DX = 0.022
export const VALVE_Y = DECK_Y + 0.004
export const ENGINE_FRONT_X = 1.47
export const ENGINE_REAR_X = 1.03

// Transmisión
export const GEARBOX_COUNTER_Y = CRANK_Y - 0.1
export const GEAR_CENTER_DIST = 0.1
export const GEAR_X = [0, 0.49, 0.56, 0.63, 0.7, 0.42] // por marcha (índice = marcha)
export const DIFF_X = REAR_AXLE_X
export const PINION_YOKE_X = -1.12
export const GEARBOX_OUT_X = 0.28

/** Altura del bulón del pistón para un ángulo de muñequilla dado. */
export function pinY(theta: number) {
  const s = CRANK_R * Math.sin(theta)
  return CRANK_Y + CRANK_R * Math.cos(theta) + Math.sqrt(ROD_L * ROD_L - s * s)
}

// ── Disposición del conjunto motor ─────────────────────────────
// El motor, el embrague y la caja se modelan en coordenadas propias (cigüeñal
// a lo largo de X local). Cada disposición ubica y gira ese conjunto en el auto.

type P3 = [number, number, number]
export type EngineLayout = 'longitudinal' | 'transversal'

export const ENGINE_FRAMES: Record<EngineLayout, { position: P3; rotationY: number }> = {
  longitudinal: { position: [0, 0, 0], rotationY: 0 },
  // Girado 90°: cigüeñal a lo ancho del auto, escape hacia adelante y transeje a la derecha
  transversal: { position: [1.45, 0, 1.13], rotationY: Math.PI / 2 },
}

/** Punto del conjunto motor (coordenadas propias) en coordenadas del auto. */
export function engineToWorld(layout: EngineLayout, [x, y, z]: P3): P3 {
  const f = ENGINE_FRAMES[layout]
  const c = Math.cos(f.rotationY)
  const s = Math.sin(f.rotationY)
  return [f.position[0] + x * c + z * s, f.position[1] + y, f.position[2] - x * s + z * c]
}

/** Dirección del conjunto motor en coordenadas del auto (para encuadrar la cámara). */
export function engineDirToWorld(layout: EngineLayout, [x, y, z]: P3): P3 {
  const r = ENGINE_FRAMES[layout].rotationY
  return [x * Math.cos(r) + z * Math.sin(r), y, -x * Math.sin(r) + z * Math.cos(r)]
}

// ── Transeje (tracción delantera), en coordenadas del conjunto motor ─────
export const TA_INPUT = { y: CRANK_Y, z: 0 } // coaxial con el cigüeñal
export const TA_OUTPUT = { y: 0.408, z: -0.099 } // a 0,1 m del primario
export const TA_GEAR_X = [0, 0.66, 0.71, 0.76, 0.81, 0.86] // por marcha
export const TA_FINAL_X = 0.925 // piñón de ataque, junto a la campana
export const TA_RING_R = 0.082
/** Diferencial delantero, en coordenadas del auto (sobre el eje de las ruedas delanteras). */
export const FRONT_DIFF: P3 = [FRONT_AXLE_X, WHEEL_Y, ENGINE_FRAMES.transversal.position[2] - TA_FINAL_X]

// ── Transeje automático, en coordenadas del conjunto motor ────────────
// El eje de salida va más lejos del de entrada (0,14 m) para dejar espacio al
// convertidor de par, y a 0,11 m del diferencial, igual que en el manual.
export const AT_OUTPUT = { y: 0.4196, z: -0.14 }
export const AT_PLANET_X = 0.8
export const AT_CONVERTER_X = 0.955
export const AT_TRANSFER_X = 0.66

// ── Propulsión eléctrica (tracción trasera), en coordenadas del auto ───
// Motor con su eje paralelo al eje trasero; reductora de dos etapas (3:1 · 3:1).
export const EV_MOTOR = { x: -1.12, y: 0.34, z0: -0.2, z1: 0.06, r: 0.1 }
export const EV_IDLER = { x: -1.2, y: 0.47 }
export const EV_DIFF: P3 = [REAR_AXLE_X, WHEEL_Y, 0.14]
export const EV_STAGE1_Z = 0.1
export const EV_PACK = { x0: -0.95, x1: 0.95, y0: 0.13, y1: 0.3, z: 0.6 }

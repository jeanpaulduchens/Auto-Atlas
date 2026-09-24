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

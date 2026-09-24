import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { brushedTexture, castTexture, treadTexture } from './textures'

const std = (color: string, metalness: number, roughness: number, extra = {}) =>
  new MeshStandardMaterial({ color, metalness, roughness, ...extra })

/** Metal fundido: rugosidad y relieve granulados (bloque, culata, carcasas). */
const cast = (color: string, metalness: number) =>
  std(color, metalness, 1, { roughnessMap: castTexture(), bumpMap: castTexture(), bumpScale: 0.6 })

/** Aluminio cepillado: vetas que alargan los reflejos. */
const brushed = (color: string, metalness: number, roughness: number) =>
  std(color, metalness, roughness, { roughnessMap: brushedTexture() })

/**
 * Materiales compartidos. <Part> clona el material de cada malla al montarla,
 * así que resaltar o transparentar una pieza no afecta a las demás.
 * Los valores de emisión mayores a 1 hacen brillar faros y luces (bloom).
 */
export const M = {
  paint: new MeshPhysicalMaterial({
    color: '#a3141c',
    metalness: 0.55,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  }),
  // Opaco a propósito: la cabina provisoria es maciza (con un modelo real, pasar a vidrio translúcido)
  windowGlass: new MeshPhysicalMaterial({ color: '#0b1320', metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
  chrome: std('#e5e7eb', 1, 0.12),
  steel: brushed('#a1a1aa', 0.9, 0.55),
  darkSteel: std('#52525b', 0.85, 0.42),
  aluminum: brushed('#cbd5e1', 0.8, 0.7),
  castIron: cast('#6b6f76', 0.55),
  black: std('#27272a', 0.2, 0.6),
  rubber: std('#18181b', 0, 0.92),
  tire: std('#151518', 0, 1, { roughnessMap: treadTexture(), bumpMap: treadTexture(), bumpScale: 3 }),
  gold: std('#eab308', 0.95, 0.28),
  copper: std('#c2410c', 0.9, 0.3),
  red: std('#dc2626', 0.3, 0.45),
  friction: std('#78350f', 0.1, 0.9),
  ceramic: std('#f5f5f4', 0, 0.35),
  valveCover: cast('#7f1d1d', 0.4),
  seat: std('#3f3f46', 0, 0.95),
  hose: std('#1c1917', 0, 0.75),
  belt: std('#0c0a09', 0, 0.85),
  radiatorFin: brushed('#94a3b8', 0.8, 0.6),
  fuelTank: std('#44403c', 0.5, 0.5),
  headlight: std('#f8fafc', 0.2, 0.1, { emissive: '#fef9c3', emissiveIntensity: 3 }),
  taillight: std('#7f1d1d', 0.2, 0.2, { emissive: '#ef4444', emissiveIntensity: 2.2 }),
  // Carcasas: se vuelven translúcidas o se cortan según el modo de interior.
  block: cast('#9ca3af', 0.5),
  housing: cast('#a8a29e', 0.55),
}

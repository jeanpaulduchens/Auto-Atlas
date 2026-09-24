import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'

const std = (color: string, metalness: number, roughness: number, extra = {}) =>
  new MeshStandardMaterial({ color, metalness, roughness, ...extra })

/**
 * Materiales compartidos. <Part> clona el material de cada malla al montarla,
 * así que resaltar o transparentar una pieza no afecta a las demás.
 */
export const M = {
  paint: new MeshPhysicalMaterial({
    color: '#b91c1c',
    metalness: 0.5,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  }),
  windowGlass: std('#0f172a', 0.9, 0.05),
  chrome: std('#e5e7eb', 1, 0.15),
  steel: std('#a1a1aa', 0.9, 0.32),
  darkSteel: std('#52525b', 0.85, 0.42),
  aluminum: std('#cbd5e1', 0.75, 0.38),
  castIron: std('#71717a', 0.6, 0.6),
  black: std('#27272a', 0.2, 0.6),
  rubber: std('#18181b', 0, 0.92),
  gold: std('#eab308', 0.95, 0.28),
  copper: std('#c2410c', 0.9, 0.3),
  red: std('#dc2626', 0.3, 0.45),
  friction: std('#78350f', 0.1, 0.9),
  ceramic: std('#f5f5f4', 0, 0.35),
  valveCover: std('#7f1d1d', 0.4, 0.5),
  seat: std('#3f3f46', 0, 0.95),
  hose: std('#1c1917', 0, 0.75),
  belt: std('#0c0a09', 0, 0.85),
  radiatorFin: std('#94a3b8', 0.8, 0.35),
  fuelTank: std('#44403c', 0.5, 0.5),
  headlight: std('#f8fafc', 0.2, 0.1, { emissive: '#fef9c3', emissiveIntensity: 0.9 }),
  taillight: std('#7f1d1d', 0.2, 0.2, { emissive: '#dc2626', emissiveIntensity: 0.8 }),
  // Piezas “de corte”: se vuelven translúcidas con el modo Corte activo.
  block: std('#9ca3af', 0.55, 0.45),
  housing: std('#a8a29e', 0.6, 0.45),
}

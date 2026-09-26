/**
 * Versiones del auto. Cada una combina módulos (motor, caja, disposición…);
 * las piezas del catálogo declaran a qué módulo pertenecen y solo aparecen en
 * las versiones que lo incluyen.
 */

import type { EngineLayout } from './scene/layout'

export type CarId = 'sedan' | 'sedan-turbo' | 'compacto' | 'compacto-automatico'

/** Grupos de piezas que se agregan o quitan según la versión. */
export type Module =
  | 'combustion' // motor de gasolina con sus sistemas (admisión, escape, combustible, refrigeración)
  | 'turbo'
  | 'caja-manual' // embrague, palanca y caja de engranajes con sincronizadores
  | 'caja-automatica' // convertidor de par, tren planetario, frenos y embragues hidráulicos
  | 'traccion-trasera' // caja longitudinal, cardán, diferencial y puente trasero
  | 'traccion-delantera' // transeje, semiejes con juntas homocinéticas y eje trasero de torsión

export interface CarConfig {
  id: CarId
  name: string
  /** Ficha corta: disposición · caja · motor. */
  spec: string
  modules: Module[]
  layout: EngineLayout
  body: 'sedan' | 'hatch'
  paint: string
  /** Relaciones de la caja por marcha (índice 0 = neutro). */
  gears: number[]
  finalDrive: number
}

const MANUAL_5 = [0, 3.54, 2.13, 1.36, 1.0, 0.82]

/**
 * Caja automática de un solo tren planetario (sol S, corona R): cada marcha
 * sale de qué pieza recibe el giro y cuál se frena. Con R/S = 2,47:
 * 1ª 1 + R/S · 2ª 1 + S/R · 3ª directa · 4ª sobremarcha 1 / (1 + S/R).
 */
export const PLANET = { sun: 0.03, planet: 0.022 } // radios (m)
export const RING_R = PLANET.sun + 2 * PLANET.planet
const K = RING_R / PLANET.sun
const AUTO_4 = [0, 1 + K, 1 + 1 / K, 1, 1 / (1 + 1 / K)]

export const CARS: Record<CarId, CarConfig> = {
  sedan: {
    id: 'sedan',
    name: 'Sedán clásico',
    spec: 'Tracción trasera · manual 5 · 4 cil.',
    modules: ['combustion', 'caja-manual', 'traccion-trasera'],
    layout: 'longitudinal',
    body: 'sedan',
    paint: '#a3141c',
    gears: MANUAL_5,
    finalDrive: 3.9,
  },
  'sedan-turbo': {
    id: 'sedan-turbo',
    name: 'Sedán turbo',
    spec: 'Tracción trasera · manual 5 · 4 cil. turbo',
    modules: ['combustion', 'turbo', 'caja-manual', 'traccion-trasera'],
    layout: 'longitudinal',
    body: 'sedan',
    paint: '#1d4f91',
    gears: MANUAL_5,
    finalDrive: 3.7,
  },
  compacto: {
    id: 'compacto',
    name: 'Compacto',
    spec: 'Tracción delantera · manual 5 · 4 cil. transversal',
    modules: ['combustion', 'caja-manual', 'traccion-delantera'],
    layout: 'transversal',
    body: 'hatch',
    paint: '#1f7a5c',
    gears: [0, 3.45, 1.94, 1.28, 0.95, 0.76],
    finalDrive: 4.07,
  },
  'compacto-automatico': {
    id: 'compacto-automatico',
    name: 'Compacto automático',
    spec: 'Tracción delantera · automática 4 · 4 cil. transversal',
    modules: ['combustion', 'caja-automatica', 'traccion-delantera'],
    layout: 'transversal',
    body: 'hatch',
    paint: '#b4531a',
    gears: AUTO_4,
    finalDrive: 3.6,
  },
}

export const CAR_ORDER = Object.keys(CARS) as CarId[]

export const hasModule = (car: CarId, m: Module) => CARS[car].modules.includes(m)

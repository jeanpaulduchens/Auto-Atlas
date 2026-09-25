/**
 * Versiones del auto. Cada una combina módulos (motor, caja, disposición…);
 * las piezas del catálogo declaran a qué módulo pertenecen y solo aparecen en
 * las versiones que lo incluyen.
 */

export type CarId = 'sedan' | 'sedan-turbo'

/** Grupos de piezas que se agregan o quitan según la versión. */
export type Module =
  | 'combustion' // motor de gasolina con sus sistemas (admisión, escape, combustible, refrigeración)
  | 'turbo'
  | 'manual-longitudinal' // embrague + caja manual en línea con el motor
  | 'traccion-trasera' // cardán, diferencial y puente trasero

export interface CarConfig {
  id: CarId
  name: string
  /** Ficha corta: disposición · caja · motor. */
  spec: string
  modules: Module[]
  paint: string
  /** Relaciones de la caja por marcha (índice 0 = neutro). */
  gears: number[]
  finalDrive: number
}

const MANUAL_5 = [0, 3.54, 2.13, 1.36, 1.0, 0.82]

export const CARS: Record<CarId, CarConfig> = {
  sedan: {
    id: 'sedan',
    name: 'Sedán clásico',
    spec: 'Tracción trasera · manual 5 · 4 cil.',
    modules: ['combustion', 'manual-longitudinal', 'traccion-trasera'],
    paint: '#a3141c',
    gears: MANUAL_5,
    finalDrive: 3.9,
  },
  'sedan-turbo': {
    id: 'sedan-turbo',
    name: 'Sedán turbo',
    spec: 'Tracción trasera · manual 5 · 4 cil. turbo',
    modules: ['combustion', 'turbo', 'manual-longitudinal', 'traccion-trasera'],
    paint: '#1d4f91',
    gears: MANUAL_5,
    finalDrive: 3.7,
  },
}

export const CAR_ORDER = Object.keys(CARS) as CarId[]

export const hasModule = (car: CarId, m: Module) => CARS[car].modules.includes(m)

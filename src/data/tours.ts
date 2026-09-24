import type { SystemId } from './parts'
import type { CameraView, Interior } from '../store'

export interface TourState {
  explode?: number
  bodyOpacity?: number
  interior?: Interior
  running?: boolean
  rpm?: number
  slow?: number
  gear?: number
  clutch?: boolean
}

export interface TourStep {
  title: string
  text: string
  /** Qué encuadrar y desde dónde. Se calcula con el tamaño real de las piezas. */
  view: CameraView
  /** Pieza resaltada, con su etiqueta. */
  select?: string
  state?: TourState
  /** Sistemas ocultos en este paso (si no, los del recorrido). */
  hidden?: SystemId[]
}

export interface Tour {
  id: string
  name: string
  blurb: string
  base: TourState
  hidden: SystemId[]
  steps: TourStep[]
}

const CICLO_OCULTOS: SystemId[] = ['escape', 'ruedas', 'suspension', 'frenos']
const MOTOR: string[] = ['bloque', 'culata', 'tapa-valvulas']

export const TOURS: Tour[] = [
  {
    id: 'ciclo',
    name: 'El ciclo de 4 tiempos',
    blurb: 'Qué pasa dentro de cada cilindro',
    base: { interior: 'seccion', rpm: 900, slow: 0.05, gear: 0 },
    hidden: CICLO_OCULTOS,
    steps: [
      {
        title: 'Un motor cortado por la mitad',
        text: 'Cortamos el auto y el motor a lo largo para ver adentro. Los cuatro pistones suben y bajan en sus cilindros; el color de cada cámara indica en qué tiempo está.',
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: [...MOTOR, 'carter'], dir: [0.5, 0.45, 1] },
      },
      {
        title: 'Admisión',
        text: 'El pistón baja y las válvulas de admisión se abren: entra aire con combustible (celeste).',
        select: 'valvulas',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: MOTOR, dir: [0.25, 0.35, 1], zoom: 0.95 },
      },
      {
        title: 'Compresión y chispa',
        text: 'Las válvulas se cierran y el pistón sube apretando la mezcla (azul). Al llegar arriba, la bujía hace saltar la chispa: el destello amarillo.',
        select: 'bujias',
        state: { slow: 0.02 },
        view: { frame: MOTOR, dir: [0.2, 0.75, 1], zoom: 0.95 },
      },
      {
        title: 'Explosión',
        text: 'La mezcla se quema y empuja el pistón hacia abajo con varias toneladas de fuerza (naranja). Es el único de los cuatro tiempos que produce trabajo.',
        select: 'pistones',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: ['bloque'], dir: [0.3, 0.2, 1], zoom: 1.05 },
      },
      {
        title: 'Escape',
        text: 'El pistón vuelve a subir y expulsa los gases quemados (gris) por las válvulas de escape. Las abre este árbol de levas, que gira a la mitad de velocidad que el cigüeñal.',
        select: 'arbol-levas-escape',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: ['culata', 'tapa-valvulas'], dir: [0.35, 0.6, 1], zoom: 1.05 },
      },
      {
        title: 'Del sube y baja al giro',
        text: 'Las bielas transforman el movimiento de los pistones en giro del cigüeñal. Con el orden de encendido 1-3-4-2, siempre hay un cilindro empujando.',
        select: 'ciguenal',
        hidden: [...CICLO_OCULTOS, 'electrico', 'carroceria'],
        view: { frame: ['ciguenal', 'bloque'], dir: [0.35, 0.1, 1], zoom: 1.0 },
      },
    ],
  },
  {
    id: 'transmision',
    name: 'Del motor a las ruedas',
    blurb: 'El camino de la fuerza hasta el asfalto',
    base: { interior: 'seccion', rpm: 1500, slow: 0.05, gear: 1 },
    hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'suspension', 'frenos'],
    steps: [
      {
        title: 'Tracción trasera',
        text: 'La fuerza del motor viaja hacia atrás: embrague, caja de cambios, cardán y diferencial, hasta las ruedas traseras.',
        view: { frame: ['bloque', 'caja-cambios', 'cardan', 'puente-trasero'], dir: [0.15, 0.55, 1], zoom: 0.75 },
      },
      {
        title: 'Embrague',
        text: 'Une el motor con la caja. El plato gira con el motor y el disco (marrón) con la caja; al pisar el pedal se separan y la caja se detiene.',
        select: 'embrague',
        view: { frame: ['embrague', 'volante-motor', 'caja-cambios'], dir: [0.45, 0.4, 1], zoom: 0.9 },
      },
      {
        title: 'Caja de cambios en 2ª',
        text: 'Todos los engranajes giran, pero solo uno queda unido al eje de salida: el que bloquea el sincronizador dorado. En 2ª, el motor da 2,13 vueltas por cada vuelta del eje.',
        select: 'eje-secundario',
        state: { gear: 2 },
        view: { frame: ['caja-cambios'], dir: [0.3, 0.3, 1], zoom: 1.0 },
      },
      {
        title: 'Cardán',
        text: 'Lleva el giro hacia atrás. Las crucetas de sus extremos le permiten seguir girando aunque la suspensión suba y baje.',
        select: 'cardan',
        state: { gear: 2 },
        view: { frame: ['cardan'], dir: [0.15, 0.6, 1], zoom: 0.9 },
      },
      {
        title: 'Diferencial',
        text: 'El piñón mueve la corona dorada: reduce la velocidad 3,9 veces y gira el movimiento 90° hacia las ruedas. En una curva, deja que cada rueda gire a su propio ritmo.',
        select: 'diferencial',
        state: { gear: 2 },
        view: { frame: ['diferencial'], dir: [0.7, 0.55, 1], zoom: 1.5 },
      },
      {
        title: 'Hasta las ruedas',
        text: 'Los semiejes llevan el giro a cada rueda. En 2ª, el motor da 8,3 vueltas por cada vuelta de rueda (2,13 × 3,9).',
        select: 'semiejes',
        state: { gear: 2 },
        view: { frame: ['semiejes', 'puente-trasero'], dir: [-0.5, 0.9, 0.9], zoom: 0.85 },
      },
    ],
  },
  {
    id: 'refrigeracion',
    name: 'Cómo se enfría el motor',
    blurb: 'El recorrido del refrigerante',
    base: { interior: 'translucido', rpm: 1500, slow: 0.05, gear: 0 },
    hidden: ['carroceria', 'escape', 'electrico', 'suspension', 'ruedas', 'frenos'],
    steps: [
      {
        title: 'El circuito',
        text: 'Cerca de un tercio de la energía de la gasolina se convierte en calor. El refrigerante lo saca del motor y lo entrega al aire en el radiador.',
        view: { frame: ['radiador', 'bloque', 'mangueras'], dir: [1, 0.6, 0.9], zoom: 0.9 },
      },
      {
        title: 'Bomba de agua',
        text: 'La correa del motor mueve la bomba, que empuja el refrigerante por los conductos del bloque y la culata.',
        select: 'bomba-agua',
        view: { frame: ['bomba-agua', 'correa-accesorios'], dir: [0.3, 1, -0.6], zoom: 1.4 },
      },
      {
        title: 'Sale caliente',
        text: 'Cuando pasa de unos 90 °C, el termostato se abre y el líquido caliente (rojo) sale por la manguera superior hacia el radiador.',
        select: 'mangueras',
        view: { frame: ['mangueras'], dir: [0.3, 0.7, 1], zoom: 1.0 },
      },
      {
        title: 'Radiador',
        text: 'Baja por decenas de tubos rodeados de aletas y el aire se lleva el calor. Sale frío (azul) por abajo y vuelve a la bomba.',
        select: 'radiador',
        view: { frame: ['radiador'], dir: [1, 0.35, 0.6], zoom: 1.0 },
      },
      {
        title: 'Electroventilador',
        text: 'Si el auto va lento o está detenido no entra suficiente aire, así que el electroventilador lo empuja a través del radiador.',
        select: 'ventilador',
        view: { frame: ['ventilador', 'radiador'], dir: [-0.7, 0.55, 0.7], zoom: 1.0 },
      },
    ],
  },
]

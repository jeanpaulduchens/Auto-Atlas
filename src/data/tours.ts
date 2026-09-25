import type { SystemId } from './parts'
import { hasModule, type CarId, type Module } from '../cars'
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
  /** Módulos que debe tener la versión para ofrecer este recorrido. */
  requires: Module[]
  base: TourState
  hidden: SystemId[]
  steps: TourStep[]
}

// Refrigeración oculta: con motor transversal, el radiador tapa la vista del motor
const CICLO_OCULTOS: SystemId[] = ['escape', 'ruedas', 'suspension', 'frenos', 'refrigeracion']
const MOTOR: string[] = ['bloque', 'culata', 'tapa-valvulas']

export const TOURS: Tour[] = [
  {
    id: 'ciclo',
    name: 'El ciclo de 4 tiempos',
    blurb: 'Qué pasa dentro de cada cilindro',
    requires: ['combustion'],
    base: { interior: 'seccion', rpm: 900, slow: 0.05, gear: 0 },
    hidden: CICLO_OCULTOS,
    steps: [
      {
        title: 'Un motor cortado por la mitad',
        text: 'Cortamos el auto y el motor a lo largo para ver adentro. Los cuatro pistones suben y bajan en sus cilindros; el color de cada cámara indica en qué tiempo está.',
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: [...MOTOR, 'carter'], dir: [0.5, 0.45, 1], engineSpace: true },
      },
      {
        title: 'Admisión',
        text: 'El pistón baja y las válvulas de admisión se abren: entra aire con combustible (celeste).',
        select: 'valvulas',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: MOTOR, dir: [0.25, 0.35, 1], zoom: 0.95, engineSpace: true },
      },
      {
        title: 'Compresión y chispa',
        text: 'Las válvulas se cierran y el pistón sube apretando la mezcla (azul). Al llegar arriba, la bujía hace saltar la chispa: el destello amarillo.',
        select: 'bujias',
        state: { slow: 0.02 },
        view: { frame: MOTOR, dir: [0.2, 0.75, 1], zoom: 0.95, engineSpace: true },
      },
      {
        title: 'Explosión',
        text: 'La mezcla se quema y empuja el pistón hacia abajo con varias toneladas de fuerza (naranja). Es el único de los cuatro tiempos que produce trabajo.',
        select: 'pistones',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: ['bloque'], dir: [0.3, 0.2, 1], zoom: 1.05, engineSpace: true },
      },
      {
        title: 'Escape',
        text: 'El pistón vuelve a subir y expulsa los gases quemados (gris) por las válvulas de escape. Las abre este árbol de levas, que gira a la mitad de velocidad que el cigüeñal.',
        select: 'arbol-levas-escape',
        state: { slow: 0.02 },
        hidden: [...CICLO_OCULTOS, 'electrico'],
        view: { frame: ['culata', 'tapa-valvulas'], dir: [0.35, 0.6, 1], zoom: 1.05, engineSpace: true },
      },
      {
        title: 'Del sube y baja al giro',
        text: 'Las bielas transforman el movimiento de los pistones en giro del cigüeñal. Con el orden de encendido 1-3-4-2, siempre hay un cilindro empujando.',
        select: 'ciguenal',
        hidden: [...CICLO_OCULTOS, 'electrico', 'carroceria'],
        view: { frame: ['ciguenal', 'bloque'], dir: [0.35, 0.1, 1], zoom: 1.0, engineSpace: true },
      },
    ],
  },
  {
    id: 'transmision',
    name: 'Del motor a las ruedas',
    blurb: 'El camino de la fuerza hasta el asfalto',
    requires: ['caja-manual', 'traccion-trasera'],
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
    requires: ['combustion'],
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
        view: { frame: ['bomba-agua', 'correa-accesorios'], dir: [0.3, 1, -0.6], zoom: 1.4, engineSpace: true },
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
  {
    id: 'traccion-delantera',
    name: 'Tracción delantera',
    blurb: 'Motor atravesado y todo adelante',
    requires: ['caja-manual', 'traccion-delantera'],
    base: { interior: 'seccion', rpm: 1500, slow: 0.05, gear: 2 },
    hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'refrigeracion', 'suspension', 'frenos'],
    steps: [
      {
        title: 'Todo en la parte delantera',
        text: 'El motor va atravesado, con el cigüeñal a lo ancho del auto. A su lado va el transeje, que junta caja y diferencial, y dos semiejes llevan el giro a las ruedas delanteras. No hay cardán: el piso queda plano y el auto es más corto.',
        view: { frame: ['bloque', 'transeje', 'semiejes-delanteros'], dir: [0.55, 0.9, 0.7], zoom: 0.85 },
      },
      {
        title: 'Transeje: solo dos ejes',
        text: 'El primario (unido al embrague) y el secundario engranan directo, sin eje intermediario. El collar dorado bloquea la 2ª marcha, y en el extremo del secundario un piñón mueve la corona del diferencial.',
        select: 'transeje-ejes',
        hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'refrigeracion', 'suspension', 'frenos', 'ruedas'],
        view: { frame: ['transeje'], dir: [1, 0.45, 0.45], zoom: 0.95 },
      },
      {
        title: 'Diferencial delantero',
        text: 'La corona dorada gira con las ruedas y reparte el giro entre los dos semiejes. En una curva, la rueda de afuera gira más rápido que la de adentro.',
        select: 'diferencial-delantero',
        hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'refrigeracion', 'suspension', 'frenos', 'ruedas'],
        view: { frame: ['diferencial-delantero', 'transeje'], dir: [1, 0.35, -0.25], zoom: 1.0 },
      },
      {
        title: 'Juntas homocinéticas',
        text: 'Bajo cada fuelle negro hay una junta que transmite el giro aunque el semieje esté en ángulo: la rueda gira para doblar y sube y baja con la suspensión, sin tirones.',
        select: 'semiejes-delanteros',
        hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'refrigeracion', 'ruedas'],
        view: { frame: ['semiejes-delanteros'], dir: [1, 0.3, 0.25], zoom: 0.75 },
      },
      {
        title: 'Atrás, solo acompañan',
        text: 'Las ruedas traseras no reciben fuerza del motor, así que basta un eje de torsión simple: dos brazos unidos por una viga que se tuerce.',
        select: 'suspension-trasera-torsion',
        hidden: ['carroceria', 'escape', 'electrico', 'combustible', 'refrigeracion', 'frenos'],
        view: { frame: ['suspension-trasera-torsion'], dir: [-0.6, 0.8, 0.8], zoom: 0.9 },
      },
    ],
  },
  {
    id: 'turbo',
    name: 'Cómo funciona el turbo',
    blurb: 'Los gases de escape empujan aire al motor',
    requires: ['turbo'],
    base: { interior: 'translucido', rpm: 3000, slow: 0.05, gear: 0 },
    hidden: ['carroceria', 'suspension', 'ruedas', 'frenos', 'electrico'],
    steps: [
      {
        title: 'Energía que se perdía',
        text: 'Los gases de escape salen calientes y a presión. El turbo aprovecha esa energía para empujar más aire dentro del motor: más aire permite quemar más combustible.',
        view: { frame: ['turbo', 'intercooler', 'ductos-turbo', 'bloque'], dir: [0.55, 0.75, 1], zoom: 0.85 },
      },
      {
        title: 'La turbina',
        text: 'Los gases (naranjos) salen del múltiple de escape y hacen girar la turbina, la rueda de álabes del lado de hierro. Después siguen hacia el catalizador.',
        select: 'turbo',
        view: { frame: ['turbo', 'multiple-escape'], dir: [-0.3, 0.55, 1], zoom: 1.0 },
      },
      {
        title: 'El compresor',
        text: 'Un eje une la turbina con el compresor, del lado de aluminio. El compresor aspira aire fresco del filtro (celeste claro) y lo empuja comprimido. A plena carga, el eje supera las 150.000 rpm.',
        select: 'turbo',
        state: { rpm: 4500 },
        view: { frame: ['turbo'], dir: [1, 0.45, 0.8], zoom: 1.3 },
      },
      {
        title: 'Intercooler',
        text: 'Al comprimirse, el aire se calienta (naranjo claro). El intercooler lo enfría con el aire que entra por el frente del auto: el aire frío es más denso y trae más oxígeno.',
        select: 'intercooler',
        view: { frame: ['intercooler', 'ductos-turbo'], dir: [1, 0.7, 0.5], zoom: 0.8 },
      },
      {
        title: 'De vuelta al motor',
        text: 'El aire comprimido y enfriado (celeste) llega a la mariposa y al múltiple de admisión. Cada cilindro recibe hasta un 50 % más de aire que en un motor atmosférico.',
        select: 'ductos-turbo',
        view: { frame: ['ductos-turbo', 'admision'], dir: [0.5, 0.9, -1], zoom: 0.9 },
      },
    ],
  },
]

/** Recorridos disponibles en una versión del auto. */
export const toursForCar = (car: CarId) => TOURS.filter((t) => t.requires.every((m) => hasModule(car, m)))

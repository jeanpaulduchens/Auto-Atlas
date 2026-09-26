import { create } from 'zustand'
import { SYSTEM_ORDER, type SystemId } from './data/parts'
import { CARS, type CarId } from './cars'

export type V3 = [number, number, number]

/** Cómo se muestran las carcasas (bloque, culata, caja…): cerradas, translúcidas o cortadas por la mitad. */
export type Interior = 'cerrado' | 'translucido' | 'seccion'

/** Alta: post-procesado (oclusión ambiental, brillo, tone mapping de cine). Rápida: para equipos modestos. */
export type Quality = 'alta' | 'rapida'

export interface AppState {
  car: CarId
  explode: number
  bodyOpacity: number
  interior: Interior
  quality: Quality
  /** Etiquetas sobre las piezas (se pueden ocultar para solo hacer clic). */
  labels: boolean
  running: boolean
  rpm: number
  slow: number
  gear: number
  clutch: boolean
  selected: string | null
  hovered: string | null
  isolate: boolean
  hidden: Record<SystemId, boolean>
  /** Sistema elegido en la vista desarmada (muestra las etiquetas de sus piezas). */
  activeSystem: SystemId | null
  /** Recorrido guiado en curso. */
  tour: { id: string; step: number } | null
  /** Se incrementa para pedirle a la cámara que enfoque la selección (o la vista general si no hay). */
  focusNonce: number
  /** Vista de cámara pedida explícitamente (recorridos); n cambia en cada pedido. */
  view: (CameraView & { n: number }) | null
  /** Cajón de piezas (izquierda) abierto. */
  partsOpen: boolean
  /** Tarjeta de mecánica (abajo a la derecha) minimizada. */
  mechMin: boolean
  set: (patch: Partial<AppState>) => void
  toggleLabels: () => void
  setCar: (car: CarId) => void
  select: (id: string | null, focus?: boolean) => void
  toggleSystem: (id: SystemId) => void
  focus: () => void
  goTo: (view: CameraView) => void
}

/**
 * Vista de cámara: encuadra unas piezas mirando desde una dirección (se adapta
 * a cualquier modelo), o una posición y un objetivo fijos.
 */
export interface CameraView {
  /** Piezas a encuadrar. */
  frame?: string[]
  /** Dirección desde las piezas hacia la cámara. */
  dir?: V3
  /** >1 aleja, <1 acerca. */
  zoom?: number
  /** La dirección es relativa al motor (gira con él en un motor transversal). */
  engineSpace?: boolean
  cam?: V3
  target?: V3
}

/** Permite abrir una vista concreta: ?explode=1&body=0.2&interior=seccion&gear=2&select=ciguenal&tour=ciclo&step=2 */
const params = new URLSearchParams(window.location.search)
const num = (key: string, fallback: number) => {
  const v = params.get(key)
  return v !== null && !Number.isNaN(+v) ? +v : fallback
}
const INTERIORS: Interior[] = ['cerrado', 'translucido', 'seccion']
const interiorParam = params.get('interior') as Interior | null

/** Preferencia del visitante, recordada en su navegador (puede no estar disponible). */
const LABELS_KEY = 'auto-atlas:etiquetas'
function readLabels() {
  try {
    return localStorage.getItem(LABELS_KEY) !== 'no'
  } catch {
    return true
  }
}
function saveLabels(on: boolean) {
  try {
    localStorage.setItem(LABELS_KEY, on ? 'si' : 'no')
  } catch {
    // sin almacenamiento: la preferencia dura solo esta visita
  }
}

export const noneHidden = () => Object.fromEntries(SYSTEM_ORDER.map((s) => [s, false])) as Record<SystemId, boolean>

const carParam = params.get('auto') as CarId | null

export const useStore = create<AppState>((set) => ({
  car: carParam && carParam in CARS ? carParam : 'sedan',
  explode: num('explode', 0),
  bodyOpacity: num('body', 1),
  interior: interiorParam && INTERIORS.includes(interiorParam) ? interiorParam : 'translucido',
  // Celulares y tablets (pantalla táctil) parten en Rápida: el post-procesado exige más GPU
  quality: (params.get('calidad') as Quality | null) ?? (window.matchMedia('(pointer: coarse)').matches ? 'rapida' : 'alta'),
  labels: readLabels(),
  running: params.get('running') !== '0',
  rpm: num('rpm', 900),
  slow: num('slow', 0.05),
  gear: num('gear', 0),
  clutch: params.get('clutch') === '1',
  selected: params.get('select'),
  hovered: null,
  isolate: false,
  hidden: noneHidden(),
  activeSystem: null,
  tour: null,
  focusNonce: 0,
  view: null,
  // En pantallas anchas el cajón de piezas parte abierto; en celulares, todo parte recogido
  partsOpen: window.innerWidth >= 1100,
  mechMin: window.innerWidth < 760,
  set: (patch) => set(patch),
  setCar: (car) =>
    set((s) => ({
      car,
      gear: 0,
      clutch: false,
      selected: null,
      isolate: false,
      activeSystem: null,
      tour: null,
      hidden: noneHidden(),
      focusNonce: s.focusNonce + 1,
    })),
  toggleLabels: () =>
    set((s) => {
      saveLabels(!s.labels)
      return { labels: !s.labels }
    }),
  select: (id, focus = false) =>
    set((s) => ({
      selected: id,
      isolate: id ? s.isolate : false,
      activeSystem: id ? s.activeSystem : null,
      focusNonce: focus ? s.focusNonce + 1 : s.focusNonce,
    })),
  toggleSystem: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  focus: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),
  goTo: (view) => set((s) => ({ view: { ...view, n: (s.view?.n ?? 0) + 1 } })),
}))

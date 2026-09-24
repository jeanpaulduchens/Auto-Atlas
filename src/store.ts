import { create } from 'zustand'
import { SYSTEM_ORDER, type SystemId } from './data/parts'

export interface AppState {
  explode: number
  bodyOpacity: number
  cutaway: boolean
  running: boolean
  rpm: number
  slow: number
  gear: number
  clutch: boolean
  /** Modo manejo: el motor y el auto responden a acelerador, freno, embrague y marchas. */
  driveMode: boolean
  sound: boolean
  /** Aviso breve en pantalla (ej. “se paró el motor”); n cambia en cada aviso nuevo. */
  toast: { text: string; n: number } | null
  selected: string | null
  hovered: string | null
  isolate: boolean
  hidden: Record<SystemId, boolean>
  /** Se incrementa para pedirle a la cámara que enfoque la selección (o la vista general si no hay). */
  focusNonce: number
  set: (patch: Partial<AppState>) => void
  select: (id: string | null, focus?: boolean) => void
  toggleSystem: (id: SystemId) => void
  focus: () => void
  notify: (text: string) => void
}

/** Permite abrir una vista concreta: ?explode=1&body=0.2&gear=2&rpm=1500&select=ciguenal */
const params = new URLSearchParams(window.location.search)
const num = (key: string, fallback: number) => {
  const v = params.get(key)
  return v !== null && !Number.isNaN(+v) ? +v : fallback
}

export const useStore = create<AppState>((set) => ({
  explode: num('explode', 0),
  bodyOpacity: num('body', 1),
  cutaway: params.get('cutaway') !== '0',
  running: params.get('running') !== '0',
  rpm: num('rpm', 900),
  slow: num('slow', 0.05),
  gear: num('gear', 0),
  clutch: params.get('clutch') === '1',
  driveMode: params.get('drive') === '1',
  sound: false,
  toast: null,
  selected: params.get('select'),
  hovered: null,
  isolate: false,
  hidden: Object.fromEntries(SYSTEM_ORDER.map((s) => [s, false])) as Record<SystemId, boolean>,
  focusNonce: 0,
  set: (patch) => set(patch),
  select: (id, focus = false) =>
    set((s) => ({
      selected: id,
      isolate: id ? s.isolate : false,
      focusNonce: focus ? s.focusNonce + 1 : s.focusNonce,
    })),
  toggleSystem: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  focus: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),
  notify: (text) => set((s) => ({ toast: { text, n: (s.toast?.n ?? 0) + 1 } })),
}))

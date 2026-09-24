import { TOURS, type TourState } from './data/tours'
import { noneHidden, useStore, type AppState } from './store'

/** Estado con que arranca cada paso, antes de aplicar lo propio del recorrido y del paso. */
const STEP_DEFAULTS: Required<TourState> = {
  explode: 0,
  bodyOpacity: 1,
  interior: 'seccion',
  running: true,
  rpm: 900,
  slow: 0.05,
  gear: 0,
  clutch: false,
}

const RESTORED = ['explode', 'bodyOpacity', 'interior', 'running', 'rpm', 'slow', 'gear', 'clutch', 'hidden', 'selected', 'panelCollapsed'] as const
type Saved = Pick<AppState, (typeof RESTORED)[number]>

/** Cómo estaba la vista antes del recorrido, para devolverla al terminar. */
let saved: Saved | null = null

export function goToStep(tourId: string, step: number) {
  const tour = TOURS.find((t) => t.id === tourId)
  if (!tour) return
  const s = useStore.getState()
  if (!s.tour) saved = Object.fromEntries(RESTORED.map((k) => [k, s[k]])) as Saved

  const i = Math.max(0, Math.min(step, tour.steps.length - 1))
  const st = tour.steps[i]
  const hidden = noneHidden()
  for (const sys of st.hidden ?? tour.hidden) hidden[sys] = true

  s.set({
    ...STEP_DEFAULTS,
    ...tour.base,
    ...st.state,
    hidden,
    selected: st.select ?? null,
    isolate: false,
    activeSystem: null,
    tour: { id: tourId, step: i },
    panelCollapsed: true, // más espacio para la vista; se restaura al salir
  })
  s.goTo(st.view)
}

export function endTour() {
  const s = useStore.getState()
  s.set({ ...saved, tour: null, isolate: false, activeSystem: null })
  saved = null
  s.focus()
}

/** ?tour=ciclo&step=2 abre directamente un paso de un recorrido. */
export function startTourFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('tour')
  if (id) goToStep(id, Number(params.get('step') ?? 1) - 1)
}

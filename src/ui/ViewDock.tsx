import { useStore, type Interior } from '../store'
import { Icon, Segmented } from './controls'

const INTERIOR: { value: Interior; label: string; title: string }[] = [
  { value: 'cerrado', label: 'Cerrado', title: 'Piezas cerradas, como en el auto real' },
  { value: 'translucido', label: 'Translúcido', title: 'Carcasas translúcidas para ver adentro' },
  { value: 'seccion', label: 'Corte', title: 'Cortar por la mitad, como un plano técnico' },
]

/** Controles de vista, abajo al centro: lo que más se usa, siempre a mano. */
export function ViewDock() {
  const explode = useStore((s) => s.explode)
  const bodyOpacity = useStore((s) => s.bodyOpacity)
  const interior = useStore((s) => s.interior)
  const touring = useStore((s) => s.tour !== null)
  const set = useStore((s) => s.set)
  const select = useStore((s) => s.select)
  const partsOpen = useStore((s) => s.partsOpen)
  if (touring) return null
  // Centrada en el espacio libre entre el cajón de piezas y la tarjeta de mecánica
  const left = partsOpen ? 'calc(var(--drawer-w) + 2 * var(--edge))' : 'var(--edge)'
  return (
    <div className="dock-area" style={{ left }}>
      <div className="dock" role="toolbar" aria-label="Vista">
        <label className="dock-slider">
          <span>Desarmar</span>
          <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => set({ explode: +e.target.value })} />
        </label>
        <span className="dock-sep" />
        <Segmented options={INTERIOR} value={interior} onChange={(v) => set({ interior: v })} label="Interior" />
        <span className="dock-sep" />
        <label className="dock-slider narrow">
          <span>Carrocería</span>
          <input type="range" min={0} max={1} step={0.01} value={bodyOpacity} onChange={(e) => set({ bodyOpacity: +e.target.value })} />
        </label>
        <span className="dock-sep" />
        <button className="icon-btn" title="Vista general" onClick={() => select(null, true)}>
          <Icon name="home" />
        </button>
      </div>
    </div>
  )
}

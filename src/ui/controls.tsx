import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CYLINDERS, STROKES, cycleAngle, strokeOf } from '../sim'
import { useStore } from '../store'

/** Íconos de trazo, 20×20, heredan el color del texto. */
const PATHS = {
  chevron: 'M5 7.5l5 5 5-5',
  close: 'M5 5l10 10M15 5L5 15',
  search: 'M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM13.5 13.5L17 17',
  tag: 'M3 3h6l8 8-6 6-8-8V3zM6.5 6.5h.01',
  help: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM7.8 7.5a2.3 2.3 0 0 1 4.4.9c0 1.6-2.2 2-2.2 3.3M10 14.5h.01',
  home: 'M3 9.5L10 3l7 6.5M5 8v9h10V8',
  play: 'M6 4l10 6-10 6V4z',
  pause: 'M6 4h3v12H6zM11 4h3v12h-3z',
  minus: 'M5 10h10',
  plus: 'M10 5v10M5 10h10',
  parts: 'M3 5h14M3 10h14M3 15h9',
  route: 'M4 16a2 2 0 1 0 0-.01M16 4a2 2 0 1 0 0-.01M4 14V9a3 3 0 0 1 3-3h6M13 3l3 3-3 3',
  sparkle: 'M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Grupo de botones excluyentes. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: { value: T; label: string; title?: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div className={`seg ${className}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Botón que abre un panel flotante; se cierra con clic afuera o Esc. */
export function Popover({
  trigger,
  title,
  className = '',
  align = 'left',
  children,
}: {
  trigger: ReactNode
  title: string
  className?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="pop-root" ref={root}>
      <button className={`pop-trigger ${className} ${open ? 'open' : ''}`} aria-expanded={open} aria-haspopup="dialog" title={title} onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <div className={`pop ${align}`} role="dialog" aria-label={title}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

/** Tiempo del ciclo de cada cilindro, actualizado fuera de React en cada frame. */
export function CycleReadout() {
  const cells = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    let raf = 0
    const loop = () => {
      CYLINDERS.forEach((c, i) => {
        const el = cells.current[i]
        if (!el) return
        const k = String(strokeOf(cycleAngle(i)))
        if (el.dataset.k === k) return
        el.dataset.k = k
        el.className = `stroke s${k}`
        el.textContent = `${c.n} · ${STROKES[+k]}`
      })
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="strokes" aria-label="Tiempo de cada cilindro">
      {CYLINDERS.map((_, i) => (
        <div key={i} ref={(el) => void (cells.current[i] = el)} className="stroke" />
      ))}
    </div>
  )
}

/** Atajos globales: L etiquetas, P cajón de piezas. */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const s = useStore.getState()
      if (e.key === 'l' || e.key === 'L') s.toggleLabels()
      else if ((e.key === 'p' || e.key === 'P') && !s.tour) s.set({ partsOpen: !s.partsOpen })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

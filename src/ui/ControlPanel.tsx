import { useEffect, useRef, useState } from 'react'
import { PARTS, SYSTEMS, SYSTEM_ORDER, type SystemId } from '../data/parts'
import { CYLINDERS, FINAL_DRIVE, GEAR_RATIOS, STROKES, TAU, WHEEL_RADIUS, cycleAngle, strokeOf } from '../sim'
import { useStore, type Interior } from '../store'
import { TOURS } from '../data/tours'
import { endTour, goToStep } from '../tours'

const SPEEDS = [
  { label: '×0.02', value: 0.02 },
  { label: '×0.05', value: 0.05 },
  { label: '×0.15', value: 0.15 },
  { label: '×0.5', value: 0.5 },
  { label: 'Real', value: 1 },
]

/** Tiempo del ciclo de cada cilindro, actualizado fuera de React en cada frame. */
function CycleReadout() {
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
    <div className="strokes">
      {CYLINDERS.map((_, i) => (
        <div key={i} ref={(el) => void (cells.current[i] = el)} className="stroke" />
      ))}
    </div>
  )
}

function SystemRow({ id }: { id: SystemId }) {
  const [open, setOpen] = useState(false)
  const hidden = useStore((s) => s.hidden[id])
  const selected = useStore((s) => s.selected)
  const toggle = useStore((s) => s.toggleSystem)
  const select = useStore((s) => s.select)
  const parts = Object.entries(PARTS).filter(([, p]) => p.system === id)
  return (
    <div className="system">
      <div className="system-head">
        <input type="checkbox" checked={!hidden} onChange={() => toggle(id)} title="Mostrar/ocultar" />
        <span className="dot" style={{ background: SYSTEMS[id].color }} />
        <button className="link" onClick={() => setOpen(!open)}>
          {SYSTEMS[id].name}
        </button>
        <span className="chev">{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <ul className="part-list">
          {parts.map(([pid, p]) => (
            <li key={pid}>
              <button className={`link ${selected === pid ? 'active' : ''}`} onClick={() => select(pid, true)}>
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const INTERIOR: { value: Interior; label: string }[] = [
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'translucido', label: 'Translúcido' },
  { value: 'seccion', label: 'Corte' },
]

function Tours() {
  const tour = useStore((s) => s.tour)
  return (
    <section>
      <h2>Recorridos</h2>
      <div className="tours">
        {TOURS.map((t) => {
          const active = tour?.id === t.id
          return (
            <button
              key={t.id}
              className={`tour-item ${active ? 'active' : ''}`}
              onClick={() => (active ? endTour() : goToStep(t.id, 0))}
              aria-pressed={active}
            >
              <span className="tour-item-name">{t.name}</span>
              <span className="tour-item-meta">
                {t.blurb} · {t.steps.length} pasos
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function ControlPanel() {
  const s = useStore()
  const collapsed = s.panelCollapsed
  const setCollapsed = (v: boolean) => s.set({ panelCollapsed: v })
  const wheelRpm = s.running && !s.clutch && s.gear > 0 ? s.rpm / GEAR_RATIOS[s.gear] / FINAL_DRIVE : 0
  const kmh = (wheelRpm * TAU * WHEEL_RADIUS * 60) / 1000

  return (
    <aside className={`panel left ${collapsed ? 'collapsed' : ''}`}>
      <header>
        <div>
          <h1>Auto Atlas</h1>
          <p className="muted">Anatomía interactiva de un automóvil</p>
        </div>
        <button className="icon" onClick={() => setCollapsed(!collapsed)} title="Contraer panel">
          {collapsed ? '☰' : '×'}
        </button>
      </header>

      {!collapsed && (
        <div className="scroll">
          <Tours />

          <section>
            <h2>Vista</h2>
            <label className="row">
              <span>Desarmar</span>
              <input type="range" min={0} max={1} step={0.01} value={s.explode} onChange={(e) => s.set({ explode: +e.target.value })} />
            </label>
            <div className="btns">
              <button onClick={() => s.set({ explode: 0 })}>Armar</button>
              <button onClick={() => s.set({ explode: 1 })}>Desarmar</button>
              <button onClick={() => s.select(null, true)}>Vista general</button>
            </div>
            <label className="row">
              <span>Carrocería</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={s.bodyOpacity}
                onChange={(e) => s.set({ bodyOpacity: +e.target.value })}
              />
            </label>
            <div className="row">
              <span>Interior</span>
              <div className="seg" role="group" aria-label="Cómo se ven el motor, la caja y la carrocería por dentro">
                {INTERIOR.map((o) => (
                  <button key={o.value} className={s.interior === o.value ? 'on' : ''} onClick={() => s.set({ interior: o.value })}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2>Motor</h2>
            <div className="btns">
              <button className={s.running ? 'on' : ''} onClick={() => s.set({ running: !s.running })}>
                {s.running ? '■ Apagar' : '▶ Encender'}
              </button>
            </div>
            <label className="row">
              <span>{s.rpm} rpm</span>
              <input type="range" min={700} max={6500} step={50} value={s.rpm} onChange={(e) => s.set({ rpm: +e.target.value })} />
            </label>
            <div className="row">
              <span>Cámara lenta</span>
              <div className="seg">
                {SPEEDS.map((o) => (
                  <button key={o.value} className={s.slow === o.value ? 'on' : ''} onClick={() => s.set({ slow: o.value })}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <CycleReadout />
          </section>

          <section>
            <h2>Caja de cambios</h2>
            <div className="seg gears">
              {['N', '1', '2', '3', '4', '5'].map((g, i) => (
                <button key={g} className={s.gear === i ? 'on' : ''} onClick={() => s.set({ gear: i })}>
                  {g}
                </button>
              ))}
            </div>
            <div className="btns">
              <button className={s.clutch ? 'on' : ''} onClick={() => s.set({ clutch: !s.clutch })}>
                {s.clutch ? 'Soltar embrague' : 'Pisar embrague'}
              </button>
            </div>
            <div className="readout">
              <div>
                <b>{kmh.toFixed(0)}</b> km/h
              </div>
              <div>
                <b>{wheelRpm.toFixed(0)}</b> rpm rueda
              </div>
              <div>
                <b>{s.gear > 0 ? (GEAR_RATIOS[s.gear] * FINAL_DRIVE).toFixed(1) : '–'}</b> : 1 total
              </div>
            </div>
          </section>

          <section>
            <h2>Sistemas y piezas</h2>
            {SYSTEM_ORDER.map((id) => (
              <SystemRow key={id} id={id} />
            ))}
          </section>
        </div>
      )}
    </aside>
  )
}

import { useMemo, useState } from 'react'
import { PARTS, SYSTEMS, SYSTEM_ORDER, partInCar, type SystemId } from '../data/parts'
import { useStore } from '../store'
import { Icon } from './controls'

/** Compara sin tildes ni mayúsculas. */
const fold = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function SystemRow({ id, parts, onPick }: { id: SystemId; parts: [string, (typeof PARTS)[string]][]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const hidden = useStore((s) => s.hidden[id])
  const selected = useStore((s) => s.selected)
  const toggle = useStore((s) => s.toggleSystem)
  const hasSelected = parts.some(([pid]) => pid === selected)
  const expanded = open || hasSelected
  return (
    <div className="system">
      <div className="system-head">
        <input type="checkbox" checked={!hidden} onChange={() => toggle(id)} aria-label={`Mostrar ${SYSTEMS[id].name}`} />
        <span className="dot" style={{ background: SYSTEMS[id].color }} />
        <button className="link" aria-expanded={expanded} onClick={() => setOpen(!expanded)}>
          {SYSTEMS[id].name}
          <span className="count">{parts.length}</span>
        </button>
        <span className={`chev ${expanded ? 'open' : ''}`}>
          <Icon name="chevron" size={14} />
        </span>
      </div>
      {expanded && (
        <ul className="part-list">
          {parts.map(([pid, p]) => (
            <li key={pid}>
              <button className={`link ${selected === pid ? 'active' : ''}`} onClick={() => onPick(pid)}>
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PartsDrawer() {
  const open = useStore((s) => s.partsOpen)
  const touring = useStore((s) => s.tour !== null)
  const car = useStore((s) => s.car)
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const set = useStore((s) => s.set)
  const [query, setQuery] = useState('')
  // En celular la lista y la ficha no caben juntas: al elegir una pieza se cierra la lista
  const pick = (id: string) => {
    select(id, true)
    if (window.innerWidth < 760) set({ partsOpen: false })
  }

  const inCar = useMemo(() => Object.entries(PARTS).filter(([pid]) => partInCar(pid, car)), [car])
  const matches = useMemo(() => {
    const q = fold(query.trim())
    return q ? inCar.filter(([, p]) => fold(p.name).includes(q) || fold(SYSTEMS[p.system].name).includes(q)) : []
  }, [inCar, query])

  if (touring) return null
  if (!open) {
    return (
      <button className="drawer-tab" onClick={() => set({ partsOpen: true })} title="Lista de piezas (P)">
        <Icon name="parts" />
        <span>Piezas</span>
      </button>
    )
  }

  return (
    <aside className="drawer" aria-label="Piezas del auto">
      <header>
        <h2>
          Piezas <span className="count">{inCar.length}</span>
        </h2>
        <button className="icon-btn" onClick={() => set({ partsOpen: false })} title="Cerrar lista (P)">
          <Icon name="close" size={16} />
        </button>
      </header>
      <label className="search">
        <Icon name="search" size={16} />
        <input type="search" placeholder="Buscar pieza…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar pieza" />
      </label>
      <div className="drawer-scroll">
        {query.trim() ? (
          matches.length ? (
            <ul className="part-list flat">
              {matches.map(([pid, p]) => (
                <li key={pid}>
                  <button className={`link ${selected === pid ? 'active' : ''}`} onClick={() => pick(pid)}>
                    <span className="dot" style={{ background: SYSTEMS[p.system].color }} />
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Ninguna pieza de esta versión se llama así.</p>
          )
        ) : (
          SYSTEM_ORDER.map((id) => {
            const parts = inCar.filter(([, p]) => p.system === id)
            return parts.length ? <SystemRow key={id} id={id} parts={parts} onPick={pick} /> : null
          })
        )}
      </div>
    </aside>
  )
}

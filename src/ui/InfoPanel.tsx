import { PARTS, SYSTEMS } from '../data/parts'
import { useStore } from '../store'

export function InfoPanel() {
  const selected = useStore((s) => s.selected)
  const isolate = useStore((s) => s.isolate)
  const set = useStore((s) => s.set)
  const select = useStore((s) => s.select)
  const focus = useStore((s) => s.focus)
  if (!selected) return null
  const part = PARTS[selected]
  const system = SYSTEMS[part.system]

  return (
    <aside className="panel right">
      <header>
        <div>
          <span className="chip" style={{ borderColor: system.color, color: system.color }}>
            {system.name}
          </span>
          <h1>{part.name}</h1>
        </div>
        <button className="icon" onClick={() => select(null)} title="Cerrar">
          ×
        </button>
      </header>
      <div className="scroll">
        <p className="summary">{part.summary}</p>
        <h2>Cómo funciona</h2>
        <ul className="how">
          {part.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        {part.fact && <p className="fact">{part.fact}</p>}
      </div>
      <div className="btns">
        <button onClick={focus}>Enfocar</button>
        <button className={isolate ? 'on' : ''} onClick={() => set({ isolate: !isolate })}>
          {isolate ? 'Mostrar todo' : 'Aislar'}
        </button>
      </div>
    </aside>
  )
}

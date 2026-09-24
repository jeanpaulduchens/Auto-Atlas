import { useEffect } from 'react'
import { TOURS } from '../data/tours'
import { useStore } from '../store'
import { endTour, goToStep } from '../tours'

export function TourCard() {
  const tour = useStore((s) => s.tour)
  const data = tour && TOURS.find((t) => t.id === tour.id)

  // ← → para avanzar o retroceder, Esc para salir
  useEffect(() => {
    if (!tour) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') goToStep(tour.id, tour.step + 1)
      else if (e.key === 'ArrowLeft') goToStep(tour.id, tour.step - 1)
      else if (e.key === 'Escape') endTour()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tour])

  if (!tour || !data) return null
  const step = data.steps[tour.step]
  const last = tour.step === data.steps.length - 1

  return (
    <section className="tour" aria-label={`Recorrido: ${data.name}`}>
      <header>
        <span className="tour-name">{data.name}</span>
        <span className="tour-count">
          {tour.step + 1} / {data.steps.length}
        </span>
        <button className="icon" onClick={endTour} title="Salir del recorrido (Esc)">
          ×
        </button>
      </header>
      <h2>{step.title}</h2>
      <p>{step.text}</p>
      <div className="tour-nav">
        <button onClick={() => goToStep(tour.id, tour.step - 1)} disabled={tour.step === 0}>
          ← Anterior
        </button>
        <div className="tour-dots">
          {data.steps.map((s, i) => (
            <button
              key={s.title}
              className={i === tour.step ? 'on' : ''}
              onClick={() => goToStep(tour.id, i)}
              aria-label={`Paso ${i + 1}: ${s.title}`}
            />
          ))}
        </div>
        <button className="on" onClick={() => (last ? endTour() : goToStep(tour.id, tour.step + 1))}>
          {last ? 'Terminar' : 'Siguiente →'}
        </button>
      </div>
    </section>
  )
}

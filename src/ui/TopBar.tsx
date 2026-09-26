import { CARS, CAR_ORDER } from '../cars'
import { toursForCar } from '../data/tours'
import { useStore } from '../store'
import { endTour, goToStep } from '../tours'
import { Icon, Popover } from './controls'

function CarPicker() {
  const car = useStore((s) => s.car)
  const setCar = useStore((s) => s.setCar)
  return (
    <Popover
      title="Elegir versión del auto"
      className="car-trigger"
      trigger={
        <>
          <span className="version-swatch" style={{ background: CARS[car].paint }} />
          <span className="car-trigger-text">
            <span className="car-trigger-name">{CARS[car].name}</span>
            <span className="car-trigger-spec">{CARS[car].spec}</span>
          </span>
          <Icon name="chevron" size={16} />
        </>
      }
    >
      {(close) => (
        <div className="versions" role="radiogroup" aria-label="Versión del auto">
          {CAR_ORDER.map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={car === id}
              className={`version ${car === id ? 'active' : ''}`}
              onClick={() => {
                if (car !== id) setCar(id)
                close()
              }}
            >
              <span className="version-swatch" style={{ background: CARS[id].paint }} />
              <span className="version-text">
                <span className="version-name">{CARS[id].name}</span>
                <span className="version-spec">{CARS[id].spec}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

function ToursMenu() {
  const car = useStore((s) => s.car)
  const tour = useStore((s) => s.tour)
  const tours = toursForCar(car)
  return (
    <Popover
      title="Recorridos guiados"
      className={tour ? 'active' : ''}
      trigger={
        <>
          <Icon name="route" />
          <span className="hide-sm">Recorridos</span>
          <span className="badge">{tours.length}</span>
        </>
      }
    >
      {(close) => (
        <div className="tours">
          {tours.map((t) => {
            const active = tour?.id === t.id
            return (
              <button
                key={t.id}
                className={`tour-item ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => {
                  if (active) endTour()
                  else goToStep(t.id, 0)
                  close()
                }}
              >
                <span className="tour-item-name">{t.name}</span>
                <span className="tour-item-meta">
                  {t.blurb} · {t.steps.length} pasos
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Popover>
  )
}

const HELP: [string, string][] = [
  ['Arrastrar', 'Girar la vista'],
  ['Rueda / pellizcar', 'Acercar y alejar'],
  ['Clic derecho / dos dedos', 'Mover la vista'],
  ['Clic en una pieza', 'Ver cómo funciona'],
  ['L', 'Mostrar u ocultar etiquetas'],
  ['P', 'Abrir o cerrar la lista de piezas'],
  ['← →', 'Pasos de un recorrido'],
  ['Esc', 'Salir del recorrido'],
]

function Help() {
  return (
    <Popover title="Ayuda y atajos" className="icon-btn" align="right" trigger={<Icon name="help" />}>
      {() => (
        <dl className="help">
          {HELP.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Popover>
  )
}

export function TopBar() {
  const labels = useStore((s) => s.labels)
  const toggleLabels = useStore((s) => s.toggleLabels)
  const quality = useStore((s) => s.quality)
  const set = useStore((s) => s.set)
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-name">Auto Atlas</span>
      </div>
      <CarPicker />
      <ToursMenu />
      <div className="topbar-right">
        <button className={`icon-btn ${labels ? 'on' : ''}`} aria-pressed={labels} title="Etiquetas sobre las piezas (L)" onClick={toggleLabels}>
          <Icon name="tag" />
        </button>
        <button
          className={`icon-btn ${quality === 'alta' ? 'on' : ''}`}
          aria-pressed={quality === 'alta'}
          title={quality === 'alta' ? 'Calidad alta (clic para rápida)' : 'Calidad rápida (clic para alta)'}
          onClick={() => set({ quality: quality === 'alta' ? 'rapida' : 'alta' })}
        >
          <Icon name="sparkle" />
        </button>
        <Help />
      </div>
    </header>
  )
}

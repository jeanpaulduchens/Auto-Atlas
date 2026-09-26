import { useEffect, useRef } from 'react'
import { TAU, WHEEL_RADIUS } from '../sim'
import { CARS } from '../cars'
import { converterRatio } from '../automatic'
import { useStore } from '../store'
import { CycleReadout, Icon, Segmented } from './controls'

const SPEEDS = [
  { value: 0.02, label: '×0.02' },
  { value: 0.05, label: '×0.05' },
  { value: 0.15, label: '×0.15' },
  { value: 0.5, label: '×0.5' },
  { value: 1, label: 'Real' },
]

/** Mecánica en marcha, abajo a la derecha: motor, velocidad de animación y marchas. Se minimiza. */
export function MechanicsCard() {
  const s = useStore()
  const box = useRef<HTMLElement>(null)
  const car = CARS[s.car]
  const automatic = car.modules.includes('caja-automatica')
  const electric = car.modules.includes('electrica')
  const engaged = automatic || electric || !s.clutch
  const slip = automatic ? converterRatio(s.gear, s.rpm) : 1
  const wheelRpm = s.running && engaged && s.gear > 0 ? (s.rpm * slip) / car.gears[s.gear] / car.finalDrive : 0
  const kmh = (wheelRpm * TAU * WHEEL_RADIUS * 60) / 1000
  const gearName = (i: number) => (i === 0 ? 'N' : electric ? 'D' : automatic ? `D${i}` : String(i))

  // Publica la altura de la tarjeta para que la ficha de la pieza no la tape
  useEffect(() => {
    const el = box.current
    const root = document.documentElement
    if (!el) {
      root.style.setProperty('--mech-h', '0px')
      return
    }
    const ro = new ResizeObserver(() => root.style.setProperty('--mech-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty('--mech-h', '0px')
    }
  })

  if (s.tour) return null

  const title = electric ? 'Motor eléctrico' : 'Motor'
  return (
    <section ref={box} className={`mech ${s.mechMin ? 'min' : ''}`} aria-label="Mecánica">
      <header>
        <button className={`play ${s.running ? 'on' : ''}`} onClick={() => s.set({ running: !s.running })} title={s.running ? 'Detener' : 'Poner en marcha'}>
          <Icon name={s.running ? 'pause' : 'play'} size={16} />
        </button>
        <div className="mech-title">
          <span>{title}</span>
          <small>
            {s.running ? `${s.rpm.toLocaleString('es-CL')} rpm` : 'detenido'} · {gearName(s.gear)} · {kmh.toFixed(0)} km/h
          </small>
        </div>
        <button className="icon-btn" onClick={() => s.set({ mechMin: !s.mechMin })} title={s.mechMin ? 'Expandir' : 'Minimizar'}>
          <Icon name={s.mechMin ? 'plus' : 'minus'} size={16} />
        </button>
      </header>

      {!s.mechMin && (
        <div className="mech-body">
          <label className="row">
            <span>Régimen del motor · {s.rpm.toLocaleString('es-CL')} rpm</span>
            <input
              type="range"
              min={electric ? 0 : 700}
              max={car.maxRpm ?? 6500}
              step={50}
              value={s.rpm}
              onChange={(e) => s.set({ rpm: +e.target.value })}
            />
          </label>
          <div className="row">
            <span>Velocidad de la animación</span>
            <Segmented options={SPEEDS} value={s.slow} onChange={(v) => s.set({ slow: v })} label="Velocidad de la animación" />
          </div>
          {!electric && <CycleReadout />}

          <h3>{electric ? 'Reductora' : automatic ? 'Caja automática' : 'Caja de cambios'}</h3>
          <Segmented
            className="gears"
            options={car.gears.map((_, i) => ({ value: i, label: gearName(i) }))}
            value={s.gear}
            onChange={(v) => s.set({ gear: v })}
            label="Marcha"
          />
          {electric ? (
            <p className="note">Una sola relación (9:1): el motor eléctrico no necesita marchas.</p>
          ) : automatic ? (
            <p className="note">Dorado recibe el giro, rojo frenado, azul entrega.</p>
          ) : (
            <button className={`clutch ${s.clutch ? 'on' : ''}`} aria-pressed={s.clutch} onClick={() => s.set({ clutch: !s.clutch })}>
              {s.clutch ? 'Embrague pisado' : 'Pisar embrague'}
            </button>
          )}
          <div className="readout">
            <div>
              <b>{kmh.toFixed(0)}</b> km/h
            </div>
            <div>
              <b>{wheelRpm.toFixed(0)}</b> rpm rueda
            </div>
            <div>
              <b>{s.gear > 0 ? (car.gears[s.gear] * car.finalDrive).toFixed(1) : '–'}</b> : 1
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

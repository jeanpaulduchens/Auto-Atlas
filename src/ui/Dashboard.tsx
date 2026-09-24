import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { REDLINE_RPM, drive, shiftTo, toggleEngine } from '../drive'
import { useStore } from '../store'

const MAX_RPM = 7000
const CX = 100
const CY = 100
const R = 80

/** Ángulo (radianes, antihorario desde +X) de la aguja del tacómetro para unas rpm. */
const tachAngle = (rpm: number) => (7 * Math.PI) / 6 - (Math.min(rpm, MAX_RPM) / MAX_RPM) * ((4 * Math.PI) / 3)
const polar = (a: number, r: number) => [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const

function arc(from: number, to: number, r: number) {
  const [x0, y0] = polar(tachAngle(from), r)
  const [x1, y1] = polar(tachAngle(to), r)
  const large = ((to - from) / MAX_RPM) * 240 > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

function Tachometer({ needle }: { needle: RefObject<SVGGElement | null> }) {
  return (
    <svg className="tach" viewBox="0 0 200 150" role="img" aria-label="Tacómetro">
      <path d={arc(0, MAX_RPM, R)} className="tach-track" />
      <path d={arc(REDLINE_RPM, MAX_RPM, R)} className="tach-red" />
      {Array.from({ length: 8 }, (_, k) => {
        const a = tachAngle(k * 1000)
        const [x0, y0] = polar(a, R - 4)
        const [x1, y1] = polar(a, R - 14)
        const [tx, ty] = polar(a, R - 26)
        return (
          <g key={k}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} className="tach-tick" />
            <text x={tx} y={ty + 4} className="tach-num">
              {k}
            </text>
          </g>
        )
      })}
      <text x={CX} y={CY + 30} className="tach-unit">
        ×1000 rpm
      </text>
      <g ref={needle}>
        <line x1={CX} y1={CY + 10} x2={CX} y2={CY - R + 8} className="tach-needle" />
      </g>
      <circle cx={CX} cy={CY} r={6} className="tach-hub" />
    </svg>
  )
}

type Pedal = 'clutch' | 'brake' | 'throttle'
const PEDALS: { id: Pedal; label: string; key: string }[] = [
  { id: 'clutch', label: 'Embrague', key: 'Espacio' },
  { id: 'brake', label: 'Freno', key: 'S' },
  { id: 'throttle', label: 'Acelerador', key: 'W' },
]

const KEYS: Record<string, Pedal> = {
  KeyW: 'throttle',
  ArrowUp: 'throttle',
  KeyS: 'brake',
  ArrowDown: 'brake',
  Space: 'clutch',
}

/** Teclado: W/↑ acelerar, S/↓ frenar, Espacio embrague, 1–5 y N marchas, E encender. */
function useDriveKeys() {
  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement
    const down = (e: KeyboardEvent) => {
      if (isField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      const pedal = KEYS[e.code]
      if (pedal) {
        e.preventDefault()
        drive.inputs[pedal] = true
        return
      }
      if (e.repeat) return
      const digit = /^Digit([0-5])$/.exec(e.code)
      if (digit) shiftTo(+digit[1])
      else if (e.code === 'KeyN') shiftTo(0)
      else if (e.code === 'KeyE') toggleEngine()
    }
    const up = (e: KeyboardEvent) => {
      const pedal = KEYS[e.code]
      if (!pedal) return
      e.preventDefault() // evita que Espacio “haga clic” en el botón con foco
      drive.inputs[pedal] = false
    }
    const release = () => Object.assign(drive.inputs, { throttle: false, brake: false, clutch: false })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', release)
      release()
    }
  }, [])
}

function Toast() {
  const toast = useStore((s) => s.toast)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), 2800)
    return () => window.clearTimeout(t)
  }, [toast])
  return (
    <div className="toast" role="status" aria-live="polite" hidden={!visible}>
      {toast?.text}
    </div>
  )
}

export function Dashboard() {
  const gear = useStore((s) => s.gear)
  const running = useStore((s) => s.running)
  const needle = useRef<SVGGElement>(null)
  const speed = useRef<HTMLSpanElement>(null)
  const bars = useRef<Record<Pedal, HTMLSpanElement | null>>({ clutch: null, brake: null, throttle: null })
  useDriveKeys()

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const deg = 90 - (tachAngle(drive.rpm) * 180) / Math.PI
      needle.current?.setAttribute('transform', `rotate(${deg.toFixed(2)} ${CX} ${CY})`)
      if (speed.current) speed.current.textContent = drive.kmh.toFixed(0)
      const amount: Record<Pedal, number> = { clutch: 1 - drive.clutch, brake: drive.brake, throttle: drive.throttle }
      for (const p of PEDALS) {
        const el = bars.current[p.id]
        if (el) el.style.transform = `scaleY(${amount[p.id].toFixed(3)})`
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  const press = (pedal: Pedal, on: boolean) => (e: PointerEvent<HTMLButtonElement>) => {
    if (on) e.currentTarget.setPointerCapture(e.pointerId)
    drive.inputs[pedal] = on
  }

  return (
    <div className="dash">
      <Toast />
      <div className="dash-main">
        <Tachometer needle={needle} />
        <div className="dash-readouts">
          <div className="dash-speed">
            <span ref={speed}>0</span>
            <small>km/h</small>
          </div>
          <div className="dash-gear" aria-label="Marcha">
            {gear === 0 ? 'N' : gear}
          </div>
          <button className={running ? '' : 'on'} onClick={toggleEngine}>
            {running ? 'Apagar motor (E)' : 'Encender motor (E)'}
          </button>
        </div>
        <div className="pedals">
          {PEDALS.map((p) => (
            <button
              key={p.id}
              className="pedal"
              onPointerDown={press(p.id, true)}
              onPointerUp={press(p.id, false)}
              onPointerCancel={press(p.id, false)}
              onLostPointerCapture={() => (drive.inputs[p.id] = false)}
              aria-label={`${p.label} (${p.key})`}
            >
              <span className="pedal-bar">
                <span ref={(el) => void (bars.current[p.id] = el)} className={`pedal-fill ${p.id}`} />
              </span>
              <span className="pedal-label">{p.label}</span>
              <kbd>{p.key}</kbd>
            </button>
          ))}
        </div>
      </div>
      <p className="dash-keys">
        <kbd>1</kbd>–<kbd>5</kbd> marchas · <kbd>N</kbd> neutro · <kbd>E</kbd> encender/apagar · para cambiar, pisa el embrague
      </p>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Vector3, type Group } from 'three'
import { PARTS, SYSTEMS, SYSTEM_ORDER, type SystemId } from '../data/parts'
import { useStore } from '../store'
import { partAnchor } from './registry'

/** Pieza sobre la que se ancla la etiqueta de cada sistema. */
const SYSTEM_ANCHOR: Record<SystemId, string> = {
  carroceria: 'carroceria',
  motor: 'culata',
  electrico: 'bateria',
  combustible: 'estanque',
  refrigeracion: 'radiador',
  transmision: 'caja-cambios',
  escape: 'silenciador',
  suspension: 'suspension-delantera',
  frenos: 'frenos',
  ruedas: 'ruedas',
}

const BASE_LIFT = 30 // px entre el punto de anclaje y la etiqueta
const LIFT_STEP = 24
const MAX_STEPS = 7
const GAP = 4

const layer = { current: document.getElementById('labels-layer')! }

interface Entry {
  box: HTMLDivElement | null
  pill: HTMLButtonElement | null
  anchor: Vector3
  shown: boolean
}
/** Etiquetas montadas, para acomodarlas en pantalla sin que se tapen. */
const entries = new Map<string, Entry>()

function Label({
  labelKey,
  partId,
  text,
  color,
  active,
  onClick,
  hoverId,
}: {
  labelKey: string
  partId: string
  text: string
  color: string
  active: boolean
  onClick: () => void
  hoverId?: string
}) {
  const ref = useRef<Group>(null)
  const entry = useRef<Entry>({ box: null, pill: null, anchor: new Vector3(), shown: false })
  const placed = useRef(false)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    entries.set(labelKey, entry.current)
    return () => void entries.delete(labelKey)
  }, [labelKey])

  useFrame(() => {
    const g = ref.current
    const e = entry.current
    if (!g) return
    const ok = partAnchor(partId, camera, e.anchor)
    if (ok) g.position.copy(e.anchor)
    // Html se reposiciona un frame después: mostrarla recién cuando ya tiene su lugar
    e.shown = ok && placed.current
    if (e.box) e.box.style.display = e.shown ? '' : 'none'
    placed.current = ok
  })

  const setHovered = (id: string | null) => useStore.getState().set({ hovered: id })
  return (
    <group ref={ref}>
      <Html portal={layer} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={(el) => void (entry.current.box = el)} className={`lbl ${active ? 'active' : ''}`} style={{ display: 'none' }}>
          <span className="lbl-dot" />
          <span className="lbl-line" />
          <button
            ref={(el) => void (entry.current.pill = el)}
            className="lbl-pill"
            onClick={onClick}
            onMouseEnter={() => hoverId && setHovered(hoverId)}
            onMouseLeave={() => hoverId && setHovered(null)}
          >
            <span className="lbl-swatch" style={{ background: color }} />
            {text}
          </button>
        </div>
      </Html>
    </group>
  )
}

const projected = new Vector3()

/**
 * Acomoda las etiquetas en pantalla: de abajo hacia arriba, cada una sube su
 * línea guía lo necesario para no tapar a las ya ubicadas.
 */
function useLabelLayout() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useFrame(() => {
    const items: { e: Entry; x: number; y: number; w: number; h: number }[] = []
    entries.forEach((e) => {
      if (!e.shown || !e.pill || !e.box) return
      projected.copy(e.anchor).project(camera)
      items.push({
        e,
        x: ((projected.x + 1) / 2) * size.width,
        y: ((1 - projected.y) / 2) * size.height,
        w: e.pill.offsetWidth,
        h: e.pill.offsetHeight,
      })
    })
    items.sort((a, b) => b.y - a.y)
    const placed: { l: number; r: number; t: number; b: number }[] = []
    for (const it of items) {
      let lift = BASE_LIFT
      for (let step = 0; step <= MAX_STEPS; step++) {
        lift = BASE_LIFT + step * LIFT_STEP
        const rect = { l: it.x - it.w / 2, r: it.x + it.w / 2, t: it.y - lift - it.h, b: it.y - lift }
        const hit = placed.some((p) => rect.l < p.r + GAP && rect.r > p.l - GAP && rect.t < p.b + GAP && rect.b > p.t - GAP)
        if (!hit || step === MAX_STEPS) {
          placed.push(rect)
          break
        }
      }
      it.e.box!.style.setProperty('--lift', `${lift}px`)
    }
  })
}

/**
 * Etiquetas sobre las piezas:
 * - la pieza seleccionada siempre lleva la suya;
 * - con el auto desarmado se ven los sistemas, y al elegir uno, sus piezas.
 */
export function Labels() {
  const exploded = useStore((s) => s.explode >= 0.5)
  const selected = useStore((s) => s.selected)
  const activeSystem = useStore((s) => s.activeSystem)
  const hidden = useStore((s) => s.hidden)
  const isolate = useStore((s) => s.isolate)
  const select = useStore((s) => s.select)
  const set = useStore((s) => s.set)
  const focus = useStore((s) => s.focus)
  useLabelLayout()

  const system = selected ? PARTS[selected].system : activeSystem

  if (!exploded || isolate) {
    if (!selected || hidden[PARTS[selected].system]) return null
    const p = PARTS[selected]
    return <Label labelKey={selected} partId={selected} text={p.name} color={SYSTEMS[p.system].color} active onClick={focus} />
  }

  if (system) {
    if (hidden[system]) return null
    return (
      <>
        {Object.entries(PARTS)
          .filter(([, p]) => p.system === system)
          .map(([id, p]) => (
            <Label
              key={id}
              labelKey={id}
              partId={id}
              text={p.name}
              color={SYSTEMS[system].color}
              active={id === selected}
              hoverId={id}
              onClick={() => select(id)}
            />
          ))}
      </>
    )
  }

  return (
    <>
      {SYSTEM_ORDER.filter((s) => !hidden[s]).map((s) => (
        <Label
          key={s}
          labelKey={`sistema-${s}`}
          partId={SYSTEM_ANCHOR[s]}
          text={SYSTEMS[s].name}
          color={SYSTEMS[s].color}
          active={false}
          onClick={() => {
            set({ activeSystem: s })
            focus()
          }}
        />
      ))}
    </>
  )
}

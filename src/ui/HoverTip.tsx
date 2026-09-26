import { useEffect, useRef, useState } from 'react'
import { PARTS } from '../data/parts'
import { useStore } from '../store'

/** Nombre de la pieza bajo el mouse, junto al cursor. */
export function HoverTip() {
  const hovered = useStore((s) => s.hovered)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !ref.current) return
      ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 16}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <div ref={ref} className="tip" hidden={!hovered} aria-hidden="true">
      {hovered && PARTS[hovered].name}
    </div>
  )
}

/** Pista para quien llega por primera vez; desaparece al tocar la escena. */
export function FirstHint() {
  const [visible, setVisible] = useState(true)
  const touring = useStore((s) => s.tour !== null)
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    const hide = () => setVisible(false)
    canvas?.addEventListener('pointerdown', hide, { once: true })
    const t = window.setTimeout(hide, 12000)
    return () => {
      canvas?.removeEventListener('pointerdown', hide)
      window.clearTimeout(t)
    }
  }, [])
  if (!visible || touring) return null
  return <div className="first-hint">Arrastra para girar · clic en una pieza para ver cómo funciona</div>
}

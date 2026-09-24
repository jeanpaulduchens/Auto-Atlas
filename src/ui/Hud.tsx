import { PARTS } from '../data/parts'
import { useStore } from '../store'

export function Hud() {
  const hovered = useStore((s) => s.hovered)
  return (
    <div className="hud">
      {hovered ? <b>{PARTS[hovered].name}</b> : 'Clic en una pieza para ver cómo funciona · Arrastra para girar · Rueda para acercar'}
    </div>
  )
}

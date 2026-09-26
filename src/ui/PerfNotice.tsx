import { useStore } from '../store'
import { Icon } from './controls'

/** Dónde se activa la aceleración por hardware en cada navegador. */
function accelerationHint() {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'En Edge: Configuración → Sistema y rendimiento → activa “Usar la aceleración de gráficos cuando esté disponible” y reinicia el navegador.'
  if (ua.includes('Firefox/')) return 'En Firefox: Ajustes → General → Rendimiento → desmarca “Usar la configuración recomendada” y activa “Usar aceleración por hardware cuando esté disponible”.'
  if (ua.includes('Chrome/')) return 'En Chrome: Configuración → Sistema → activa “Usar la aceleración de gráficos cuando esté disponible” y reinicia el navegador.'
  return 'Activa la aceleración por hardware (o de gráficos) en la configuración del navegador y reinícialo.'
}

/** Aviso cuando la calidad se bajó sola o el navegador dibuja sin tarjeta gráfica. */
export function PerfNotice() {
  const notice = useStore((s) => s.perfNotice)
  const set = useStore((s) => s.set)
  if (!notice) return null
  return (
    <div className="notice" role="status">
      {notice === 'software' ? (
        <p>
          <b>Tu navegador está dibujando el 3D sin la tarjeta gráfica</b>, por eso va lento. Pasamos a calidad Rápida.{' '}
          {accelerationHint()}
        </p>
      ) : (
        <p>
          <b>Bajamos la calidad a Rápida</b> para que se mueva fluido en este equipo.
        </p>
      )}
      {notice === 'auto' && (
        <button onClick={() => set({ quality: 'alta', lowRes: false, perfNotice: null })}>Volver a Alta</button>
      )}
      <button className="icon-btn" title="Cerrar aviso" onClick={() => set({ perfNotice: null })}>
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

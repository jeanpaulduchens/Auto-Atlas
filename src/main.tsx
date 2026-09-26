import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './scene/Scene'
import { TopBar } from './ui/TopBar'
import { PartsDrawer } from './ui/PartsDrawer'
import { ViewDock } from './ui/ViewDock'
import { MechanicsCard } from './ui/MechanicsCard'
import { InfoPanel } from './ui/InfoPanel'
import { TourCard } from './ui/TourCard'
import { FirstHint, HoverTip } from './ui/HoverTip'
import { useShortcuts } from './ui/controls'
import { startTourFromUrl } from './tours'
import './styles.css'

/**
 * Interfaz en los bordes, la escena al centro:
 * arriba qué ver (versión, recorridos, ajustes) · izquierda la lista de piezas ·
 * abajo al centro cómo verlo · abajo a la derecha la mecánica · derecha la ficha.
 */
function App() {
  useShortcuts()
  return (
    <>
      <Scene />
      <TopBar />
      <PartsDrawer />
      <InfoPanel />
      <MechanicsCard />
      <ViewDock />
      <TourCard />
      <FirstHint />
      <HoverTip />
    </>
  )
}

startTourFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './scene/Scene'
import { ControlPanel } from './ui/ControlPanel'
import { InfoPanel } from './ui/InfoPanel'
import { Hud } from './ui/Hud'
import { TourCard } from './ui/TourCard'
import { useStore } from './store'
import { startTourFromUrl } from './tours'
import './styles.css'

function Bottom() {
  return useStore((s) => s.tour) ? <TourCard /> : <Hud />
}

startTourFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Scene />
    <ControlPanel />
    <InfoPanel />
    <Bottom />
  </StrictMode>,
)

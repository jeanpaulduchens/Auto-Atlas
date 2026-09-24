import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './scene/Scene'
import { ControlPanel } from './ui/ControlPanel'
import { InfoPanel } from './ui/InfoPanel'
import { Hud } from './ui/Hud'
import { Dashboard } from './ui/Dashboard'
import { useStore } from './store'
import './styles.css'

function Bottom() {
  return useStore((s) => s.driveMode) ? <Dashboard /> : <Hud />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Scene />
    <ControlPanel />
    <InfoPanel />
    <Bottom />
  </StrictMode>,
)

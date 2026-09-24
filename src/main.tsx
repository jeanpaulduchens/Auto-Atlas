import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './scene/Scene'
import { ControlPanel } from './ui/ControlPanel'
import { InfoPanel } from './ui/InfoPanel'
import { Hud } from './ui/Hud'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Scene />
    <ControlPanel />
    <InfoPanel />
    <Hud />
  </StrictMode>,
)

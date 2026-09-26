import { useEffect, useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import type { WebGLRenderer } from 'three'
import { QUALITY_FROM_URL, useStore } from '../store'

const WARMUP_MS = 3000 // al partir se compilan shaders y carga el entorno: tirones normales

/**
 * Baja la calidad sola si el equipo no alcanza a dibujar fluido: primero la
 * resolución (a 1×) y después el post-procesado (calidad Rápida), avisando.
 * Solo mide con el motor en marcha: con el motor detenido la escena se dibuja
 * a pedido y contar cuadros no dice nada del rendimiento.
 */
export function AdaptiveQuality() {
  const running = useStore((s) => s.running)
  const lowRes = useStore((s) => s.lowRes)
  const quality = useStore((s) => s.quality)
  const [armed, setArmed] = useState(false)
  // Cada cambio (motor, resolución, calidad) reinicia la medición tras un tiempo de espera
  const round = `${running}-${lowRes}-${quality}`

  useEffect(() => {
    setArmed(false)
    const t = window.setTimeout(() => setArmed(true), WARMUP_MS)
    return () => window.clearTimeout(t)
  }, [round])

  const done = lowRes && quality === 'rapida'
  if (!running || !armed || done || QUALITY_FROM_URL) return null

  const onDecline = () => {
    const s = useStore.getState()
    if (!s.lowRes && window.devicePixelRatio > 1) s.set({ lowRes: true })
    else if (s.quality === 'alta') s.set({ quality: 'rapida', lowRes: true, perfNotice: 'auto' })
  }
  return <PerformanceMonitor key={round} onDecline={onDecline} />
}

/** Tarjeta gráfica que usa el navegador (se muestra en Ayuda para diagnosticar lentitud). */
export const gpu = { name: '', software: false }

/** true si el navegador dibuja el 3D con el procesador (sin aceleración por hardware). */
export function isSoftwareRenderer(gl: WebGLRenderer) {
  const ctx = gl.getContext()
  const ext = ctx.getExtension('WEBGL_debug_renderer_info')
  const name = String(ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER))
  gpu.name = name
  gpu.software = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(name)
  return gpu.software
}

/** Sin tarjeta gráfica: calidad Rápida y resolución 1× de entrada, con un aviso para activarla. */
export function handleSoftwareRenderer(gl: WebGLRenderer) {
  if (!isSoftwareRenderer(gl)) return
  const patch = QUALITY_FROM_URL ? { perfNotice: 'software' as const } : { quality: 'rapida' as const, lowRes: true, perfNotice: 'software' as const }
  useStore.getState().set(patch)
}

import { TAU, sim } from './sim'
import { useStore } from './store'

const LOOKAHEAD = 0.12 // s de explosiones programadas por adelantado
const TICK_MS = 25

/**
 * Sonido del motor sintetizado y sincronizado con la animación: cada explosión
 * (una cada media vuelta del cigüeñal en un 4 cilindros) suena en el instante
 * en que el cilindro se enciende en pantalla. En cámara lenta se oyen golpes
 * separados; a velocidad real se funden en el sonido de un motor.
 */
class EngineAudio {
  private ctx: AudioContext | null = null
  private tone!: BiquadFilterNode
  private thump!: AudioBuffer
  private timer = 0
  private nextFiring = 0 // índice k de la próxima explosión (ocurre en el ángulo k·π)

  /** Debe llamarse desde un clic: los navegadores solo permiten audio tras una interacción. */
  enable() {
    if (this.ctx) return
    const ctx = new AudioContext()
    this.ctx = ctx
    void ctx.resume() // algunos navegadores lo crean suspendido

    const compressor = ctx.createDynamicsCompressor()
    compressor.connect(ctx.destination)
    const out = ctx.createGain()
    out.gain.value = 0.55
    out.connect(compressor)
    this.tone = ctx.createBiquadFilter()
    this.tone.type = 'lowpass'
    this.tone.Q.value = 0.9
    this.tone.connect(out)

    // Golpe de una explosión: tono grave que decae + un poco de ruido
    const len = Math.round(ctx.sampleRate * 0.09)
    this.thump = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.thump.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate
      data[i] = Math.exp(-t / 0.014) * Math.sin(TAU * 58 * t) * 0.9 + Math.exp(-t / 0.005) * (Math.random() * 2 - 1) * 0.5
    }

    this.nextFiring = Math.floor(sim.crank / Math.PI) + 1
    this.timer = window.setInterval(() => this.tick(), TICK_MS)
  }

  disable() {
    window.clearInterval(this.timer)
    void this.ctx?.close()
    this.ctx = null
  }

  private tick() {
    const ctx = this.ctx
    if (!ctx) return
    const s = useStore.getState()
    const omega = s.running ? (s.rpm / 60) * TAU * s.slow : 0 // rad/s del cigüeñal en pantalla
    const angle = sim.crank + (omega * (performance.now() - sim.stamp)) / 1000
    const current = Math.floor(angle / Math.PI)

    // Suspendido (sin gesto del usuario o sin salida de audio): no acumular explosiones
    if (ctx.state !== 'running') {
      void ctx.resume()
      this.nextFiring = current + 1
      return
    }
    const now = ctx.currentTime
    const rpmHeard = (omega * 60) / TAU
    this.tone.frequency.setTargetAtTime(600 + rpmHeard * 0.4, now, 0.05)
    if (omega < 1) {
      this.nextFiring = current + 1
      return
    }
    // Resincroniza si el ángulo saltó (pestaña en segundo plano, cambio de velocidad)
    if (this.nextFiring <= current - 2 || this.nextFiring > current + 8) this.nextFiring = current + 1

    for (let n = 0; n < 64; n++) {
      const t = (this.nextFiring * Math.PI - angle) / omega
      if (t > LOOKAHEAD) break
      if (t > -0.02) this.pulse(now + Math.max(0, t), rpmHeard)
      this.nextFiring++
    }
  }

  private pulse(when: number, rpm: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.thump
    src.playbackRate.value = 0.94 + Math.random() * 0.1 + rpm / 25000
    src.connect(this.tone)
    src.start(when)
  }
}

const engineAudio = new EngineAudio()

export function setSound(on: boolean) {
  if (on) engineAudio.enable()
  else engineAudio.disable()
  useStore.getState().set({ sound: on })
}

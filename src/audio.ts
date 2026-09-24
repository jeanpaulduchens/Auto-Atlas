import { TAU, sim } from './sim'
import { drive } from './drive'
import { useStore } from './store'

const LOOKAHEAD = 0.12 // s de explosiones programadas por adelantado
const TICK_MS = 25

/**
 * Sonido del motor sintetizado: cada explosión (una cada media vuelta en un
 * 4 cilindros) es un golpe corto programado en el instante exacto. A pocas rpm
 * se oyen separados; al subir se funden en el zumbido del motor.
 *
 * En modo demostración va sincronizado con la animación (incluida la cámara
 * lenta). En modo manejo suena a las rpm reales del motor.
 */
class EngineAudio {
  private ctx: AudioContext | null = null
  private out!: GainNode
  private tone!: BiquadFilterNode
  private intake!: GainNode
  private thump!: AudioBuffer
  private timer = 0
  private nextFiring = 0 // índice k de la próxima explosión (ocurre en el ángulo k·π)
  private phase = 0 // fase propia para el modo manejo
  private lastTick = 0 // performance.now() del tick anterior

  /** Debe llamarse desde un clic: los navegadores solo permiten audio tras una interacción. */
  enable() {
    if (this.ctx) return
    const ctx = new AudioContext()
    this.ctx = ctx

    const compressor = ctx.createDynamicsCompressor()
    compressor.connect(ctx.destination)
    this.out = ctx.createGain()
    this.out.gain.value = 0.55
    this.out.connect(compressor)
    this.tone = ctx.createBiquadFilter()
    this.tone.type = 'lowpass'
    this.tone.Q.value = 0.9
    this.tone.connect(this.out)

    // Golpe de una explosión: tono grave que decae + un poco de ruido
    const len = Math.round(ctx.sampleRate * 0.09)
    this.thump = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = this.thump.getChannelData(0)
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate
      data[i] = Math.exp(-t / 0.014) * Math.sin(TAU * 58 * t) * 0.9 + Math.exp(-t / 0.005) * (Math.random() * 2 - 1) * 0.5
    }

    // Ruido de admisión: crece con el acelerador y las rpm
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const nd = noise.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = noise
    src.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 700
    band.Q.value = 0.7
    this.intake = ctx.createGain()
    this.intake.gain.value = 0
    src.connect(band).connect(this.intake).connect(this.tone)
    src.start()

    void ctx.resume() // algunos navegadores lo crean suspendido
    this.lastTick = performance.now()
    this.nextFiring = Math.floor(sim.crank / Math.PI) + 1
    this.timer = window.setInterval(() => this.tick(), TICK_MS)
  }

  disable() {
    window.clearInterval(this.timer)
    this.ctx?.close()
    this.ctx = null
  }

  private tick() {
    const ctx = this.ctx
    if (!ctx) return
    const s = useStore.getState()
    const now = ctx.currentTime
    const wall = performance.now()
    const elapsed = (wall - this.lastTick) / 1000
    this.lastTick = wall

    let omega: number // rad/s del cigüeñal que se escucha
    let angle: number
    let load: number
    if (s.driveMode) {
      omega = s.running ? drive.omega : 0
      this.phase += omega * elapsed
      angle = this.phase
      load = drive.throttle
    } else {
      omega = s.running ? (s.rpm / 60) * TAU * s.slow : 0
      angle = sim.crank + (omega * (performance.now() - sim.stamp)) / 1000
      load = 0.3
    }

    const rpmHeard = (omega * 60) / TAU
    this.tone.frequency.setTargetAtTime(250 + rpmHeard * 0.35 + load * 1400, now, 0.05)
    this.intake.gain.setTargetAtTime(omega > 1 ? 0.015 + load * 0.1 * Math.min(1, rpmHeard / 5000) : 0, now, 0.05)

    const current = Math.floor(angle / Math.PI)
    // Suspendido (sin gesto del usuario o sin salida de audio): no acumular explosiones
    if (ctx.state !== 'running') {
      void ctx.resume()
      this.nextFiring = current + 1
      return
    }
    if (omega < 1) {
      this.nextFiring = current + 1
      return
    }
    // Resincroniza si el ángulo saltó (cambio de modo, pestaña en segundo plano)
    if (this.nextFiring <= current - 2 || this.nextFiring > current + 8) this.nextFiring = current + 1

    for (let n = 0; n < 64; n++) {
      const t = (this.nextFiring * Math.PI - angle) / omega
      if (t > LOOKAHEAD) break
      if (t > -0.02) this.pulse(now + Math.max(0, t), load, rpmHeard)
      this.nextFiring++
    }
  }

  private pulse(when: number, load: number, rpm: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.thump
    src.playbackRate.value = 0.92 + Math.random() * 0.12 + rpm / 25000
    const gain = ctx.createGain()
    gain.gain.value = 0.35 + 0.65 * load
    src.connect(gain).connect(this.tone)
    src.start(when)
  }
}

export const engineAudio = new EngineAudio()
if (import.meta.env.DEV) Object.assign(window, { __audio: engineAudio })

export function setSound(on: boolean) {
  if (on) engineAudio.enable()
  else engineAudio.disable()
  useStore.getState().set({ sound: on })
}

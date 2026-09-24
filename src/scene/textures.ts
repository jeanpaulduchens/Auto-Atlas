import { CanvasTexture, RepeatWrapping, type Texture } from 'three'

/**
 * Texturas de superficie generadas en el navegador (sin archivos): dan a las
 * piezas la rugosidad de la fundición, el cepillado del aluminio y el dibujo
 * del neumático. Se usan como mapas de rugosidad y de relieve.
 */

/** Generador pseudoaleatorio con semilla, para que las texturas salgan siempre iguales. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Ruido de valor repetible (tileable) en [0, 1], sumando varias octavas. */
function valueNoise(size: number, cells: number[], seed: number) {
  const out = new Float32Array(size * size)
  let amp = 1
  let total = 0
  cells.forEach((n, octave) => {
    const rand = rng(seed + octave * 101)
    const grid = Float32Array.from({ length: n * n }, rand)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * n
        const gy = (y / size) * n
        const x0 = Math.floor(gx)
        const y0 = Math.floor(gy)
        const fx = gx - x0
        const fy = gy - y0
        const sx = fx * fx * (3 - 2 * fx)
        const sy = fy * fy * (3 - 2 * fy)
        const at = (i: number, j: number) => grid[((j + n) % n) * n + ((i + n) % n)]
        const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx
        const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx
        out[y * size + x] += (top * (1 - sy) + bottom * sy) * amp
      }
    }
    total += amp
    amp *= 0.55
  })
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

function toTexture(width: number, height: number, value: (x: number, y: number) => number, repeat: [number, number]) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.max(0, Math.min(255, Math.round(value(x, y) * 255)))
      const i = (y * width + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(...repeat)
  tex.anisotropy = 4
  return tex
}

const cache = new Map<string, Texture>()
const once = (key: string, make: () => Texture) => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)!
}

/** Superficie de fundición (bloque, culata, carcasas): granulada e irregular. */
export const castTexture = () =>
  once('fundicion', () => {
    const size = 256
    const n = valueNoise(size, [6, 16, 48, 96], 7)
    return toTexture(size, size, (x, y) => 0.5 + 0.45 * (n[y * size + x] - 0.5) * 2, [2, 2])
  })

/** Aluminio cepillado: vetas finas en una dirección. */
export const brushedTexture = () =>
  once('cepillado', () => {
    const size = 256
    const rand = rng(21)
    const rows = Float32Array.from({ length: size }, rand)
    const n = valueNoise(size, [4, 12], 5)
    return toTexture(size, size, (x, y) => 0.35 + 0.3 * rows[y] + 0.15 * n[y * size + x], [1, 3])
  })

/**
 * Banda de rodadura del neumático. En la geometría del neumático, v recorre el
 * perfil (0,43–0,57 es la banda que toca el suelo) y u da la vuelta a la rueda.
 */
export const treadTexture = () =>
  once('rodadura', () => {
    const w = 128
    const h = 256
    const n = valueNoise(w, [8, 32], 13)
    const grooves = [0.455, 0.5, 0.545]
    return toTexture(
      w,
      h,
      (x, y) => {
        const v = 1 - y / h // CanvasTexture se da vuelta: la fila de abajo es v = 0
        const grain = 0.06 * (n[(y % w) * w + x] - 0.5)
        if (v < 0.41 || v > 0.59) return 0.55 + grain // flanco
        if (grooves.some((g) => Math.abs(v - g) < 0.007)) return 0.08 // surcos a lo largo
        const u = x / w
        const sipe = Math.abs(u - 0.5 - (v - 0.5) * 1.5) < 0.06 // cortes diagonales entre surcos
        return (sipe ? 0.2 : 0.7) + grain
      },
      [42, 1],
    )
  })

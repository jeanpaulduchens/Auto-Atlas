export const TAU = Math.PI * 2

/** Relaciones de la caja (índice 0 = neutro). */
export const GEAR_RATIOS = [0, 3.54, 2.13, 1.36, 1.0, 0.82]
export const FINAL_DRIVE = 3.9
export const WHEEL_RADIUS = 0.31

/**
 * Estado mecánico mutable, actualizado en cada frame por <SimDriver>.
 * Vive fuera de React para que las piezas lo lean en useFrame sin re-renderizar.
 * Todos los ángulos son acumulados, en radianes.
 */
export const sim = {
  crank: 0, // cigüeñal
  input: 0, // eje primario (se detiene con el embrague pisado)
  output: 0, // eje secundario / cardán
  wheel: 0, // ruedas traseras (y delanteras, rodando)
  fan: 0,
  stamp: 0, // performance.now() de la última actualización (para sincronizar el sonido)
  explode: +(new URLSearchParams(window.location.search).get('explode') ?? 0) || 0, // interpolado hacia el del store
}

export const mod = (a: number, n: number) => ((a % n) + n) % n
export const wrapPi = (a: number) => mod(a + Math.PI, TAU) - Math.PI

/**
 * Cilindros de adelante hacia atrás. `phase` es el ángulo de la muñequilla en el
 * cigüeñal; `offset` es el ángulo del cigüeñal en que ese cilindro inicia su
 * admisión (PMS). Orden de encendido 1-3-4-2.
 */
export const CYLINDERS = [
  { n: 1, phase: 0, offset: 0 },
  { n: 2, phase: Math.PI, offset: 3 * Math.PI },
  { n: 3, phase: Math.PI, offset: Math.PI },
  { n: 4, phase: 0, offset: 2 * Math.PI },
]

export const STROKES = ['Admisión', 'Compresión', 'Explosión', 'Escape']

/** Posición del cilindro i dentro de su ciclo de 4 tiempos, en [0, 4π). */
export const cycleAngle = (i: number) => mod(sim.crank - CYLINDERS[i].offset, 2 * TAU)
export const strokeOf = (cycle: number) => Math.min(3, Math.floor(cycle / Math.PI))

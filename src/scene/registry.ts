import { Box3, Vector3, type Camera, type Mesh, type Object3D } from 'three'
import { PARTS, type SystemId } from '../data/parts'

/** Grupos 3D montados por cada id de pieza (una pieza puede tener varias instancias, ej. 4 ruedas). */
const registry = new Map<string, Set<Object3D>>()

export function registerPart(id: string, obj: Object3D) {
  let set = registry.get(id)
  if (!set) registry.set(id, (set = new Set()))
  set.add(obj)
  return () => {
    set.delete(obj)
  }
}

const meshBox = new Box3()

/**
 * Caja envolvente en coordenadas del mundo. Ignora las partículas de flujo
 * (noHighlight), cuyas instancias no dan una caja fiable.
 */
function boundsOf(root: Object3D, target: Box3) {
  root.updateWorldMatrix(true, true)
  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh || mesh.userData.noHighlight) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    meshBox.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld)
    target.union(meshBox)
  })
  return target
}

function isShown(o: Object3D) {
  for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false
  return true
}

export function partBounds(id: string): Box3 | null {
  const box = new Box3()
  registry.get(id)?.forEach((o) => boundsOf(o, box))
  return box.isEmpty() ? null : box
}

export function systemBounds(system: SystemId): Box3 | null {
  const box = new Box3()
  for (const [id, set] of registry) if (PARTS[id]?.system === system) set.forEach((o) => boundsOf(o, box))
  return box.isEmpty() ? null : box
}

const instBox = new Box3()
const center = new Vector3()

/**
 * Punto donde anclar la etiqueta de una pieza: sobre la instancia visible más
 * cercana a la cámara (para las 4 ruedas, la rueda que se ve de frente).
 */
export function partAnchor(id: string, camera: Camera, out: Vector3) {
  let best = Infinity
  registry.get(id)?.forEach((o) => {
    if (!isShown(o)) return
    boundsOf(o, instBox.makeEmpty())
    if (instBox.isEmpty()) return
    instBox.getCenter(center)
    const d = center.distanceToSquared(camera.position)
    if (d < best) {
      best = d
      out.set(center.x, instBox.max.y, center.z)
    }
  })
  return best < Infinity
}

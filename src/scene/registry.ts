import { Box3, Raycaster, Vector3, type Camera, type Mesh, type Object3D } from 'three'
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

const DOWN = new Vector3(0, -1, 0)
const raycaster = new Raycaster()
const vertex = new Vector3()
const origin = new Vector3()

/** Ancla de cada instancia, relativa a la posición de su grupo (que solo se traslada al desarmar). */
const anchors = new WeakMap<Object3D, Vector3>()

/**
 * Punto sobre la superficie de la pieza donde apoyar su etiqueta: donde un rayo
 * vertical que baja por el centro de la pieza la toca. Si el rayo no toca nada
 * (piezas largas o en forma de L, como el tubo de escape), el punto de la pieza
 * más cercano a su centro.
 */
function computeAnchor(root: Object3D) {
  const box = boundsOf(root, new Box3())
  if (box.isEmpty()) return null
  const center = box.getCenter(new Vector3())
  const meshes: Mesh[] = []
  root.traverse((o) => {
    const mesh = o as Mesh
    if (mesh.isMesh && !mesh.userData.noHighlight) meshes.push(mesh)
  })

  raycaster.set(origin.set(center.x, box.max.y + 0.05, center.z), DOWN)
  const hit = raycaster.intersectObjects(meshes, false)[0]
  const point = new Vector3()
  if (hit) {
    point.copy(hit.point)
  } else {
    let best = Infinity
    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        vertex.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
        const d = vertex.distanceToSquared(center)
        if (d < best) {
          best = d
          point.copy(vertex)
        }
      }
    }
  }
  return point.sub(root.getWorldPosition(new Vector3()))
}

const worldAnchor = new Vector3()

/**
 * Punto donde anclar la etiqueta de una pieza: sobre la instancia visible más
 * cercana a la cámara (para las 4 ruedas, la rueda que se ve de frente).
 */
export function partAnchor(id: string, camera: Camera, out: Vector3) {
  let best = Infinity
  registry.get(id)?.forEach((o) => {
    if (!isShown(o)) return
    let local = anchors.get(o)
    if (!local) {
      const computed = computeAnchor(o)
      if (!computed) return
      anchors.set(o, (local = computed))
    }
    o.getWorldPosition(worldAnchor).add(local)
    const d = worldAnchor.distanceToSquared(camera.position)
    if (d < best) {
      best = d
      out.copy(worldAnchor)
    }
  })
  return best < Infinity
}

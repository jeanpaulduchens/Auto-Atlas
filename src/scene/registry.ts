import { Box3, type Object3D } from 'three'

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

export function partBounds(id: string): Box3 | null {
  const set = registry.get(id)
  if (!set?.size) return null
  const box = new Box3()
  set.forEach((o) => box.expandByObject(o))
  return box.isEmpty() ? null : box
}

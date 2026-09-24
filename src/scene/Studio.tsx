import { Environment, Lightformer } from '@react-three/drei'

export const BACKGROUND = '#0a0d12'

/**
 * Iluminación de estudio fotográfico: un softbox cenital, tiras de luz a cada
 * lado (los reflejos largos que se ven sobre la pintura de un auto en un
 * showroom) y luces de relleno más frías por detrás.
 */
export function StudioLights() {
  return (
    <>
      <hemisphereLight args={['#dbeafe', '#0f141b', 0.35]} />
      <directionalLight position={[4, 7, 5]} intensity={1.5} />
      <directionalLight position={[-6, 3, -4]} intensity={0.45} color="#c7d7fe" />
      <Environment resolution={512} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={2.5} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 5, 1]} />
        <Lightformer form="rect" intensity={5} position={[0, 3.2, 7]} scale={[16, 0.4, 1]} />
        <Lightformer form="rect" intensity={4} position={[0, 1.4, 7]} scale={[16, 0.18, 1]} />
        <Lightformer form="rect" intensity={5} position={[0, 3.2, -7]} scale={[16, 0.4, 1]} />
        <Lightformer form="rect" intensity={2} position={[8, 2, 0]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-8, 2, 0]} scale={[6, 3, 1]} color="#bfdbfe" />
        <Lightformer form="ring" intensity={1.2} position={[4, 4, 5]} scale={1.5} color="#e0f2fe" />
      </Environment>
    </>
  )
}

/** Piso de estudio: satinado, con un reflejo suave que se funde con la niebla en el horizonte. */
export function StudioFloor() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]}>
      <circleGeometry args={[40, 64]} />
      <meshStandardMaterial color="#141820" roughness={0.5} metalness={0.25} />
    </mesh>
  )
}

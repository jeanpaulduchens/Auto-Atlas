import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * Post-procesado en calidad alta:
 * - oclusión ambiental (N8AO): sombra suave donde las piezas se tocan o se acercan;
 * - brillo (bloom) solo en lo que emite más luz que el blanco: faros, chispa, explosión;
 * - tone mapping Neutral de Khronos, pensado para productos: conserva los colores reales;
 * - SMAA para suavizar bordes (el antialiasing por hardware no funciona junto con la oclusión ambiental).
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={28} distanceFalloff={0.3} intensity={2.4} screenSpaceRadius halfRes quality="low" />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.55} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  )
}

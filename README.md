# Auto Atlas

Anatomía interactiva de un automóvil en 3D: se puede desarmar y cada pieza está animada funcionando.

## Cómo correrlo

```bash
export PATH=~/.local/node/bin:$PATH   # Node 24 instalado en ~/.local/node
npm install
npm run dev                            # abre http://localhost:5173
```

## Cómo se usa

- **Interior** (panel → Vista): *Cerrado*, *Translúcido* o *Corte*. El corte parte el auto, el motor y
  la caja por la mitad, con rayado técnico en las caras cortadas.
- **Desarmar**: separa las piezas y muestra una etiqueta por sistema; al tocar un sistema aparecen
  las etiquetas de sus piezas.
- **Recorridos**: secuencias de vistas con explicación (← → para avanzar, Esc para salir). Se definen en
  `src/data/tours.ts`: cada paso indica qué piezas encuadrar y desde qué dirección, y la cámara calcula
  la distancia sola, así que siguen funcionando si cambian los modelos.
- **Calidad** (panel → Vista): *Alta* agrega oclusión ambiental, brillo en luces y explosión, y tone
  mapping Neutral; *Rápida* lo desactiva para equipos modestos (es la inicial en pantallas táctiles).
- **Enlaces a una vista**: `?interior=seccion&explode=1&select=ciguenal`, `?tour=ciclo&step=3` o `?calidad=rapida`.

## Stack

- **React + TypeScript + Vite**: la interfaz y el build.
- **Three.js vía React Three Fiber** (`@react-three/fiber`) y **drei**: el 3D.
- **zustand**: el estado de la interfaz (marcha, rpm, pieza seleccionada…).

## Arquitectura

```
src/
  data/parts.ts      Catálogo de piezas: nombre, sistema y explicación (lo que muestra el panel)
  data/tours.ts      Recorridos guiados: pasos, encuadres y textos
  sim.ts             Simulación mecánica: ángulos de cigüeñal, caja, ruedas; ciclo de 4 tiempos
  tours.ts           Navegación de los recorridos guiados
  store.ts           Estado de la interfaz (zustand)
  scene/
    Part.tsx         Envoltorio de cada pieza: selección, resaltado, transparencia, corte, explosión
    Labels.tsx       Etiquetas sobre las piezas, acomodadas para no taparse
    Studio.tsx       Iluminación de estudio, piso y post-procesado
    textures.ts      Texturas de superficie generadas por código (fundición, cepillado, rodadura)
    layout.ts        Cotas del auto (dónde va cada cosa, en metros)
    helpers.tsx      Engranajes, resortes, correas, tubos, partículas de flujo
    Engine.tsx       Motor 4 cilindros DOHC 16v
    Drivetrain.tsx   Embrague, caja de 5 velocidades, cardán, diferencial
    Cooling.tsx      Radiador, ventilador, mangueras
    Exhaust.tsx      Múltiple, catalizador, silenciador
    Chassis.tsx      Ruedas, frenos, suspensión, chasis, batería, combustible
    Body.tsx         Carrocería e interior
  ui/                Paneles HTML sobre el canvas
```

**Para agregar una pieza:** créala en `data/parts.ts` con su explicación y envuelve sus mallas en
`<Part id="mi-pieza" explode={[x, y, z]}>` dentro del sistema que corresponda. La selección, el resaltado,
el modo aislar, la explosión y el enfoque de la cámara funcionan solos.

**Para animarla:** lee los ángulos de `sim` (`sim.crank`, `sim.output`, `sim.wheel`…) dentro de un
`useFrame`, o usa `<Spinner angle={() => ...}>`.

## Modelos 3D

Por ahora todas las piezas son **procedurales** (generadas por código). Así las animaciones son exactas
y no dependemos de licencias. El plan es reemplazar pieza por pieza con modelos `.glb` en `public/models/`,
manteniendo el mismo `<Part id=...>`.

Fuentes a revisar (siempre verificar la licencia de cada modelo):
- **GrabCAD**: modelos CAD de ingeniería (motores, cajas). Exportar STEP → Blender → glTF.
- **Sketchfab**: filtrar por “Downloadable” y licencia CC-BY o CC0; buscar “engine cutaway”.
- **Poly Pizza / Quaternius / Kenney**: autos low-poly CC0 para la carrocería.
- **BlenderKit**: materiales y algunos modelos gratuitos.

## Próximos pasos (ideas)

- [ ] Dirección: cremallera, columna y volante que giran las ruedas delanteras
- [ ] Resortes de válvula que se comprimen; bomba de aceite con flujo de aceite
- [ ] Marcha atrás (engranaje intermedio) y horquillas de cambio
- [ ] Diferencial en curva (ruedas a distinta velocidad)
- [ ] Circuito de frenos con pedal, bomba y líquido
- [x] Recorridos guiados paso a paso
- [x] Corte de sección y etiquetas sobre las piezas
- [ ] Carrocería con un modelo `.glb` más realista
- [ ] Más autos: tracción delantera con motor transversal, eléctrico

import { CARS, type CarId, type Module } from '../cars'

export type SystemId =
  | 'carroceria'
  | 'motor'
  | 'electrico'
  | 'combustible'
  | 'refrigeracion'
  | 'transmision'
  | 'escape'
  | 'suspension'
  | 'frenos'
  | 'ruedas'

export interface SystemInfo {
  name: string
  color: string
}

export const SYSTEMS: Record<SystemId, SystemInfo> = {
  carroceria: { name: 'Carrocería y chasis', color: '#94a3b8' },
  motor: { name: 'Motor', color: '#ef4444' },
  electrico: { name: 'Sistema eléctrico', color: '#eab308' },
  combustible: { name: 'Combustible', color: '#ec4899' },
  refrigeracion: { name: 'Refrigeración', color: '#06b6d4' },
  transmision: { name: 'Transmisión', color: '#8b5cf6' },
  escape: { name: 'Escape', color: '#a8a29e' },
  suspension: { name: 'Suspensión', color: '#22c55e' },
  frenos: { name: 'Frenos', color: '#f97316' },
  ruedas: { name: 'Ruedas', color: '#64748b' },
}

export const SYSTEM_ORDER = Object.keys(SYSTEMS) as SystemId[]

export interface PartInfo {
  name: string
  system: SystemId
  /** Módulos que debe tener la versión para incluir la pieza (todos); sin módulo, está en todas. */
  module?: Module | Module[]
  summary: string
  how: string[]
  fact?: string
}

export const PARTS: Record<string, PartInfo> = {
  // ── Carrocería ────────────────────────────────────────────────
  carroceria: {
    name: 'Carrocería',
    system: 'carroceria',
    summary:
      'La “piel” del auto: paneles de acero estampado que protegen a los ocupantes, le dan forma aerodinámica y sostienen puertas, capó y maletero.',
    how: [
      'En la mayoría de los autos modernos es monocasco: carrocería y chasis forman una sola estructura soldada.',
      'Tiene zonas de deformación programada que se aplastan en un choque para absorber energía y proteger la cabina.',
      'Su forma reduce la resistencia al aire; un sedán típico tiene un coeficiente aerodinámico (Cx) cercano a 0,30.',
    ],
    fact: 'Aquí la mostramos separada del chasis para dejar ver la mecánica, como en los autos antiguos o las camionetas con chasis de escalera.',
  },
  habitaculo: {
    name: 'Habitáculo',
    system: 'carroceria',
    summary: 'El espacio de los ocupantes: asientos, tablero y volante.',
    how: [
      'La jaula del habitáculo es la parte más rígida de la carrocería: está diseñada para no deformarse en un choque.',
      'El volante gira la columna de dirección, que mueve las ruedas delanteras mediante una cremallera.',
    ],
  },
  chasis: {
    name: 'Chasis (bastidor)',
    system: 'carroceria',
    summary: 'El esqueleto del auto: largueros y travesaños que sostienen el motor, la caja, la suspensión y la carrocería.',
    how: [
      'Dos largueros longitudinales unidos por travesaños forman un “chasis de escalera”.',
      'El motor y la caja se apoyan en soportes de goma que absorben las vibraciones antes de que lleguen a la cabina.',
    ],
  },

  // ── Motor ─────────────────────────────────────────────────────
  bloque: {
    name: 'Bloque del motor',
    system: 'motor',
    module: 'combustion',
    summary:
      'La pieza principal del motor: un bloque de hierro o aluminio fundido que contiene los cilindros donde se mueven los pistones.',
    how: [
      'Este es un motor de 4 cilindros en línea: los cuatro cilindros están alineados uno detrás de otro.',
      'Dentro de sus paredes hay conductos por donde circula el refrigerante (camisas de agua) y galerías de aceite a presión.',
      'Por debajo sostiene el cigüeñal mediante los apoyos de bancada.',
    ],
    fact: 'En el panel, elige Interior → Corte para ver el bloque partido por la mitad y los pistones trabajando adentro.',
  },
  culata: {
    name: 'Culata',
    system: 'motor',
    module: 'combustion',
    summary:
      'Cierra los cilindros por arriba. Contiene las cámaras de combustión, los conductos de admisión y escape y los asientos de las válvulas.',
    how: [
      'Entre la culata y el bloque va la junta de culata, que sella la compresión, el aceite y el refrigerante.',
      'Cada cilindro tiene 4 válvulas (2 de admisión y 2 de escape): es un motor de 16 válvulas.',
    ],
  },
  'tapa-valvulas': {
    name: 'Tapa de válvulas',
    system: 'motor',
    module: 'combustion',
    summary: 'Cubre los árboles de levas y las válvulas, y mantiene dentro el aceite que los lubrica.',
    how: [
      'Arriba tiene la tapa de llenado de aceite del motor.',
      'Por ella asoman las bujías (o las bobinas de encendido) de cada cilindro.',
    ],
  },
  ciguenal: {
    name: 'Cigüeñal',
    system: 'motor',
    module: 'combustion',
    summary:
      'Convierte el movimiento de sube y baja de los pistones en giro. Es el eje que finalmente mueve las ruedas.',
    how: [
      'Tiene “muñequillas” desplazadas del centro: al empujarlas las bielas, el eje gira, como los pedales de una bicicleta.',
      'En un 4 cilindros, los cilindros 1 y 4 suben juntos, y el 2 y el 3 también, desfasados 180°.',
      'Los contrapesos equilibran la masa de pistones y bielas para reducir las vibraciones.',
      'Orden de encendido: 1-3-4-2. Cada media vuelta explota un cilindro distinto.',
    ],
    fact: 'A 3.000 rpm el cigüeñal da 50 vueltas por segundo. Por eso la animación va en cámara lenta.',
  },
  pistones: {
    name: 'Pistones',
    system: 'motor',
    module: 'combustion',
    summary: 'Cilindros de aluminio que suben y bajan dentro del bloque y reciben la fuerza de la combustión.',
    how: [
      'Ciclo de 4 tiempos, en dos vueltas del cigüeñal: admisión (baja y aspira aire y combustible), compresión (sube y comprime), explosión (la chispa enciende la mezcla y lo empuja hacia abajo) y escape (sube y expulsa los gases).',
      'Los segmentos (anillos) sellan contra la pared del cilindro para que no se escape la presión.',
      'Los colores dentro de cada cilindro indican el tiempo: azul = admisión y compresión, naranja = explosión, gris = escape.',
    ],
    fact: 'En la explosión, la presión puede superar las 50 atmósferas: varias toneladas de fuerza sobre la cabeza del pistón.',
  },
  bielas: {
    name: 'Bielas',
    system: 'motor',
    module: 'combustion',
    summary: 'Barras de acero forjado que unen cada pistón con el cigüeñal.',
    how: [
      'El “pie” de la biela se une al pistón con un bulón y la “cabeza” abraza la muñequilla del cigüeñal.',
      'Transforman el movimiento lineal en giratorio, oscilando de lado a lado mientras el cigüeñal gira.',
    ],
  },
  'arbol-levas-admision': {
    name: 'Árbol de levas de admisión',
    system: 'motor',
    module: 'combustion',
    summary: 'Eje con levas ovaladas que empujan y abren las válvulas de admisión en el momento exacto.',
    how: [
      'Gira a la mitad de velocidad que el cigüeñal: cada válvula se abre una vez cada dos vueltas del motor.',
      'La forma de cada leva define cuánto se abre la válvula (alzada) y durante cuánto tiempo (duración).',
      'Este motor es DOHC: tiene dos árboles de levas en la culata, uno para admisión y otro para escape.',
    ],
  },
  'arbol-levas-escape': {
    name: 'Árbol de levas de escape',
    system: 'motor',
    module: 'combustion',
    summary: 'Abre las válvulas de escape para que los gases quemados salgan del cilindro.',
    how: [
      'Igual que el de admisión, gira a la mitad de las rpm del cigüeñal, sincronizado por la correa de distribución.',
      'Abre las válvulas de escape cuando el pistón sube después de la explosión.',
    ],
  },
  valvulas: {
    name: 'Válvulas',
    system: 'motor',
    module: 'combustion',
    summary: 'Tapones en forma de hongo que abren y cierran el paso de la mezcla y de los gases en cada cilindro.',
    how: [
      'Las levas las empujan hacia abajo para abrirlas y un resorte las vuelve a cerrar.',
      'Las de admisión (lado izquierdo) dejan entrar aire y combustible; las de escape (lado derecho) dejan salir los gases.',
      'En la compresión y la explosión ambas están cerradas, para sellar el cilindro.',
    ],
  },
  'correa-distribucion': {
    name: 'Correa de distribución',
    system: 'motor',
    module: 'combustion',
    summary: 'Correa dentada que sincroniza el cigüeñal con los árboles de levas.',
    how: [
      'La polea del cigüeñal es la mitad de grande que las de las levas: relación 2:1.',
      'Mantiene las válvulas abriéndose en el momento exacto respecto a la posición de los pistones.',
    ],
    fact: 'Si se corta en un motor “interferente”, las válvulas chocan con los pistones. Se cambia cada 60.000 a 100.000 km aprox.',
  },
  carter: {
    name: 'Cárter de aceite',
    system: 'motor',
    module: 'combustion',
    summary: 'Depósito bajo el motor donde se acumula el aceite.',
    how: [
      'La bomba de aceite lo aspira y lo envía a presión a los cojinetes del cigüeñal, las levas y los pistones.',
      'El aceite vuelve a caer al cárter por gravedad. Tiene un tapón en la parte baja para vaciarlo al cambiarlo.',
    ],
  },
  'volante-motor': {
    name: 'Volante de inercia',
    system: 'motor',
    module: 'combustion',
    summary: 'Disco pesado atornillado al final del cigüeñal que suaviza los pulsos de cada explosión.',
    how: [
      'Por su masa acumula energía y mantiene el giro estable entre una explosión y la siguiente.',
      'Su borde dentado (corona) es donde engrana el motor de arranque para hacer girar el motor al darle contacto.',
      'Su cara trasera es la superficie contra la que aprieta el disco de embrague.',
    ],
  },
  admision: {
    name: 'Admisión (filtro y múltiple)',
    system: 'motor',
    module: 'combustion',
    summary: 'Lleva el aire limpio desde el exterior hasta cada cilindro.',
    how: [
      'El filtro de aire retiene el polvo; la mariposa (conectada al acelerador) regula cuánto aire entra.',
      'El múltiple de admisión reparte el aire en cuatro conductos, uno por cilindro.',
      'Más aire (con su combustible proporcional) significa más potencia: por eso el acelerador controla el aire, no la gasolina directamente.',
    ],
  },
  'correa-accesorios': {
    name: 'Correa de accesorios',
    system: 'motor',
    module: 'combustion',
    summary: 'Correa acanalada (poly-V) que toma giro del cigüeñal para mover el alternador y la bomba de agua.',
    how: [
      'En muchos autos también mueve el compresor del aire acondicionado y la bomba de la dirección hidráulica.',
      'El tamaño de cada polea define a qué velocidad gira cada accesorio.',
    ],
  },

  // ── Turbo ─────────────────────────────────────────────────────
  turbo: {
    name: 'Turbocompresor',
    system: 'motor',
    module: 'turbo',
    summary:
      'Usa la energía de los gases de escape para meter más aire al motor. Más aire permite quemar más combustible: más potencia con el mismo tamaño de motor.',
    how: [
      'Los gases calientes del escape hacen girar la turbina (lado de hierro, a la izquierda del eje).',
      'La turbina está unida por un eje al compresor (lado de aluminio), que aspira aire fresco y lo empuja comprimido hacia el motor.',
      'El eje llega a girar a más de 150.000 rpm y flota sobre una película de aceite.',
      'La válvula de descarga (wastegate) desvía parte de los gases cuando la presión es suficiente, para no sobrealimentar el motor.',
    ],
    fact: 'Un motor turbo de 2,0 litros puede rendir como uno atmosférico de 3,0: por eso casi todos los autos nuevos lo usan.',
  },
  intercooler: {
    name: 'Intercooler',
    system: 'motor',
    module: 'turbo',
    summary: 'Radiador de aire: enfría el aire que sale caliente del compresor antes de que entre al motor.',
    how: [
      'Al comprimir el aire, este se calienta (puede superar los 120 °C) y el aire caliente es menos denso.',
      'El intercooler lo enfría con el aire que entra por el frente del auto; así cabe más oxígeno en cada cilindro.',
      'El aire comprimido entra caliente (puntos naranjo claro) y sale enfriado (puntos celestes) de camino al motor.',
    ],
  },
  'ductos-turbo': {
    name: 'Ductos de admisión turbo',
    system: 'motor',
    module: 'turbo',
    summary: 'Conducen el aire: del filtro al compresor, del compresor al intercooler y del intercooler a la mariposa.',
    how: [
      'Tramo frío: del filtro de aire a la entrada del compresor.',
      'Tramo presurizado: del compresor al intercooler y de ahí al múltiple de admisión, a 0,5–1,5 bar sobre la presión atmosférica.',
    ],
  },

  // ── Eléctrico ─────────────────────────────────────────────────
  bujias: {
    name: 'Bujías',
    system: 'electrico',
    module: 'combustion',
    summary: 'Hacen saltar la chispa que enciende la mezcla de aire y combustible dentro de cada cilindro.',
    how: [
      'La bobina eleva los 12 V de la batería a entre 20.000 y 40.000 V.',
      'La chispa salta justo antes de que el pistón llegue arriba al final de la compresión (avance de encendido).',
      'Mira el destello amarillo en cada cilindro cuando empieza la explosión.',
    ],
  },
  bateria: {
    name: 'Batería',
    system: 'electrico',
    summary: 'Acumulador de 12 V que da la energía para arrancar el motor y alimenta el auto cuando está apagado.',
    how: [
      'Es de plomo-ácido: seis celdas de 2,1 V en serie.',
      'Al arrancar entrega de 300 a 600 amperes al motor de arranque durante unos segundos.',
      'Con el motor funcionando, el alternador la recarga. En un auto eléctrico, la recarga un conversor desde la batería de tracción.',
    ],
  },
  alternador: {
    name: 'Alternador',
    system: 'electrico',
    module: 'combustion',
    summary: 'Generador que produce electricidad mientras el motor gira y recarga la batería.',
    how: [
      'La correa de accesorios lo hace girar 2 a 3 veces más rápido que el cigüeñal, por su polea más pequeña.',
      'Genera corriente alterna que un puente de diodos convierte en continua (unos 14 V).',
    ],
  },

  // ── Combustible ───────────────────────────────────────────────
  estanque: {
    name: 'Estanque y línea de combustible',
    system: 'combustible',
    module: 'combustion',
    summary: 'Almacena la gasolina y la envía al motor.',
    how: [
      'Dentro del estanque hay una bomba eléctrica sumergida que empuja el combustible por la línea a unos 3–4 bar.',
      'Los puntos rosados muestran el combustible viajando hacia el motor.',
    ],
  },
  inyeccion: {
    name: 'Riel e inyectores',
    system: 'combustible',
    module: 'combustion',
    summary: 'Pulverizan la gasolina en cada conducto de admisión, en la cantidad justa.',
    how: [
      'El riel reparte el combustible a presión a los 4 inyectores.',
      'El computador del motor (ECU) decide cuántos milisegundos abrir cada inyector según el aire que entra, las rpm y la temperatura.',
      'La proporción ideal es de unas 14,7 partes de aire por 1 de gasolina (en masa).',
    ],
  },

  // ── Refrigeración ─────────────────────────────────────────────
  radiador: {
    name: 'Radiador',
    system: 'refrigeracion',
    module: 'combustion',
    summary: 'Intercambiador de calor que enfría el líquido refrigerante con el aire que pasa por el frente del auto.',
    how: [
      'El refrigerante caliente entra por arriba y baja por decenas de tubos delgados rodeados de aletas de aluminio.',
      'El aire que atraviesa las aletas se lleva el calor; el líquido sale frío por abajo y vuelve al motor.',
    ],
    fact: 'Cerca de un tercio de la energía de la gasolina se pierde como calor en el refrigerante.',
  },
  ventilador: {
    name: 'Electroventilador',
    system: 'refrigeracion',
    module: 'combustion',
    summary: 'Empuja aire a través del radiador cuando el auto va lento o está detenido.',
    how: [
      'Un sensor de temperatura lo enciende cuando el refrigerante supera unos 95 °C.',
      'En carretera casi no hace falta: el propio avance del auto empuja el aire.',
    ],
  },
  'bomba-agua': {
    name: 'Bomba de agua',
    system: 'refrigeracion',
    module: 'combustion',
    summary: 'Bomba centrífuga que hace circular el refrigerante entre el motor y el radiador.',
    how: [
      'La mueve la correa de accesorios, así que funciona siempre que el motor está en marcha.',
      'Aspira el líquido frío del radiador y lo empuja por las camisas de agua del bloque y la culata.',
    ],
  },
  mangueras: {
    name: 'Mangueras y termostato',
    system: 'refrigeracion',
    module: 'combustion',
    summary: 'Conectan el motor con el radiador. El termostato decide cuándo el líquido pasa por el radiador.',
    how: [
      'La manguera superior (puntos rojos) lleva el refrigerante caliente del motor al radiador.',
      'La inferior (puntos azules) devuelve el líquido frío a la bomba de agua.',
      'Con el motor frío, el termostato está cerrado para que se caliente rápido; se abre a unos 88–92 °C.',
    ],
  },

  // ── Transmisión ───────────────────────────────────────────────
  embrague: {
    name: 'Embrague',
    system: 'transmision',
    module: 'caja-manual',
    summary: 'Conecta y desconecta el motor de la caja de cambios.',
    how: [
      'Un disco con material de fricción queda apretado entre el volante y el plato de presión por un resorte de diafragma.',
      'Al pisar el pedal, el plato se separa, el disco queda libre y el motor ya no mueve la caja. Así se puede cambiar de marcha.',
      'Prueba el botón “Pisar embrague”: el disco (marrón) y los ejes de la caja se detienen aunque el motor siga girando.',
    ],
  },
  'caja-cambios': {
    name: 'Caja de cambios (carcasa)',
    system: 'transmision',
    module: ['caja-manual', 'traccion-trasera'],
    summary: 'Contiene los ejes y engranajes que cambian la relación entre las vueltas del motor y las de las ruedas.',
    how: [
      'Es una caja manual de 5 velocidades. Los engranajes giran bañados en aceite.',
      'Marchas cortas (1ª, 2ª) dan mucha fuerza y poca velocidad; las largas (4ª, 5ª), lo contrario.',
    ],
    fact: 'En el panel, elige Interior → Corte para ver los engranajes dentro de la carcasa.',
  },
  'eje-primario': {
    name: 'Eje primario (de entrada)',
    system: 'transmision',
    module: ['caja-manual', 'traccion-trasera'],
    summary: 'Recibe el giro del motor a través del embrague y lo pasa al eje intermediario.',
    how: [
      'Su engranaje está siempre engranado con el primer engranaje del eje intermediario (engranaje de toma constante).',
    ],
  },
  'eje-intermediario': {
    name: 'Eje intermediario',
    system: 'transmision',
    module: ['caja-manual', 'traccion-trasera'],
    summary: 'Eje inferior con un engranaje fijo por cada marcha. Gira siempre que el embrague está suelto.',
    how: [
      'Cada engranaje del intermediario está permanentemente engranado con su pareja del eje secundario.',
      'Gira en sentido contrario al motor; al pasar al secundario el sentido se invierte otra vez.',
    ],
  },
  'eje-secundario': {
    name: 'Eje secundario y sincronizador',
    system: 'transmision',
    module: ['caja-manual', 'traccion-trasera'],
    summary: 'Eje de salida hacia el cardán. Sus engranajes giran “locos” hasta que el sincronizador bloquea uno.',
    how: [
      'Todos los engranajes del secundario giran siempre, cada uno a su velocidad, pero libres sobre el eje.',
      'Al elegir una marcha, el sincronizador (collar dorado) iguala velocidades y bloquea ese engranaje al eje.',
      'Relaciones: 1ª 3,54 · 2ª 2,13 · 3ª 1,36 · 4ª 1,00 · 5ª 0,82. En 1ª, el motor da 3,54 vueltas por cada vuelta del eje.',
    ],
  },
  palanca: {
    name: 'Palanca de cambios',
    system: 'transmision',
    module: 'caja-manual',
    summary: 'Mueve las horquillas que desplazan los sincronizadores dentro de la caja.',
    how: [
      'Patrón en H: izquierda-derecha elige la horquilla y adelante-atrás la mueve.',
      'Cambia de marcha en el panel y mira cómo se mueven la palanca y el collar dorado.',
      'En los autos de tracción delantera la caja queda lejos, adelante: la palanca la mueve a través de dos cables.',
    ],
  },
  cardan: {
    name: 'Cardán (eje de transmisión)',
    system: 'transmision',
    module: 'traccion-trasera',
    summary: 'Tubo que lleva el giro desde la caja de cambios hasta el diferencial trasero.',
    how: [
      'En cada extremo tiene una junta universal (cruceta) que le permite girar en ángulo.',
      'Así sigue transmitiendo el giro aunque la suspensión trasera suba y baje.',
    ],
    fact: 'Este auto es de tracción trasera, la disposición clásica que deja ver toda la cadena: motor → caja → cardán → diferencial → ruedas.',
  },
  diferencial: {
    name: 'Diferencial',
    system: 'transmision',
    module: 'traccion-trasera',
    summary: 'Gira el movimiento 90° hacia las ruedas, lo reduce y permite que cada rueda gire a distinta velocidad en las curvas.',
    how: [
      'El piñón (pequeño) mueve la corona (grande): una reducción final de 3,9 a 1.',
      'Dentro de la corona hay engranajes satélites y planetarios. En línea recta giran como un bloque.',
      'En una curva, la rueda exterior recorre más distancia: los satélites giran y reparten la diferencia.',
    ],
  },
  'puente-trasero': {
    name: 'Puente trasero',
    system: 'transmision',
    module: 'traccion-trasera',
    summary: 'Carcasa rígida que contiene el diferencial y los semiejes. También forma parte de la suspensión trasera.',
    how: ['Por dentro está lleno en parte con aceite de engranajes para lubricar la corona y el piñón.'],
  },
  semiejes: {
    name: 'Semiejes (palieres)',
    system: 'transmision',
    module: 'traccion-trasera',
    summary: 'Ejes que llevan el giro desde el diferencial hasta cada rueda trasera.',
    how: ['Se conectan a los engranajes planetarios del diferencial por un extremo y al buje de la rueda por el otro.'],
  },

  // ── Tracción delantera ────────────────────────────────────────
  transeje: {
    name: 'Transeje',
    system: 'transmision',
    module: ['caja-manual', 'traccion-delantera'],
    summary:
      'Caja de cambios y diferencial en una sola carcasa, atornillada al costado del motor. Es la solución de casi todos los autos de tracción delantera.',
    how: [
      'Con el motor atravesado, no hay espacio para una caja larga y un cardán: todo se junta en un bloque compacto.',
      'Adentro hay solo dos ejes (primario y secundario) y, al final, el diferencial que reparte el giro a las ruedas delanteras.',
    ],
    fact: 'El Mini de 1959 popularizó el motor transversal con tracción delantera: dejaba el 80 % del auto para pasajeros y equipaje.',
  },
  'transeje-ejes': {
    name: 'Ejes y engranajes del transeje',
    system: 'transmision',
    module: ['caja-manual', 'traccion-delantera'],
    summary: 'El eje primario recibe el giro del embrague; el secundario lo entrega, reducido, al diferencial.',
    how: [
      'A diferencia de la caja longitudinal, aquí no hay eje intermediario: cada engranaje del primario engrana directo con su pareja del secundario.',
      'Los engranajes del secundario giran libres hasta que el sincronizador (collar dorado) bloquea el de la marcha elegida.',
      'En el extremo del secundario, un piñón pequeño mueve la corona del diferencial.',
    ],
  },
  'diferencial-delantero': {
    name: 'Diferencial delantero',
    system: 'transmision',
    module: 'traccion-delantera',
    summary: 'Reparte el giro entre las dos ruedas delanteras y deja que giren a distinta velocidad en las curvas.',
    how: [
      'Su corona (dorada) la mueve el piñón del eje secundario, con una reducción final de unas 4 veces.',
      'Como las ruedas delanteras además giran para doblar, en una curva la diferencia de velocidad entre ellas es aún mayor que en un auto de tracción trasera.',
    ],
  },
  'semiejes-delanteros': {
    name: 'Semiejes y juntas homocinéticas',
    system: 'transmision',
    module: 'traccion-delantera',
    summary: 'Llevan el giro del diferencial a cada rueda delantera, aunque la rueda esté girada para doblar y subiendo o bajando con la suspensión.',
    how: [
      'En cada extremo hay una junta homocinética (bajo el fuelle de goma negro): transmite el giro a velocidad constante aunque el eje trabaje en ángulo.',
      'Una junta universal (cruceta) como la del cardán haría que la rueda acelere y frene en cada vuelta cuando está doblada; la homocinética lo evita.',
      'Suelen ser de distinto largo, porque el diferencial no queda en el centro del auto.',
    ],
    fact: 'Un fuelle roto deja salir la grasa y entrar tierra: la junta empieza a sonar con un “clac-clac” al doblar.',
  },
  'suspension-trasera-torsion': {
    name: 'Suspensión trasera de eje de torsión',
    system: 'suspension',
    module: 'traccion-delantera',
    summary: 'Dos brazos longitudinales unidos por una viga que se tuerce. Simple, barata y ocupa poco espacio.',
    how: [
      'Cuando una rueda sube, la viga se tuerce y actúa como barra estabilizadora.',
      'Como las ruedas traseras no reciben fuerza del motor, basta con esta suspensión sencilla, que además deja espacio para el piso del maletero.',
    ],
  },

  // ── Caja automática ───────────────────────────────────────────
  'convertidor-par': {
    name: 'Convertidor de par',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'Reemplaza al embrague: une el motor con la caja a través de aceite, sin pedal.',
    how: [
      'La bomba (plateada) gira con el motor y lanza aceite contra la turbina (dorada), que mueve la caja. No se tocan: el aceite hace de unión.',
      'Con el auto detenido y en D, la turbina puede quedarse quieta mientras el motor gira: por eso el auto no se apaga en un semáforo.',
      'El estator (al centro) redirige el aceite y multiplica la fuerza al arrancar, hasta el doble.',
      'A velocidad constante, un embrague de bloqueo une bomba y turbina para no perder energía en el aceite.',
    ],
  },
  'caja-automatica': {
    name: 'Caja automática (carcasa)',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'Contiene el tren planetario, los frenos y embragues hidráulicos y el diferencial, bañados en aceite especial (ATF).',
    how: [
      'No tiene pedal de embrague ni palanca con H: el conductor elige P, R, N o D y la caja cambia de marcha sola.',
      'El mismo aceite lubrica, enfría y, a presión, acciona los frenos y embragues que eligen cada marcha.',
    ],
  },
  'tren-planetario': {
    name: 'Tren planetario',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'Un sol al centro, satélites que giran a su alrededor y una corona de dientes internos. Con un solo juego se consiguen varias marchas.',
    how: [
      'Cada marcha sale de elegir qué pieza recibe el giro del motor (dorada), cuál se frena (roja) y cuál entrega el giro (azul).',
      '1ª: entra por el sol, la corona frenada, sale por el portasatélites (3,47:1). 2ª: entra por la corona, el sol frenado (1,41:1).',
      '3ª: todo unido, gira como un bloque (1:1). 4ª, sobremarcha: entra por el portasatélites, el sol frenado y sale por la corona, más rápido que el motor (0,71:1).',
      'Si se frena el portasatélites, la corona gira al revés: así se logra la marcha atrás.',
    ],
    fact: 'Las cajas reales combinan dos o tres trenes planetarios para lograr 6 a 10 marchas; aquí se muestra uno solo para entender la idea.',
  },
  'frenos-embragues': {
    name: 'Frenos y embragues hidráulicos',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'Sujetan o unen piezas del tren planetario. Al aplicarse (en rojo o dorado) eligen la marcha.',
    how: [
      'Freno de cinta: una banda que abraza el tambor de la corona y la detiene (1ª).',
      'Freno del sol: discos que lo sujetan contra la carcasa (2ª y 4ª).',
      'Embrague directo: discos que unen sol y corona para que todo gire junto (3ª).',
      'Los acciona el aceite a presión: al cambiar, uno se suelta mientras el otro se aplica, sin cortar la fuerza.',
    ],
  },
  'eje-salida-automatica': {
    name: 'Transferencia y eje de salida',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'Llevan el giro del tren planetario al eje de salida y, con su piñón, a la corona del diferencial.',
    how: ['El engranaje azul gira con la salida del tren planetario y mueve a su pareja en el eje de salida.'],
  },
  'cuerpo-valvulas': {
    name: 'Cuerpo de válvulas',
    system: 'transmision',
    module: ['caja-automatica', 'traccion-delantera'],
    summary: 'El “cerebro hidráulico”: un laberinto de canales y válvulas que manda aceite a presión al freno o embrague de cada marcha.',
    how: [
      'Los solenoides (cilindros negros) los controla el computador de la caja según la velocidad, el acelerador y la carga.',
      'Decide cuándo cambiar: acelerando a fondo retrasa el cambio; con el pie suave, cambia antes para gastar menos.',
    ],
  },
  'palanca-selectora': {
    name: 'Palanca selectora',
    system: 'transmision',
    module: 'caja-automatica',
    summary: 'P (estacionar), R (reversa), N (neutro) y D (avanzar). En D, la caja elige sola la marcha.',
    how: [
      'En P, un trinquete bloquea el eje de salida para que el auto no se mueva.',
      'Un cable la une a la caja, que va adelante junto al motor.',
    ],
  },

  // ── Eléctrico ─────────────────────────────────────────────────
  'bateria-traccion': {
    name: 'Batería de tracción',
    system: 'electrico',
    module: 'electrica',
    summary: 'Cientos de celdas de ion-litio agrupadas en módulos bajo el piso. Guardan la energía que mueve el auto.',
    how: [
      'Las celdas (azules) se conectan en serie y en paralelo hasta llegar a unos 400 V de corriente continua.',
      'Va en el piso, entre los ejes: el peso queda bajo y centrado, y el auto se vuelca menos en las curvas.',
      'Un sistema de gestión (BMS) vigila la temperatura y la carga de cada módulo, y la batería tiene su propio circuito de refrigeración.',
    ],
    fact: 'Una batería de 60 kWh guarda la energía de unos 7 litros de gasolina, pero el motor eléctrico la aprovecha 3 veces mejor.',
  },
  inversor: {
    name: 'Inversor',
    system: 'electrico',
    module: 'electrica',
    summary: 'Convierte la corriente continua de la batería en corriente alterna trifásica para el motor, y controla su velocidad y su fuerza.',
    how: [
      'Transistores de potencia se encienden y apagan miles de veces por segundo para “fabricar” las tres fases del motor.',
      'Los cables naranjos son de alta tensión: el color es obligatorio para advertir a mecánicos y rescatistas.',
      'Al frenar funciona al revés: el motor actúa como generador y el inversor devuelve energía a la batería (frenado regenerativo).',
      'Un conversor aparte baja la tensión a 12 V para las luces y la batería auxiliar, en lugar de un alternador.',
    ],
  },
  'motor-electrico': {
    name: 'Motor eléctrico',
    system: 'motor',
    module: 'electrica',
    summary: 'Reemplaza al motor a combustión: sin pistones, válvulas ni explosiones. Tiene una sola pieza que gira: el rotor.',
    how: [
      'El estátor (por fuera) tiene bobinas de cobre; al pasar corriente alterna se forma un campo magnético que gira. Mira cómo se iluminan en secuencia.',
      'El rotor tiene imanes permanentes (rojo norte, azul sur) que persiguen ese campo giratorio y hacen girar el eje.',
      'Entrega toda su fuerza desde cero rpm: por eso los eléctricos aceleran tan rápido desde detenidos.',
      'Gira hasta unas 16.000 rpm y convierte en movimiento más del 90 % de la energía (un motor a gasolina, cerca del 30 %).',
    ],
  },
  reductora: {
    name: 'Reductora y diferencial',
    system: 'transmision',
    module: 'electrica',
    summary: 'Una “caja” de una sola marcha: baja las rpm del motor unas 9 veces y reparte el giro entre las ruedas.',
    how: [
      'Primera etapa: el piñón del motor mueve el engranaje grande del eje intermedio (3:1).',
      'Segunda etapa: el engranaje chico del eje intermedio mueve la corona del diferencial (3:1 otra vez, 9:1 en total).',
      'No necesita marchas: el motor eléctrico da fuerza a cualquier velocidad. La marcha atrás se logra haciendo girar el motor al revés.',
    ],
  },
  'semiejes-traseros': {
    name: 'Semiejes traseros',
    system: 'transmision',
    module: 'electrica',
    summary: 'Llevan el giro del diferencial a cada rueda trasera, con juntas homocinéticas que siguen el movimiento de la suspensión.',
    how: ['Como la suspensión trasera es independiente, cada rueda sube y baja por su cuenta y el semieje trabaja en ángulo.'],
  },
  'suspension-trasera-independiente': {
    name: 'Suspensión trasera independiente',
    system: 'suspension',
    module: 'electrica',
    summary: 'Cada rueda trasera tiene sus propios brazos, resorte y amortiguador: un bache en una no afecta a la otra.',
    how: [
      'Los brazos superior e inferior guían la rueda; el resorte y el amortiguador controlan el movimiento.',
      'Da más comodidad y agarre que un eje rígido, y deja espacio al motor y la reductora entre las ruedas.',
    ],
  },
  'puerto-carga': {
    name: 'Puerto de carga',
    system: 'electrico',
    module: 'electrica',
    summary: 'Donde se conecta el cable para cargar la batería.',
    how: [
      'En corriente alterna (en casa) un cargador dentro del auto convierte la energía; en corriente continua (carga rápida) va directo a la batería.',
      'Una carga rápida lleva la batería del 10 al 80 % en unos 30 minutos.',
    ],
  },

  // ── Escape ────────────────────────────────────────────────────
  'multiple-escape': {
    name: 'Múltiple de escape',
    system: 'escape',
    module: 'combustion',
    summary: 'Recoge los gases calientes que salen de cada cilindro y los junta en un solo tubo.',
    how: [
      'Los gases salen a más de 800 °C: por eso suele ser de hierro fundido o de acero inoxidable.',
      'Aquí va la sonda lambda, que mide el oxígeno en el escape para que la ECU ajuste la mezcla.',
    ],
  },
  catalizador: {
    name: 'Catalizador',
    system: 'escape',
    module: 'combustion',
    summary: 'Convierte los gases más tóxicos del escape en gases menos dañinos.',
    how: [
      'Dentro tiene un panal cerámico recubierto de platino, paladio y rodio.',
      'Transforma el monóxido de carbono (CO), los hidrocarburos (HC) y los óxidos de nitrógeno (NOx) en CO₂, vapor de agua y nitrógeno.',
    ],
  },
  silenciador: {
    name: 'Tubo de escape y silenciador',
    system: 'escape',
    module: 'combustion',
    summary: 'Conduce los gases hacia atrás y reduce el ruido de las explosiones.',
    how: [
      'El silenciador tiene cámaras y deflectores que hacen chocar entre sí las ondas de sonido para anularlas.',
      'Los puntos grises muestran los gases de escape saliendo.',
    ],
  },

  // ── Suspensión ────────────────────────────────────────────────
  'suspension-delantera': {
    name: 'Suspensión delantera McPherson',
    system: 'suspension',
    summary: 'Mantiene las ruedas en contacto con el camino y absorbe los baches.',
    how: [
      'El resorte (espiral) soporta el peso y absorbe los golpes.',
      'El amortiguador (dentro del resorte) frena el rebote para que el auto no quede saltando.',
      'El brazo inferior (parrilla) guía la rueda y la une al chasis.',
    ],
  },
  'suspension-trasera': {
    name: 'Suspensión trasera de eje rígido',
    system: 'suspension',
    module: 'traccion-trasera',
    summary: 'Resortes, amortiguadores y brazos que unen el puente trasero con el chasis.',
    how: [
      'Como las dos ruedas van unidas por el puente, lo que le pasa a una afecta a la otra. Es un sistema simple y muy resistente.',
      'Los brazos longitudinales transmiten al chasis el empuje de las ruedas.',
    ],
  },

  // ── Frenos ────────────────────────────────────────────────────
  frenos: {
    name: 'Frenos de disco',
    system: 'frenos',
    summary: 'Detienen el auto convirtiendo su energía de movimiento en calor.',
    how: [
      'Al pisar el pedal, la bomba de freno empuja líquido a presión hacia cada pinza (la pieza roja).',
      'El pistón de la pinza aprieta las pastillas contra el disco que gira con la rueda.',
      'La fricción frena el disco. Frenando fuerte, un disco puede superar los 500 °C.',
    ],
  },

  // ── Ruedas ────────────────────────────────────────────────────
  ruedas: {
    name: 'Ruedas y neumáticos',
    system: 'ruedas',
    summary: 'La llanta metálica y el neumático de goma: el único contacto del auto con el suelo.',
    how: [
      'La superficie de contacto de cada neumático con el suelo es del tamaño de una mano.',
      'El dibujo de la banda de rodadura evacúa el agua para no perder agarre al mojarse.',
      'Con una marcha puesta y el embrague suelto, las ruedas motrices giran: mira la velocidad en el panel.',
    ],
  },
}

/** ¿La pieza forma parte de esta versión del auto? */
export const partInCar = (id: string, car: CarId) => {
  const m = PARTS[id]?.module
  if (!m) return true
  return (Array.isArray(m) ? m : [m]).every((x) => CARS[car].modules.includes(x))
}

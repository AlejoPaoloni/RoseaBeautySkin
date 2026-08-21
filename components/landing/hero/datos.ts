/**
 * Coreografia del hero. Todas las posiciones son porcentajes del escenario
 * (el bloque sticky de 100svh), medidas desde arriba-izquierda.
 *
 * Los recortes transparentes se generan con `node scripts/hero-assets.mjs`.
 */

export interface Pose {
  /** % horizontal del escenario donde queda el centro del producto. */
  x: number;
  /** % vertical del escenario. */
  y: number;
  escala: number;
  /** Giro en el plano (deg). */
  giro: number;
  /** Giro en profundidad (deg). Da sensacion de volumen al salir. */
  giroY: number;
}

export interface HeroProducto {
  slug: string;
  nombre: string;
  marca: string;
  /** Dimensiones reales del webp, para reservar espacio y evitar CLS. */
  ancho: number;
  alto: number;
  /** Ventana de scroll (0-1) en la que este producto sale de la bolsa. */
  desde: number;
  hasta: number;
  /** Curvatura de la trayectoria: % horizontal extra a mitad de camino. */
  arco: number;
  /** 0 = pegado al observador, 1 = al fondo. Controla desenfoque y opacidad. */
  profundidad: number;
  flotar: { dur: number; retraso: number; amplitud: number };
  fin: Pose;
  finMobile: Pose;
}

/**
 * Punto de partida: bien adentro de la bolsa, no en el borde de la boca.
 *
 * La bolsa se ancla abajo y su alto es un clamp, asi que su boca cae en un %
 * distinto segun la pantalla (entre ~67% y ~76% del escenario). El 86% queda
 * por debajo de la cara frontal en todo ese rango, de modo que los productos
 * estan realmente tapados al empezar y emergen por la boca, en vez de
 * aparecer flotando arriba de la bolsa.
 */
export const SALIDA = { x: 50, y: 86 };
export const SALIDA_MOBILE = { x: 50, y: 86 };

/**
 * Altura (% del escenario) que TODOS los productos deben alcanzar, centrados,
 * antes de empezar a abrirse hacia los costados.
 *
 * Bug que esto resuelve: si el producto empieza a moverse en X mientras
 * todavia esta mas abajo que el borde de la bolsa (~60% en desktop, ~70% en
 * mobile, varia porque el alto de la bolsa es un clamp distinto por
 * breakpoint), se lo ve salir por el costado/fuelle en vez de por la boca.
 * Los dos productos con menos recorrido vertical (highlight-milk, terminan
 * mas abajo que el resto) eran los que quedaban mas tiempo por debajo de ese
 * borde. Fijando una altura de escape comun -bien arriba del borde en ambos
 * breakpoints, con margen- se garantiza que los 4 asoman rectos por la boca
 * antes de abrirse, sin importar donde termine cada uno.
 */
export const ALTURA_ESCAPE = 44;
export const ALTURA_ESCAPE_MOBILE = 52;

/**
 * Fraccion del recorrido local (0-1) dedicada a subir recto por la boca,
 * centrado. El resto se reparte entre abrirse hacia el costado y asentar.
 */
export const ETAPA_ESCAPE = 0.42;

/**
 * Hasta ETAPA_ABRIR el producto sigue casi centrado (X retenido); de ahi en
 * mas se abre rapido hacia su posicion final en X. Una retencion larga es
 * lo que hace que la salida se vea como "sube y despues se abre", en vez de
 * abrirse mientras todavia esta subiendo -que se ve apurado/desordenado-.
 *
 * Se probo adelantar esto (hasta 0.27) para que los productos no crucen la
 * altura del titulo/subtitulo centrados. El texto SIEMPRE se dibuja encima
 * (z-40 vs z-20, confirmado con elementFromPoint real: nunca queda tapado),
 * asi que no habia bug de legibilidad -solo la sombra de pocket-bronze
 * pasando detras del subtitulo un instante, sin ocultar ninguna letra-.
 * Adelantar la apertura arreglaba eso pero apuraba toda la coreografia y se
 * veia peor. Se prioriza como se ve por sobre un roce de sombra que ni tapa
 * texto.
 */
export const ETAPA_ABRIR = 0.8;

/** Escala con la que arrancan dentro de la bolsa (todavia ocultos). */
export const ESCALA_INICIAL = 0.32;

/**
 * La coreografia termina antes de que el sticky se despegue, para que la
 * composicion final se sostenga un momento en pantalla.
 */
export const FIN_COREOGRAFIA = 0.78;

/**
 * Protagonista: Soft Pinch Liquid Blush (Rare Beauty). Es el producto mas
 * reconocible del catalogo y su silueta (frasco + tapa esferica dorada) es la
 * que mejor lee como "campana". Sale primero, queda mas grande y mas cerca.
 *
 * El resto acompana alternando claro/oscuro para equilibrar la composicion:
 * el bronzer oscuro hace de contrapeso del blush, y el highlighter claro y el
 * lip tint cierran la diagonal.
 */
export const PRODUCTOS: HeroProducto[] = [
  {
    slug: "soft-pinch-blush",
    nombre: "Soft Pinch Liquid Blush",
    marca: "Rare Beauty",
    ancho: 159,
    alto: 520,
    desde: 0.3,
    hasta: 0.6,
    arco: 5,
    profundidad: 0,
    flotar: { dur: 6.4, retraso: 0, amplitud: 7 },
    fin: { x: 71, y: 44, escala: 1.25, giro: 5, giroY: -7 },
    finMobile: { x: 73, y: 44, escala: 1.05, giro: 6, giroY: 0 },
  },
  {
    slug: "pocket-bronze",
    nombre: "Pocket Bronze Cream Bronzer",
    marca: "rhode",
    ancho: 301,
    alto: 520,
    desde: 0.35,
    hasta: 0.66,
    arco: -6,
    profundidad: 0.25,
    flotar: { dur: 7.6, retraso: 0.8, amplitud: 6 },
    fin: { x: 28, y: 42, escala: 0.92, giro: -6, giroY: 8 },
    finMobile: { x: 26, y: 42, escala: 0.82, giro: -7, giroY: 0 },
  },
  {
    slug: "highlight-milk",
    nombre: "Highlight Milk Multipurpose Luminizer",
    marca: "rhode",
    ancho: 259,
    alto: 520,
    desde: 0.4,
    hasta: 0.72,
    arco: -4,
    profundidad: 0.7,
    flotar: { dur: 5.9, retraso: 1.6, amplitud: 5 },
    fin: { x: 22, y: 67, escala: 0.74, giro: -9, giroY: 10 },
    finMobile: { x: 17, y: 63, escala: 0.64, giro: -9, giroY: 0 },
  },
  {
    slug: "peptide-lip-tint",
    nombre: "Peptide Lip Tint Nourishing Glaze",
    marca: "rhode",
    ancho: 125,
    alto: 520,
    desde: 0.44,
    hasta: FIN_COREOGRAFIA,
    arco: 5,
    profundidad: 0.35,
    flotar: { dur: 6.9, retraso: 2.3, amplitud: 6 },
    fin: { x: 78, y: 65, escala: 0.86, giro: 8, giroY: -8 },
    finMobile: { x: 84, y: 61, escala: 0.76, giro: 8, giroY: 0 },
  },
];

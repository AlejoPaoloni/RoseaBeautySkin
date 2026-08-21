"use client";

import { cubicBezier, motion, useTransform, type MotionValue } from "framer-motion";
import {
  ALTURA_ESCAPE,
  ALTURA_ESCAPE_MOBILE,
  ESCALA_INICIAL,
  ETAPA_ABRIR,
  ETAPA_ESCAPE,
  SALIDA,
  SALIDA_MOBILE,
  type HeroProducto,
} from "./datos";

// Salida rapida y frenada larga: da sensacion de masa, no de interpolacion.
const IMPULSO = cubicBezier(0.16, 0.9, 0.3, 1);
const LATERAL = cubicBezier(0.42, 0, 0.25, 1);
// Se pasa apenas del destino y vuelve: la inercia que evita el freno mecanico.
const ASENTAR = cubicBezier(0.34, 1.42, 0.64, 1);

interface Props {
  producto: HeroProducto;
  /** Progreso del scroll del hero, 0-1. */
  avance: MotionValue<number>;
  esMobile: boolean;
  reducido: boolean;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

export default function ProductoFlotante({
  producto,
  avance,
  esMobile,
  reducido,
  parallaxX,
  parallaxY,
}: Props) {
  const { fin, finMobile, profundidad, arco, flotar } = producto;
  const pose = esMobile ? finMobile : fin;
  const salida = esMobile ? SALIDA_MOBILE : SALIDA;
  const alturaEscape = esMobile ? ALTURA_ESCAPE_MOBILE : ALTURA_ESCAPE;

  // Deltas desde la boca de la bolsa hasta la posicion final. Como las
  // posiciones son % del escenario (que mide 100vw x 100svh), los deltas se
  // expresan en vw/svh y siguen siendo correctos en cualquier pantalla.
  const dx = salida.x - pose.x;
  const dy = salida.y - pose.y;
  // Offset (en el mismo sistema que dy) que ubica al producto a la altura de
  // escape, todavia centrado. Puede ser mayor o menor que dy: si la pose
  // final queda por debajo de esa altura (como highlight-milk/peptide-lip-
  // tint), el producto sigue de largo hacia arriba y despues *baja* a su
  // lugar -un arco, no un frenazo-, en vez de abrirse hacia el costado
  // mientras todavia esta a la altura del fuelle.
  const dyEscape = alturaEscape - pose.y;

  const t = useTransform(avance, [producto.desde, producto.hasta], [0, 1]);

  // Dos etapas sincronizadas entre X e Y, no independientes: primero sube
  // recto y centrado hasta despejar la boca (X casi no se mueve mientras Y
  // hace todo el trabajo), y solo despues se abre hacia el costado y asienta.
  // Si X e Y avanzaran cada uno por su cuenta, un producto con poco recorrido
  // vertical (llega mas abajo, como highlight-milk) alcanza su X final antes
  // de despegar del alto del fuelle, y se ve salir por el costado de la
  // bolsa en vez de por la boca.
  //
  // Entre ETAPA_ESCAPE y ETAPA_ABRIR el X sigue retenido (casi centrado):
  // es lo que hace que la salida se lea "sube y despues se abre" en vez de
  // "se abre mientras sube" (mas apurado/desordenado). Ver el comentario en
  // ETAPA_ABRIR (datos.ts) sobre por que se mantiene ese retenido largo.
  const x = useTransform(
    t,
    [0, ETAPA_ESCAPE, ETAPA_ABRIR, 1],
    [`${dx}vw`, `${dx * 0.92}vw`, `${arco}vw`, "0vw"],
    { ease: [LATERAL, LATERAL, ASENTAR] }
  );
  const y = useTransform(
    t,
    [0, ETAPA_ESCAPE, 1],
    [`${dy}svh`, `${dyEscape}svh`, "0svh"],
    { ease: [IMPULSO, ASENTAR] }
  );
  const scale = useTransform(t, [0, 1], [ESCALA_INICIAL, pose.escala], {
    ease: ASENTAR,
  });
  const rotate = useTransform(t, [0, 1], [-pose.giro * 0.35, pose.giro], {
    ease: ASENTAR,
  });
  const rotateY = useTransform(t, [0, 1], [pose.giroY * 2.5, pose.giroY], {
    ease: IMPULSO,
  });
  // Red de seguridad: aunque la cara de la bolsa ya los tapa, no aparecen
  // hasta haber arrancado.
  const opacidadSalida = useTransform(t, [0, 0.12], [0, 1]);

  const intensidad = 1 - profundidad * 0.55;
  const px = useTransform(parallaxX, (v) => v * intensidad);
  const py = useTransform(parallaxY, (v) => v * intensidad);

  // Desenfoque casi homeopatico: apenas despega el fondo del frente. Con mas
  // que esto los productos leen fuera de foco y baratos, no lejanos. En mobile
  // ni eso: es caro y ahi la profundidad ya la da la escala.
  const desenfoque = !esMobile && profundidad > 0.5 ? "blur(0.6px) " : "";
  // Luz desde arriba-izquierda, igual para todos, en tono de marca.
  const sombra = esMobile
    ? "drop-shadow(4px 7px 8px rgba(143, 90, 82, 0.24))"
    : "drop-shadow(9px 15px 18px rgba(143, 90, 82, 0.28))";

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${pose.x}%`,
        top: `${pose.y}%`,
        x: px,
        y: py,
        opacity: 1 - profundidad * 0.12,
      }}
    >
      <motion.div
        style={{
          x,
          y,
          scale,
          rotate,
          rotateY,
          opacity: opacidadSalida,
          transformOrigin: "0 0",
        }}
      >
        <motion.div
          style={{ transformOrigin: "0 0" }}
          animate={
            reducido
              ? undefined
              : { y: [0, -flotar.amplitud, 0], rotate: [0, 1.1, 0] }
          }
          transition={
            reducido
              ? undefined
              : {
                  duration: flotar.dur,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: flotar.retraso,
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/hero/${producto.slug}.webp`}
            alt=""
            width={producto.ancho}
            height={producto.alto}
            decoding="async"
            className="block max-w-none -translate-x-1/2 -translate-y-1/2"
            style={{
              height: "var(--alto-producto)",
              width: "auto",
              filter: `${desenfoque}${sombra}`,
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

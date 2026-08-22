"use client";

import { useCallback, useRef, useSyncExternalStore, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { config } from "@/lib/config";
import { BolsaAdelante, BolsaAtras } from "./hero/Bolsa";
import ProductoFlotante from "./hero/ProductoFlotante";
import { PRODUCTOS } from "./hero/datos";

/**
 * Media query sin romper la hidratacion: el servidor siempre ve `false` y
 * React se encarga de re-renderizar con el valor real apenas hidrata, sin
 * dejar atributos sin parchear ni encadenar renders desde un efecto.
 */
function useMediaQuery(consulta: string) {
  const suscribir = useCallback(
    (avisar: () => void) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    [consulta]
  );
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(consulta).matches,
    () => false
  );
}

/**
 * Las dos mitades de la bolsa comparten posicion y transform para quedar
 * pegadas al pixel; entre medio se cuelan los productos.
 */
function CapaBolsa({
  z,
  escala,
  y,
  x,
  children,
}: {
  z: string;
  escala: MotionValue<number>;
  y: MotionValue<string>;
  x: MotionValue<number>;
  children: ReactNode;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${z}`}>
      <div className="absolute bottom-[5%] left-1/2 aspect-[320/400] h-[clamp(205px,38svh,300px)] -translate-x-1/2 md:h-[clamp(260px,50svh,430px)]">
        <motion.div
          className="relative h-full w-full"
          style={{ scale: escala, y, x, transformOrigin: "50% 100%" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function Hero() {
  const referencia = useRef<HTMLElement>(null);
  // Mobile no escala la composicion de desktop: tiene su propio armado.
  const esMobile = useMediaQuery("(max-width: 767px)");
  // El parallax de mouse solo tiene sentido con puntero fino.
  const punteroFino = useMediaQuery("(pointer: fine)");
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { scrollYProgress } = useScroll({
    target: referencia,
    offset: ["start start", "end end"],
  });

  // Con movimiento reducido no hay coreografia: se muestra directo la
  // composicion final y el hero vuelve a medir una pantalla.
  const finFijo = useMotionValue(1);
  const avance = reducido ? finFijo : scrollYProgress;

  const punteroX = useMotionValue(0);
  const punteroY = useMotionValue(0);
  const resorte = { stiffness: 55, damping: 18, mass: 0.7 };
  const parallaxX = useSpring(punteroX, resorte);
  const parallaxY = useSpring(punteroY, resorte);

  const parallaxBolsaX = useTransform(parallaxX, (v) => v * 0.45);
  const parallaxFondoX = useTransform(parallaxX, (v) => v * 0.18);

  function moverPuntero(e: React.PointerEvent<HTMLDivElement>) {
    if (!punteroFino || reducido) return;
    const caja = e.currentTarget.getBoundingClientRect();
    punteroX.set(((e.clientX - caja.left) / caja.width - 0.5) * 26);
    punteroY.set(((e.clientY - caja.top) / caja.height - 0.5) * 16);
  }

  // 0-18%: quieto. 18-35%: se acerca y el texto cede protagonismo sin irse.
  // 80-95%: el texto vuelve a integrarse en la composicion final.
  const opacidadTexto = useTransform(
    avance,
    [0, 0.18, 0.35, 0.8, 0.95],
    [1, 1, 0.8, 0.8, 1]
  );
  const yTexto = useTransform(avance, [0, 0.18, 0.4], ["0svh", "0svh", "-1.5svh"]);
  const escalaBolsa = useTransform(avance, [0, 0.18, 0.35], [1, 1, 1.05]);
  const yBolsa = useTransform(avance, [0, 0.18, 0.35], ["0svh", "0svh", "-1.5svh"]);
  const opacidadFlecha = useTransform(avance, [0.03, 0.16], [1, 0]);

  return (
    /*
      El alto se decide en CSS y no con `reducido`: si dependiera del hook, el
      HTML del servidor y el del cliente no coincidirian y React no parchea ese
      atributo al hidratar. Sin coreografia no hace falta recorrido, asi que el
      hero vuelve a medir una sola pantalla.

      Mobile mide bastante menos que desktop (160svh vs 230svh): en celular se
      scrollea con flicks cortos, no con un gesto continuo. Con 210svh (mas de
      2 pantallas solo para el hero) alcanza con que la inercia de un flick se
      frene a mitad de la coreografia -algo comun, el scroll "para" solo- para
      que quede una composicion a medio resolver que se ve rota, aunque el
      usuario sienta que ya termino de scrollear. Acortar el recorrido baja
      las chances de que eso pase.
    */
    <section
      id="inicio"
      ref={referencia}
      className="relative h-[160svh] bg-white motion-reduce:h-svh md:h-[230svh] md:motion-reduce:h-svh"
    >
      <div
        onPointerMove={moverPuntero}
        className="sticky top-0 h-svh overflow-hidden [--alto-producto:clamp(120px,19svh,180px)] md:[--alto-producto:clamp(165px,24svh,260px)]"
      >
        {/* Escenario: degradado de marca + luz difusa de estudio, todo con
            gradientes CSS (nada de blur, que en mobile cuesta caro). */}
        <div className="absolute inset-0 bg-gradient-to-b from-rosea-100 via-rosea-50 to-white" />
        <motion.div
          className="absolute inset-0"
          style={{
            x: parallaxFondoX,
            background:
              "radial-gradient(58% 42% at 50% 58%, rgba(255,255,255,0.9), rgba(255,255,255,0) 72%)",
          }}
        />
        {/* Superficie donde apoya la bolsa. Va tenida en calido, no en blanco
            puro: si no, el papel blanco de la bolsa se funde con el piso y
            pierde el apoyo. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38%]"
          style={{
            background:
              "linear-gradient(to top, #ffffff 0%, rgba(250,241,239,0.95) 26%, rgba(250,241,239,0) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, rgba(255,255,255,0) 55%, rgba(189,124,114,0.10) 100%)",
          }}
        />

        {/* Composicion. Para lectores de pantalla es una sola imagen descrita,
            no cuatro archivos sueltos. */}
        <div
          role="img"
          aria-label={`Bolsa de ${config.marca} con productos destacados del catálogo flotando alrededor`}
          className="absolute inset-0"
        >
          <CapaBolsa z="z-10" escala={escalaBolsa} y={yBolsa} x={parallaxBolsaX}>
            <BolsaAtras className="absolute inset-0 h-full w-full" />
          </CapaBolsa>

          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{ perspective: 1000 }}
          >
            {PRODUCTOS.map((producto) => (
              <ProductoFlotante
                key={producto.slug}
                producto={producto}
                avance={avance}
                esMobile={esMobile}
                reducido={reducido}
                parallaxX={parallaxX}
                parallaxY={parallaxY}
              />
            ))}
          </div>

          <CapaBolsa z="z-30" escala={escalaBolsa} y={yBolsa} x={parallaxBolsaX}>
            <BolsaAdelante className="absolute inset-0 h-full w-full" />
          </CapaBolsa>
        </div>

        {/* Contenido: primero en foco y por encima de todo, la animacion nunca
            se le pone adelante. */}
        <motion.div
          style={{ opacity: opacidadTexto, y: yTexto }}
          className="absolute inset-x-0 top-[11svh] z-40 flex flex-col items-center px-6 text-center md:top-[12svh]"
        >
          <h1>
            <Image
              src="/brand/caligrafia.svg"
              alt={config.marca}
              width={640}
              height={205}
              priority
              className="w-[min(74vw,460px)]"
            />
          </h1>
          <p className="mt-5 font-serif text-lg tracking-wide text-rosea-700 md:text-2xl">
            {config.tagline}
          </p>
        </motion.div>

        <motion.a
          href="#como-comprar"
          aria-label="Ir a cómo comprar"
          style={{ opacity: opacidadFlecha }}
          className="absolute bottom-7 left-1/2 z-40 -translate-x-1/2 text-rosea-500"
        >
          <motion.svg
            animate={reducido ? undefined : { y: [0, 8, 0] }}
            transition={reducido ? undefined : { repeat: Infinity, duration: 1.8 }}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </motion.a>

        {/* Cierre hacia la seccion siguiente: el escenario termina en blanco
            para que no haya corte con "Cómo comprar". */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] h-[6%] bg-gradient-to-b from-transparent to-white" />
      </div>
    </section>
  );
}

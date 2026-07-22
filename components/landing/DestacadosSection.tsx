"use client";

import type { Producto } from "@/lib/types";
import { productosDestacados } from "@/lib/catalog";
import ProductCard from "./ProductCard";

// Repite la lista hasta alcanzar el minimo de cards para que una copia
// de la pista cubra el viewport mas ancho (~1536px / 240px por card).
const MIN_CARDS_POR_COPIA = 7;

function repetirHasta(items: Producto[], minimo: number): Producto[] {
  const resultado: Producto[] = [];
  while (resultado.length < minimo) resultado.push(...items);
  return resultado;
}

export default function DestacadosSection({
  productos,
}: {
  productos: Producto[];
}) {
  const items = productosDestacados(productos);
  if (items.length === 0) return null;

  const base = repetirHasta(items, MIN_CARDS_POR_COPIA);
  // Duracion proporcional a la cantidad para velocidad constante y lenta.
  const duracion = Math.max(20, base.length * 6);
  // Pista = dos copias de base: la animacion traslada -50% y el loop cierra
  // exacto porque el espaciado va por item (pr-4), no como gap de la pista.
  const pista = [...base, ...base];

  return (
    <section id="destacados" className="py-16">
      <h2 className="text-center font-serif text-4xl text-rosea-700 md:text-5xl">
        Productos Destacados
      </h2>
      <div className="group mt-10 overflow-hidden motion-reduce:overflow-x-auto">
        <div
          className="animate-marquee flex w-max group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duracion}s` }}
        >
          {pista.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className={`w-60 shrink-0 pr-4 ${
                i >= items.length ? "motion-reduce:hidden" : ""
              }`}
              aria-hidden={i >= items.length}
            >
              <ProductCard producto={p} estatico />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import type { Producto } from "@/lib/types";
import { productosDestacados } from "@/lib/catalog";
import ProductCard from "./ProductCard";

export default function DestacadosSection({
  productos,
}: {
  productos: Producto[];
}) {
  const items = productosDestacados(productos);
  if (items.length === 0) return null;

  // Duracion proporcional a la cantidad para velocidad constante y lenta.
  const duracion = Math.max(20, items.length * 6);
  // Lista duplicada: la animacion translada -50% y el loop queda sin salto.
  const pista = [...items, ...items];

  return (
    <section id="destacados" className="py-16">
      <h2 className="text-center font-serif text-4xl text-rosea-700 md:text-5xl">
        Productos Destacados
      </h2>
      <div className="group mt-10 overflow-hidden motion-reduce:overflow-x-auto">
        <div
          className="animate-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duracion}s` }}
        >
          {pista.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="w-56 shrink-0"
              aria-hidden={i >= items.length}
            >
              <ProductCard producto={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

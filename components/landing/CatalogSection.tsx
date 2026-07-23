"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Categoria, Producto } from "@/lib/types";
import { filtrarProductos } from "@/lib/catalog";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";

export default function CatalogSection({
  productos,
}: {
  productos: Producto[];
}) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(null);
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  // La Navbar emite este evento al clickear Maquillajes/Skincare
  useEffect(() => {
    function onSetFilter(e: Event) {
      const detail = (e as CustomEvent).detail as {
        categoria: Categoria | null;
      };
      setCategoria(detail.categoria);
      setSubcategoria(null);
    }
    window.addEventListener("rosea:set-filter", onSetFilter);
    return () => window.removeEventListener("rosea:set-filter", onSetFilter);
  }, []);

  const visibles = filtrarProductos(
    productos,
    categoria,
    subcategoria,
    soloDisponibles
  );

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center font-serif text-4xl text-rosea-700 md:text-5xl"
      >
        Catálogo
      </motion.h2>

      <FilterBar
        categoria={categoria}
        subcategoria={subcategoria}
        soloDisponibles={soloDisponibles}
        onCategoria={(c) => {
          setCategoria(c);
          setSubcategoria(null);
        }}
        onSubcategoria={setSubcategoria}
        onSoloDisponibles={setSoloDisponibles}
      />

      <motion.div
        layout
        className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {visibles.map((p, i) => (
            <ProductCard key={p.id} producto={p} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {visibles.length === 0 && (
        <p className="mt-10 text-center text-neutral-400">
          No hay productos en esta categoría todavía.
        </p>
      )}
    </section>
  );
}

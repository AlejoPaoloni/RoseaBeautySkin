"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Categoria, Producto } from "@/lib/types";
import { filtrarProductos, rangoPrecios } from "@/lib/catalog";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";

export default function CatalogSection({
  productos,
  huboError = false,
}: {
  productos: Producto[];
  // true si la carga desde Supabase fallo: el mensaje de "sin resultados"
  // no debe confundirse con "estos filtros no matchean nada".
  huboError?: boolean;
}) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(null);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  // Los extremos de la barra salen del catalogo, que no cambia en runtime.
  const { piso, tope } = rangoPrecios(productos);
  const [precioMin, setPrecioMin] = useState(piso);
  const [precioMax, setPrecioMax] = useState(tope);

  // Sincronizar extremos si el catálogo cambia (ej: se agregan productos)
  useEffect(() => {
    setPrecioMin(piso);
    setPrecioMax(tope);
  }, [piso, tope]);

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

  function limpiarFiltros() {
    setCategoria(null);
    setSubcategoria(null);
    setSoloDisponibles(false);
    setBusqueda("");
    setPrecioMin(piso);
    setPrecioMax(tope);
  }

  const visibles = filtrarProductos(
    productos,
    categoria,
    subcategoria,
    soloDisponibles,
    busqueda,
    precioMin,
    precioMax
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
        busqueda={busqueda}
        precioMin={precioMin}
        precioMax={precioMax}
        precioPiso={piso}
        precioTope={tope}
        onBusqueda={setBusqueda}
        onPrecio={(min, max) => {
          setPrecioMin(min);
          setPrecioMax(max);
        }}
        onLimpiar={limpiarFiltros}
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

      {visibles.length === 0 && huboError && (
        <p className="mt-10 text-center text-neutral-500">
          No pudimos cargar el catálogo en este momento. Volvé a intentar en
          unos minutos.
        </p>
      )}
      {visibles.length === 0 && !huboError && (
        <p className="mt-10 text-center text-neutral-500">
          No encontramos productos con estos filtros. Probá ajustar la búsqueda,
          el precio o la categoría.
        </p>
      )}
    </section>
  );
}

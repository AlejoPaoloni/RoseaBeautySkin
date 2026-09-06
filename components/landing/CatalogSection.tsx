"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Categoria, Producto } from "@/lib/types";
import { filtrarProductos, ordenarParaCatalogo, rangoPrecios } from "@/lib/catalog";
import {
  guardarFiltrosCatalogo,
  leerVueltaAlCatalogo,
  olvidarVuelta,
} from "@/lib/catalogoEstado";
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
  // Ajustar estado durante el render en vez de en un efecto (patron oficial
  // de React para "resetear estado cuando cambia una prop"): evita el
  // render de mas que un efecto siempre agrega, y saca el error de lint
  // react-hooks/set-state-in-effect. Un ref no sirve aca: React prohibe
  // mutar refs durante el render (react-hooks/refs), asi que el "previo"
  // se guarda en estado, igual que precioMin/precioMax.
  const [rangoPrevio, setRangoPrevio] = useState({ piso, tope });
  if (rangoPrevio.piso !== piso || rangoPrevio.tope !== tope) {
    setRangoPrevio({ piso, tope });
    setPrecioMin(piso);
    setPrecioMax(tope);
  }

  // Volver del detalle de un producto tiene que devolver el catalogo tal
  // como estaba: mismos filtros y misma altura. Va en un efecto (y no en el
  // estado inicial) porque sessionStorage no existe en el server y leerlo
  // durante el render romperia la hidratacion.
  const yaRestauro = useRef(false);
  useEffect(() => {
    const vuelta = leerVueltaAlCatalogo();
    if (!vuelta) {
      yaRestauro.current = true;
      return;
    }
    // Los setState van dentro del frame siguiente y no en el cuerpo del
    // efecto: asi lo pide react-hooks/set-state-in-effect, la misma regla
    // que ya obligo a mover el reseteo del rango de precios al render.
    const frame = requestAnimationFrame(() => {
      olvidarVuelta();
      const f = vuelta.filtros;
      if (f) {
        setCategoria(f.categoria);
        setSubcategoria(f.subcategoria);
        setSoloDisponibles(f.soloDisponibles);
        setBusqueda(f.busqueda);
        setPrecioMin(f.precioMin);
        setPrecioMax(f.precioMax);
      }
      // Recien ahora se habilita el guardado: si se habilitara antes, este
      // mismo montaje pisaria los filtros guardados con los vacios que
      // tiene el primer render (y el doble montaje de StrictMode se llevaba
      // puesta la restauracion entera).
      yaRestauro.current = true;
      // Otro frame mas: el scroll recien tiene sentido cuando la grilla ya
      // se pinto con los filtros repuestos y volvio a su altura de antes.
      requestAnimationFrame(() =>
        window.scrollTo({ top: vuelta.scrollY, behavior: "instant" })
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Lo que se guarda es lo que se repone al volver.
  useEffect(() => {
    if (!yaRestauro.current) return;
    guardarFiltrosCatalogo({
      categoria,
      subcategoria,
      soloDisponibles,
      busqueda,
      precioMin,
      precioMax,
    });
  }, [categoria, subcategoria, soloDisponibles, busqueda, precioMin, precioMax]);

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

  const visibles = ordenarParaCatalogo(
    filtrarProductos(
      productos,
      categoria,
      subcategoria,
      soloDisponibles,
      busqueda,
      precioMin,
      precioMax
    )
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

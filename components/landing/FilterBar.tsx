"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Categoria } from "@/lib/types";
import { SUBCATEGORIAS } from "@/lib/types";
import { PASO_PRECIO } from "@/lib/catalog";
import PriceRange from "@/components/common/PriceRange";

interface Props {
  categoria: Categoria | null;
  subcategoria: string | null;
  soloDisponibles: boolean;
  busqueda: string;
  precioMin: number;
  precioMax: number;
  precioPiso: number;
  precioTope: number;
  onCategoria: (c: Categoria | null) => void;
  onSubcategoria: (s: string | null) => void;
  onSoloDisponibles: (v: boolean) => void;
  onBusqueda: (v: string) => void;
  onPrecio: (min: number, max: number) => void;
  onLimpiar: () => void;
}

const OPCIONES: (Categoria | null)[] = [null, "Maquillajes", "Skincare"];

const ETIQUETAS: Record<string, string> = {
  Skincare: "Skin Care",
};

export default function FilterBar({
  categoria,
  subcategoria,
  soloDisponibles,
  busqueda,
  precioMin,
  precioMax,
  precioPiso,
  precioTope,
  onCategoria,
  onSubcategoria,
  onSoloDisponibles,
  onBusqueda,
  onPrecio,
  onLimpiar,
}: Props) {
  const hayFiltrosActivos =
    categoria !== null ||
    subcategoria !== null ||
    busqueda !== "" ||
    soloDisponibles ||
    precioMin !== precioPiso ||
    precioMax !== precioTope;

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {OPCIONES.map((c) => {
          const activo = categoria === c;
          return (
            <button
              key={c ?? "todos"}
              onClick={() => onCategoria(c)}
              className={`rounded-full px-5 py-2 text-sm tracking-wide transition-colors ${
                activo
                  ? "bg-rosea-400 text-white"
                  : "bg-rosea-50 text-neutral-600 hover:bg-rosea-100"
              }`}
            >
              {c ? (ETIQUETAS[c] ?? c) : "Todos"}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {categoria && SUBCATEGORIAS[categoria].length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {SUBCATEGORIAS[categoria].map((s) => {
              const activo = subcategoria === s;
              return (
                <button
                  key={s}
                  onClick={() => onSubcategoria(activo ? null : s)}
                  className={`rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors ${
                    activo
                      ? "bg-rosea-400 text-white"
                      : "bg-white text-neutral-500 ring-1 ring-rosea-200 hover:bg-rosea-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => onBusqueda(e.target.value)}
        placeholder="Buscar por nombre o marca..."
        aria-label="Buscar productos por nombre o marca"
        className="w-full max-w-xs rounded-full bg-white px-5 py-2 text-sm text-neutral-600 ring-1 ring-rosea-200 transition-shadow placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-rosea-400 sm:max-w-sm"
      />

      <PriceRange
        min={precioMin}
        max={precioMax}
        piso={precioPiso}
        tope={precioTope}
        paso={PASO_PRECIO}
        onChange={onPrecio}
      />

      <button
        onClick={() => onSoloDisponibles(!soloDisponibles)}
        aria-pressed={soloDisponibles}
        className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm tracking-wide transition-colors ${
          soloDisponibles
            ? "bg-emerald-500 text-white"
            : "bg-rosea-50 text-neutral-600 hover:bg-rosea-100"
        }`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            soloDisponibles ? "bg-white" : "bg-emerald-500"
          }`}
        />
        Solo disponibles
      </button>

      <AnimatePresence>
        {hayFiltrosActivos && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            onClick={onLimpiar}
            className="text-xs font-medium text-rosea-500 underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

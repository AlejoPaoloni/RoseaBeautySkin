"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Categoria } from "@/lib/types";
import { SUBCATEGORIAS } from "@/lib/types";

interface Props {
  categoria: Categoria | null;
  subcategoria: string | null;
  onCategoria: (c: Categoria | null) => void;
  onSubcategoria: (s: string | null) => void;
}

const OPCIONES: (Categoria | null)[] = [null, "Maquillajes", "Skincare"];

export default function FilterBar({
  categoria,
  subcategoria,
  onCategoria,
  onSubcategoria,
}: Props) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
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
              {c ?? "Todos"}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {categoria && (
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
    </div>
  );
}

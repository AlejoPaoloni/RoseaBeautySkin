"use client";

import Image from "next/image";
import type { Estado, Producto } from "@/lib/types";
import { ESTADOS } from "@/lib/types";

interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
  onDestacado: () => void;
  dragHandle?: React.ReactNode;
}

export default function ProductRow({
  producto,
  onEstado,
  onEditar,
  onBorrar,
  onDestacado,
  dragHandle,
}: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-rosea-100/60">
      {dragHandle}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-rosea-50">
        {producto.imagen_url && (
          <Image
            src={producto.imagen_url}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onDestacado}
        aria-label={
          producto.destacado
            ? "Quitar de destacados"
            : "Marcar como destacado"
        }
        className={`px-1 text-lg leading-none transition-colors ${
          producto.destacado
            ? "text-amber-400 hover:text-amber-500"
            : "text-neutral-300 hover:text-amber-400"
        }`}
      >
        ★
      </button>
      <span className="flex-1 truncate text-sm">{producto.nombre}</span>
      <select
        value={producto.estado}
        onChange={(e) => onEstado(e.target.value as Estado)}
        className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
      >
        {ESTADOS.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <button
        onClick={onEditar}
        className="px-2 text-xs text-rosea-500 hover:underline"
      >
        Editar
      </button>
      <button
        onClick={onBorrar}
        className="px-2 text-xs text-red-400 hover:underline"
      >
        Eliminar
      </button>
    </div>
  );
}

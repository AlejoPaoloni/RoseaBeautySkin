"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Estado, Producto } from "@/lib/types";
import ProductRow from "./ProductRow";

interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
  onDestacado: () => void;
}

export default function SortableRow({ producto, ...acciones }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: producto.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60" : ""}
    >
      <ProductRow
        producto={producto}
        {...acciones}
        dragHandle={
          <button
            type="button"
            aria-label="Reordenar"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none px-1 text-neutral-300 hover:text-neutral-500"
          >
            ⠿
          </button>
        }
      />
    </div>
  );
}

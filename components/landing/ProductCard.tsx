"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { formatearPrecio } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

const BADGE: Record<Producto["estado"], string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "Por Encargo": "bg-amber-100 text-amber-800",
  "Sin stock": "bg-neutral-200 text-neutral-500",
};

export default function ProductCard({
  producto,
  index = 0,
}: {
  producto: Producto;
  index?: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        delay: (index % 4) * 0.06,
      }}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-rosea-100/60 transition-shadow hover:shadow-xl hover:shadow-rosea-200/40"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-rosea-50">
        {producto.imagen_url && (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              producto.estado === "Sin stock" ? "opacity-80 saturate-50" : ""
            }`}
          />
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${BADGE[producto.estado]}`}
        >
          {producto.estado}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-neutral-900">
          {producto.nombre}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          {producto.descripcion_corta}
        </p>
        <p className="mt-2 font-serif text-lg text-rosea-500">
          {formatearPrecio(producto.precio)}
        </p>
      </div>
    </motion.article>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { formatearPrecio } from "@/lib/catalog";
import type { Producto } from "@/lib/types";
import ColorSwatches from "@/components/common/ColorSwatches";

const BADGE: Record<Producto["estado"], string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "Por Encargo": "bg-amber-100 text-amber-800",
  "Sin stock": "bg-red-100 text-red-600",
};

export default function ProductCard({
  producto,
  index = 0,
  estatico = false,
}: {
  producto: Producto;
  index?: number;
  // true dentro del marquee: sin layout/exit animations (la pista ya se
  // mueve con CSS y las cards duplicadas no deben animar posicion).
  estatico?: boolean;
}) {
  return (
    <motion.article
      layout={!estatico}
      // En marquee (estatico) sin desplazamiento vertical: el contenedor
      // overflow-hidden recortaria la card mientras sube.
      initial={{ opacity: 0, y: estatico ? 0 : 24 }}
      whileInView={{
        opacity: producto.estado === "Sin stock" ? 0.75 : 1,
        y: 0,
      }}
      viewport={{ once: true, margin: "-40px" }}
      exit={estatico ? undefined : { opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        delay: (index % 4) * 0.06,
      }}
      className={`group flex h-full flex-col rounded-2xl bg-white shadow-sm ring-1 transition-shadow ${
        producto.estado === "Sin stock"
          ? "ring-neutral-200"
          : "ring-rosea-100/60 hover:shadow-xl hover:shadow-rosea-200/40"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-rosea-50">
        {producto.imagen_url && (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={producto.imagen_url.includes("sephora.com")}
            className={`object-cover transition-transform duration-500 ${
              estatico ? "" : "group-hover:scale-105"
            } ${producto.estado === "Sin stock" ? "grayscale-[75%]" : ""}`}
          />
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${BADGE[producto.estado]}`}
        >
          {producto.estado}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {producto.marca && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400 sm:text-xs">
            {producto.marca}
          </p>
        )}
        <h3 className="font-serif text-base text-neutral-900 sm:text-lg">
          {producto.nombre}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500 sm:text-sm">
          {producto.descripcion_corta}
        </p>
        {producto.tonos && producto.tonos.length > 0 && (
          <ColorSwatches tonos={producto.tonos} />
        )}
        <p className="mt-auto pt-2 font-serif text-xl font-semibold text-rosea-500 sm:text-2xl">
          {formatearPrecio(producto.precio)}
        </p>
      </div>
    </motion.article>
  );
}

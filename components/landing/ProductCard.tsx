"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { esProductoNuevo, formatearPrecio } from "@/lib/catalog";
import { instagramDmUrl } from "@/lib/config";
import { compartirProducto } from "@/lib/share";
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
  const [compartido, setCompartido] = useState(false);
  const [imagenCargada, setImagenCargada] = useState(false);

  async function onCompartir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await compartirProducto(producto);
    if (ok) {
      setCompartido(true);
      setTimeout(() => setCompartido(false), 1500);
    }
  }

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
          <>
            {!imagenCargada && (
              <div className="absolute inset-0 animate-pulse bg-rosea-100/60 motion-reduce:animate-none" />
            )}
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized={producto.imagen_url.includes("sephora.com")}
              onLoad={() => setImagenCargada(true)}
              className={`object-cover transition-[opacity,transform] duration-700 ease-out ${
                imagenCargada ? "opacity-100" : "opacity-0"
              } ${estatico ? "" : "group-hover:scale-[1.03]"} ${
                producto.estado === "Sin stock" ? "grayscale-[75%]" : ""
              }`}
            />
          </>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${BADGE[producto.estado]}`}
        >
          {producto.estado}
        </span>
        {esProductoNuevo(producto) && (
          <span className="absolute left-2 top-2 rounded-full bg-rosea-500 px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
            Nuevo
          </span>
        )}
        <button
          type="button"
          aria-label={`Compartir ${producto.nombre}`}
          onClick={onCompartir}
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-rosea-100/50 text-rosea-500 backdrop-blur-sm transition-colors hover:bg-rosea-100/75 sm:bottom-3 sm:right-3"
        >
          {compartido ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-[18px] sm:w-[18px]">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-[18px] sm:w-[18px]">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
              <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {producto.marca && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 sm:text-xs">
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
        <a
          href={instagramDmUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar por Instagram: ${producto.nombre}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-full bg-rosea-500 py-2 text-xs font-medium text-white transition-colors hover:bg-rosea-600 sm:text-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
          Consultar
        </a>
      </div>
    </motion.article>
  );
}

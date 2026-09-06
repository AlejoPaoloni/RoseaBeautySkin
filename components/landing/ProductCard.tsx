"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  esProductoNuevo,
  formatearPrecio,
  tienePrecioPublico,
} from "@/lib/catalog";
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
    // display:contents: el Link no debe sumar una caja propia al grid/flex
    // que arma la seccion — el item de layout sigue siendo el article de
    // adentro, igual que antes de que la card llevara a un detalle.
    <Link
      href={`/producto/${producto.id}`}
      className="contents"
      aria-label={`Ver detalle de ${producto.nombre}`}
    >
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
        className={`group flex h-full cursor-pointer flex-col rounded-2xl bg-white shadow-sm ring-1 transition-shadow ${
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
          {tienePrecioPublico(producto) ? (
            <p className="mt-auto pt-2 font-serif text-xl font-semibold text-rosea-500 sm:text-2xl">
              {formatearPrecio(producto.precio)}
            </p>
          ) : (
            <p className="mt-auto pt-2 font-serif text-lg text-rosea-500 sm:text-xl">
              Precio a consultar
            </p>
          )}
          {/* No es un <a>: toda la card ya es el Link al detalle, y un link
              adentro de otro link es HTML invalido. */}
          <span className="mt-3 flex items-center justify-center gap-2 rounded-full bg-rosea-500 py-2 text-xs font-medium text-white transition-colors group-hover:bg-rosea-600 sm:text-sm">
            Ver producto
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

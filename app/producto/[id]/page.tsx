import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  esProductoNuevo,
  formatearPrecio,
  imagenesProducto,
  tienePrecioPublico,
} from "@/lib/catalog";
import { config, instagramDmUrl } from "@/lib/config";
import { obtenerProductoPorId } from "@/lib/supabase/server";
import ColorSwatches from "@/components/common/ColorSwatches";
import Footer from "@/components/landing/Footer";
import InstagramButton from "@/components/landing/InstagramButton";
import ProductGallery from "@/components/landing/ProductGallery";

export const revalidate = 60;

const BADGE: Record<string, string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "Por Encargo": "bg-amber-100 text-amber-800",
  "Sin stock": "bg-red-100 text-red-600",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const producto = await obtenerProductoPorId(id);
  if (!producto) return {};
  const descripcion = producto.descripcion_corta ?? producto.descripcion_larga ?? config.tagline;
  return {
    title: `${producto.nombre} | ${config.marca}`,
    description: descripcion,
    alternates: { canonical: `/producto/${producto.id}` },
    openGraph: {
      title: producto.nombre,
      description: descripcion,
      images: producto.imagen_url ? [producto.imagen_url] : undefined,
    },
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { id } = await params;
  const producto = await obtenerProductoPorId(id);
  if (!producto) notFound();

  const imagenes = imagenesProducto(producto);
  const descripcion = producto.descripcion_larga || producto.descripcion_corta;

  return (
    <main>
      <header className="border-b border-rosea-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Inicio">
            <Image src="/brand/monogram.svg" alt="RB" width={44} height={33} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-rosea-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver al catálogo
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ProductGallery imagenes={imagenes} alt={producto.nombre} />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE[producto.estado]}`}
              >
                {producto.estado}
              </span>
              {esProductoNuevo(producto) && (
                <span className="rounded-full bg-rosea-500 px-3 py-1 text-xs font-medium text-white">
                  Nuevo
                </span>
              )}
            </div>

            {producto.marca && (
              <p className="mt-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
                {producto.marca}
              </p>
            )}
            <h1 className="mt-1 font-serif text-3xl text-neutral-900 md:text-4xl">
              {producto.nombre}
            </h1>

            {producto.tonos && producto.tonos.length > 0 && (
              <ColorSwatches tonos={producto.tonos} />
            )}

            {tienePrecioPublico(producto) ? (
              <p className="mt-4 font-serif text-3xl font-semibold text-rosea-500">
                {formatearPrecio(producto.precio)}
              </p>
            ) : (
              <p className="mt-4 font-serif text-2xl text-rosea-500">
                Precio a consultar
              </p>
            )}

            {descripcion && (
              <p className="mt-6 whitespace-pre-line leading-relaxed text-neutral-600">
                {descripcion}
              </p>
            )}

            <a
              href={instagramDmUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar por Instagram: ${producto.nombre}`}
              className="mt-8 flex items-center justify-center gap-2 rounded-full bg-rosea-500 py-3 text-sm font-medium text-white transition-colors hover:bg-rosea-600 md:max-w-xs"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
              Consultar
            </a>
          </div>
        </div>
      </div>

      <Footer />
      <InstagramButton />
    </main>
  );
}

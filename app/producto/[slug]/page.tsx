import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  esProductoNuevo,
  formatearPrecio,
  imagenesProducto,
  tienePrecioPublico,
} from "@/lib/catalog";
import { config } from "@/lib/config";
import { esUuid, rutaProducto } from "@/lib/slug";
import { obtenerProducto } from "@/lib/supabase/server";
import ColorSwatches from "@/components/common/ColorSwatches";
import ConsultarButton from "@/components/landing/ConsultarButton";
import Footer from "@/components/landing/Footer";
import ProductGallery from "@/components/landing/ProductGallery";
import ProductoJsonLd from "@/components/landing/ProductoJsonLd";
import ShareProductButton from "@/components/landing/ShareProductButton";
import VolverAlCatalogo from "@/components/landing/VolverAlCatalogo";

export const revalidate = 60;

const BADGE: Record<string, string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "Por Encargo": "bg-amber-100 text-amber-800",
  "Sin stock": "bg-red-100 text-red-600",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) return {};
  const descripcion = producto.descripcion_corta ?? producto.descripcion_larga ?? config.tagline;
  // El titulo lleva la marca del producto adelante: es como se busca
  // ("rhode pocket blush"), y en el resultado de Google se lee antes de que
  // lo corte el ancho.
  const titulo = producto.marca
    ? `${producto.marca} ${producto.nombre}`
    : producto.nombre;
  return {
    title: titulo,
    description: descripcion,
    keywords: [
      producto.nombre,
      ...(producto.marca ? [producto.marca] : []),
      ...(producto.tonos ?? []).map((t) => t.nombre),
      producto.categoria,
      producto.subcategoria,
      "importado",
      "Argentina",
    ],
    alternates: { canonical: rutaProducto(producto) },
    // Sin images aca: la vista previa la arma opengraph-image.tsx, que
    // devuelve PNG (las fotos del bucket son .webp y WhatsApp no las lee).
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
      url: rutaProducto(producto),
      siteName: config.marca,
      locale: "es_AR",
    },
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  const producto = await obtenerProducto(slug);
  if (!producto) notFound();

  // Link viejo (/producto/<uuid>, ya compartido por WhatsApp) -> 308 a la URL
  // con slug, para no quedar con dos URLs indexadas del mismo producto.
  if (esUuid(slug) && producto.slug) permanentRedirect(rutaProducto(producto));

  const imagenes = imagenesProducto(producto);
  const descripcion = producto.descripcion_larga || producto.descripcion_corta;

  return (
    // pb-24 en el celular: la barra fija de abajo no puede comerse el final
    // del footer cuando se llega abajo de todo.
    <main className="pb-24 md:pb-0">
      <ProductoJsonLd producto={producto} />
      <header className="border-b border-rosea-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Inicio" className="-m-2 p-2">
            <Image src="/brand/monogram.svg" alt="RB" width={44} height={33} />
          </Link>
          <VolverAlCatalogo />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-6 pt-6 md:pb-10 md:pt-10">
        <div className="grid gap-4 md:grid-cols-2 md:gap-12">
          {/* Los distintivos van sobre la foto igual que en las cards: en el
              celular cada linea de la columna cuenta para que la ficha entre
              en una pantalla. */}
          <div className="relative">
            <ProductGallery imagenes={imagenes} alt={producto.nombre} />
            <span
              className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${BADGE[producto.estado]}`}
            >
              {producto.estado}
            </span>
            {esProductoNuevo(producto) && (
              <span className="absolute left-3 top-3 rounded-full bg-rosea-500 px-3 py-1 text-xs font-medium text-white">
                Nuevo
              </span>
            )}
          </div>

          <div className="flex flex-col">
            {producto.marca && (
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                {producto.marca}
              </p>
            )}
            <h1 className="mt-1 font-serif text-3xl text-neutral-900 md:text-4xl">
              {producto.nombre}
            </h1>

            {producto.tonos && producto.tonos.length > 0 && (
              <ColorSwatches tonos={producto.tonos} grande />
            )}

            {tienePrecioPublico(producto) ? (
              <p className="mt-2 font-serif text-3xl font-semibold text-rosea-500 md:mt-4">
                {formatearPrecio(producto.precio)}
              </p>
            ) : (
              <p className="mt-2 font-serif text-2xl text-rosea-500 md:mt-4">
                Precio a consultar
              </p>
            )}

            {descripcion && (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-neutral-600 md:mt-6">
                {descripcion}
              </p>
            )}

            {/* En el celular los dos botones viven fijos abajo: la clienta
                los tiene siempre a mano sin scrollear hasta el final. En
                desktop vuelven a la columna, debajo de la descripcion. */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-rosea-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:static md:mt-8 md:block md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <ConsultarButton nombre={producto.nombre} />

            <ShareProductButton producto={producto} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

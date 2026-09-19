import type { MetadataRoute } from "next";
import { imagenesProducto } from "@/lib/catalog";
import { siteUrl } from "@/lib/config";
import { rutaProducto } from "@/lib/slug";
import { obtenerProductos } from "@/lib/supabase/server";

// El sitemap depende del catalogo: sin esto queda congelado con los
// productos que habia al momento del build.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { productos } = await obtenerProductos();
  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...productos.map((p) => ({
      url: `${siteUrl()}${rutaProducto(p)}`,
      // La fecha real de la fila, no new Date(): decirle a Google que los 38
      // productos cambiaron recien, en cada corrida, es ruido — deja de
      // confiar en el dato y lo ignora.
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      // Las fotos entran al sitemap de imagenes: para un catalogo de
      // maquillaje, Google Imagenes es una puerta de entrada real.
      images: imagenesProducto(p),
    })),
  ];
}

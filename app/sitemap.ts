import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { obtenerProductos } from "@/lib/supabase/server";

// El sitemap ahora depende del catalogo: sin esto queda congelado con
// los productos que habia al momento del build.
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
      url: `${siteUrl()}/producto/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

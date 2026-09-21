import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      // e.l.f. Cosmetics (elfcosmetics.com corre en Shopify)
      { protocol: "https", hostname: "cdn.shopify.com" },
      // excepcion puntual: Daily Dew Stick esta discontinuado en el sitio
      // oficial de e.l.f., imagen tomada de Amazon
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
    // Una foto de producto no cambia nunca despues de subida (nombre con
    // uuid, se borra la vieja al reemplazarla) — no hay motivo para que Next
    // la re-optimice cada 4hs (el default). 31 dias tira el trabajo repetido
    // a cero y es lo que Vercel factura como "Image Transformations": con el
    // plan gratis en 5000/mes, esto era la mayor parte del gasto.
    minimumCacheTTL: 2678400,
    // Los anchos reales que pide el sitio (ProductCard, ProductGallery) caen
    // en un rango chico. El default de Next trae 8 deviceSizes pensados para
    // cualquier sitio; acotarlo a los 4 que de verdad se usan corta a la
    // mitad las variantes posibles por foto.
    deviceSizes: [640, 828, 1080, 1920],
    // Los unicos usos fijos son la miniatura de la galeria (64px) y la fila
    // del admin (48px); 96/128 quedan de margen para el ojo de pez del hover.
    imageSizes: [48, 64, 96, 128],
  },
  async headers() {
    return [
      {
        // El dominio de Vercel sirve el mismo sitio que roseabeautyskin.com y
        // responde 200: sin esto Google puede indexar las dos copias y partir
        // la autoridad entre ambas. El canonical ya apunta al dominio real,
        // pero el noindex lo cierra del todo.
        source: "/:path*",
        has: [{ type: "host", value: "(.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

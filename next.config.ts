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

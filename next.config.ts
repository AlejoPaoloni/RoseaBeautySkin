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
};

export default nextConfig;

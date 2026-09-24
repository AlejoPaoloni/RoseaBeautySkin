import type { NextConfig } from "next";
import { remotePatterns } from "./lib/imagenes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigen = supabaseUrl ? new URL(supabaseUrl).origin : "";
const enDesarrollo = process.env.NODE_ENV === "development";

// Content-Security-Policy. No es la version mas estricta posible a proposito:
// Next inyecta scripts en linea para hidratar, y quitar 'unsafe-inline' exige
// nonces por request, o sea renderizar cada pagina en el servidor y perder el
// cache estatico del catalogo. Lo que si queda cerrado y es lo que mas rinde:
// nadie puede embeber el sitio en un iframe (clickjacking sobre el login),
// nada de plugins, el <base> y los formularios quedan atados al propio sitio,
// y el navegador solo habla con este sitio y con Supabase — si algo inyectara
// un script, no tiene adonde mandar los datos.
const csp = [
  "default-src 'self'",
  // En desarrollo Next necesita eval para el refresco en caliente.
  `script-src 'self' 'unsafe-inline'${enDesarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: para la vista previa de la foto que se esta subiendo en el admin.
  // cdn.shopify.com: el admin muestra con <img> la foto de e.l.f. cuando el
  // producto la usa (en el catalogo todo pasa por /_next/image, que es 'self').
  `img-src 'self' data: blob: ${supabaseOrigen} https://cdn.shopify.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigen}${enDesarrollo ? " ws://localhost:* http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(enDesarrollo ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Sin el header X-Powered-By: no hace falta contarle a nadie con que esta
  // hecho el sitio.
  poweredByHeader: false,
  images: {
    remotePatterns: remotePatterns(supabaseUrl),
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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Redundante con frame-ancestors, pero cubre navegadores viejos.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nada del sitio usa estas APIs; que queden apagadas.
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
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

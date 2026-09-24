// De donde puede venir una foto de producto. Una sola lista para los dos
// lugares que la necesitan: el optimizador de next/image (next.config.ts) y la
// ruta de la imagen OG, que baja la foto desde el servidor.
//
// Sin imports con alias ("@/...") a proposito: next.config.ts la carga por
// ruta relativa y ahi los alias no resuelven.
//
// Antes esto eran comodines (*.supabase.co, cdn.shopify.com entero): cualquier
// proyecto de Supabase o tienda de Shopify del mundo podia pasar por el
// optimizador de este sitio — gastando la cuota de transformaciones de Vercel
// y dandole a cualquiera un procesador de imagenes remoto de regalo. Ahora
// solo el bucket propio y la carpeta de e.l.f. en su Shopify.

type Origen = { hostname: string; prefijo: string };

const BUCKET = "/storage/v1/object/public/productos-img/";
// Tienda de e.l.f. Cosmetics (elfcosmetics.com corre en Shopify).
const ELF_SHOPIFY = "/s/files/1/0661/2251/4520/";

export function origenesDeImagen(supabaseUrl: string | undefined): Origen[] {
  const origenes: Origen[] = [
    { hostname: "cdn.shopify.com", prefijo: ELF_SHOPIFY },
  ];
  if (supabaseUrl) {
    origenes.push({ hostname: new URL(supabaseUrl).hostname, prefijo: BUCKET });
  }
  return origenes;
}

// Formato que pide images.remotePatterns.
export function remotePatterns(supabaseUrl: string | undefined) {
  return origenesDeImagen(supabaseUrl).map((o) => ({
    protocol: "https" as const,
    hostname: o.hostname,
    pathname: `${o.prefijo}**`,
  }));
}

// Para el fetch del servidor: la URL sale de la base de datos, asi que se
// valida contra la misma lista antes de pedirla.
export function imagenPermitida(
  url: string,
  supabaseUrl: string | undefined,
  sitio: string
): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.origin === new URL(sitio).origin) return true;
  if (u.protocol !== "https:") return false;
  return origenesDeImagen(supabaseUrl).some(
    (o) => u.hostname === o.hostname && u.pathname.startsWith(o.prefijo)
  );
}

export const config = {
  marca: "Rosea Beauty",
  tagline: "Tu rutina de belleza, nivel internacional",
  instagram: "https://instagram.com/roseabeautyskin",
  instagramUsuario: "roseabeautyskin",
  mensajeConsulta: "Hola, tengo una consulta",
  email: "roseabeautyskin@gmail.com",
  notaPorEncargo:
    "Encargá tus favoritos con un 50% de seña. Llegan con nuestro próximo pedido.",
};

// Sin la barra final: si SITE_URL se carga con "/" al final (fue el caso en
// Vercel), concatenar un path a mano duplicaba la barra — robots.txt
// terminaba apuntando al sitemap con "//sitemap.xml".
//
// Sin prefijo NEXT_PUBLIC_: es la URL publica del sitio (ya visible en el
// sitemap, robots.txt, canonical y el JSON-LD de cada pagina), pero no la
// necesita ningun componente cliente — todo lo que la usa corre en el
// servidor (robots.ts, sitemap.ts, layout.tsx, OrganizationJsonLd.tsx).
export function siteUrl(): string {
  const url = process.env.SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

// Abre el mensaje directo de Instagram (no solo el perfil).
export function instagramDmUrl(): string {
  return `https://ig.me/m/${config.instagramUsuario}`;
}

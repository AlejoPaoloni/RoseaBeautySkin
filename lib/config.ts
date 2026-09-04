export const config = {
  marca: "Rosea Beauty",
  tagline: "Tu rutina de belleza, nivel internacional",
  whatsapp: {
    // Codigo de pais + numero, sin "+" ni espacios. Ej: "5491112345678"
    numero: "",
    mensaje: "Hola, tengo una consulta",
  },
  instagram: "https://instagram.com/roseabeautyskin",
  instagramUsuario: "roseabeautyskin",
  mensajeConsulta: "Hola, tengo una consulta",
  email: "roseabeautyskin@gmail.com",
  notaPorEncargo:
    "Encargá tus favoritos con un 50% de seña. Llegan con nuestro próximo pedido.",
};

// Sin la barra final: si NEXT_PUBLIC_SITE_URL se carga con "/" al final (fue
// el caso en Vercel), concatenar un path a mano duplicaba la barra —
// robots.txt terminaba apuntando al sitemap con "//sitemap.xml".
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export function whatsappUrl(): string {
  const { numero, mensaje } = config.whatsapp;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

// Abre el mensaje directo de Instagram (no solo el perfil).
export function instagramDmUrl(): string {
  return `https://ig.me/m/${config.instagramUsuario}`;
}

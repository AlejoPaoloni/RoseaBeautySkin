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
  email: "contacto@roseabeauty.com",
  notaPorEncargo:
    "Los productos por encargo se piden al momento y llegan en 15 a 20 días.",
};

export function whatsappUrl(): string {
  const { numero, mensaje } = config.whatsapp;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

// Abre el mensaje directo de Instagram (no solo el perfil).
export function instagramDmUrl(): string {
  return `https://ig.me/m/${config.instagramUsuario}`;
}

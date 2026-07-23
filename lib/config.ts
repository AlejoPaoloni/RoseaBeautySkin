export const config = {
  marca: "Rosea Beauty",
  tagline: "Belleza importada, elegida para vos",
  whatsapp: {
    // Codigo de pais + numero, sin "+" ni espacios. Ej: "5491112345678"
    numero: "",
    mensaje: "Hola, tengo una consulta",
  },
  instagram: "https://instagram.com/roseabeautyskin",
  email: "contacto@roseabeauty.com",
  notaPorEncargo:
    "Los productos por encargo se piden al momento y llegan en 15 a 20 días.",
};

export function whatsappUrl(): string {
  const { numero, mensaje } = config.whatsapp;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

// JSON.stringify no escapa "<": un nombre o descripcion de producto con
// "</script>" cierra la etiqueta y lo que sigue se ejecuta como HTML en la
// pagina publica. Reemplazar "<" por su escape unicode lo evita sin cambiar el
// JSON que lee Google (es la receta de la guia de JSON-LD de Next).
export function jsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

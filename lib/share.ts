import { formatearPrecio, tienePrecioPublico } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

// Comparte un producto a cualquier red: en mobile con Web Share soportado
// abre el panel nativo (con imagen si se puede traer sin CORS, nombre y
// precio); si no hay Web Share (desktop / navegador viejo) copia el texto
// al portapapeles para que se pueda pegar donde sea.
// Devuelve true si se pudo compartir o copiar, false si el usuario cancelo.
export async function compartirProducto(producto: Producto): Promise<boolean> {
  // Un por encargo se comparte sin precio: se cotiza por consulta, mandar un
  // numero por WhatsApp seria contradecir a la card.
  const texto = tienePrecioPublico(producto)
    ? `${producto.nombre} - ${formatearPrecio(producto.precio)}`
    : `${producto.nombre} - precio a consultar`;
  const url = typeof window !== "undefined" ? window.location.href : "";

  if (typeof navigator !== "undefined" && navigator.share) {
    let files: File[] | undefined;
    try {
      if (producto.imagen_url && navigator.canShare) {
        const res = await fetch(producto.imagen_url);
        const blob = await res.blob();
        const nombreArchivo =
          producto.imagen_url.split("/").pop()?.split("?")[0] || "producto.jpg";
        const file = new File([blob], nombreArchivo, {
          type: blob.type || "image/jpeg",
        });
        if (navigator.canShare({ files: [file] })) files = [file];
      }
    } catch {
      // La imagen es de un CDN externo (Sephora): si el fetch falla por CORS
      // u otra razon, compartimos igual pero sin adjuntarla.
    }

    try {
      await navigator.share({
        title: producto.nombre,
        text: texto,
        url,
        ...(files ? { files } : {}),
      });
      return true;
    } catch {
      // Usuario cancelo el panel nativo.
      return false;
    }
  }

  try {
    await navigator.clipboard?.writeText(`${texto}\n${url}`);
    return true;
  } catch {
    return false;
  }
}

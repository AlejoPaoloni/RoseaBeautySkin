import { formatearPrecio, tienePrecioPublico } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

// Link directo al detalle del producto. Se arma con el id y no con la URL
// de la pagina actual para que nunca viaje con parametros pegados (?utm,
// ?_vercel_share) ni dependa de desde donde se comparta.
export function urlProducto(producto: Producto): string {
  const origen = typeof window !== "undefined" ? window.location.origin : "";
  return `${origen}/producto/${producto.id}`;
}

// Comparte el producto como LINK, no como foto adjunta: WhatsApp e Instagram
// arman solos la vista previa (foto, nombre y precio salen del Open Graph de
// la pagina del producto) y al tocarla la clienta cae en ese detalle. Mandar
// la imagen como archivo hacia justo lo contrario: llegaba una foto suelta y
// el link aparte, sin previa y sin nada en que tocar.
//
// En desktop, o en navegadores sin Web Share, copia el texto con el link al
// portapapeles. Devuelve true si se compartio o copio, false si se cancelo.
export async function compartirProducto(producto: Producto): Promise<boolean> {
  // Un por encargo se comparte sin precio: se cotiza por consulta, mandar un
  // numero por WhatsApp seria contradecir a la card.
  const texto = tienePrecioPublico(producto)
    ? `${producto.nombre} - ${formatearPrecio(producto.precio)}`
    : `${producto.nombre} - precio a consultar`;
  const url = urlProducto(producto);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: producto.nombre, text: texto, url });
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

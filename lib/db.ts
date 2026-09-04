import { createClient } from "@/lib/supabase/client";
import { ordenarProductos } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

type ProductoNuevo = Omit<Producto, "id" | "created_at">;

export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await createClient().from("productos").select("*");
  if (error) throw error;
  return ordenarProductos((data ?? []) as Producto[]);
}

export async function crearProducto(p: ProductoNuevo): Promise<void> {
  const { error } = await createClient().from("productos").insert(p);
  if (error) throw error;
}

export async function actualizarProducto(
  id: string,
  p: Partial<ProductoNuevo>
): Promise<void> {
  const { error } = await createClient()
    .from("productos")
    .update(p)
    .eq("id", id);
  if (error) throw error;
}

// Extrae el path dentro del bucket a partir de la URL publica que devuelve
// getPublicUrl. Si la imagen viene de otro origen (ej: hotlink externo
// mientras no hay foto propia todavia) no hay nada que borrar en el bucket.
function pathEnBucket(imagenUrl: string | null): string | null {
  const marcador = "/productos-img/";
  const i = imagenUrl?.indexOf(marcador) ?? -1;
  return i === -1 ? null : decodeURIComponent(imagenUrl!.slice(i + marcador.length));
}

// Borra del bucket la imagen anterior de un producto, si era propia. Se usa
// tanto al eliminar el producto como al reemplazarle la foto en Editar — ese
// segundo caso es el que mas basura deja: cada retoque de imagen suma un
// archivo huerfano si nadie borra el viejo.
// No se relanza: quien llama ya completo su operacion principal (borrar el
// producto, o subir la foto nueva), y esto es prolijeza de fondo — en el
// peor caso queda un archivo huerfano ocupando espacio, no algo roto.
async function eliminarImagenAnterior(imagenUrl: string | null): Promise<void> {
  const path = pathEnBucket(imagenUrl);
  if (!path) return;
  const { error } = await createClient().storage
    .from("productos-img")
    .remove([path]);
  if (error) console.error("No se pudo borrar la imagen del bucket:", error);
}

export async function eliminarProducto(
  id: string,
  imagenUrl: string | null
): Promise<void> {
  const { error } = await createClient()
    .from("productos")
    .delete()
    .eq("id", id);
  if (error) throw error;
  await eliminarImagenAnterior(imagenUrl);
}

// Sube la foto nueva y borra la anterior (si el producto ya tenia una propia
// en el bucket). Se sube primero para no quedarse sin ninguna imagen si el
// borrado fallara.
export async function reemplazarImagen(
  blob: Blob,
  nombre: string,
  imagenAnteriorUrl: string | null
): Promise<string> {
  const url = await subirImagen(blob, nombre);
  await eliminarImagenAnterior(imagenAnteriorUrl);
  return url;
}

export async function guardarOrden(
  items: { id: string; orden_display: number }[]
): Promise<void> {
  const supabase = createClient();
  const resultados = await Promise.all(
    items.map(({ id, orden_display }) =>
      supabase.from("productos").update({ orden_display }).eq("id", id)
    )
  );
  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) throw fallo.error;
}

export async function subirImagen(blob: Blob, nombre: string): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("productos-img")
    .upload(nombre, blob, { contentType: "image/webp" });
  if (error) throw error;
  return supabase.storage.from("productos-img").getPublicUrl(nombre).data
    .publicUrl;
}

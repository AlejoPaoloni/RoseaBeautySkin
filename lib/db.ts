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

export async function eliminarProducto(id: string): Promise<void> {
  const { error } = await createClient()
    .from("productos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function guardarOrden(
  items: { id: string; orden_display: number }[]
): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    items.map(({ id, orden_display }) =>
      supabase.from("productos").update({ orden_display }).eq("id", id)
    )
  );
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

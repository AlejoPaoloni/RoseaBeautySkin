import { createClient } from "@/lib/supabase/client";
import type {
  Clienta,
  Pedido,
  PedidoItem,
  Producto,
  Publicacion,
  Tarea,
} from "@/lib/types";

export type ClientaNueva = Omit<Clienta, "id" | "created_at">;
export type TareaNueva = Omit<Tarea, "id" | "created_at">;
export type PublicacionNueva = Omit<
  Publicacion,
  "id" | "created_at" | "productos"
>;
export type PedidoNuevo = Omit<Pedido, "id" | "created_at" | "items">;
export type PedidoItemNuevo = Omit<PedidoItem, "id" | "pedido_id">;

// --- Clientas ---

export async function listarClientas(): Promise<Clienta[]> {
  const { data, error } = await createClient()
    .from("clientas")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as Clienta[];
}

export async function crearClienta(c: ClientaNueva): Promise<string> {
  const { data, error } = await createClient()
    .from("clientas")
    .insert(c)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function actualizarClienta(
  id: string,
  c: Partial<ClientaNueva>
): Promise<void> {
  const { error } = await createClient()
    .from("clientas")
    .update(c)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarClienta(id: string): Promise<void> {
  const { error } = await createClient().from("clientas").delete().eq("id", id);
  if (error) throw error;
}

// --- Tareas ---

export async function listarTareas(): Promise<Tarea[]> {
  const { data, error } = await createClient()
    .from("tareas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tarea[];
}

export async function crearTarea(t: TareaNueva): Promise<void> {
  const { error } = await createClient().from("tareas").insert(t);
  if (error) throw error;
}

export async function actualizarTarea(
  id: string,
  t: Partial<TareaNueva>
): Promise<void> {
  const { error } = await createClient().from("tareas").update(t).eq("id", id);
  if (error) throw error;
}

export async function eliminarTarea(id: string): Promise<void> {
  const { error } = await createClient().from("tareas").delete().eq("id", id);
  if (error) throw error;
}

// --- Publicaciones ---

interface FilaPublicacion extends Omit<Publicacion, "productos"> {
  publicacion_productos: { producto_id: string }[] | null;
}

export async function listarPublicaciones(): Promise<Publicacion[]> {
  const { data, error } = await createClient()
    .from("publicaciones")
    .select("*, publicacion_productos(producto_id)")
    .order("fecha", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as FilaPublicacion[]).map(
    ({ publicacion_productos, ...p }) => ({
      ...p,
      productos: (publicacion_productos ?? []).map((x) => x.producto_id),
    })
  );
}

// Los productos ligados se reescriben enteros: son pocos por publicación y
// diffear altas y bajas por separado no compensa.
async function guardarProductosLigados(
  publicacionId: string,
  productoIds: string[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("publicacion_productos")
    .delete()
    .eq("publicacion_id", publicacionId);
  if (error) throw error;
  if (productoIds.length === 0) return;
  const { error: errorInsert } = await supabase
    .from("publicacion_productos")
    .insert(
      productoIds.map((producto_id) => ({
        publicacion_id: publicacionId,
        producto_id,
      }))
    );
  if (errorInsert) throw errorInsert;
}

export async function crearPublicacion(
  p: PublicacionNueva,
  productoIds: string[]
): Promise<void> {
  const { data, error } = await createClient()
    .from("publicaciones")
    .insert(p)
    .select("id")
    .single();
  if (error) throw error;
  await guardarProductosLigados(data.id as string, productoIds);
}

export async function actualizarPublicacion(
  id: string,
  p: Partial<PublicacionNueva>,
  productoIds?: string[]
): Promise<void> {
  const { error } = await createClient()
    .from("publicaciones")
    .update(p)
    .eq("id", id);
  if (error) throw error;
  if (productoIds) await guardarProductosLigados(id, productoIds);
}

export async function eliminarPublicacion(id: string): Promise<void> {
  const { error } = await createClient()
    .from("publicaciones")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// --- Pedidos ---

interface FilaPedido extends Omit<Pedido, "items"> {
  items: PedidoItem[] | null;
}

export async function listarPedidos(): Promise<Pedido[]> {
  const { data, error } = await createClient()
    .from("pedidos")
    .select("*, items:pedido_items(*)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as FilaPedido[]).map((p) => ({
    ...p,
    items: p.items ?? [],
  }));
}

export async function crearPedido(
  pedido: PedidoNuevo,
  items: PedidoItemNuevo[]
): Promise<void> {
  if (items.length === 0) throw new Error("El pedido necesita al menos un item");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("pedidos")
    .insert(pedido)
    .select("id")
    .single();
  if (error) throw error;

  const { error: errorItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i) => ({ ...i, pedido_id: data.id })));
  if (errorItems) {
    await supabase.from("pedidos").delete().eq("id", data.id);
    throw errorItems;
  }
}

export async function actualizarPedido(
  id: string,
  p: Partial<PedidoNuevo>
): Promise<void> {
  const { error } = await createClient().from("pedidos").update(p).eq("id", id);
  if (error) throw error;
}

export async function eliminarPedido(id: string): Promise<void> {
  // pedido_items tiene on delete cascade.
  const { error } = await createClient().from("pedidos").delete().eq("id", id);
  if (error) throw error;
}

// --- Stock ---

// El stock se mueve desde la app y no con un trigger de Postgres a propósito:
// así queda a la vista en el código que una venta descuenta y un borrado
// repone, sin magia escondida en la base.
async function moverStock(
  items: { producto_id: string | null; cantidad: number }[],
  productos: Producto[],
  signo: 1 | -1
): Promise<void> {
  const supabase = createClient();
  const cambios = new Map<string, number>();

  for (const item of items) {
    if (!item.producto_id) continue;
    const producto = productos.find((p) => p.id === item.producto_id);
    // stock null = ese producto no lleva control, no se toca.
    if (!producto || producto.stock === null) continue;
    const acumulado = cambios.get(producto.id) ?? producto.stock;
    cambios.set(producto.id, acumulado + signo * item.cantidad);
  }

  await Promise.all(
    [...cambios].map(([id, stock]) =>
      supabase
        .from("productos")
        .update({ stock: Math.max(stock, 0) })
        .eq("id", id)
    )
  );
}

export function descontarStock(
  items: { producto_id: string | null; cantidad: number }[],
  productos: Producto[]
): Promise<void> {
  return moverStock(items, productos, -1);
}

export function reponerStock(
  items: { producto_id: string | null; cantidad: number }[],
  productos: Producto[]
): Promise<void> {
  return moverStock(items, productos, 1);
}

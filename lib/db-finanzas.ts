import { createClient } from "@/lib/supabase/client";
import type { Gasto, Venta, VentaItem } from "@/lib/types";

export type GastoNuevo = Omit<Gasto, "id" | "created_at">;
export type ItemNuevo = Omit<VentaItem, "id" | "venta_id">;
export type VentaNueva = Omit<Venta, "id" | "created_at" | "items">;

// --- Gastos ---

export async function listarGastos(): Promise<Gasto[]> {
  const { data, error } = await createClient()
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Gasto[];
}

export async function crearGasto(g: GastoNuevo): Promise<void> {
  const { error } = await createClient().from("gastos").insert(g);
  if (error) throw error;
}

export async function actualizarGasto(
  id: string,
  g: Partial<GastoNuevo>
): Promise<void> {
  const { error } = await createClient().from("gastos").update(g).eq("id", id);
  if (error) throw error;
}

export async function eliminarGasto(id: string): Promise<void> {
  const { error } = await createClient().from("gastos").delete().eq("id", id);
  if (error) throw error;
}

// --- Ventas ---

export async function listarVentas(): Promise<Venta[]> {
  const { data, error } = await createClient()
    .from("ventas")
    .select("*, items:venta_items(*)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  // items puede venir null si la venta quedo sin renglones.
  return ((data ?? []) as Venta[]).map((v) => ({ ...v, items: v.items ?? [] }));
}

// Sin transacciones desde el cliente: se inserta la venta y despues los
// renglones. Si los renglones fallan se borra la venta para no dejar una
// venta fantasma en $0 inflando la cantidad de ventas del mes.
export async function crearVenta(
  venta: VentaNueva,
  items: ItemNuevo[]
): Promise<string> {
  if (items.length === 0) throw new Error("La venta necesita al menos un item");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ventas")
    .insert(venta)
    .select("id")
    .single();
  if (error) throw error;

  const { error: errorItems } = await supabase
    .from("venta_items")
    .insert(items.map((i) => ({ ...i, venta_id: data.id })));
  if (errorItems) {
    await supabase.from("ventas").delete().eq("id", data.id);
    throw errorItems;
  }
  return data.id as string;
}

// Tampoco hay transacciones aca, asi que el orden esta pensado para que un
// error a mitad de camino deje la venta consistente y reintentar no duplique
// nada: 1) cabecera (repetirla no cambia nada), 2) renglones nuevos, 3) se
// borran los viejos. Si el paso 3 falla se deshace el 2, y la venta queda
// con sus renglones de antes.
export async function actualizarVenta(
  id: string,
  venta: VentaNueva,
  itemsViejos: VentaItem[],
  items: ItemNuevo[]
): Promise<void> {
  if (items.length === 0) throw new Error("La venta necesita al menos un item");
  const supabase = createClient();

  const { error } = await supabase.from("ventas").update(venta).eq("id", id);
  if (error) throw error;

  const { data: nuevos, error: errorNuevos } = await supabase
    .from("venta_items")
    .insert(items.map((i) => ({ ...i, venta_id: id })))
    .select("id");
  if (errorNuevos) throw errorNuevos;

  if (itemsViejos.length > 0) {
    const { error: errorViejos } = await supabase
      .from("venta_items")
      .delete()
      .in("id", itemsViejos.map((i) => i.id));
    if (errorViejos) {
      await supabase
        .from("venta_items")
        .delete()
        .in("id", (nuevos ?? []).map((n) => n.id as string));
      throw errorViejos;
    }
  }
}

export async function marcarCobrada(id: string, cobrada: boolean): Promise<void> {
  const { error } = await createClient()
    .from("ventas")
    .update({ cobrada })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarVenta(id: string): Promise<void> {
  // venta_items tiene on delete cascade, se van solos.
  const { error } = await createClient().from("ventas").delete().eq("id", id);
  if (error) throw error;
}

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

export async function eliminarVenta(id: string): Promise<void> {
  // venta_items tiene on delete cascade, se van solos.
  const { error } = await createClient().from("ventas").delete().eq("id", id);
  if (error) throw error;
}

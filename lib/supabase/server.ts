import { createClient } from "@supabase/supabase-js";
import { ordenarProductos } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

// Lectura publica para la landing (sin cookies ni sesion).
// Devuelve [] si Supabase no esta configurado para que build/dev no fallen.
export async function obtenerProductos(): Promise<Producto[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.from("productos").select("*");
    if (error || !data) return [];
    return ordenarProductos(data as Producto[]);
  } catch {
    return [];
  }
}

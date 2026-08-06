import { createClient } from "@supabase/supabase-js";
import { ordenarProductos } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

export interface ResultadoProductos {
  productos: Producto[];
  // true si Supabase no respondio bien (distinto de "no hay productos").
  huboError: boolean;
}

// Lectura publica para la landing (sin cookies ni sesion).
// No lanza si Supabase no esta configurado o falla, para que build/dev no
// se rompan — pero marca huboError para que la UI no confunda "sin datos
// por fetch caido" con "sin productos que matcheen el filtro".
export async function obtenerProductos(): Promise<ResultadoProductos> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { productos: [], huboError: true };
  try {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.from("productos").select("*");
    if (error || !data) return { productos: [], huboError: true };
    return { productos: ordenarProductos(data as Producto[]), huboError: false };
  } catch {
    return { productos: [], huboError: true };
  }
}

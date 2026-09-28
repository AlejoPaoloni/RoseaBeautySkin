import { createClient } from "@supabase/supabase-js";
import { ordenarProductos } from "@/lib/catalog";
import { esUuid } from "@/lib/slug";
import type { Producto } from "@/lib/types";

// Lo unico que la web publica puede leer de productos (migracion 011: anon
// tiene permiso solo sobre estas columnas). costo, stock y stock_minimo
// quedan afuera: son del admin. Si se agrega una columna que la web muestra,
// va aca Y en el grant de la migracion.
export const COLUMNAS_PUBLICAS = [
  "id", "slug", "nombre", "marca", "descripcion_corta", "imagen_url",
  "descripcion_larga", "imagenes_extra", "categoria", "subcategoria",
  "estado", "precio", "destacado", "tonos", "orden_display", "created_at",
] as const;

const SELECT_PUBLICO = COLUMNAS_PUBLICAS.join(",");

// Completa el tipo Producto sin inventar datos privados: la web publica no
// los tiene ni los usa. stock null significa "sin control de stock", que
// para la landing es lo mismo que no saberlo.
function conCamposPrivadosVacios(fila: Omit<Producto, "costo" | "stock" | "stock_minimo">): Producto {
  return { ...fila, costo: null, stock: null, stock_minimo: 0 };
}

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
    const { data, error } = await supabase.from("productos").select(SELECT_PUBLICO);
    if (error || !data) return { productos: [], huboError: true };
    return {
      productos: ordenarProductos(
        (data as unknown as Omit<Producto, "costo" | "stock" | "stock_minimo">[]).map(
          conCamposPrivadosVacios
        )
      ),
      huboError: false,
    };
  } catch {
    return { productos: [], huboError: true };
  }
}

// Lectura publica de un solo producto, para la pagina de detalle.
// null = no existe o Supabase no esta configurado/fallo (la pagina lo trata
// como 404 en ambos casos: no hay nada mas que mostrarle a la visita).
//
// `valor` puede ser el slug (URL nueva) o el uuid (URL vieja, ya compartida
// por WhatsApp): la pagina resuelve por cualquiera de los dos y redirige la
// vieja a la nueva.
export async function obtenerProducto(
  valor: string
): Promise<Producto | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase
      .from("productos")
      .select(SELECT_PUBLICO)
      .eq(esUuid(valor) ? "id" : "slug", valor)
      .single();
    if (error || !data) return null;
    return conCamposPrivadosVacios(
      data as unknown as Omit<Producto, "costo" | "stock" | "stock_minimo">
    );
  } catch {
    return null;
  }
}

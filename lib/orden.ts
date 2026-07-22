import type { Producto } from "./types";

export function conOrden(
  productos: Producto[]
): { id: string; orden_display: number }[] {
  return productos.map((p, i) => ({ id: p.id, orden_display: i }));
}

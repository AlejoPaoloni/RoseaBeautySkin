import type { Categoria, Producto } from "./types";
import { SUBCATEGORIAS } from "./types";

export function ordenarProductos(productos: Producto[]): Producto[] {
  return [...productos].sort(
    (a, b) =>
      a.orden_display - b.orden_display ||
      a.created_at.localeCompare(b.created_at)
  );
}

export function filtrarProductos(
  productos: Producto[],
  categoria: Categoria | null,
  subcategoria: string | null
): Producto[] {
  return productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!subcategoria || p.subcategoria === subcategoria)
  );
}

export function productosPorEncargo(productos: Producto[]): Producto[] {
  return productos.filter((p) => p.estado === "Por Encargo");
}

export function agruparPorSubcategoria(
  productos: Producto[],
  categoria: Categoria
): Record<string, Producto[]> {
  const grupos: Record<string, Producto[]> = {};
  for (const sub of SUBCATEGORIAS[categoria]) {
    grupos[sub] = ordenarProductos(
      productos.filter(
        (p) => p.categoria === categoria && p.subcategoria === sub
      )
    );
  }
  return grupos;
}

export function formatearPrecio(precio: number | undefined | null): string {
  const precioSeguro = precio ?? 0;
  return precioSeguro.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

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
  subcategoria: string | null,
  soloDisponibles = false,
  busqueda: string | null = null,
  precioMin: number | null = null,
  precioMax: number | null = null
): Producto[] {
  const q = busqueda?.trim().toLowerCase() ?? "";
  return productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!subcategoria || p.subcategoria === subcategoria) &&
      (!soloDisponibles || p.estado === "Disponible") &&
      (!q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.marca?.toLowerCase().includes(q) ?? false)) &&
      // == null para que 0 sea un limite valido, no "sin filtro"
      (precioMin == null || p.precio >= precioMin) &&
      (precioMax == null || p.precio <= precioMax)
  );
}

// Paso de la barra de precio: los valores del catalogo son de decenas de
// miles de pesos, mover de a $1 no tendria sentido.
export const PASO_PRECIO = 1000;

// Limites de la barra de precio, redondeados al paso para que los extremos
// sean valores redondos y no el precio exacto de un producto.
export function rangoPrecios(productos: Producto[]): {
  piso: number;
  tope: number;
} {
  if (productos.length === 0) return { piso: 0, tope: 0 };
  const precios = productos.map((p) => p.precio);
  return {
    piso: Math.floor(Math.min(...precios) / PASO_PRECIO) * PASO_PRECIO,
    tope: Math.ceil(Math.max(...precios) / PASO_PRECIO) * PASO_PRECIO,
  };
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

export function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export function productosDestacados(productos: Producto[]): Producto[] {
  return ordenarProductos(productos.filter((p) => p.destacado));
}

// Ventana en dias para el badge "Nuevo" en las cards.
const DIAS_PRODUCTO_NUEVO = 7;

export function esProductoNuevo(producto: Producto): boolean {
  const creado = new Date(producto.created_at).getTime();
  if (Number.isNaN(creado)) return false;
  const diasTranscurridos = (Date.now() - creado) / (1000 * 60 * 60 * 24);
  return diasTranscurridos >= 0 && diasTranscurridos <= DIAS_PRODUCTO_NUEVO;
}

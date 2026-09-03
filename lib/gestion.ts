import type {
  PasoChecklist,
  Pedido,
  Producto,
  Publicacion,
  Tarea,
  Venta,
} from "./types";
import { PASOS_POR_DEFECTO } from "./types";
import { totalVenta } from "./finanzas";

// --- Contenido ---

export function checklistPorDefecto(): PasoChecklist[] {
  return PASOS_POR_DEFECTO.map((paso) => ({ paso, hecho: false }));
}

export function progresoChecklist(publicacion: Publicacion): {
  hechos: number;
  total: number;
  pct: number;
} {
  const pasos = publicacion.checklist ?? [];
  const hechos = pasos.filter((p) => p.hecho).length;
  return {
    hechos,
    total: pasos.length,
    pct: pasos.length === 0 ? 0 : (hechos / pasos.length) * 100,
  };
}

// Sin fecha = todavía es una idea suelta, no está agendada.
export function esIdea(publicacion: Publicacion): boolean {
  return publicacion.fecha === null;
}

export function ideas(publicaciones: Publicacion[]): Publicacion[] {
  return publicaciones.filter(esIdea);
}

export function agendadas(
  publicaciones: Publicacion[],
  mes: string
): Publicacion[] {
  return publicaciones.filter((p) => p.fecha !== null && p.fecha.slice(0, 7) === mes);
}

export const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Grilla del calendario con la semana arrancando el lunes. Los null del
// principio son los casilleros vacíos hasta que cae el día 1.
export function grillaMes(mes: string): (string | null)[] {
  const [anio, m] = mes.split("-").map(Number);
  // getDay() devuelve 0 para domingo; con +6 % 7 el lunes pasa a ser 0.
  const offset = (new Date(anio, m - 1, 1).getDay() + 6) % 7;
  // Día 0 del mes siguiente es el último del actual.
  const cantidadDias = new Date(anio, m, 0).getDate();

  const celdas: (string | null)[] = Array(offset).fill(null);
  for (let dia = 1; dia <= cantidadDias; dia += 1) {
    celdas.push(`${mes}-${String(dia).padStart(2, "0")}`);
  }
  return celdas;
}

export function agruparPorDia(
  publicaciones: Publicacion[]
): Record<string, Publicacion[]> {
  const grupos: Record<string, Publicacion[]> = {};
  for (const p of publicaciones) {
    if (p.fecha === null) continue;
    (grupos[p.fecha] ??= []).push(p);
  }
  return grupos;
}

// --- Stock ---

export function llevaStock(producto: Producto): boolean {
  return producto.stock !== null;
}

export function stockBajo(producto: Producto): boolean {
  return producto.stock !== null && producto.stock <= producto.stock_minimo;
}

export function productosStockBajo(productos: Producto[]): Producto[] {
  return productos
    .filter(stockBajo)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
}

// --- Pedidos ---

export function totalPedido(pedido: Pedido): number {
  return pedido.items.reduce(
    (t, i) => t + i.precio_estimado * i.cantidad,
    0
  );
}

export function saldoPedido(pedido: Pedido): number {
  return Math.max(totalPedido(pedido) - pedido.sena, 0);
}

export function pedidosAbiertos(pedidos: Pedido[]): Pedido[] {
  return pedidos.filter((p) => p.estado !== "Entregado");
}

// --- Clientas ---

export interface HistorialClienta {
  compras: number;
  total: number;
  // Fecha de la última compra, null si todavía no compró.
  ultima: string | null;
}

export function historialClienta(
  ventas: Venta[],
  clientaId: string
): HistorialClienta {
  const suyas = ventas.filter((v) => v.cliente_id === clientaId);
  return {
    compras: suyas.length,
    total: suyas.reduce((t, v) => t + totalVenta(v), 0),
    ultima: suyas.reduce<string | null>(
      (max, v) => (max === null || v.fecha > max ? v.fecha : max),
      null
    ),
  };
}

// --- Tareas ---

// Pendientes primero; dentro de cada grupo, las que tienen fecha límite antes
// que las sueltas, y las más urgentes arriba.
export function ordenarTareas(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    if (a.hecha !== b.hecha) return a.hecha ? 1 : -1;
    if (a.fecha_limite !== b.fecha_limite) {
      if (a.fecha_limite === null) return 1;
      if (b.fecha_limite === null) return -1;
      return a.fecha_limite.localeCompare(b.fecha_limite);
    }
    return a.created_at.localeCompare(b.created_at);
  });
}

export function tareaVencida(tarea: Tarea, hoy: string): boolean {
  return !tarea.hecha && tarea.fecha_limite !== null && tarea.fecha_limite < hoy;
}

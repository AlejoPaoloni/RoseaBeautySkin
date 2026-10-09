import type {
  Clienta,
  Estado,
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

// Estado que corresponde despues de mover el stock (venta o venta borrada).
// Por Encargo no se toca: se pide aunque no haya unidades en mano.
export function estadoSegunStock(actual: Estado, stock: number): Estado {
  if (actual === "Por Encargo") return actual;
  return stock > 0 ? "Disponible" : "Sin stock";
}

export function stockBajo(producto: Producto): boolean {
  return producto.stock !== null && producto.stock <= producto.stock_minimo;
}

export function productosStockBajo(productos: Producto[]): Producto[] {
  return productos
    .filter(stockBajo)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
}

// Cuanto mover el stock al editar una venta: nuevo menos viejo por producto.
// Positivo = descontar mas, negativo = devolver. Asi el stock se corrige por
// la diferencia en vez de reponer todo y volver a descontar.
export function diferenciaStock(
  antes: { producto_id: string | null; cantidad: number }[],
  despues: { producto_id: string | null; cantidad: number }[]
): { producto_id: string; cantidad: number }[] {
  const delta = new Map<string, number>();
  for (const [renglones, signo] of [[antes, -1], [despues, 1]] as const) {
    for (const r of renglones) {
      if (!r.producto_id) continue;
      delta.set(r.producto_id, (delta.get(r.producto_id) ?? 0) + signo * r.cantidad);
    }
  }
  return [...delta]
    .filter(([, cantidad]) => cantidad !== 0)
    .map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
}

export interface ValorStock {
  unidades: number;
  // Plata invertida en lo que hay en mano (unidades x costo).
  alCosto: number;
  // Lo que se facturaria vendiendo todo al precio de lista.
  alPrecio: number;
  // Productos con unidades pero sin costo cargado (no suman a alCosto).
  sinCosto: number;
}

export function valorStock(productos: Producto[]): ValorStock {
  const v: ValorStock = { unidades: 0, alCosto: 0, alPrecio: 0, sinCosto: 0 };
  for (const p of productos) {
    if (!p.stock || p.stock <= 0) continue;
    v.unidades += p.stock;
    v.alPrecio += p.stock * p.precio;
    if (p.costo == null) v.sinCosto += 1;
    else v.alCosto += p.stock * p.costo;
  }
  return v;
}

// --- Llegada de un pedido al proveedor ---

export interface LineaLlegada {
  producto_id: string;
  unidades: number;
  // Costo unitario de ESTE pedido: pasa a ser el costo del producto.
  costo: number;
}

export interface ResultadoLlegada {
  cambios: { id: string; stock: number; costo: number; estado: Estado }[];
  totalMercaderia: number;
}

// Lo que hay que escribir en cada producto cuando llega la mercaderia: suma
// unidades (un producto sin control de stock empieza a contar desde lo que
// llego), pisa el costo con el del pedido y ajusta el estado con la misma
// regla que una venta (Sin stock con unidades vuelve a Disponible; Por
// Encargo no se toca).
export function aplicarLlegada(
  productos: Producto[],
  lineas: LineaLlegada[]
): ResultadoLlegada {
  const porProducto = new Map<string, { unidades: number; costo: number }>();
  let totalMercaderia = 0;
  for (const l of lineas) {
    if (l.unidades <= 0) continue;
    const previa = porProducto.get(l.producto_id);
    porProducto.set(l.producto_id, {
      unidades: (previa?.unidades ?? 0) + l.unidades,
      costo: l.costo,
    });
    totalMercaderia += l.unidades * l.costo;
  }

  const cambios: ResultadoLlegada["cambios"] = [];
  for (const [id, { unidades, costo }] of porProducto) {
    const p = productos.find((x) => x.id === id);
    if (!p) continue;
    const stock = (p.stock ?? 0) + unidades;
    cambios.push({ id, stock, costo, estado: estadoSegunStock(p.estado, stock) });
  }
  return { cambios, totalMercaderia };
}

// --- Clientas para volver a escribirles ---

export const DIAS_INACTIVA = 60;

export interface ClientaInactiva {
  clienta: Clienta;
  ultimaCompra: string;
  compras: number;
}

// Clientas con ficha que compraron alguna vez pero no en los ultimos
// DIAS_INACTIVA dias. Las que nunca compraron no entran: no hay a quien
// "recuperar". La mas olvidada primero.
export function clientasInactivas(
  clientas: Clienta[],
  ventas: Venta[],
  hoy: string
): ClientaInactiva[] {
  const limite = restarDias(hoy, DIAS_INACTIVA);
  const resultado: ClientaInactiva[] = [];
  for (const c of clientas) {
    const suyas = ventas.filter((v) => v.cliente_id === c.id);
    if (suyas.length === 0) continue;
    const ultimaCompra = suyas.reduce((u, v) => (v.fecha > u ? v.fecha : u), "");
    if (ultimaCompra >= limite) continue;
    resultado.push({ clienta: c, ultimaCompra, compras: suyas.length });
  }
  return resultado.sort((a, b) => a.ultimaCompra.localeCompare(b.ultimaCompra));
}

// --- Reposicion (lo que hay que volver a pedirle al proveedor) ---

// Ventana para medir cuanto se vende de cada producto al sugerir cantidades.
export const DIAS_REPOSICION = 90;

export interface FilaReposicion {
  producto: Producto;
  motivo: "Sin stock" | "Stock bajo";
  // Unidades vendidas en los ultimos DIAS_REPOSICION dias.
  vendidas: number;
  sugerido: number;
}

// Fechas "YYYY-MM-DD" (columnas date): se resta en UTC para que el horario
// de Argentina no corra el dia.
function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

export function paraReponer(
  productos: Producto[],
  ventas: Venta[],
  hoy: string
): FilaReposicion[] {
  const desde = restarDias(hoy, DIAS_REPOSICION);
  const vendidasPorId = new Map<string, number>();
  for (const venta of ventas) {
    if (venta.fecha < desde) continue;
    for (const item of venta.items) {
      if (!item.producto_id) continue;
      vendidasPorId.set(
        item.producto_id,
        (vendidasPorId.get(item.producto_id) ?? 0) + item.cantidad
      );
    }
  }

  const filas: FilaReposicion[] = [];
  for (const p of productos) {
    // Por Encargo no se repone: se pide cuando lo encargan.
    const motivo =
      p.estado === "Sin stock"
        ? "Sin stock"
        : p.estado === "Disponible" && stockBajo(p)
          ? "Stock bajo"
          : null;
    if (!motivo) continue;
    const quedan = p.stock ?? 0;
    const vendidas = vendidasPorId.get(p.id) ?? 0;
    // Lo que se vendio en la ventana menos lo que queda, y como minimo lo
    // necesario para quedar por encima del aviso de stock bajo.
    const sugerido = Math.max(vendidas - quedan, p.stock_minimo + 1 - quedan, 1);
    filas.push({ producto: p, motivo, vendidas, sugerido });
  }

  return filas.sort(
    (a, b) =>
      Number(b.motivo === "Sin stock") - Number(a.motivo === "Sin stock") ||
      b.vendidas - a.vendidas ||
      a.producto.nombre.localeCompare(b.producto.nombre)
  );
}

// Nombre completo para pedirle al proveedor. Cada tono es un producto
// aparte con un solo tono cargado: sin el, tres "Hydrating Camo Concealer"
// en la lista no se distinguen.
export function tonoUnico(producto: Producto): string | null {
  return producto.tonos?.length === 1 ? producto.tonos[0].nombre : null;
}

// Lo que se puede elegir al cargar una venta: solo lo Disponible (no se
// vende lo que no hay ni lo que es por encargo, que entra por Pedidos). Al
// editar una venta, el producto que ya tiene el renglon se mantiene aunque
// haya dejado de estar Disponible — tipicamente porque esa misma venta lo
// dejo en 0 —; si no, el selector quedaria mostrando otro producto.
export function productosParaVender(
  productos: Producto[],
  seleccionadoId: string | null
): Producto[] {
  return productos.filter(
    (p) => p.estado === "Disponible" || p.id === seleccionadoId
  );
}

export function nombreParaPedir(producto: Producto): string {
  const tono = tonoUnico(producto);
  return [producto.marca, producto.nombre].filter(Boolean).join(" ") +
    (tono ? ` (${tono})` : "");
}

// Texto listo para pegar en el WhatsApp del proveedor.
export function textoReposicion(
  filas: { producto: Producto; cantidad: number }[]
): string {
  const lineas = filas
    .filter((f) => f.cantidad > 0)
    .map((f) => `- ${f.cantidad} × ${nombreParaPedir(f.producto)}`);
  return ["Reposición Rosea Beauty", "", ...lineas].join("\n");
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

// --- Pantalla de inicio: lo que pide atencion hoy ---

// Pedidos de clientas que ya llegaron y falta entregar: el mas viejo primero,
// que es el que lleva mas tiempo esperando.
export function pedidosParaEntregar(pedidos: Pedido[]): Pedido[] {
  return pedidos
    .filter((p) => p.estado === "Llegó")
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Tareas sin hacer que vencen hoy o ya vencieron.
export function tareasUrgentes(tareas: Tarea[], hoy: string): Tarea[] {
  return tareas
    .filter((t) => !t.hecha && t.fecha_limite !== null && t.fecha_limite <= hoy)
    .sort((a, b) => a.fecha_limite!.localeCompare(b.fecha_limite!));
}

// Publicaciones agendadas para los proximos 7 dias, mas las atrasadas que
// todavia no se publicaron. Las ideas sin fecha no entran.
export function proximasPublicaciones(
  publicaciones: Publicacion[],
  hoy: string
): Publicacion[] {
  const hasta = restarDias(hoy, -7);
  return publicaciones
    .filter((p) => p.fecha !== null && p.fecha <= hasta && p.estado !== "Publicado")
    .sort((a, b) => a.fecha!.localeCompare(b.fecha!));
}

// Normaliza para comparar: minusculas y sin espacios de mas. Devuelve true si
// `texto` no viene vacio (sin busqueda, todo matchea) o si `campos` contiene
// el termino en alguno de sus valores no nulos.
export function coincide(busqueda: string, campos: (string | null)[]): boolean {
  const q = busqueda.trim().toLowerCase();
  if (!q) return true;
  return campos.some((c) => c?.toLowerCase().includes(q) ?? false);
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

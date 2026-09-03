import type { CategoriaGasto, Gasto, Venta } from "./types";
import { CATEGORIAS_GASTO } from "./types";

// Las fechas de ventas y gastos son columnas `date` de Postgres: llegan como
// "YYYY-MM-DD" sin hora ni zona. Se recortan como texto a proposito — pasarlas
// por new Date() las interpretaria como UTC y en Argentina (UTC-3) una venta
// del dia 1 caeria en el mes anterior.
export function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

export function mesActual(hoy: Date = new Date()): string {
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
}

export function fechaHoy(hoy: Date = new Date()): string {
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${mesActual(hoy)}-${dia}`;
}

export function mesAnterior(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  return m === 1
    ? `${anio - 1}-12`
    : `${anio}-${String(m - 1).padStart(2, "0")}`;
}

// Devuelve los ultimos n meses en orden cronologico, terminando en `hasta`.
export function ultimosMeses(n: number, hasta: string = mesActual()): string[] {
  const meses: string[] = [];
  let cursor = hasta;
  for (let i = 0; i < n; i += 1) {
    meses.unshift(cursor);
    cursor = mesAnterior(cursor);
  }
  return meses;
}

const MESES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function nombreMes(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  return `${MESES_ES[m - 1]} ${anio}`;
}

export function mesCorto(mes: string): string {
  const [, m] = mes.split("-").map(Number);
  return MESES_ES[m - 1].slice(0, 3);
}

export function totalVenta(venta: Venta): number {
  return venta.items.reduce((t, i) => t + i.precio_unitario * i.cantidad, 0);
}

export function costoVenta(venta: Venta): number {
  return venta.items.reduce((t, i) => t + i.costo_unitario * i.cantidad, 0);
}

export function gananciaVenta(venta: Venta): number {
  return totalVenta(venta) - costoVenta(venta);
}

export function unidadesVenta(venta: Venta): number {
  return venta.items.reduce((t, i) => t + i.cantidad, 0);
}

export interface ResumenMes {
  mes: string;
  ingresos: number;
  cantidadVentas: number;
  unidades: number;
  // Costo de la mercaderia efectivamente vendida este mes.
  costoVendido: number;
  gastosTotal: number;
  gastosMercaderia: number;
  gastosOperativos: number;
  // Caja: lo que entro menos todo lo que salio este mes. Sirve para saber
  // cuanta plata quedo en el bolsillo.
  resultadoCaja: number;
  // Margen: ingresos menos el costo de lo vendido y los gastos que no son
  // compra de stock. No suma los gastos de Mercaderia porque ese costo ya
  // esta contado en costoVendido — contarlo dos veces inventaria perdidas.
  gananciaMargen: number;
  // Porcentaje de margen sobre ingresos. null si no hubo ventas.
  margenPct: number | null;
}

export function resumenMes(
  ventas: Venta[],
  gastos: Gasto[],
  mes: string
): ResumenMes {
  const delMes = ventas.filter((v) => mesDe(v.fecha) === mes);
  const gastosDelMes = gastos.filter((g) => mesDe(g.fecha) === mes);

  const ingresos = delMes.reduce((t, v) => t + totalVenta(v), 0);
  const costoVendido = delMes.reduce((t, v) => t + costoVenta(v), 0);
  const unidades = delMes.reduce((t, v) => t + unidadesVenta(v), 0);

  const gastosMercaderia = gastosDelMes
    .filter((g) => g.categoria === "Mercaderia")
    .reduce((t, g) => t + g.monto, 0);
  const gastosTotal = gastosDelMes.reduce((t, g) => t + g.monto, 0);
  const gastosOperativos = gastosTotal - gastosMercaderia;

  const gananciaMargen = ingresos - costoVendido - gastosOperativos;

  return {
    mes,
    ingresos,
    cantidadVentas: delMes.length,
    unidades,
    costoVendido,
    gastosTotal,
    gastosMercaderia,
    gastosOperativos,
    resultadoCaja: ingresos - gastosTotal,
    gananciaMargen,
    margenPct: ingresos === 0 ? null : (gananciaMargen / ingresos) * 100,
  };
}

export function serieMensual(
  ventas: Venta[],
  gastos: Gasto[],
  meses: string[]
): ResumenMes[] {
  return meses.map((m) => resumenMes(ventas, gastos, m));
}

// Variacion porcentual contra el mes anterior. null cuando no hay base de
// comparacion (mes anterior en cero): "creciste infinito" no dice nada.
export function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

export interface FilaProducto {
  nombre: string;
  unidades: number;
  ingresos: number;
  ganancia: number;
}

// Agrupa por nombre y no por producto_id: si el producto se borro del
// catalogo el id queda en null, pero el nombre snapshot sigue estando.
export function topProductos(
  ventas: Venta[],
  mes: string | null = null,
  limite = 5
): FilaProducto[] {
  const filtradas = mes ? ventas.filter((v) => mesDe(v.fecha) === mes) : ventas;
  const acumulado = new Map<string, FilaProducto>();

  for (const venta of filtradas) {
    for (const item of venta.items) {
      const fila = acumulado.get(item.nombre) ?? {
        nombre: item.nombre,
        unidades: 0,
        ingresos: 0,
        ganancia: 0,
      };
      fila.unidades += item.cantidad;
      fila.ingresos += item.precio_unitario * item.cantidad;
      fila.ganancia +=
        (item.precio_unitario - item.costo_unitario) * item.cantidad;
      acumulado.set(item.nombre, fila);
    }
  }

  return [...acumulado.values()]
    .sort((a, b) => b.ingresos - a.ingresos || b.unidades - a.unidades)
    .slice(0, limite);
}

export interface FilaGasto {
  categoria: CategoriaGasto;
  monto: number;
  pct: number;
}

export function gastosPorCategoria(
  gastos: Gasto[],
  mes: string | null = null
): FilaGasto[] {
  const filtrados = mes ? gastos.filter((g) => mesDe(g.fecha) === mes) : gastos;
  const total = filtrados.reduce((t, g) => t + g.monto, 0);

  return CATEGORIAS_GASTO.map((categoria) => {
    const monto = filtrados
      .filter((g) => g.categoria === categoria)
      .reduce((t, g) => t + g.monto, 0);
    return { categoria, monto, pct: total === 0 ? 0 : (monto / total) * 100 };
  })
    .filter((f) => f.monto > 0)
    .sort((a, b) => b.monto - a.monto);
}

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

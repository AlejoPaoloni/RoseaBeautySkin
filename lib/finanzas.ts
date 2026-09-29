import type { CategoriaGasto, Gasto, MedioPago, Venta } from "./types";
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
  // cuanta plata quedo en el bolsillo. Una venta sin cobrar no entro: no
  // cuenta en la caja (si en ingresos y ganancia, que miden lo vendido).
  resultadoCaja: number;
  // Ventas del mes que la clienta todavia debe.
  pendienteCobro: number;
  // Lo cobrado del mes por medio. "Sin dato" = ventas de antes de 012.
  cobradoPorMedio: Record<MedioPago | "Sin dato", number>;
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

  const cobradoPorMedio: Record<MedioPago | "Sin dato", number> = {
    Transferencia: 0,
    Efectivo: 0,
    "Sin dato": 0,
  };
  let pendienteCobro = 0;
  for (const v of delMes) {
    if (!v.cobrada) pendienteCobro += totalVenta(v);
    else cobradoPorMedio[v.medio_pago ?? "Sin dato"] += totalVenta(v);
  }

  return {
    mes,
    ingresos,
    cantidadVentas: delMes.length,
    unidades,
    costoVendido,
    gastosTotal,
    gastosMercaderia,
    gastosOperativos,
    resultadoCaja: ingresos - pendienteCobro - gastosTotal,
    pendienteCobro,
    cobradoPorMedio,
    gananciaMargen,
    margenPct: ingresos === 0 ? null : (gananciaMargen / ingresos) * 100,
  };
}

// Todas las ventas adeudadas, de cualquier mes: la mas vieja primero, que es
// la que mas urge reclamar.
export function pendientesDeCobro(ventas: Venta[]): Venta[] {
  return ventas
    .filter((v) => !v.cobrada)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.created_at.localeCompare(b.created_at));
}

// Identidad de la clienta de una venta: la ficha si tiene, si no el nombre
// suelto normalizado (ventas viejas). null = venta sin clienta.
function claveClienta(v: Venta): string | null {
  if (v.cliente_id) return `id:${v.cliente_id}`;
  const nombre = v.cliente?.trim().toLowerCase();
  return nombre ? `nombre:${nombre}` : null;
}

export interface MetricasClientas {
  ticketPromedio: number;
  // Clientas cuya primera compra de todas fue este mes.
  nuevas: number;
  // Clientas que compraron este mes y ya habian comprado antes.
  volvieron: number;
}

export function metricasClientasMes(ventas: Venta[], mes: string): MetricasClientas {
  const delMes = ventas.filter((v) => mesDe(v.fecha) === mes);
  const ingresos = delMes.reduce((t, v) => t + totalVenta(v), 0);

  const primeraCompra = new Map<string, string>();
  for (const v of ventas) {
    const clave = claveClienta(v);
    if (!clave) continue;
    const previa = primeraCompra.get(clave);
    if (!previa || v.fecha < previa) primeraCompra.set(clave, v.fecha);
  }

  const delMesUnicas = new Set(
    delMes.map(claveClienta).filter((c): c is string => c !== null)
  );
  let nuevas = 0;
  for (const clave of delMesUnicas) {
    if (mesDe(primeraCompra.get(clave)!) === mes) nuevas += 1;
  }

  return {
    ticketPromedio: delMes.length === 0 ? 0 : Math.round(ingresos / delMes.length),
    nuevas,
    volvieron: delMesUnicas.size - nuevas,
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

export type CriterioRanking = "ingresos" | "unidades" | "ganancia";

// Agrupa por nombre y no por producto_id: si el producto se borro del
// catalogo el id queda en null, pero el nombre snapshot sigue estando.
// `mes` puede ser un mes, varios (ej: los ultimos 12) o null para todo.
export function topProductos(
  ventas: Venta[],
  mes: string | string[] | null = null,
  limite = 5,
  criterio: CriterioRanking = "ingresos"
): FilaProducto[] {
  const meses = mes === null ? null : Array.isArray(mes) ? mes : [mes];
  const filtradas = meses
    ? ventas.filter((v) => meses.includes(mesDe(v.fecha)))
    : ventas;
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
    .sort(
      (a, b) =>
        b[criterio] - a[criterio] ||
        b.ingresos - a.ingresos ||
        b.unidades - a.unidades
    )
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

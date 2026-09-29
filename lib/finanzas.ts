import type { CategoriaGasto, Gasto, MedioPago, Producto, Venta } from "./types";
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

// --- De donde viene la plata ---

export type Dimension = "canal" | "marca" | "categoria";

export interface FilaDimension {
  clave: string;
  ingresos: number;
  ganancia: number;
  unidades: number;
}

// Ventas agrupadas por canal, marca o categoria. Marca y categoria salen del
// producto actual del renglon (el snapshot de la venta no las guarda); un
// renglon cuyo producto se borro va a "Sin producto". En Maquillajes la
// categoria es la subcategoria (Rostro, Ojos, Labios), que es lo que
// distingue; Skincare tiene una sola.
export function ventasPorDimension(
  ventas: Venta[],
  productos: Producto[],
  meses: string[] | null,
  dimension: Dimension
): FilaDimension[] {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const acumulado = new Map<string, FilaDimension>();
  for (const v of ventas) {
    if (meses && !meses.includes(mesDe(v.fecha))) continue;
    for (const i of v.items) {
      const p = i.producto_id ? porId.get(i.producto_id) : undefined;
      const clave =
        dimension === "canal"
          ? v.canal
          : !p
            ? "Sin producto"
            : dimension === "marca"
              ? (p.marca ?? "Sin marca")
              : p.subcategoria;
      const fila = acumulado.get(clave) ?? { clave, ingresos: 0, ganancia: 0, unidades: 0 };
      fila.ingresos += i.precio_unitario * i.cantidad;
      fila.ganancia += (i.precio_unitario - i.costo_unitario) * i.cantidad;
      fila.unidades += i.cantidad;
      acumulado.set(clave, fila);
    }
  }
  return [...acumulado.values()].sort((a, b) => b.ingresos - a.ingresos);
}

// --- Proyeccion y punto de equilibrio ---

function diasDelMes(mes: string): number {
  const [anio, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(anio, m, 0)).getUTCDate();
}

// "Al ritmo actual cerras el mes en...": solo para el mes en curso y desde
// el dia 3 (con uno o dos dias la extrapolacion no dice nada).
export function proyeccionMes(ventas: Venta[], mes: string, hoy: string): number | null {
  if (mesDe(hoy) !== mes) return null;
  const dia = Number(hoy.slice(8, 10));
  if (dia < 3) return null;
  const vendido = ventas
    .filter((v) => mesDe(v.fecha) === mes && v.fecha <= hoy)
    .reduce((t, v) => t + totalVenta(v), 0);
  return Math.round((vendido / dia) * diasDelMes(mes));
}

export interface PuntoEquilibrio {
  // Gastos que no son mercaderia, promedio de los ultimos 3 meses.
  gastosFijosPromedio: number;
  // Lo que queda de cada peso vendido despues de pagar la mercaderia (12 meses).
  margenBrutoPct: number;
  // Ventas por mes para cubrir esos gastos: ni ganar ni perder.
  ventasNecesarias: number;
}

// Mercaderia no entra en los gastos fijos: ese costo ya esta descontado en
// el margen bruto. Se promedian 3 meses para que un mes de mucha
// publicidad no mueva todo, y el margen se toma de 12 para que sea estable.
export function puntoEquilibrio(
  ventas: Venta[],
  gastos: Gasto[],
  mes: string
): PuntoEquilibrio | null {
  const tres = ultimosMeses(3, mes);
  const doce = ultimosMeses(12, mes);
  const gastosFijos = gastos
    .filter((g) => g.categoria !== "Mercaderia" && tres.includes(mesDe(g.fecha)))
    .reduce((t, g) => t + g.monto, 0);
  const periodo = ventas.filter((v) => doce.includes(mesDe(v.fecha)));
  const ingresos = periodo.reduce((t, v) => t + totalVenta(v), 0);
  if (ingresos === 0) return null;
  const costo = periodo.reduce((t, v) => t + costoVenta(v), 0);
  const margen = (ingresos - costo) / ingresos;
  if (margen <= 0) return null;
  const gastosFijosPromedio = Math.round(gastosFijos / tres.length);
  return {
    gastosFijosPromedio,
    margenBrutoPct: Math.round(margen * 100),
    ventasNecesarias: Math.round(gastosFijosPromedio / margen),
  };
}

// Mensaje para mandarle a la clienta por WhatsApp con el detalle de su
// compra. Si la debe, suma cuanto falta y el alias para transferir.
export function mensajeVentaClienta(
  venta: Venta,
  nombre: string | null,
  alias: string
): string {
  const lineas = venta.items.map(
    (i) =>
      `- ${i.cantidad} × ${i.nombre}: ${formatearPrecioAr(i.precio_unitario * i.cantidad)}`
  );
  const total = totalVenta(venta);
  const partes = [
    `Hola${nombre ? ` ${nombre}` : ""}! Te paso el detalle de tu compra en Rosea Beauty:`,
    "",
    ...lineas,
    "",
    `Total: ${formatearPrecioAr(total)}`,
  ];
  if (!venta.cobrada) {
    partes.push(
      "",
      `Queda pendiente ${formatearPrecioAr(total)}. Podés transferir al alias ${alias} y mandarnos el comprobante.`
    );
  } else {
    partes.push("", "¡Gracias por tu compra! 💕");
  }
  return partes.join("\n");
}

// Mismo formato que formatearPrecio de lib/catalog (no se importa para no
// atar finanzas al catalogo publico).
function formatearPrecioAr(monto: number): string {
  return monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
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

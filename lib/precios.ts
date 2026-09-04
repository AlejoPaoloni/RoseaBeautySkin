// Calculadora de precio de venta para producto importado.
//
// El margen se define sobre el PRECIO, no sobre el costo: "quiero que me
// quede el 40% de lo que cobro". Es el mismo criterio que usa resumenMes()
// en lib/finanzas.ts, asi el numero que promete la calculadora es el mismo
// que despues reporta el dashboard.

export interface EntradaPrecio {
  // Lo que sale el producto en la tienda de origen.
  precioUsd: number;
  // Pesos por dolar, lo carga la usuaria (cambia todas las semanas).
  tipoCambio: number;
  // Courier del pedido entero, se prorratea entre las unidades que vinieron.
  envioPedidoUsd: number;
  unidadesPedido: number;
  // Packaging + envio a la clienta, por unidad y ya en pesos.
  costosLocalesArs: number;
  margenPct: number;
  // Multiplo al que redondear el precio final. 0 = sin redondeo.
  redondeoArs: number;
}

export interface ResultadoPrecio {
  costoProducto: number;
  envioPorUnidad: number;
  costosLocales: number;
  costoTotal: number;
  // Precio que da la cuenta exacta, con decimales.
  precioExacto: number;
  // El que se muestra y se guarda: redondeado hacia arriba.
  precioSugerido: number;
  ganancia: number;
  // Margen recalculado sobre el precio sugerido: redondear mueve el margen
  // unos decimales y mostrar el objetivo en vez del real seria mentir.
  margenReal: number;
}

// Arriba de este margen la cuenta se dispara al infinito (precio = costo / 0)
// y deja de tener sentido practico.
export const MARGEN_MAXIMO = 95;

export function calcularPrecio(entrada: EntradaPrecio): ResultadoPrecio {
  const costoProducto = entrada.precioUsd * entrada.tipoCambio;

  // Sin unidades cargadas no hay como prorratear: el courier no se reparte
  // en vez de romper la cuenta con una division por cero.
  const envioPorUnidad =
    entrada.unidadesPedido > 0
      ? (entrada.envioPedidoUsd / entrada.unidadesPedido) * entrada.tipoCambio
      : 0;

  const costosLocales = entrada.costosLocalesArs;
  const costoTotal = costoProducto + envioPorUnidad + costosLocales;

  const margen = Math.min(Math.max(entrada.margenPct, 0), MARGEN_MAXIMO);
  const precioExacto = costoTotal / (1 - margen / 100);

  // Siempre hacia arriba: redondear para abajo come margen en silencio.
  const precioSugerido =
    entrada.redondeoArs > 0
      ? Math.ceil(precioExacto / entrada.redondeoArs) * entrada.redondeoArs
      : Math.ceil(precioExacto);

  const ganancia = precioSugerido - costoTotal;

  return {
    costoProducto,
    envioPorUnidad,
    costosLocales,
    costoTotal,
    precioExacto,
    precioSugerido,
    ganancia,
    margenReal: precioSugerido === 0 ? 0 : (ganancia / precioSugerido) * 100,
  };
}

// Cuanto se mueve el precio sugerido contra el que ya tiene cargado el
// producto. null cuando el producto todavia no tiene precio con el que
// comparar.
export function variacionContraActual(
  precioSugerido: number,
  precioActual: number | null
): number | null {
  if (precioActual === null || precioActual === 0) return null;
  return ((precioSugerido - precioActual) / precioActual) * 100;
}

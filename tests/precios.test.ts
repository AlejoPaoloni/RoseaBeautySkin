import { describe, expect, it } from "vitest";
import {
  calcularPrecio,
  MARGEN_MAXIMO,
  variacionContraActual,
  type EntradaPrecio,
} from "@/lib/precios";

function entrada(over: Partial<EntradaPrecio> = {}): EntradaPrecio {
  return {
    precioUsd: 20,
    tipoCambio: 1000,
    envioPedidoUsd: 120,
    unidadesPedido: 12,
    costosLocalesArs: 2000,
    margenPct: 40,
    redondeoArs: 0,
    ...over,
  };
}

describe("calcularPrecio", () => {
  it("suma producto, courier prorrateado y costos locales", () => {
    const r = calcularPrecio(entrada());
    expect(r.costoProducto).toBe(20000);
    // 120 USD / 12 unidades = 10 USD por unidad.
    expect(r.envioPorUnidad).toBe(10000);
    expect(r.costosLocales).toBe(2000);
    expect(r.costoTotal).toBe(32000);
  });

  it("aplica el margen sobre el precio, no sobre el costo", () => {
    // 40% de margen: el costo es el 60% del precio.
    const r = calcularPrecio(entrada({ redondeoArs: 0 }));
    expect(r.precioExacto).toBeCloseTo(32000 / 0.6, 5);
    // El error tipico seria costo * 1.4 = 44800, que da 28.6% de margen real.
    expect(r.precioExacto).not.toBeCloseTo(44800, 0);
  });

  it("redondea siempre hacia arriba para no comerse margen", () => {
    const r = calcularPrecio(entrada({ redondeoArs: 500 }));
    // Exacto 53333.33 -> 53500, nunca 53000.
    expect(r.precioSugerido).toBe(53500);
    expect(r.precioSugerido).toBeGreaterThan(r.precioExacto);
  });

  it("recalcula el margen real despues de redondear", () => {
    const r = calcularPrecio(entrada({ redondeoArs: 500 }));
    expect(r.ganancia).toBe(53500 - 32000);
    expect(r.margenReal).toBeCloseTo((21500 / 53500) * 100, 5);
    // Redondear hacia arriba deja el margen real apenas por encima del pedido.
    expect(r.margenReal).toBeGreaterThan(40);
  });

  it("sin redondeo devuelve el entero de arriba", () => {
    const r = calcularPrecio(entrada({ redondeoArs: 0 }));
    expect(r.precioSugerido).toBe(53334);
  });

  it("no divide por cero si no hay unidades del pedido", () => {
    const r = calcularPrecio(entrada({ unidadesPedido: 0 }));
    expect(r.envioPorUnidad).toBe(0);
    expect(r.costoTotal).toBe(22000);
    expect(Number.isFinite(r.precioSugerido)).toBe(true);
  });

  it("limita el margen para que el precio no se dispare al infinito", () => {
    const r = calcularPrecio(entrada({ margenPct: 100 }));
    expect(Number.isFinite(r.precioSugerido)).toBe(true);
    expect(r.margenReal).toBeLessThanOrEqual(MARGEN_MAXIMO + 1);
  });

  it("trata un margen negativo como cero", () => {
    const r = calcularPrecio(entrada({ margenPct: -20, redondeoArs: 0 }));
    expect(r.precioSugerido).toBe(32000);
    expect(r.ganancia).toBe(0);
  });

  it("con todo en cero no rompe ni devuelve NaN", () => {
    const r = calcularPrecio({
      precioUsd: 0,
      tipoCambio: 0,
      envioPedidoUsd: 0,
      unidadesPedido: 0,
      costosLocalesArs: 0,
      margenPct: 40,
      redondeoArs: 500,
    });
    expect(r.costoTotal).toBe(0);
    expect(r.precioSugerido).toBe(0);
    expect(r.margenReal).toBe(0);
  });
});

describe("variacionContraActual", () => {
  it("compara contra el precio ya cargado", () => {
    expect(variacionContraActual(120000, 100000)).toBe(20);
    expect(variacionContraActual(80000, 100000)).toBe(-20);
  });

  it("devuelve null si el producto no tiene precio util", () => {
    expect(variacionContraActual(120000, null)).toBeNull();
    expect(variacionContraActual(120000, 0)).toBeNull();
  });
});

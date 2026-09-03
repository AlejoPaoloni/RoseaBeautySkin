import { describe, expect, it } from "vitest";
import {
  costoVenta,
  fechaHoy,
  gastosPorCategoria,
  mesActual,
  mesAnterior,
  mesCorto,
  mesDe,
  nombreMes,
  resumenMes,
  serieMensual,
  topProductos,
  totalVenta,
  ultimosMeses,
  variacion,
} from "@/lib/finanzas";
import type { Gasto, Venta, VentaItem } from "@/lib/types";

let n = 0;

function item(over: Partial<VentaItem> = {}): VentaItem {
  n += 1;
  return {
    id: `item-${n}`,
    venta_id: "v-1",
    producto_id: `p-${n}`,
    nombre: `Producto ${n}`,
    cantidad: 1,
    precio_unitario: 10000,
    costo_unitario: 6000,
    ...over,
  };
}

function venta(over: Partial<Venta> = {}): Venta {
  n += 1;
  return {
    id: `v-${n}`,
    fecha: "2026-09-10",
    cliente: null,
    cliente_id: null,
    canal: "Instagram",
    nota: null,
    created_at: "2026-09-10T12:00:00Z",
    items: [item()],
    ...over,
  };
}

function gasto(over: Partial<Gasto> = {}): Gasto {
  n += 1;
  return {
    id: `g-${n}`,
    fecha: "2026-09-05",
    categoria: "Envios",
    descripcion: "Correo",
    monto: 3000,
    created_at: "2026-09-05T12:00:00Z",
    ...over,
  };
}

describe("fechas", () => {
  it("mesDe recorta el texto sin pasar por Date", () => {
    // Una venta del dia 1 en UTC-3 tiene que quedar en su propio mes.
    expect(mesDe("2026-09-01")).toBe("2026-09");
  });

  it("mesActual y fechaHoy usan la fecha local", () => {
    const hoy = new Date(2026, 8, 3);
    expect(mesActual(hoy)).toBe("2026-09");
    expect(fechaHoy(hoy)).toBe("2026-09-03");
  });

  it("mesAnterior cruza el cambio de anio", () => {
    expect(mesAnterior("2026-09")).toBe("2026-08");
    expect(mesAnterior("2026-01")).toBe("2025-12");
  });

  it("ultimosMeses devuelve el rango en orden cronologico", () => {
    expect(ultimosMeses(3, "2026-02")).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("nombreMes y mesCorto formatean en espanol", () => {
    expect(nombreMes("2026-09")).toBe("septiembre 2026");
    expect(mesCorto("2026-09")).toBe("sep");
  });
});

describe("totales de una venta", () => {
  it("suma precio por cantidad", () => {
    const v = venta({
      items: [
        item({ precio_unitario: 10000, cantidad: 2, costo_unitario: 6000 }),
        item({ precio_unitario: 5000, cantidad: 1, costo_unitario: 2000 }),
      ],
    });
    expect(totalVenta(v)).toBe(25000);
    expect(costoVenta(v)).toBe(14000);
  });
});

describe("resumenMes", () => {
  it("separa caja de margen sin contar dos veces la mercaderia", () => {
    const ventas = [
      venta({
        fecha: "2026-09-10",
        items: [item({ precio_unitario: 20000, costo_unitario: 12000 })],
      }),
    ];
    const gastos = [
      gasto({ fecha: "2026-09-02", categoria: "Mercaderia", monto: 50000 }),
      gasto({ fecha: "2026-09-05", categoria: "Envios", monto: 3000 }),
    ];
    const r = resumenMes(ventas, gastos, "2026-09");

    expect(r.ingresos).toBe(20000);
    expect(r.costoVendido).toBe(12000);
    expect(r.gastosTotal).toBe(53000);
    expect(r.gastosOperativos).toBe(3000);
    // Caja: mes de compra fuerte, quedo en rojo.
    expect(r.resultadoCaja).toBe(-33000);
    // Margen: 20000 - 12000 de costo vendido - 3000 de envio.
    expect(r.gananciaMargen).toBe(5000);
    expect(r.margenPct).toBe(25);
  });

  it("ignora ventas y gastos de otros meses", () => {
    const ventas = [venta({ fecha: "2026-08-31" })];
    const gastos = [gasto({ fecha: "2026-10-01" })];
    const r = resumenMes(ventas, gastos, "2026-09");
    expect(r.ingresos).toBe(0);
    expect(r.gastosTotal).toBe(0);
    expect(r.margenPct).toBeNull();
  });

  it("cuenta ventas y unidades", () => {
    const ventas = [
      venta({ items: [item({ cantidad: 2 }), item({ cantidad: 1 })] }),
      venta({ items: [item({ cantidad: 3 })] }),
    ];
    const r = resumenMes(ventas, [], "2026-09");
    expect(r.cantidadVentas).toBe(2);
    expect(r.unidades).toBe(6);
  });
});

describe("serieMensual", () => {
  it("devuelve un resumen por mes pedido", () => {
    const ventas = [venta({ fecha: "2026-08-15" })];
    const serie = serieMensual(ventas, [], ["2026-08", "2026-09"]);
    expect(serie.map((s) => s.mes)).toEqual(["2026-08", "2026-09"]);
    expect(serie[0].ingresos).toBe(10000);
    expect(serie[1].ingresos).toBe(0);
  });
});

describe("variacion", () => {
  it("calcula el cambio contra el mes anterior", () => {
    expect(variacion(150, 100)).toBe(50);
    expect(variacion(50, 100)).toBe(-50);
  });

  it("devuelve null si no hay base de comparacion", () => {
    expect(variacion(100, 0)).toBeNull();
  });
});

describe("topProductos", () => {
  it("agrupa por nombre y ordena por ingresos", () => {
    const ventas = [
      venta({
        items: [
          item({ nombre: "Labial", precio_unitario: 5000, cantidad: 1 }),
          item({ nombre: "Base", precio_unitario: 30000, cantidad: 1 }),
        ],
      }),
      venta({
        items: [item({ nombre: "Labial", precio_unitario: 5000, cantidad: 2 })],
      }),
    ];
    const top = topProductos(ventas);
    expect(top[0].nombre).toBe("Base");
    expect(top[1]).toMatchObject({ nombre: "Labial", unidades: 3, ingresos: 15000 });
  });

  it("respeta el limite y el filtro por mes", () => {
    const ventas = [
      venta({ fecha: "2026-08-01", items: [item({ nombre: "Viejo" })] }),
      venta({ fecha: "2026-09-01", items: [item({ nombre: "Nuevo" })] }),
    ];
    expect(topProductos(ventas, "2026-09").map((f) => f.nombre)).toEqual([
      "Nuevo",
    ]);
    expect(topProductos(ventas, null, 1)).toHaveLength(1);
  });

  it("calcula ganancia por producto con el costo snapshot", () => {
    const ventas = [
      venta({
        items: [
          item({
            nombre: "Serum",
            precio_unitario: 25000,
            costo_unitario: 15000,
            cantidad: 2,
          }),
        ],
      }),
    ];
    expect(topProductos(ventas)[0].ganancia).toBe(20000);
  });
});

describe("gastosPorCategoria", () => {
  it("suma por categoria, calcula porcentaje y descarta las vacias", () => {
    const gastos = [
      gasto({ categoria: "Envios", monto: 3000 }),
      gasto({ categoria: "Envios", monto: 1000 }),
      gasto({ categoria: "Publicidad", monto: 6000 }),
    ];
    const filas = gastosPorCategoria(gastos, "2026-09");
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({ categoria: "Publicidad", monto: 6000, pct: 60 });
    expect(filas[1]).toMatchObject({ categoria: "Envios", monto: 4000, pct: 40 });
  });

  it("no rompe cuando no hay gastos", () => {
    expect(gastosPorCategoria([], "2026-09")).toEqual([]);
  });
});

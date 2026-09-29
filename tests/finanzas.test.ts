import { describe, expect, it } from "vitest";
import {
  costoVenta,
  fechaHoy,
  gastosPorCategoria,
  mesActual,
  mesAnterior,
  mesCorto,
  mesDe,
  proyeccionMes,
  puntoEquilibrio,
  ventasPorDimension,
  mensajeVentaClienta,
  metricasClientasMes,
  pendientesDeCobro,
  nombreMes,
  resumenMes,
  serieMensual,
  topProductos,
  totalVenta,
  ultimosMeses,
  variacion,
} from "@/lib/finanzas";
import type { Gasto, Producto, Venta, VentaItem } from "@/lib/types";

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
    medio_pago: "Transferencia",
    cobrada: true,
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

describe("topProductos con periodo y criterio", () => {
  const ventas = [
    venta({
      fecha: "2026-08-15",
      items: [item({ nombre: "Labial", precio_unitario: 5000, costo_unitario: 1000, cantidad: 6 })],
    }),
    venta({
      fecha: "2026-09-02",
      items: [item({ nombre: "Base", precio_unitario: 40000, costo_unitario: 35000, cantidad: 1 })],
    }),
  ];

  it("acepta varios meses juntos", () => {
    expect(topProductos(ventas, ["2026-08", "2026-09"]).map((f) => f.nombre)).toEqual([
      "Base",
      "Labial",
    ]);
    expect(topProductos(ventas, ["2026-09"]).map((f) => f.nombre)).toEqual(["Base"]);
  });

  it("ordena por el criterio elegido", () => {
    // Labial: 30000 ingresos, 6 u, 24000 ganancia. Base: 40000, 1 u, 5000.
    expect(topProductos(ventas, null, 5, "ingresos")[0].nombre).toBe("Base");
    expect(topProductos(ventas, null, 5, "unidades")[0].nombre).toBe("Labial");
    expect(topProductos(ventas, null, 5, "ganancia")[0].nombre).toBe("Labial");
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

describe("cobro de ventas", () => {
  const cobradaTransf = venta({
    fecha: "2026-09-05",
    medio_pago: "Transferencia",
    items: [item({ precio_unitario: 10000 })],
  });
  const cobradaEfvo = venta({
    fecha: "2026-09-06",
    medio_pago: "Efectivo",
    items: [item({ precio_unitario: 4000 })],
  });
  const pendiente = venta({
    fecha: "2026-09-07",
    cobrada: false,
    items: [item({ precio_unitario: 7000 })],
  });
  const vieja = venta({
    fecha: "2026-09-08",
    medio_pago: null,
    items: [item({ precio_unitario: 1000 })],
  });
  const ventas = [cobradaTransf, cobradaEfvo, pendiente, vieja];

  it("la caja cuenta solo lo cobrado; las ventas siguen contando todo", () => {
    const r = resumenMes(ventas, [], "2026-09");
    expect(r.ingresos).toBe(22000);
    expect(r.resultadoCaja).toBe(15000);
    expect(r.pendienteCobro).toBe(7000);
  });

  it("separa lo cobrado por medio de pago, con las viejas aparte", () => {
    const r = resumenMes(ventas, [], "2026-09");
    expect(r.cobradoPorMedio).toEqual({
      Transferencia: 10000,
      Efectivo: 4000,
      "Sin dato": 1000,
    });
  });

  it("pendientesDeCobro lista todas las adeudadas, la mas vieja primero", () => {
    const otra = venta({ fecha: "2026-08-01", cobrada: false });
    expect(pendientesDeCobro([...ventas, otra]).map((v) => v.id)).toEqual([
      otra.id,
      pendiente.id,
    ]);
  });
});

describe("metricasClientasMes", () => {
  it("ticket promedio, clientas nuevas y las que volvieron", () => {
    const ventas = [
      venta({ fecha: "2026-08-10", cliente_id: "ana", items: [item({ precio_unitario: 5000 })] }),
      venta({ fecha: "2026-09-02", cliente_id: "ana", items: [item({ precio_unitario: 10000 })] }),
      venta({ fecha: "2026-09-03", cliente_id: "bea", items: [item({ precio_unitario: 20000 })] }),
      // Bea compra dos veces en el mes: sigue siendo UNA clienta nueva.
      venta({ fecha: "2026-09-20", cliente_id: "bea", items: [item({ precio_unitario: 6000 })] }),
      // Nombre suelto (ventas viejas): cuenta por nombre, sin mayusculas.
      venta({ fecha: "2026-07-01", cliente: "Caro", items: [item()] }),
      venta({ fecha: "2026-09-04", cliente: " caro ", items: [item({ precio_unitario: 4000 })] }),
      // Sin clienta: suma al ticket pero no a nuevas/volvieron.
      venta({ fecha: "2026-09-05", items: [item({ precio_unitario: 5000 })] }),
    ];
    const m = metricasClientasMes(ventas, "2026-09");
    expect(m.ticketPromedio).toBe(9000); // 45000 / 5 ventas
    expect(m.nuevas).toBe(1); // bea
    expect(m.volvieron).toBe(2); // ana, caro
  });

  it("sin ventas en el mes no divide por cero", () => {
    expect(metricasClientasMes([], "2026-09").ticketPromedio).toBe(0);
  });
});

describe("mensajeVentaClienta", () => {
  const v = venta({
    items: [
      item({ nombre: "Pocket Blush", cantidad: 2, precio_unitario: 30000 }),
      item({ nombre: "Lip Tint", cantidad: 1, precio_unitario: 25000 }),
    ],
  });

  it("lista el detalle y el total, con el nombre de la clienta", () => {
    const m = mensajeVentaClienta({ ...v, cobrada: true }, "Ana", "MI.ALIAS");
    expect(m).toContain("Hola Ana");
    expect(m).toMatch(/2 × Pocket Blush/);
    expect(m).toMatch(/Total: \$\s?85\.000/);
    expect(m).not.toContain("MI.ALIAS");
  });

  it("si esta por cobrar, dice cuanto falta y pasa el alias", () => {
    const m = mensajeVentaClienta({ ...v, cobrada: false }, null, "MI.ALIAS");
    expect(m).toMatch(/^Hola!/);
    expect(m).toContain("MI.ALIAS");
    expect(m).toMatch(/pendiente/i);
  });
});

function prod(over: Partial<Producto>): Producto {
  return {
    id: "x", slug: null, nombre: "X", marca: null, descripcion_corta: null,
    imagen_url: null, descripcion_larga: null, imagenes_extra: null,
    categoria: "Maquillajes", subcategoria: "Labios", estado: "Disponible",
    precio: 1000, costo: null, stock: null, stock_minimo: 1, destacado: false,
    tonos: null, orden_display: 0, created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("ventasPorDimension", () => {
  const productos = [
    prod({ id: "rhode", marca: "rhode", categoria: "Maquillajes", subcategoria: "Rostro" }),
    prod({ id: "elf", marca: "e.l.f.", categoria: "Skincare", subcategoria: "Skincare" }),
  ];
  const ventas = [
    venta({
      fecha: "2026-09-02",
      canal: "Instagram",
      items: [
        item({ producto_id: "rhode", cantidad: 1, precio_unitario: 30000, costo_unitario: 20000 }),
        item({ producto_id: "elf", cantidad: 2, precio_unitario: 10000, costo_unitario: 4000 }),
      ],
    }),
    venta({
      fecha: "2026-09-10",
      canal: "WhatsApp",
      items: [item({ producto_id: null, nombre: "Borrado", precio_unitario: 5000, costo_unitario: 1000 })],
    }),
    venta({ fecha: "2026-08-01", canal: "Presencial", items: [item({ producto_id: "rhode" })] }),
  ];

  it("por canal suma cada venta en su canal", () => {
    const r = ventasPorDimension(ventas, productos, ["2026-09"], "canal");
    expect(r.map((f) => [f.clave, f.ingresos])).toEqual([
      ["Instagram", 50000],
      ["WhatsApp", 5000],
    ]);
  });

  it("por marca calcula ganancia y deja aparte lo que no tiene producto", () => {
    const r = ventasPorDimension(ventas, productos, ["2026-09"], "marca");
    expect(r).toEqual([
      { clave: "rhode", ingresos: 30000, ganancia: 10000, unidades: 1 },
      { clave: "e.l.f.", ingresos: 20000, ganancia: 12000, unidades: 2 },
      { clave: "Sin producto", ingresos: 5000, ganancia: 4000, unidades: 1 },
    ]);
  });

  it("por categoria usa la subcategoria de maquillaje", () => {
    const r = ventasPorDimension(ventas, productos, ["2026-09"], "categoria");
    expect(r.map((f) => f.clave)).toEqual(["Rostro", "Skincare", "Sin producto"]);
  });

  it("null = todos los meses", () => {
    const r = ventasPorDimension(ventas, productos, null, "canal");
    expect(r.map((f) => f.clave)).toContain("Presencial");
  });
});

describe("proyeccionMes", () => {
  const ventas = [
    venta({ fecha: "2026-09-02", items: [item({ precio_unitario: 30000 })] }),
    venta({ fecha: "2026-09-09", items: [item({ precio_unitario: 30000 })] }),
  ];

  it("extrapola lo vendido al ritmo de los dias que pasaron", () => {
    // 60000 en 10 dias de 30 -> 180000
    expect(proyeccionMes(ventas, "2026-09", "2026-09-10")).toBe(180000);
  });

  it("no proyecta un mes cerrado, uno futuro ni los primeros 2 dias", () => {
    expect(proyeccionMes(ventas, "2026-08", "2026-09-10")).toBeNull();
    expect(proyeccionMes(ventas, "2026-10", "2026-09-10")).toBeNull();
    expect(proyeccionMes(ventas, "2026-09", "2026-09-02")).toBeNull();
  });
});

describe("puntoEquilibrio", () => {
  it("gastos operativos promedio dividido el margen bruto", () => {
    const ventas = [
      // margen bruto 40%: vende 100000, costo 60000
      venta({ fecha: "2026-09-05", items: [item({ precio_unitario: 100000, costo_unitario: 60000 })] }),
    ];
    const gastos = [
      gasto({ fecha: "2026-09-01", categoria: "Publicidad", monto: 30000 }),
      gasto({ fecha: "2026-08-01", categoria: "Packaging", monto: 6000 }),
      gasto({ fecha: "2026-07-01", categoria: "Envios", monto: 0 }),
      // Mercaderia no es gasto fijo: ya esta en el costo de lo vendido.
      gasto({ fecha: "2026-09-02", categoria: "Mercaderia", monto: 999999 }),
    ];
    const r = puntoEquilibrio(ventas, gastos, "2026-09")!;
    expect(r.gastosFijosPromedio).toBe(12000); // (30000 + 6000 + 0) / 3
    expect(r.margenBrutoPct).toBe(40);
    expect(r.ventasNecesarias).toBe(30000); // 12000 / 0.4
  });

  it("sin ventas no hay margen con que calcular", () => {
    expect(puntoEquilibrio([], [], "2026-09")).toBeNull();
  });
});

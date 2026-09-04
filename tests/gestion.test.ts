import { describe, expect, it } from "vitest";
import {
  agendadas,
  agruparPorDia,
  checklistPorDefecto,
  coincide,
  esIdea,
  grillaMes,
  ideas,
  ordenarTareas,
  pedidosAbiertos,
  productosStockBajo,
  progresoChecklist,
  saldoPedido,
  stockBajo,
  tareaVencida,
  totalPedido,
} from "@/lib/gestion";
import type { Pedido, Producto, Publicacion, Tarea } from "@/lib/types";

let n = 0;

function publicacion(over: Partial<Publicacion> = {}): Publicacion {
  n += 1;
  return {
    id: `pub-${n}`,
    fecha: "2026-09-10",
    red: "Instagram",
    formato: "Reel",
    titulo: `Publicación ${n}`,
    copy: null,
    estado: "Idea",
    checklist: null,
    nota: null,
    created_at: "2026-09-01T00:00:00Z",
    productos: [],
    ...over,
  };
}

function producto(over: Partial<Producto> = {}): Producto {
  n += 1;
  return {
    id: `p-${n}`,
    nombre: `Producto ${n}`,
    marca: null,
    descripcion_corta: null,
    imagen_url: null,
    categoria: "Maquillajes",
    subcategoria: "Labios",
    estado: "Disponible",
    precio: 10000,
    costo: null,
    stock: null,
    stock_minimo: 2,
    destacado: false,
    tonos: null,
    orden_display: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

function pedido(over: Partial<Pedido> = {}): Pedido {
  n += 1;
  return {
    id: `ped-${n}`,
    fecha: "2026-09-01",
    cliente_id: null,
    cliente_texto: "Sofi",
    estado: "Pedido",
    sena: 0,
    nota: null,
    venta_id: null,
    created_at: "2026-09-01T00:00:00Z",
    items: [
      {
        id: `pi-${n}`,
        pedido_id: `ped-${n}`,
        producto_id: null,
        nombre: "Labial",
        cantidad: 1,
        precio_estimado: 10000,
      },
    ],
    ...over,
  };
}

function tarea(over: Partial<Tarea> = {}): Tarea {
  n += 1;
  return {
    id: `t-${n}`,
    texto: `Tarea ${n}`,
    hecha: false,
    fecha_limite: null,
    created_at: "2026-09-01T00:00:00Z",
    ...over,
  };
}

describe("checklist", () => {
  it("arranca con todos los pasos sin hacer", () => {
    const pasos = checklistPorDefecto();
    expect(pasos.length).toBeGreaterThan(0);
    expect(pasos.every((p) => !p.hecho)).toBe(true);
  });

  it("calcula el progreso", () => {
    const p = publicacion({
      checklist: [
        { paso: "Guion", hecho: true },
        { paso: "Grabar", hecho: true },
        { paso: "Editar", hecho: false },
        { paso: "Publicar", hecho: false },
      ],
    });
    expect(progresoChecklist(p)).toEqual({ hechos: 2, total: 4, pct: 50 });
  });

  it("no divide por cero sin checklist", () => {
    expect(progresoChecklist(publicacion({ checklist: null }))).toEqual({
      hechos: 0,
      total: 0,
      pct: 0,
    });
  });
});

describe("ideas vs agendadas", () => {
  it("una publicación sin fecha es una idea", () => {
    expect(esIdea(publicacion({ fecha: null }))).toBe(true);
    expect(esIdea(publicacion({ fecha: "2026-09-10" }))).toBe(false);
  });

  it("separa el banco de ideas del calendario del mes", () => {
    const lista = [
      publicacion({ fecha: null }),
      publicacion({ fecha: "2026-09-10" }),
      publicacion({ fecha: "2026-08-10" }),
    ];
    expect(ideas(lista)).toHaveLength(1);
    expect(agendadas(lista, "2026-09")).toHaveLength(1);
  });
});

describe("grillaMes", () => {
  it("arranca la semana en lunes", () => {
    // 1/9/2026 cae martes: un solo casillero vacío antes del día 1.
    const celdas = grillaMes("2026-09");
    expect(celdas[0]).toBeNull();
    expect(celdas[1]).toBe("2026-09-01");
    expect(celdas).toHaveLength(1 + 30);
  });

  it("no deja huecos cuando el mes arranca lunes", () => {
    // 1/6/2026 cae lunes.
    expect(grillaMes("2026-06")[0]).toBe("2026-06-01");
  });

  it("cuenta bien febrero bisiesto", () => {
    const celdas = grillaMes("2028-02").filter((c) => c !== null);
    expect(celdas).toHaveLength(29);
  });
});

describe("agruparPorDia", () => {
  it("junta las publicaciones de la misma fecha y descarta ideas", () => {
    const grupos = agruparPorDia([
      publicacion({ fecha: "2026-09-10" }),
      publicacion({ fecha: "2026-09-10" }),
      publicacion({ fecha: null }),
    ]);
    expect(grupos["2026-09-10"]).toHaveLength(2);
    expect(Object.keys(grupos)).toHaveLength(1);
  });
});

describe("stock", () => {
  it("avisa cuando llega al mínimo", () => {
    expect(stockBajo(producto({ stock: 2, stock_minimo: 2 }))).toBe(true);
    expect(stockBajo(producto({ stock: 5, stock_minimo: 2 }))).toBe(false);
  });

  it("un producto sin control de stock nunca está bajo", () => {
    expect(stockBajo(producto({ stock: null }))).toBe(false);
  });

  it("ordena los faltantes por lo que queda", () => {
    const lista = [
      producto({ stock: 2 }),
      producto({ stock: 0 }),
      producto({ stock: 50 }),
    ];
    expect(productosStockBajo(lista).map((p) => p.stock)).toEqual([0, 2]);
  });
});

describe("pedidos", () => {
  it("suma el total y descuenta la seña", () => {
    const p = pedido({
      sena: 4000,
      items: [
        {
          id: "i1",
          pedido_id: "ped",
          producto_id: null,
          nombre: "Base",
          cantidad: 2,
          precio_estimado: 10000,
        },
      ],
    });
    expect(totalPedido(p)).toBe(20000);
    expect(saldoPedido(p)).toBe(16000);
  });

  it("el saldo no baja de cero aunque la seña sea mayor", () => {
    expect(saldoPedido(pedido({ sena: 999999 }))).toBe(0);
  });

  it("los entregados dejan de estar abiertos", () => {
    const lista = [pedido({ estado: "Entregado" }), pedido({ estado: "En camino" })];
    expect(pedidosAbiertos(lista)).toHaveLength(1);
  });
});

describe("tareas", () => {
  it("pone pendientes arriba y las urgentes primero", () => {
    const lista = [
      tarea({ texto: "hecha", hecha: true }),
      tarea({ texto: "sin fecha" }),
      tarea({ texto: "urgente", fecha_limite: "2026-09-02" }),
      tarea({ texto: "después", fecha_limite: "2026-09-20" }),
    ];
    expect(ordenarTareas(lista).map((t) => t.texto)).toEqual([
      "urgente",
      "después",
      "sin fecha",
      "hecha",
    ]);
  });

  it("marca vencida solo si sigue pendiente", () => {
    const vieja = tarea({ fecha_limite: "2026-09-01" });
    expect(tareaVencida(vieja, "2026-09-03")).toBe(true);
    expect(tareaVencida({ ...vieja, hecha: true }, "2026-09-03")).toBe(false);
    expect(tareaVencida(tarea({ fecha_limite: null }), "2026-09-03")).toBe(false);
  });
});

describe("coincide", () => {
  it("sin busqueda, todo matchea", () => {
    expect(coincide("", ["Sofi"])).toBe(true);
    expect(coincide("   ", ["Sofi"])).toBe(true);
  });

  it("busca sin importar mayusculas ni en que campo esta", () => {
    expect(coincide("sofi", ["Sofi Prueba", null])).toBe(true);
    expect(coincide("SOFI", [null, "contacto", "nota con Sofi adentro"])).toBe(true);
  });

  it("no matchea si ningun campo lo contiene", () => {
    expect(coincide("labial", ["Sofi Prueba", null])).toBe(false);
  });

  it("null-safe: campos vacios no rompen la busqueda", () => {
    expect(coincide("algo", [null, null])).toBe(false);
  });
});

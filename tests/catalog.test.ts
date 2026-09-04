import { describe, expect, it } from "vitest";
import {
  agruparPorSubcategoria,
  filtrarProductos,
  formatearPrecio,
  ordenarProductos,
  productosPorEncargo,
  productosDestacados,
  rangoPrecios,
  tienePrecioPublico,
} from "@/lib/catalog";
import { conOrden } from "@/lib/orden";
import type { Producto } from "@/lib/types";

let n = 0;
function producto(over: Partial<Producto> = {}): Producto {
  n += 1;
  return {
    id: `id-${n}`,
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

describe("ordenarProductos", () => {
  it("ordena por orden_display y luego created_at", () => {
    const a = producto({ orden_display: 2 });
    const b = producto({ orden_display: 1, created_at: "2026-01-02T00:00:00Z" });
    const c = producto({ orden_display: 1, created_at: "2026-01-01T00:00:00Z" });
    expect(ordenarProductos([a, b, c]).map((p) => p.id)).toEqual([
      c.id,
      b.id,
      a.id,
    ]);
  });
});

describe("filtrarProductos", () => {
  const ps = [
    producto({ categoria: "Maquillajes", subcategoria: "Labios" }),
    producto({ categoria: "Skincare", subcategoria: "Skincare" }),
  ];
  it("sin filtros devuelve todo", () => {
    expect(filtrarProductos(ps, null, null)).toHaveLength(2);
  });
  it("filtra por categoria", () => {
    expect(filtrarProductos(ps, "Skincare", null)).toHaveLength(1);
  });
  it("solo disponibles filtra por estado Disponible", () => {
    const qs = [
      producto({ estado: "Disponible" }),
      producto({ estado: "Por Encargo" }),
      producto({ estado: "Sin stock" }),
    ];
    expect(filtrarProductos(qs, null, null, true)).toHaveLength(1);
    // Sin el toggle: Disponible + Sin stock. Por Encargo queda afuera siempre.
    expect(filtrarProductos(qs, null, null, false)).toHaveLength(2);
  });
  it("filtra por subcategoria", () => {
    expect(filtrarProductos(ps, "Maquillajes", "Labios")).toHaveLength(1);
    expect(filtrarProductos(ps, "Maquillajes", "Rostro")).toHaveLength(0);
  });

  it("busqueda filtra por nombre, case-insensitive", () => {
    const rs = [
      producto({ nombre: "Rhode Lip Tint" }),
      producto({ nombre: "Serum Vitamina C" }),
    ];
    expect(filtrarProductos(rs, null, null, false, "rhode")).toHaveLength(1);
    expect(filtrarProductos(rs, null, null, false, "RHODE")).toHaveLength(1);
  });

  it("busqueda filtra por marca y es null-safe", () => {
    const rs = [producto({ marca: "Rhode" }), producto({ marca: null })];
    expect(filtrarProductos(rs, null, null, false, "rhode")).toHaveLength(1);
  });

  it("busqueda vacia o solo espacios no filtra", () => {
    const rs = [producto(), producto()];
    expect(filtrarProductos(rs, null, null, false, "")).toHaveLength(2);
    expect(filtrarProductos(rs, null, null, false, "   ")).toHaveLength(2);
    expect(filtrarProductos(rs, null, null, false, null)).toHaveLength(2);
  });

  it("precioMin excluye los mas baratos", () => {
    const rs = [producto({ precio: 5000 }), producto({ precio: 15000 })];
    expect(filtrarProductos(rs, null, null, false, null, 10000)).toHaveLength(1);
  });

  it("precioMax excluye los mas caros", () => {
    const rs = [producto({ precio: 5000 }), producto({ precio: 15000 })];
    expect(
      filtrarProductos(rs, null, null, false, null, null, 10000)
    ).toHaveLength(1);
  });

  it("precioMin y precioMax forman un rango", () => {
    const rs = [
      producto({ precio: 4000 }),
      producto({ precio: 8000 }),
      producto({ precio: 20000 }),
    ];
    expect(
      filtrarProductos(rs, null, null, false, null, 5000, 15000)
    ).toHaveLength(1);
  });

  it("los por encargo nunca aparecen en el catalogo, pase lo que pase el filtro", () => {
    // Tienen su propia seccion (PorEncargoSection); duplicarlos en la
    // grilla confunde mas de lo que ayuda, asi que quedan afuera sin
    // importar categoria, busqueda ni rango de precio.
    const rs = [
      producto({ precio: 5000, estado: "Por Encargo" }),
      producto({ categoria: "Skincare", subcategoria: "Skincare", estado: "Por Encargo" }),
    ];
    expect(filtrarProductos(rs, null, null, false, null, 0, 10000)).toHaveLength(0);
    expect(filtrarProductos(rs, "Skincare", "Skincare")).toHaveLength(0);
    expect(filtrarProductos(rs, null, null, false, "")).toHaveLength(0);
  });

  it("combina busqueda, precio y categoria con AND", () => {
    const rs = [
      producto({ categoria: "Maquillajes", nombre: "Rhode Blush", precio: 12000 }),
      producto({ categoria: "Maquillajes", nombre: "Rhode Blush", precio: 30000 }),
      producto({ categoria: "Skincare", nombre: "Rhode Serum", precio: 12000 }),
    ];
    expect(
      filtrarProductos(rs, "Maquillajes", null, false, "rhode", 10000, 20000)
    ).toHaveLength(1);
  });
});

describe("productosPorEncargo", () => {
  it("devuelve solo estado Por Encargo", () => {
    const ps = [producto(), producto({ estado: "Por Encargo" })];
    expect(productosPorEncargo(ps)).toHaveLength(1);
  });
});

describe("agruparPorSubcategoria", () => {
  it("agrupa con todas las subcategorias presentes", () => {
    const ps = [producto({ subcategoria: "Labios", orden_display: 1 })];
    const grupos = agruparPorSubcategoria(ps, "Maquillajes");
    expect(Object.keys(grupos)).toEqual(["Rostro", "Ojos", "Labios"]);
    expect(grupos["Labios"]).toHaveLength(1);
    expect(grupos["Rostro"]).toHaveLength(0);
  });
});

describe("conOrden", () => {
  it("asigna orden secuencial", () => {
    const ps = [producto(), producto()];
    expect(conOrden(ps)).toEqual([
      { id: ps[0].id, orden_display: 0 },
      { id: ps[1].id, orden_display: 1 },
    ]);
  });
});

describe("formatearPrecio", () => {
  it("formatea con separador de miles y sin decimales", () => {
    const resultado = formatearPrecio(12500);
    expect(resultado).toContain("12.500");
    expect(resultado).toContain("$");
  });

  it("formatea precio cero", () => {
    const resultado = formatearPrecio(0);
    expect(resultado).toContain("0");
    expect(resultado).toContain("$");
  });
});

describe("rangoPrecios", () => {
  it("redondea el piso hacia abajo y el tope hacia arriba al paso", () => {
    const ps = [producto({ precio: 63740 }), producto({ precio: 113980 })];
    expect(rangoPrecios(ps)).toEqual({ piso: 63000, tope: 114000 });
  });

  it("no altera precios ya alineados al paso", () => {
    const ps = [producto({ precio: 10000 }), producto({ precio: 50000 })];
    expect(rangoPrecios(ps)).toEqual({ piso: 10000, tope: 50000 });
  });

  it("devuelve 0 en ambos si no hay productos", () => {
    expect(rangoPrecios([])).toEqual({ piso: 0, tope: 0 });
  });

  it("ignora los por encargo al calcular los extremos", () => {
    const ps = [
      producto({ precio: 10000 }),
      producto({ precio: 50000 }),
      // Su precio interno no tiene que estirar una barra donde no aparece.
      producto({ precio: 999000, estado: "Por Encargo" }),
    ];
    expect(rangoPrecios(ps)).toEqual({ piso: 10000, tope: 50000 });
  });

  it("devuelve 0 si todos los productos son por encargo", () => {
    const ps = [producto({ precio: 40000, estado: "Por Encargo" })];
    expect(rangoPrecios(ps)).toEqual({ piso: 0, tope: 0 });
  });
});

describe("tienePrecioPublico", () => {
  it("es falso solo para los por encargo", () => {
    expect(tienePrecioPublico(producto({ estado: "Disponible" }))).toBe(true);
    expect(tienePrecioPublico(producto({ estado: "Sin stock" }))).toBe(true);
    expect(tienePrecioPublico(producto({ estado: "Por Encargo" }))).toBe(false);
  });
});

describe("productosDestacados", () => {
  it("devuelve solo destacados, ordenados", () => {
    const a = producto({ destacado: true, orden_display: 2 });
    const b = producto({ destacado: true, orden_display: 1 });
    const c = producto();
    expect(productosDestacados([a, b, c]).map((p) => p.id)).toEqual([
      b.id,
      a.id,
    ]);
  });

  it("devuelve vacio si no hay destacados", () => {
    expect(productosDestacados([producto(), producto()])).toEqual([]);
  });
});

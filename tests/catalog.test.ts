import { describe, expect, it } from "vitest";
import {
  agruparPorSubcategoria,
  filtrarProductos,
  formatearPrecio,
  ordenarProductos,
  productosPorEncargo,
  productosDestacados,
} from "@/lib/catalog";
import { conOrden } from "@/lib/orden";
import type { Producto } from "@/lib/types";

let n = 0;
function producto(over: Partial<Producto> = {}): Producto {
  n += 1;
  return {
    id: `id-${n}`,
    nombre: `Producto ${n}`,
    descripcion_corta: null,
    imagen_url: null,
    categoria: "Maquillajes",
    subcategoria: "Labiales",
    estado: "Disponible",
    precio: 10000,
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
    producto({ categoria: "Maquillajes", subcategoria: "Labiales" }),
    producto({ categoria: "Skincare", subcategoria: "Hidratantes" }),
  ];
  it("sin filtros devuelve todo", () => {
    expect(filtrarProductos(ps, null, null)).toHaveLength(2);
  });
  it("filtra por categoria", () => {
    expect(filtrarProductos(ps, "Skincare", null)).toHaveLength(1);
  });
  it("filtra por subcategoria", () => {
    expect(filtrarProductos(ps, "Maquillajes", "Labiales")).toHaveLength(1);
    expect(filtrarProductos(ps, "Maquillajes", "Bases & Correctores")).toHaveLength(0);
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
    const ps = [producto({ subcategoria: "Labiales", orden_display: 1 })];
    const grupos = agruparPorSubcategoria(ps, "Maquillajes");
    expect(Object.keys(grupos)).toEqual([
      "Bases & Correctores",
      "Sombras & Delineadores",
      "Labiales",
    ]);
    expect(grupos["Labiales"]).toHaveLength(1);
    expect(grupos["Bases & Correctores"]).toHaveLength(0);
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

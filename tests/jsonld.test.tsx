import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProductoJsonLd from "@/components/landing/ProductoJsonLd";
import ProductosJsonLd from "@/components/landing/ProductosJsonLd";
import type { Producto } from "@/lib/types";

const base: Producto = {
  id: "873ccfa9-aafc-4740-90d5-dbbba294f4dd", slug: "elf-halo-glow", nombre: "Halo Glow",
  marca: "e.l.f.", descripcion_corta: "corta", imagen_url: "https://x/a.webp",
  descripcion_larga: null, imagenes_extra: null, categoria: "Maquillajes",
  subcategoria: "Rostro", estado: "Disponible", precio: 59800, costo: null,
  stock: null, stock_minimo: 1, destacado: false, tonos: null, orden_display: 1,
  created_at: "2026-01-01",
};
const encargo: Producto = { ...base, id: "u2", slug: "patrick-ta-duo", nombre: "Duo", estado: "Por Encargo" };
const sinStock: Producto = { ...base, id: "u3", slug: "benefit-gel", nombre: "Gel", estado: "Sin stock" };

const blocks = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<")));

describe("ProductoJsonLd", () => {
  it("Disponible: emite Product con offers.price + breadcrumb", () => {
    const b = blocks(renderToStaticMarkup(<ProductoJsonLd producto={base} />));
    expect(b.map((x) => x["@type"])).toEqual(["Product", "BreadcrumbList"]);
    expect(b[0].offers.price).toBe(59800);
  });
  for (const p of [encargo, sinStock]) {
    it(`${p.estado}: solo breadcrumb, sin Product invalido`, () => {
      const b = blocks(renderToStaticMarkup(<ProductoJsonLd producto={p} />));
      expect(b.map((x) => x["@type"])).toEqual(["BreadcrumbList"]);
      expect(JSON.stringify(b)).not.toContain("59800");
    });
  }
});

describe("ProductosJsonLd", () => {
  it("filtra los sin precio y deja positions consecutivas", () => {
    const b = blocks(renderToStaticMarkup(
      <ProductosJsonLd productos={[encargo, base, sinStock, { ...base, id: "u4", nombre: "Otro" }]} />
    ));
    const items = b[0].itemListElement;
    expect(items.map((i: { position: number }) => i.position)).toEqual([1, 2]);
    expect(items.map((i: { item: { name: string } }) => i.item.name)).toEqual(["Halo Glow", "Otro"]);
    expect(items.every((i: { item: { offers?: unknown } }) => i.item.offers)).toBe(true);
  });
  it("catalogo entero sin precio: no emite nada", () => {
    expect(renderToStaticMarkup(<ProductosJsonLd productos={[encargo, sinStock]} />)).toBe("");
  });
});

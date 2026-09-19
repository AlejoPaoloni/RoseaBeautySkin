import { describe, expect, it } from "vitest";
import { esUuid, slugProducto, slugificar } from "@/lib/slug";
import type { Producto } from "@/lib/types";

function datos(over: Partial<Producto> = {}) {
  return {
    nombre: "Pocket Blush Buildable Hydrating Cream Blush",
    marca: "rhode",
    tonos: null,
    ...over,
  } as Pick<Producto, "nombre" | "marca" | "tonos">;
}

describe("slugificar", () => {
  it("saca acentos, mayusculas y simbolos", () => {
    expect(slugificar("Máscara Volumizadora")).toBe("mascara-volumizadora");
  });

  it("convierte & en y", () => {
    expect(slugificar("Crème & Powder Blush")).toBe("creme-y-powder-blush");
  });

  it("no deja guiones sueltos en las puntas", () => {
    expect(slugificar("  ¡Hola!  ")).toBe("hola");
  });

  it("compacta siglas con puntos", () => {
    expect(slugificar("e.l.f. Cosmetics")).toBe("elf-cosmetics");
  });

  it("no toca un punto suelto de final de frase", () => {
    expect(slugificar("Glow Reviver. Lip Oil")).toBe("glow-reviver-lip-oil");
  });
});

describe("slugProducto", () => {
  it("arma marca + nombre", () => {
    expect(slugProducto(datos())).toBe(
      "rhode-pocket-blush-buildable-hydrating-cream-blush"
    );
  });

  it("funciona sin marca", () => {
    expect(slugProducto(datos({ marca: null, nombre: "Bronzing Drops" }))).toBe(
      "bronzing-drops"
    );
  });

  it("usa el tono para desempatar cuando el slug ya esta tomado", () => {
    const producto = datos({
      marca: "Rare Beauty by Selena Gomez",
      nombre: "Soft Pinch Liquid Blush",
      tonos: [{ nombre: "Hope - nude mauve", hex: "#C98A82" }],
    });
    const base = slugProducto(producto);
    expect(slugProducto(producto, [base])).toBe(`${base}-hope`);
  });

  it("numera si el tono tampoco alcanza", () => {
    const producto = datos({ tonos: null });
    const base = slugProducto(producto);
    expect(slugProducto(producto, [base])).toBe(`${base}-2`);
    expect(slugProducto(producto, [base, `${base}-2`])).toBe(`${base}-3`);
  });

  it("recorta largo sin partir una palabra al medio", () => {
    const slug = slugProducto(
      datos({
        marca: "Benefit Cosmetics",
        nombre: "Mini 24-HR Brow Setter Clear Brow Gel with Lamination Effect",
      })
    );
    expect(slug.length).toBeLessThanOrEqual(70);
    expect(slug.endsWith("-")).toBe(false);
    // el corte cae en un guion, no adentro de una palabra
    expect(slug).toBe("benefit-cosmetics-mini-24-hr-brow-setter-clear-brow-gel-with");
  });
});

describe("esUuid", () => {
  it("reconoce un id de Supabase", () => {
    expect(esUuid("fa507fe1-bd7b-476e-a4c0-556bdfea84f6")).toBe(true);
  });

  it("no confunde un slug con un uuid", () => {
    expect(esUuid("rhode-pocket-blush")).toBe(false);
  });
});

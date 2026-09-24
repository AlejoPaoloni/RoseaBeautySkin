import { describe, expect, it } from "vitest";
import { imagenPermitida, remotePatterns } from "@/lib/imagenes";
import { jsonLd } from "@/lib/jsonld";

const SUPABASE = "https://miproyecto.supabase.co";
const SITIO = "https://www.roseabeautyskin.com";
const BUCKET = `${SUPABASE}/storage/v1/object/public/productos-img`;
const ELF = "https://cdn.shopify.com/s/files/1/0661/2251/4520/files";

describe("jsonLd", () => {
  it("no deja pasar </script> desde un campo de texto", () => {
    const salida = jsonLd({ name: "Labial </script><script>alert(1)</script>" });
    expect(salida).not.toContain("</script>");
    expect(salida).not.toContain("<");
  });

  it("el JSON resultante sigue siendo el mismo para quien lo lee", () => {
    const datos = { name: "a < b", lista: ["<x>", 3] };
    expect(JSON.parse(jsonLd(datos))).toEqual(datos);
  });
});

describe("imagenPermitida", () => {
  it("acepta el bucket propio, la carpeta de e.l.f. y el propio sitio", () => {
    expect(imagenPermitida(`${BUCKET}/a.webp`, SUPABASE, SITIO)).toBe(true);
    expect(imagenPermitida(`${ELF}/x.png?v=1`, SUPABASE, SITIO)).toBe(true);
    expect(imagenPermitida(`${SITIO}/brand/monogram.svg`, SUPABASE, SITIO)).toBe(true);
  });

  it("rechaza el bucket de OTRO proyecto de Supabase", () => {
    const ajeno = "https://otro.supabase.co/storage/v1/object/public/productos-img/a.webp";
    expect(imagenPermitida(ajeno, SUPABASE, SITIO)).toBe(false);
  });

  it("rechaza otra carpeta del propio Supabase y otra tienda de Shopify", () => {
    expect(
      imagenPermitida(`${SUPABASE}/storage/v1/object/public/otro-bucket/a.webp`, SUPABASE, SITIO)
    ).toBe(false);
    expect(
      imagenPermitida("https://cdn.shopify.com/s/files/1/9999/0000/0000/files/x.png", SUPABASE, SITIO)
    ).toBe(false);
  });

  it("no se deja engañar por .. en el path", () => {
    expect(
      imagenPermitida(`${BUCKET}/../../../../auth/v1/settings`, SUPABASE, SITIO)
    ).toBe(false);
  });

  it("rechaza http, direcciones internas y basura", () => {
    expect(imagenPermitida(BUCKET.replace("https", "http") + "/a.webp", SUPABASE, SITIO)).toBe(false);
    expect(imagenPermitida("http://169.254.169.254/latest/meta-data/", SUPABASE, SITIO)).toBe(false);
    expect(imagenPermitida("https://localhost/a.png", SUPABASE, SITIO)).toBe(false);
    expect(imagenPermitida("no es una url", SUPABASE, SITIO)).toBe(false);
  });

  it("un host que solo CONTIENE el permitido no vale", () => {
    expect(
      imagenPermitida("https://cdn.shopify.com.evil.io/s/files/1/0661/2251/4520/x.png", SUPABASE, SITIO)
    ).toBe(false);
  });
});

describe("remotePatterns", () => {
  it("devuelve solo https con path acotado, sin comodines de host", () => {
    const patrones = remotePatterns(SUPABASE);
    expect(patrones.map((p) => p.hostname).sort()).toEqual([
      "cdn.shopify.com",
      "miproyecto.supabase.co",
    ]);
    for (const p of patrones) {
      expect(p.protocol).toBe("https");
      expect(p.hostname).not.toContain("*");
      expect(p.pathname).not.toBe("/**");
    }
  });

  it("sin URL de Supabase configurada no abre nada de mas", () => {
    expect(remotePatterns(undefined).map((p) => p.hostname)).toEqual(["cdn.shopify.com"]);
  });
});

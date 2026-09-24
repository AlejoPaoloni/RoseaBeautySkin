import { describe, expect, it } from "vitest";
import {
  codigoCompleto,
  faltaSegundoFactor,
  nombreDeFactor,
  qrComoImagen,
  soloDigitos,
  tieneMfa,
} from "@/lib/mfa";

describe("faltaSegundoFactor", () => {
  it("pide el codigo si tiene MFA activado y solo puso la contrasena", () => {
    expect(faltaSegundoFactor({ currentLevel: "aal1", nextLevel: "aal2" })).toBe(true);
  });

  it("no lo pide si ya lo puso", () => {
    expect(faltaSegundoFactor({ currentLevel: "aal2", nextLevel: "aal2" })).toBe(false);
  });

  it("no lo pide si nunca activo MFA", () => {
    expect(faltaSegundoFactor({ currentLevel: "aal1", nextLevel: "aal1" })).toBe(false);
  });

  it("no rompe ni pide nada si Supabase no devolvio datos", () => {
    expect(faltaSegundoFactor(null)).toBe(false);
    expect(faltaSegundoFactor(undefined)).toBe(false);
  });

  it("sesion sin nivel conocido con MFA activo: pide el codigo", () => {
    expect(faltaSegundoFactor({ currentLevel: null, nextLevel: "aal2" })).toBe(true);
  });
});

describe("tieneMfa", () => {
  it("lo detecta este o no verificada la sesion actual", () => {
    expect(tieneMfa({ currentLevel: "aal1", nextLevel: "aal2" })).toBe(true);
    expect(tieneMfa({ currentLevel: "aal2", nextLevel: "aal2" })).toBe(true);
  });

  it("sin factor no hay MFA", () => {
    expect(tieneMfa({ currentLevel: "aal1", nextLevel: "aal1" })).toBe(false);
    expect(tieneMfa(null)).toBe(false);
  });
});

describe("codigo de 6 digitos", () => {
  it("saca espacios, guiones y letras del pegado", () => {
    expect(soloDigitos("123 456")).toBe("123456");
    expect(soloDigitos("12-34-56")).toBe("123456");
    expect(soloDigitos("ab1c2d3")).toBe("123");
  });

  it("corta en 6", () => {
    expect(soloDigitos("12345678")).toBe("123456");
  });

  it("solo es valido con exactamente 6 digitos", () => {
    expect(codigoCompleto("123456")).toBe(true);
    expect(codigoCompleto("12345")).toBe(false);
    expect(codigoCompleto("1234567")).toBe(false);
    expect(codigoCompleto("12345a")).toBe(false);
    expect(codigoCompleto("")).toBe(false);
  });
});

describe("qrComoImagen", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>';

  it("escapa el SVG en crudo: el # de un color no puede cortar el archivo", () => {
    const salida = qrComoImagen(`data:image/svg+xml;utf-8,${svg}`);
    expect(salida.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(salida).not.toContain("#");
    expect(decodeURIComponent(salida.split(",")[1])).toBe(svg);
  });

  it("deja igual lo que ya viene escapado o en base64", () => {
    const escapado = `data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`;
    expect(qrComoImagen(escapado)).toBe(escapado);
    const base64 = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    expect(qrComoImagen(base64)).toBe(base64);
  });

  it("no rompe con algo que no es un data URI", () => {
    expect(qrComoImagen("sin-coma")).toBe("sin-coma");
    expect(qrComoImagen("")).toBe("");
  });
});

describe("nombreDeFactor", () => {
  it("cambia cada vez, asi un intento a medias no bloquea el siguiente", () => {
    const a = nombreDeFactor(new Date("2026-09-24T10:00:00Z"));
    const b = nombreDeFactor(new Date("2026-09-24T10:00:01Z"));
    expect(a).not.toBe(b);
    expect(a).toContain("Rosea Beauty");
  });
});

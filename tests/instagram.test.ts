import { describe, expect, it } from "vitest";
import {
  enNavegadorDeInstagram,
  intentarAbrirEnApp,
  URL_APP_PERFIL,
} from "@/lib/instagram";

/** Ventana de mentira: guarda a donde se navego y deja disparar el reloj a mano. */
function ventanaFalsa() {
  const navegaciones: string[] = [];
  let pendiente: (() => void) | null = null;
  let oyente: (() => void) | null = null;
  const doc = {
    hidden: false,
    addEventListener: (_t: string, fn: () => void) => { oyente = fn; },
    removeEventListener: () => { oyente = null; },
  };
  return {
    navegaciones,
    get hayRespaldoPendiente() { return pendiente !== null; },
    /** simula que pasaron los 800ms sin que se abriera la app */
    correrReloj: () => pendiente?.(),
    /** simula que la app se abrio y la pagina quedo en segundo plano */
    irASegundoPlano: () => { doc.hidden = true; oyente?.(); },
    v: {
      location: { set href(u: string) { navegaciones.push(u); }, get href() { return navegaciones.at(-1) ?? ""; } },
      setTimeout: (fn: () => void) => { pendiente = fn; return 1; },
      clearTimeout: () => { pendiente = null; },
      document: doc,
    },
  };
}

const IOS_IG =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.0.42.95 (iPhone14,5; iOS 17_5; en_US; en; scale=3.00; 1170x2532; 600953308)";
const ANDROID_IG =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36 Instagram 334.0.0.42.95 Android";
const IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const ESCRITORIO =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

describe("enNavegadorDeInstagram", () => {
  it("reconoce el webview de Instagram en iOS y en Android", () => {
    expect(enNavegadorDeInstagram(IOS_IG)).toBe(true);
    expect(enNavegadorDeInstagram(ANDROID_IG)).toBe(true);
  });

  it("no toca los navegadores normales", () => {
    expect(enNavegadorDeInstagram(IOS_SAFARI)).toBe(false);
    expect(enNavegadorDeInstagram(ANDROID_CHROME)).toBe(false);
    expect(enNavegadorDeInstagram(ESCRITORIO)).toBe(false);
  });

  it("no se confunde con una web que mencione instagram", () => {
    // El nombre suelto no alcanza: se exige "Instagram <version>", que es como
    // lo escribe el webview. Si no, una pagina abierta desde un navegador que
    // se llamara "InstagramViewer" entraria por error.
    expect(enNavegadorDeInstagram("Mozilla/5.0 MiApp Instagram")).toBe(false);
    expect(enNavegadorDeInstagram("Mozilla/5.0 (compatible; InstagramBot)")).toBe(false);
  });

  it("aguanta que no haya user agent", () => {
    expect(enNavegadorDeInstagram(undefined)).toBe(false);
    expect(enNavegadorDeInstagram("")).toBe(false);
  });
});

describe("URL_APP_PERFIL", () => {
  it("es un esquema de app, no un link web", () => {
    expect(URL_APP_PERFIL.startsWith("instagram://")).toBe(true);
    expect(URL_APP_PERFIL).toContain("roseabeautyskin");
  });
});

describe("intentarAbrirEnApp", () => {
  it("en un navegador normal no hace nada: deja actuar al link de siempre", () => {
    const f = ventanaFalsa();
    expect(intentarAbrirEnApp(f.v, IOS_SAFARI)).toBe(false);
    expect(f.navegaciones).toEqual([]);
    expect(f.hayRespaldoPendiente).toBe(false);
  });

  it("dentro de Instagram intenta primero el esquema de la app", () => {
    const f = ventanaFalsa();
    expect(intentarAbrirEnApp(f.v, IOS_IG)).toBe(true);
    expect(f.navegaciones).toEqual([URL_APP_PERFIL]);
  });

  it("si la app no abre, cae al link web", () => {
    const f = ventanaFalsa();
    intentarAbrirEnApp(f.v, IOS_IG);
    f.correrReloj();
    expect(f.navegaciones).toEqual([URL_APP_PERFIL, "https://ig.me/m/roseabeautyskin"]);
  });

  it("si la app abre, NO navega por atrás al link web", () => {
    const f = ventanaFalsa();
    intentarAbrirEnApp(f.v, IOS_IG);
    f.irASegundoPlano();
    expect(f.hayRespaldoPendiente).toBe(false);
    f.correrReloj(); // aunque alguien dispare el reloj igual
    expect(f.navegaciones).toEqual([URL_APP_PERFIL]);
  });

  it("al caer al web deja de escuchar, para no navegar dos veces", () => {
    const f = ventanaFalsa();
    intentarAbrirEnApp(f.v, IOS_IG);
    f.correrReloj();
    f.irASegundoPlano();
    expect(f.navegaciones).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import {
  destinoDeConsulta,
  enNavegadorDeInstagram,
  esAndroid,
  ESQUEMA_ANDROID,
  ESQUEMA_IOS,
} from "@/lib/instagram";

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
const WEB = "https://ig.me/m/roseabeautyskin";

describe("enNavegadorDeInstagram", () => {
  it("reconoce el webview de Instagram en iOS y Android", () => {
    expect(enNavegadorDeInstagram(IOS_IG)).toBe(true);
    expect(enNavegadorDeInstagram(ANDROID_IG)).toBe(true);
  });

  it("no toca los navegadores normales", () => {
    for (const ua of [IOS_SAFARI, ANDROID_CHROME, ESCRITORIO]) {
      expect(enNavegadorDeInstagram(ua)).toBe(false);
    }
  });

  it("exige 'Instagram <version>', no el nombre suelto", () => {
    expect(enNavegadorDeInstagram("Mozilla/5.0 MiApp Instagram")).toBe(false);
    expect(enNavegadorDeInstagram("Mozilla/5.0 (compatible; InstagramBot)")).toBe(false);
  });

  it("aguanta que no haya user agent", () => {
    expect(enNavegadorDeInstagram(undefined)).toBe(false);
    expect(enNavegadorDeInstagram("")).toBe(false);
  });
});

describe("esAndroid", () => {
  it("distingue Android de iOS", () => {
    expect(esAndroid(ANDROID_IG)).toBe(true);
    expect(esAndroid(IOS_IG)).toBe(false);
  });
});

describe("destinoDeConsulta", () => {
  it("en navegadores normales usa el link web de siempre", () => {
    for (const ua of [IOS_SAFARI, ANDROID_CHROME, ESCRITORIO, undefined]) {
      expect(destinoDeConsulta(ua)).toBe(WEB);
    }
  });

  it("dentro de Instagram en iOS usa el esquema de app", () => {
    expect(destinoDeConsulta(IOS_IG)).toBe(ESQUEMA_IOS);
    expect(ESQUEMA_IOS).toBe("instagram://user?username=roseabeautyskin");
  });

  it("dentro de Instagram en Android usa intent://", () => {
    expect(destinoDeConsulta(ANDROID_IG)).toBe(ESQUEMA_ANDROID);
  });
});

describe("ESQUEMA_ANDROID", () => {
  it("declara el paquete de Instagram y a donde caer si no está instalada", () => {
    expect(ESQUEMA_ANDROID.startsWith("intent://")).toBe(true);
    expect(ESQUEMA_ANDROID).toContain("scheme=instagram");
    expect(ESQUEMA_ANDROID).toContain("package=com.instagram.android");
    expect(ESQUEMA_ANDROID).toContain(`S.browser_fallback_url=${encodeURIComponent(WEB)}`);
    expect(ESQUEMA_ANDROID.endsWith(";end")).toBe(true);
  });

  it("escapa el respaldo: sin escapar, el ':' y el '/' romperían el formato intent", () => {
    expect(ESQUEMA_ANDROID).not.toContain("=https://");
  });
});

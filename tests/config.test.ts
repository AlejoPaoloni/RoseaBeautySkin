import { describe, expect, it } from "vitest";
import { config, whatsappUrl } from "@/lib/config";

describe("whatsappUrl", () => {
  it("arma url sin numero", () => {
    config.whatsapp.numero = "";
    config.whatsapp.mensaje = "Hola, tengo una consulta";
    expect(whatsappUrl()).toBe(
      "https://wa.me/?text=Hola%2C%20tengo%20una%20consulta"
    );
  });

  it("arma url con numero", () => {
    config.whatsapp.numero = "5491112345678";
    config.whatsapp.mensaje = "Hola";
    expect(whatsappUrl()).toBe("https://wa.me/5491112345678?text=Hola");
  });
});

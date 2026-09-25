import { config, instagramDmUrl } from "./config";

// Abrir el DM desde adentro del navegador de Instagram.
//
// Cuando alguien entra por el link de la bio, Instagram no abre el navegador
// del telefono: abre su propio webview. Ahi adentro, un link a ig.me no lleva
// a ningun lado util — ig.me es solo un redirect a instagram.com/m/usuario, o
// sea otra pagina web, que se carga dentro del mismo webview lento en vez de
// saltar a la app.
//
// La unica forma de pedirle al sistema que abra la app es un enlace de
// esquema (instagram://). No esta documentado por Meta y su comportamiento
// dentro del propio webview cambia segun version y sistema operativo, asi que
// esto es un intento, no una garantia: si no funciona, a los 800ms se sigue al
// link web de siempre. En el peor caso queda como antes, nunca peor.

// Abre el perfil en la app. No hay un esquema publico que abra el chat
// directo con alguien, asi que desde el perfil queda un toque mas ("Mensaje").
export const URL_APP_PERFIL = `instagram://user?username=${config.instagramUsuario}`;

const MS_ESPERA_APP = 800;

/**
 * True si la pagina esta corriendo dentro del navegador embebido de Instagram.
 * Su user agent termina con "Instagram <version> ..." tanto en iOS como en
 * Android. En cualquier navegador normal esto da false y no se cambia nada.
 */
export function enNavegadorDeInstagram(ua: string | undefined): boolean {
  return !!ua && /\bInstagram[\s/]\d/i.test(ua);
}

type Ventana = {
  location: { href: string };
  setTimeout: (fn: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
  document: {
    hidden: boolean;
    addEventListener: (t: string, fn: () => void, o?: object) => void;
    removeEventListener: (t: string, fn: () => void) => void;
  };
};

/**
 * Intenta saltar a la app y, si no pasa nada, cae al link web.
 *
 * Como saber si funciono: si el sistema abre Instagram, esta pagina pasa a
 * segundo plano y el navegador la marca oculta. Si a los 800ms seguimos
 * visibles, el esquema no hizo nada y se navega al link de siempre.
 *
 * Devuelve true si tomo el control (quien llama tiene que cancelar el click),
 * false si conviene dejar que el <a href> haga lo suyo.
 */
export function intentarAbrirEnApp(
  v: Ventana = window as unknown as Ventana,
  ua: string | undefined = typeof navigator === "undefined" ? undefined : navigator.userAgent
): boolean {
  if (!enNavegadorDeInstagram(ua)) return false;

  const irAlWeb = () => {
    v.document.removeEventListener("visibilitychange", alOcultarse);
    v.location.href = instagramDmUrl();
  };
  const id = v.setTimeout(irAlWeb, MS_ESPERA_APP);
  function alOcultarse() {
    // La app se abrio: cancelar el respaldo para no navegar por atras y
    // dejar la pestana en el DM web cuando la persona vuelva.
    if (v.document.hidden) v.clearTimeout(id);
  }
  v.document.addEventListener("visibilitychange", alOcultarse);

  v.location.href = URL_APP_PERFIL;
  return true;
}

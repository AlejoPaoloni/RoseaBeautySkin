import { config, instagramDmUrl } from "./config";

// A donde apunta el boton de consulta segun desde donde se este mirando.
//
// El problema: quien entra por el link de la bio no navega con el navegador
// del telefono, sino con el webview que Instagram abre adentro de la app. Ahi
// un link a ig.me no salta a la app — ig.me es un redirect a
// instagram.com/m/usuario y en un navegador comun el sistema operativo lo
// intercepta (Universal Links en iOS, App Links en Android) y abre la app.
// Dentro del webview de la propia Instagram ese mecanismo no se dispara.
//
// Lo unico que queda es un enlace de esquema, y ojo con COMO se dispara:
// hacerlo por JavaScript (location.href = "instagram://...") no funciona, ya
// se probo. Lo que puede funcionar es que el esquema este en el href del <a>
// y lo toque la persona: para el webview es una navegacion iniciada por el
// usuario, no un salto automatico.
//
// En Android hay ademas intent://, que es el mecanismo propio de Chrome para
// abrir una app concreta y permite declarar a donde caer si no esta instalada.

const USUARIO = config.instagramUsuario;

// Abre el perfil en la app. No existe un esquema publico que abra el chat con
// alguien: instagram://direct-inbox abre la bandeja (sin la conversacion) y
// las URLs de conversacion necesitan un id de hilo que no tenemos. Desde el
// perfil queda un toque mas ("Mensaje"), pero ya dentro de la app.
export const ESQUEMA_IOS = `instagram://user?username=${USUARIO}`;

// Mismo destino, en el formato que entiende Chrome en Android. Si Instagram no
// estuviera instalada, browser_fallback_url evita el callejon sin salida.
export const ESQUEMA_ANDROID =
  `intent://user?username=${USUARIO}#Intent;scheme=instagram;` +
  `package=com.instagram.android;S.browser_fallback_url=${encodeURIComponent(instagramDmUrl())};end`;

/**
 * True si la pagina corre dentro del navegador embebido de Instagram. Su user
 * agent termina con "Instagram <version> ..." en iOS y en Android.
 */
export function enNavegadorDeInstagram(ua: string | undefined): boolean {
  return !!ua && /\bInstagram[\s/]\d/i.test(ua);
}

export function esAndroid(ua: string | undefined): boolean {
  return !!ua && /Android/i.test(ua);
}

/**
 * A donde tiene que apuntar el boton. En cualquier navegador normal devuelve
 * el link web de siempre: el sistema ya sabe abrir la app desde ahi.
 */
export function destinoDeConsulta(ua: string | undefined): string {
  if (!enNavegadorDeInstagram(ua)) return instagramDmUrl();
  return esAndroid(ua) ? ESQUEMA_ANDROID : ESQUEMA_IOS;
}

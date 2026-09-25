"use client";

import { useSyncExternalStore } from "react";
import { instagramDmUrl } from "@/lib/config";
import { destinoDeConsulta, enNavegadorDeInstagram } from "@/lib/instagram";

// Cuanto esperar antes de dar por perdido el salto a la app.
const MS_RESCATE = 1500;

// El user agent no cambia nunca: no hay a que suscribirse.
const sinCambios = () => () => {};

/**
 * Devuelve el href del boton de consulta y un onClick de rescate.
 *
 * El destino se decide en el cliente, no en el servidor: la pagina es estatica
 * y cacheada, el mismo HTML se sirve a todos. Con useSyncExternalStore —el
 * mismo patron que usa Hero.tsx para las media queries— el servidor ve
 * `undefined` (o sea, el link web) y React re-renderiza con el user agent real
 * apenas hidrata, sin dejar atributos sin parchear ni encadenar renders desde
 * un efecto.
 *
 * El esquema va en el href y NO se dispara por JavaScript, a proposito: para
 * el webview un toque sobre un enlace es una navegacion iniciada por la
 * persona, no un salto automatico, y eso es lo que puede dejar pasar.
 * (Dispararlo por JS ya se probo en produccion y Instagram lo ignora.)
 *
 * El rescate cubre el caso de que el esquema tampoco haga nada: sin el, el
 * boton quedaria muerto. Si la app abre, la pagina pasa a segundo plano y se
 * cancela.
 */
export function useDestinoInstagram() {
  const ua = useSyncExternalStore(
    sinCambios,
    () => navigator.userAgent,
    () => undefined
  );
  const enInstagram = enNavegadorDeInstagram(ua);

  function alTocar() {
    if (!enInstagram) return;
    const id = window.setTimeout(() => {
      document.removeEventListener("visibilitychange", alOcultarse);
      window.location.href = instagramDmUrl();
    }, MS_RESCATE);
    function alOcultarse() {
      if (document.hidden) window.clearTimeout(id);
    }
    document.addEventListener("visibilitychange", alOcultarse);
  }

  return { destino: destinoDeConsulta(ua), alTocar };
}

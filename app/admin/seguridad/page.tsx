"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  codigoCompleto,
  nombreDeFactor,
  qrComoImagen,
  soloDigitos,
} from "@/lib/mfa";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "inactivo" }
  | { tipo: "activando"; factorId: string; qr: string; secreto: string }
  | { tipo: "activo"; factorId: string };

// Lee como esta la cuenta hoy. No toca el estado de la pantalla: devuelve el
// resultado y quien la llama decide.
async function leerEstado(): Promise<{ estado: Estado; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) {
    return {
      estado: { tipo: "inactivo" },
      error: "No se pudo consultar la verificación en dos pasos.",
    };
  }
  // Una activacion que se cortó a la mitad (cerraste la pestaña con el QR en
  // pantalla) deja un factor sin verificar: se limpia para poder empezar de
  // cero sin chocar con el nombre del anterior.
  const sinVerificar = data.all.filter((f) => f.status === "unverified");
  await Promise.all(
    sinVerificar.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id }))
  );
  const verificado = data.totp[0];
  return {
    estado: verificado
      ? { tipo: "activo", factorId: verificado.id }
      : { tipo: "inactivo" },
    error: null,
  };
}

export default function SeguridadPage() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [codigo, setCodigo] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const inicial = await leerEstado();
      if (!vigente) return;
      setEstado(inicial.estado);
      setError(inicial.error);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  async function empezar() {
    setTrabajando(true);
    setError(null);
    setAviso(null);
    const { data, error: errorAlta } = await createClient().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: nombreDeFactor(),
      issuer: "Rosea Beauty",
    });
    setTrabajando(false);
    if (errorAlta || !data) {
      setError(
        `No se pudo iniciar la activación${errorAlta ? `: ${errorAlta.message}` : "."}`
      );
      return;
    }
    setCodigo("");
    setEstado({
      tipo: "activando",
      factorId: data.id,
      qr: data.totp.qr_code,
      secreto: data.totp.secret,
    });
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (estado.tipo !== "activando" || !codigoCompleto(codigo)) return;
    setTrabajando(true);
    setError(null);
    const { error: errorVerif } = await createClient().auth.mfa.challengeAndVerify({
      factorId: estado.factorId,
      code: codigo,
    });
    setTrabajando(false);
    if (errorVerif) {
      setError("Código incorrecto o vencido. Probá con el que muestra tu app ahora.");
      setCodigo("");
      return;
    }
    setEstado({ tipo: "activo", factorId: estado.factorId });
    setAviso("Listo: la próxima vez que entres te va a pedir el código.");
  }

  async function cancelar() {
    if (estado.tipo !== "activando") return;
    setTrabajando(true);
    await createClient().auth.mfa.unenroll({ factorId: estado.factorId });
    setTrabajando(false);
    setError(null);
    setEstado({ tipo: "inactivo" });
  }

  async function desactivar() {
    if (estado.tipo !== "activo") return;
    const seguro = window.confirm(
      "¿Desactivar la verificación en dos pasos? Tu cuenta va a quedar protegida solo por la contraseña."
    );
    if (!seguro) return;
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    const { error: errorBaja } = await supabase.auth.mfa.unenroll({
      factorId: estado.factorId,
    });
    if (errorBaja) {
      setTrabajando(false);
      setError("No se pudo desactivar. Probá de nuevo.");
      return;
    }
    // Sin renovar la sesion, el token sigue diciendo "aal2" hasta que vence.
    await supabase.auth.refreshSession();
    setTrabajando(false);
    setAviso("Verificación en dos pasos desactivada.");
    setEstado({ tipo: "inactivo" });
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Seguridad</h1>
        {estado.tipo === "activo" && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            Activada
          </span>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="font-serif text-lg text-neutral-800">
            Verificación en dos pasos
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Además de la contraseña, para entrar hace falta un código de 6
            dígitos que cambia cada 30 segundos y que solo tiene tu celular.
            Si alguien consigue tu contraseña, sin el celular no puede entrar.
          </p>

          {aviso && (
            <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {aviso}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {estado.tipo === "cargando" && (
            <p className="mt-6 text-sm text-neutral-400">Cargando…</p>
          )}

          {estado.tipo === "inactivo" && (
            <div className="mt-6">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Antes de activarla: el script de Google Sheets entra con
                usuario y contraseña, sin código. Con esto activado, ese
                usuario tiene que ser uno aparte de solo lectura; si no, la
                hoja deja de actualizarse.
              </p>
              <button
                onClick={empezar}
                disabled={trabajando}
                className="mt-4 rounded-full bg-rosea-400 px-5 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-50"
              >
                {trabajando ? "Preparando…" : "Activar"}
              </button>
            </div>
          )}

          {estado.tipo === "activando" && (
            <form onSubmit={confirmar} className="mt-6">
              <ol className="list-decimal space-y-4 pl-5 text-sm text-neutral-600">
                <li>
                  Abrí una app de autenticación en el celular (Google
                  Authenticator, Authy, Microsoft Authenticator, 1Password…) y
                  escaneá este código:
                  <div className="mt-3 inline-block rounded-xl border border-neutral-200 bg-white p-2">
                    {/* El QR llega como data URI SVG desde Supabase: no pasa por
                        el optimizador de imagenes, y la CSP ya permite data:. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrComoImagen(estado.qr)}
                      alt="Código QR para la app de autenticación"
                      width={176}
                      height={176}
                    />
                  </div>
                </li>
                <li>
                  ¿No podés escanear? Cargá esta clave a mano en la app.{" "}
                  <strong>Guardala en tu gestor de contraseñas</strong>: si
                  perdés el celular, con esta clave volvés a activar la app en
                  otro.
                  <code className="mt-2 block select-all break-all rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                    {estado.secreto}
                  </code>
                </li>
                <li>
                  Escribí el código de 6 dígitos que muestra la app:
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    // 7 y no 6: si se pega "123 456" el navegador cortaria un
                    // digito antes de que soloDigitos limpie el espacio.
                    maxLength={7}
                    value={codigo}
                    onChange={(e) => setCodigo(soloDigitos(e.target.value))}
                    aria-label="Código de 6 dígitos"
                    className="mt-2 block w-40 rounded-lg border border-neutral-200 px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-rosea-300"
                  />
                </li>
              </ol>

              <div className="mt-6 flex gap-2">
                <button
                  type="submit"
                  disabled={trabajando || !codigoCompleto(codigo)}
                  className="rounded-full bg-rosea-400 px-5 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-50"
                >
                  {trabajando ? "Verificando…" : "Confirmar y activar"}
                </button>
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={trabajando}
                  className="rounded-full border border-neutral-200 px-5 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {estado.tipo === "activo" && (
            <div className="mt-6">
              <p className="text-sm text-neutral-600">
                Está activada. Cada vez que entres al panel te va a pedir el
                código de tu app.
              </p>
              <button
                onClick={desactivar}
                disabled={trabajando}
                className="mt-4 rounded-full border border-neutral-200 px-5 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                {trabajando ? "Desactivando…" : "Desactivar"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

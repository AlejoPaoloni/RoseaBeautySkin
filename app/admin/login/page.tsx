"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { codigoCompleto, faltaSegundoFactor, soloDigitos } from "@/lib/mfa";

type Paso = "clave" | "codigo";

export default function LoginPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("clave");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Despues de la contrasena: si la cuenta tiene verificacion en dos pasos y
  // todavia no se puso el codigo, se pide; si no, directo al panel.
  async function seguirOPedirCodigo() {
    const supabase = createClient();
    const { data: garantia } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!faltaSegundoFactor(garantia)) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const { data: factores, error: errorFactores } = await supabase.auth.mfa.listFactors();
    const totp = factores?.totp[0];
    if (errorFactores || !totp) {
      setError("No se pudo cargar la verificación en dos pasos. Probá de nuevo.");
      return;
    }
    setFactorId(totp.id);
    setPaso("codigo");
  }

  // Si el panel te mando aca con la contrasena ya puesta pero sin el codigo
  // (recargaste, o abriste otra pestana), se retoma directo en el codigo.
  useEffect(() => {
    let vigente = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && vigente) await seguirOPedirCodigo();
    })();
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmitClave(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Credenciales inválidas");
      setCargando(false);
      return;
    }
    await seguirOPedirCodigo();
    setCargando(false);
  }

  async function onSubmitCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !codigoCompleto(codigo)) return;
    setCargando(true);
    setError(null);
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code: codigo,
    });
    if (error) {
      setError("Código incorrecto o vencido. Revisá el que muestra tu app.");
      setCodigo("");
      setCargando(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function usarOtraCuenta() {
    await createClient().auth.signOut();
    setPaso("clave");
    setFactorId(null);
    setCodigo("");
    setPassword("");
    setError(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-rosea-50 px-4">
      <form
        onSubmit={paso === "clave" ? onSubmitClave : onSubmitCodigo}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-rosea-100"
      >
        <div className="flex flex-col items-center gap-2">
          <Image src="/brand/monogram.svg" alt="RB" width={72} height={54} />
          <h1 className="font-serif text-2xl text-rosea-700">Panel Admin</h1>
        </div>

        {paso === "clave" ? (
          <>
            <label className="mt-6 block text-sm text-neutral-600">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
              />
            </label>

            <label className="mt-4 block text-sm text-neutral-600">
              Contraseña
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
              />
            </label>
          </>
        ) : (
          <>
            <p className="mt-6 text-sm text-neutral-600">
              Abrí tu app de autenticación y escribí el código de 6 dígitos de
              Rosea Beauty.
            </p>
            <label className="mt-4 block text-sm text-neutral-600">
              Código
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                // 7 y no 6: si se pega "123 456" el navegador cortaria un
                // digito antes de que soloDigitos limpie el espacio.
                maxLength={7}
                required
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(soloDigitos(e.target.value))}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-rosea-300"
              />
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando || (paso === "codigo" && !codigoCompleto(codigo))}
          className="mt-6 w-full rounded-full bg-rosea-400 py-2.5 text-sm text-white transition-colors hover:bg-rosea-500 disabled:opacity-50"
        >
          {cargando ? "Ingresando…" : paso === "clave" ? "Ingresar" : "Verificar"}
        </button>

        {paso === "codigo" && (
          <button
            type="button"
            onClick={usarOtraCuenta}
            className="mt-3 w-full text-center text-xs text-neutral-500 hover:text-neutral-800"
          >
            Volver
          </button>
        )}
      </form>
    </main>
  );
}

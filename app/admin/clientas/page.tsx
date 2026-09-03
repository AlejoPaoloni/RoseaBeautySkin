"use client";

import { useEffect, useState } from "react";
import type { Clienta, Venta } from "@/lib/types";
import {
  actualizarClienta,
  crearClienta,
  eliminarClienta,
  listarClientas,
} from "@/lib/db-gestion";
import { listarVentas } from "@/lib/db-finanzas";
import { historialClienta } from "@/lib/gestion";
import { formatearFecha } from "@/lib/finanzas";
import { formatearPrecio } from "@/lib/catalog";

export default function ClientasPage() {
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Clienta | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);

  async function cargar() {
    try {
      const [c, v] = await Promise.all([listarClientas(), listarVentas()]);
      setClientas(c);
      setVentas(v);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(c: Clienta) {
    if (
      !confirm(
        `¿Eliminar la ficha de "${c.nombre}"? Las ventas que tenga cargadas se conservan, pero quedan sin nombre.`
      )
    ) {
      return;
    }
    const previo = clientas;
    setClientas((prev) => prev.filter((x) => x.id !== c.id));
    try {
      await eliminarClienta(c.id);
    } catch {
      setClientas(previo);
      alert("No se pudo eliminar. Probá de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Clientas</h1>
        <button
          onClick={() => {
            setEditando(null);
            setFormAbierto(true);
          }}
          className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
        >
          + Clienta
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          <div className="space-y-2">
            {clientas.map((c) => {
              const historial = historialClienta(ventas, c.id);
              return (
                <article
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                >
                  <div className="min-w-40 flex-1">
                    <p className="text-sm text-neutral-800">{c.nombre}</p>
                    <p className="truncate text-xs text-neutral-400">
                      {c.contacto ?? "Sin contacto"}
                      {c.nota ? ` · ${c.nota}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-neutral-800 tabular-nums">
                      {formatearPrecio(historial.total)}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {historial.compras} compra
                      {historial.compras === 1 ? "" : "s"}
                      {historial.ultima
                        ? ` · última ${formatearFecha(historial.ultima)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditando(c);
                      setFormAbierto(true);
                    }}
                    className="shrink-0 rounded-full px-3 py-1 text-xs text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => borrar(c)}
                    aria-label={`Eliminar ${c.nombre}`}
                    className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </article>
              );
            })}
            {clientas.length === 0 && (
              <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                Sin clientas cargadas. Al crear una, aparece en el desplegable
                de las ventas y se le arma el historial solo.
              </p>
            )}
          </div>
        )}
      </main>

      {formAbierto && (
        <ClientaForm
          clienta={editando}
          onClose={() => setFormAbierto(false)}
          onSaved={() => {
            setFormAbierto(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function ClientaForm({
  clienta,
  onClose,
  onSaved,
}: {
  clienta: Clienta | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(clienta?.nombre ?? "");
  const [contacto, setContacto] = useState(clienta?.contacto ?? "");
  const [nota, setNota] = useState(clienta?.nota ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    setError(null);
    const datos = {
      nombre: nombre.trim(),
      contacto: contacto.trim() || null,
      nota: nota.trim() || null,
    };
    try {
      if (clienta) {
        await actualizarClienta(clienta.id, datos);
      } else {
        await crearClienta(datos);
      }
      onSaved();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">
          {clienta ? "Editar clienta" : "Nueva clienta"}
        </h2>

        <label className="mt-4 block text-sm text-neutral-600">
          Nombre *
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Contacto
          <input
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="@instagram o WhatsApp"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Nota
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: tono de base 220, cumple en marzo"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-rosea-400 px-5 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

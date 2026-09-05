"use client";

import { useEffect, useState } from "react";
import type { Tarea } from "@/lib/types";
import {
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  listarTareas,
} from "@/lib/db-gestion";
import { coincide, ordenarTareas, tareaVencida } from "@/lib/gestion";
import { fechaHoy, formatearFecha } from "@/lib/finanzas";
import BuscadorAdmin from "@/components/admin/BuscadorAdmin";

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [texto, setTexto] = useState("");
  const [limite, setLimite] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    try {
      setTareas(await listarTareas());
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const hoy = fechaHoy();
  const ordenadas = ordenarTareas(tareas);
  const pendientes = ordenadas.filter((t) => !t.hecha).length;
  const filtradas = ordenadas.filter((t) => coincide(busqueda, [t.texto]));

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setGuardando(true);
    try {
      await crearTarea({
        texto: texto.trim(),
        hecha: false,
        fecha_limite: limite || null,
      });
      setTexto("");
      setLimite("");
      await cargar();
    } catch {
      alert("No se pudo guardar la tarea. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function alternar(t: Tarea) {
    const previo = tareas;
    setTareas((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, hecha: !x.hecha } : x))
    );
    try {
      await actualizarTarea(t.id, { hecha: !t.hecha });
    } catch {
      setTareas(previo);
      alert("No se pudo actualizar. Probá de nuevo.");
    }
  }

  async function borrar(t: Tarea) {
    if (!confirm(`¿Eliminar "${t.texto}"?`)) return;
    const previo = tareas;
    setTareas((prev) => prev.filter((x) => x.id !== t.id));
    try {
      await eliminarTarea(t.id);
    } catch {
      setTareas(previo);
      alert("No se pudo eliminar. Probá de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Tareas</h1>
        <span className="text-sm text-neutral-500">
          {pendientes} pendiente{pendientes === 1 ? "" : "s"}
        </span>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form
          onSubmit={agregar}
          className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej: pedir cotización de envíos"
            className="min-w-40 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
          <input
            type="date"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            aria-label="Fecha límite"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-500 outline-none focus:border-rosea-300"
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-rosea-400 px-5 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-50"
          >
            Agregar
          </button>
        </form>

        <div className="mt-4">
          <BuscadorAdmin
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar tarea…"
          />
        </div>

        {cargando ? (
          <p className="mt-8 text-center text-neutral-400">Cargando…</p>
        ) : (
          <div className="mt-6 space-y-2">
            {filtradas.map((t) => (
              <article
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <input
                  type="checkbox"
                  checked={t.hecha}
                  onChange={() => alternar(t)}
                  aria-label={`Marcar "${t.texto}"`}
                  className="h-4 w-4 shrink-0 accent-rosea-400"
                />
                <p
                  className={`flex-1 text-sm ${
                    t.hecha ? "text-neutral-400 line-through" : "text-neutral-800"
                  }`}
                >
                  {t.texto}
                </p>
                {t.fecha_limite && (
                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      tareaVencida(t, hoy) ? "text-red-600" : "text-neutral-400"
                    }`}
                  >
                    {formatearFecha(t.fecha_limite)}
                  </span>
                )}
                <button
                  onClick={() => borrar(t)}
                  aria-label={`Eliminar ${t.texto}`}
                  className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:text-red-600"
                >
                  ✕
                </button>
              </article>
            ))}
            {filtradas.length === 0 && ordenadas.length > 0 && (
              <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                {`Ninguna tarea coincide con "${busqueda}".`}
              </p>
            )}
            {ordenadas.length === 0 && (
              <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                Sin tareas. Todo al día.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

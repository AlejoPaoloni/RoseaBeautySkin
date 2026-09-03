"use client";

import { useEffect, useState } from "react";
import type { Producto, Publicacion } from "@/lib/types";
import { ESTADOS_PUBLICACION } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import {
  actualizarPublicacion,
  eliminarPublicacion,
  listarPublicaciones,
} from "@/lib/db-gestion";
import {
  agendadas,
  ideas,
  progresoChecklist,
} from "@/lib/gestion";
import { fechaHoy, mesActual, mesAnterior, nombreMes, ultimosMeses } from "@/lib/finanzas";
import Calendario, {
  COLOR_ESTADO,
} from "@/components/admin/contenido/Calendario";
import PublicacionForm from "@/components/admin/contenido/PublicacionForm";

// Un par de meses hacia adelante: el calendario de contenido se planifica a
// futuro, al revés que el de finanzas que solo mira lo que ya pasó.
function mesSiguiente(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  return m === 12 ? `${anio + 1}-01` : `${anio}-${String(m + 1).padStart(2, "0")}`;
}

export default function ContenidoPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mes, setMes] = useState(mesActual());
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Publicacion | null>(null);
  const [fechaInicial, setFechaInicial] = useState("");

  async function cargar() {
    try {
      const [pubs, prods] = await Promise.all([
        listarPublicaciones(),
        listarProductos(),
      ]);
      setPublicaciones(pubs);
      setProductos(prods);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const hoy = fechaHoy();
  const delMes = agendadas(publicaciones, mes);
  const banco = ideas(publicaciones);

  // Tres meses atrás y tres adelante desde el mes actual.
  const mesesElegibles = [
    ...ultimosMeses(4, mesActual()),
    mesSiguiente(mesActual()),
    mesSiguiente(mesSiguiente(mesActual())),
  ];

  function abrirNueva(fecha: string) {
    setEditando(null);
    setFechaInicial(fecha);
    setFormAbierto(true);
  }

  function abrirEdicion(p: Publicacion) {
    setEditando(p);
    setFechaInicial("");
    setFormAbierto(true);
  }

  async function agendar(p: Publicacion, fecha: string) {
    if (!fecha) return;
    const previo = publicaciones;
    setPublicaciones((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, fecha } : x))
    );
    try {
      await actualizarPublicacion(p.id, { fecha });
    } catch {
      setPublicaciones(previo);
      alert("No se pudo agendar. Probá de nuevo.");
    }
  }

  async function borrar(p: Publicacion) {
    if (!confirm(`¿Eliminar "${p.titulo}"?`)) return;
    const previo = publicaciones;
    setPublicaciones((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await eliminarPublicacion(p.id);
    } catch {
      setPublicaciones(previo);
      alert("No se pudo eliminar. Probá de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Contenido</h1>
        <button
          onClick={() => abrirNueva("")}
          className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
        >
          + Publicación
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMes(mesAnterior(mes))}
                    aria-label="Mes anterior"
                    className="rounded-full px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    ‹
                  </button>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    aria-label="Mes del calendario"
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
                  >
                    {mesesElegibles.map((m) => (
                      <option key={m} value={m}>
                        {nombreMes(m)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setMes(mesSiguiente(mes))}
                    aria-label="Mes siguiente"
                    className="rounded-full px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    ›
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  {ESTADOS_PUBLICACION.map((e) => (
                    <span key={e} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: COLOR_ESTADO[e] }}
                      />
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Calendario
                  mes={mes}
                  publicaciones={delMes}
                  hoy={hoy}
                  onNuevo={abrirNueva}
                  onEditar={abrirEdicion}
                />
              </div>

              <p className="mt-3 text-xs text-neutral-400">
                Tocá un día para agendar algo ahí, o una publicación para
                editarla.
              </p>
            </section>

            <aside className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-serif text-lg text-rosea-700">
                Banco de ideas
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Sin fecha. Cargales una y saltan al calendario.
              </p>

              <div className="mt-4 space-y-3">
                {banco.map((p) => {
                  const progreso = progresoChecklist(p);
                  return (
                    <article
                      key={p.id}
                      className="rounded-xl border border-neutral-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => abrirEdicion(p)}
                          className="text-left text-sm text-neutral-800 hover:text-rosea-700"
                        >
                          {p.titulo}
                        </button>
                        <button
                          onClick={() => borrar(p)}
                          aria-label={`Eliminar ${p.titulo}`}
                          className="shrink-0 rounded-full px-1.5 text-sm text-neutral-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">
                        {p.red} · {p.formato}
                        {progreso.total > 0 &&
                          ` · ${progreso.hechos}/${progreso.total} pasos`}
                      </p>
                      <input
                        type="date"
                        onChange={(e) => agendar(p, e.target.value)}
                        aria-label={`Agendar ${p.titulo}`}
                        className="mt-2 w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 outline-none focus:border-rosea-300"
                      />
                    </article>
                  );
                })}
                {banco.length === 0 && (
                  <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                    Sin ideas guardadas. Creá una publicación y dejala sin
                    fecha.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {formAbierto && (
        <PublicacionForm
          publicacion={editando}
          fechaInicial={fechaInicial}
          productos={productos}
          onClose={() => setFormAbierto(false)}
          onSaved={() => {
            setFormAbierto(false);
            cargar();
          }}
          onBorrar={
            editando
              ? async () => {
                  await borrar(editando);
                  setFormAbierto(false);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

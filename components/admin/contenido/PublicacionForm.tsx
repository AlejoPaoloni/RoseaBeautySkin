"use client";

import { useState } from "react";
import type {
  EstadoPublicacion,
  Formato,
  PasoChecklist,
  Producto,
  Publicacion,
  Red,
} from "@/lib/types";
import {
  ESTADOS_PUBLICACION,
  FORMATOS,
  REDES,
} from "@/lib/types";
import { checklistPorDefecto } from "@/lib/gestion";
import {
  actualizarPublicacion,
  crearPublicacion,
} from "@/lib/db-gestion";

interface Props {
  publicacion: Publicacion | null;
  // Fecha con la que se abre al tocar un día del calendario. "" abre como idea.
  fechaInicial?: string;
  productos: Producto[];
  onClose: () => void;
  onSaved: () => void;
  // Solo al editar: desde el calendario no había otra forma de borrar una
  // publicación ya agendada.
  onBorrar?: () => void;
}

export default function PublicacionForm({
  publicacion,
  fechaInicial = "",
  productos,
  onClose,
  onSaved,
  onBorrar,
}: Props) {
  const [fecha, setFecha] = useState(publicacion?.fecha ?? fechaInicial);
  const [red, setRed] = useState<Red>(publicacion?.red ?? "Instagram");
  const [formato, setFormato] = useState<Formato>(
    publicacion?.formato ?? "Reel"
  );
  const [titulo, setTitulo] = useState(publicacion?.titulo ?? "");
  const [copy, setCopy] = useState(publicacion?.copy ?? "");
  const [estado, setEstado] = useState<EstadoPublicacion>(
    publicacion?.estado ?? "Idea"
  );
  const [checklist, setChecklist] = useState<PasoChecklist[]>(
    publicacion?.checklist ?? checklistPorDefecto()
  );
  const [nota, setNota] = useState(publicacion?.nota ?? "");
  const [ligados, setLigados] = useState<string[]>(
    publicacion?.productos ?? []
  );
  const [pasoNuevo, setPasoNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternarPaso(i: number) {
    setChecklist((prev) =>
      prev.map((p, j) => (j === i ? { ...p, hecho: !p.hecho } : p))
    );
  }

  function agregarPaso() {
    if (!pasoNuevo.trim()) return;
    setChecklist([...checklist, { paso: pasoNuevo.trim(), hecho: false }]);
    setPasoNuevo("");
  }

  function alternarProducto(id: string) {
    setLigados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Ponele un título para reconocerla en el calendario");
      return;
    }
    setGuardando(true);
    setError(null);
    const datos = {
      // Sin fecha se guarda como idea suelta en el banco.
      fecha: fecha === "" ? null : fecha,
      red,
      formato,
      titulo: titulo.trim(),
      copy: copy.trim() || null,
      estado,
      checklist: checklist.length > 0 ? checklist : null,
      nota: nota.trim() || null,
    };
    try {
      if (publicacion) {
        await actualizarPublicacion(publicacion.id, datos, ligados);
      } else {
        await crearPublicacion(datos, ligados);
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">
          {publicacion ? "Editar publicación" : "Nueva publicación"}
        </h2>

        <label className="mt-4 block text-sm text-neutral-600">
          Título *
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: reel probando el blush de Rare"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm text-neutral-600">
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
            />
          </label>
          <label className="block text-sm text-neutral-600">
            Estado
            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as EstadoPublicacion)
              }
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {ESTADOS_PUBLICACION.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Sin fecha queda en el banco de ideas hasta que la agendes.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm text-neutral-600">
            Red
            <select
              value={red}
              onChange={(e) => setRed(e.target.value as Red)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {REDES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-neutral-600">
            Formato
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value as Formato)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {FORMATOS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <span className="text-sm text-neutral-600">Checklist</span>
          <div className="mt-2 space-y-1.5">
            {checklist.map((p, i) => (
              <div key={`${p.paso}-${i}`} className="flex items-center gap-2">
                <label className="flex flex-1 items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={p.hecho}
                    onChange={() => alternarPaso(i)}
                    className="h-4 w-4 accent-rosea-400"
                  />
                  <span className={p.hecho ? "text-neutral-400 line-through" : ""}>
                    {p.paso}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setChecklist(checklist.filter((_, j) => j !== i))
                  }
                  aria-label={`Quitar paso ${p.paso}`}
                  className="rounded-full px-2 text-sm text-neutral-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={pasoNuevo}
              onChange={(e) => setPasoNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Enter en este input agregaría el paso y encima mandaría
                  // el formulario entero.
                  e.preventDefault();
                  agregarPaso();
                }
              }}
              placeholder="Agregar paso"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
            />
            <button
              type="button"
              onClick={agregarPaso}
              className="rounded-full bg-rosea-50 px-3 py-1 text-xs text-rosea-700 hover:bg-rosea-100"
            >
              + Paso
            </button>
          </div>
        </div>

        <div className="mt-5">
          <span className="text-sm text-neutral-600">
            Productos que promociona
          </span>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-2">
            {productos.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 text-sm text-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={ligados.includes(p.id)}
                  onChange={() => alternarProducto(p.id)}
                  className="h-4 w-4 accent-rosea-400"
                />
                <span className="truncate">
                  {p.marca ? `${p.marca} · ` : ""}
                  {p.nombre}
                </span>
              </label>
            ))}
            {productos.length === 0 && (
              <p className="text-xs text-neutral-400">
                Todavía no hay productos en el catálogo.
              </p>
            )}
          </div>
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Copy
          <textarea
            value={copy}
            rows={3}
            onChange={(e) => setCopy(e.target.value)}
            placeholder="El texto que va en el pie del post"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Nota
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Opcional: locación, hora, quién graba"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          {publicacion && onBorrar && (
            <button
              type="button"
              onClick={onBorrar}
              className="mr-auto rounded-full px-4 py-2 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-600"
            >
              Eliminar
            </button>
          )}
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

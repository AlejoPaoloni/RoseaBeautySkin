"use client";

import { useState } from "react";
import type { CategoriaGasto, Gasto } from "@/lib/types";
import { CATEGORIAS_GASTO } from "@/lib/types";
import { actualizarGasto, crearGasto } from "@/lib/db-finanzas";
import { fechaHoy } from "@/lib/finanzas";

interface Props {
  gasto: Gasto | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GastoForm({ gasto, onClose, onSaved }: Props) {
  const [fecha, setFecha] = useState(gasto?.fecha ?? fechaHoy());
  const [categoria, setCategoria] = useState<CategoriaGasto>(
    gasto?.categoria ?? "Mercaderia"
  );
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? "");
  const [monto, setMonto] = useState(gasto ? String(gasto.monto) : "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError("Poné una descripción para reconocerlo después");
      return;
    }
    const montoNumero = Number(monto);
    if (!Number.isInteger(montoNumero) || montoNumero < 0) {
      setError("El monto debe ser un número entero mayor o igual a 0");
      return;
    }
    setGuardando(true);
    setError(null);
    const datos = {
      fecha,
      categoria,
      descripcion: descripcion.trim(),
      monto: montoNumero,
    };
    try {
      if (gasto) {
        await actualizarGasto(gasto.id, datos);
      } else {
        await crearGasto(datos);
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">
          {gasto ? "Editar gasto" : "Nuevo gasto"}
        </h2>

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
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {CATEGORIAS_GASTO.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Descripción *
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: pedido Sephora julio"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Monto (ARS) *
          <input
            type="number"
            min={0}
            step={1}
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        {categoria === "Mercaderia" && (
          <p className="mt-2 text-xs text-neutral-500">
            Mercadería es compra de stock: pega en la caja del mes, pero no
            resta dos veces en la ganancia (esa ya descuenta el costo de lo
            vendido).
          </p>
        )}

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

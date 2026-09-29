"use client";

import { useState } from "react";
import type { Producto } from "@/lib/types";
import { formatearPrecio } from "@/lib/catalog";
import { fechaHoy } from "@/lib/finanzas";
import { aplicarLlegada, nombreParaPedir } from "@/lib/gestion";
import { registrarLlegada } from "@/lib/db-gestion";

interface Props {
  productos: Producto[];
  // Renglones precargados (desde la lista de Reposicion).
  inicial: { producto_id: string; unidades: number }[];
  onClose: () => void;
  onSaved: (aviso: string) => void;
}

interface Linea {
  clave: string;
  producto_id: string;
  unidades: number;
  costo: number;
}

let contador = 0;
function clave() {
  contador += 1;
  return `ll-${contador}`;
}

// Registrar que llego un pedido al proveedor: suma el stock, actualiza el
// costo de cada producto y carga el gasto de Mercaderia (y el de envio, si
// hubo) — lo que antes eran tres pasos por separado.
export default function LlegadaForm({ productos, inicial, onClose, onSaved }: Props) {
  const costoDe = (id: string) => productos.find((p) => p.id === id)?.costo ?? 0;
  const [fecha, setFecha] = useState(fechaHoy());
  const [descripcion, setDescripcion] = useState("Pedido al proveedor");
  const [envio, setEnvio] = useState(0);
  const [cargarGasto, setCargarGasto] = useState(true);
  const [lineas, setLineas] = useState<Linea[]>(() =>
    inicial.length > 0
      ? inicial.map((i) => ({ clave: clave(), ...i, costo: costoDe(i.producto_id) }))
      : [{ clave: clave(), producto_id: "", unidades: 1, costo: 0 }]
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function editar(c: string, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l) => (l.clave === c ? { ...l, ...cambios } : l)));
  }

  const validas = lineas.filter((l) => l.producto_id !== "" && l.unidades > 0);
  const { cambios, totalMercaderia } = aplicarLlegada(productos, validas);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validas.length === 0) {
      setError("Agregá al menos un producto con unidades");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await registrarLlegada(
        cambios,
        cargarGasto
          ? [
              { fecha, categoria: "Mercaderia", descripcion, monto: totalMercaderia },
              { fecha, categoria: "Envios", descripcion: `Envío: ${descripcion}`, monto: envio },
            ]
          : []
      );
      // Los que cambiaron de costo o vuelven a mostrar precio: conviene
      // revisar el precio de venta antes de publicarlos.
      const revisar = cambios
        .map((c) => productos.find((p) => p.id === c.id)!)
        .filter((p) => {
          const nuevo = cambios.find((c) => c.id === p.id)!;
          return nuevo.costo !== p.costo || (p.estado === "Sin stock" && nuevo.estado === "Disponible");
        })
        .map(nombreParaPedir);
      onSaved(
        `Llegada registrada: ${cambios.length} producto${cambios.length === 1 ? "" : "s"}.` +
          (revisar.length > 0
            ? ` Revisá el precio de venta de: ${revisar.join(", ")}.`
            : "")
      );
    } catch {
      setError("No se pudo registrar la llegada. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">Registrar llegada</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Suma las unidades al stock, actualiza el costo de cada producto y
          carga el gasto en Finanzas.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            Descripción del gasto
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Productos que llegaron</span>
            <button
              type="button"
              onClick={() =>
                setLineas([...lineas, { clave: clave(), producto_id: "", unidades: 1, costo: 0 }])
              }
              className="rounded-full bg-rosea-50 px-3 py-1 text-xs text-rosea-700 hover:bg-rosea-100"
            >
              + Agregar producto
            </button>
          </div>
          <div className="mt-1 hidden grid-cols-[1fr_4.5rem_7rem_2rem] gap-2 text-xs text-neutral-500 sm:grid">
            <span>Producto</span>
            <span>Unidades</span>
            <span>Costo unitario</span>
          </div>
          <div className="mt-1 space-y-3">
            {lineas.map((l, i) => {
              const p = productos.find((x) => x.id === l.producto_id);
              const margen =
                p && p.precio > 0 && l.costo > 0
                  ? Math.round(((p.precio - l.costo) / p.precio) * 100)
                  : null;
              return (
                <div key={l.clave}>
                  <div className="grid grid-cols-[1fr_4.5rem_7rem_2rem] items-center gap-2">
                    <select
                      value={l.producto_id}
                      onChange={(e) =>
                        editar(l.clave, { producto_id: e.target.value, costo: costoDe(e.target.value) })
                      }
                      aria-label={`Producto ${i + 1}`}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                    >
                      <option value="">Elegí un producto…</option>
                      {productos.map((x) => (
                        <option key={x.id} value={x.id}>
                          {nombreParaPedir(x)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={l.unidades}
                      onChange={(e) => editar(l.clave, { unidades: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                      aria-label={`Unidades del producto ${i + 1}`}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-rosea-300"
                    />
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={l.costo}
                      onChange={(e) => editar(l.clave, { costo: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                      aria-label={`Costo unitario del producto ${i + 1}`}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-rosea-300"
                    />
                    <button
                      type="button"
                      onClick={() => setLineas((prev) => prev.filter((x) => x.clave !== l.clave))}
                      aria-label={`Quitar producto ${i + 1}`}
                      className="rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                  {p && (
                    <p
                      className={`mt-1 text-xs ${
                        margen !== null && margen < 15 ? "text-red-600" : "text-neutral-500"
                      }`}
                    >
                      Quedan {p.stock ?? 0} · precio {formatearPrecio(p.precio)}
                      {margen !== null && ` · margen con este costo: ${margen}%`}
                      {margen !== null && margen < 15 && " — revisá el precio"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-neutral-600">
            Envío / aduana del pedido (opcional)
            <input
              type="number"
              min={0}
              step={1}
              value={envio}
              onChange={(e) => setEnvio(Math.max(0, Math.round(Number(e.target.value) || 0)))}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={cargarGasto}
              onChange={(e) => setCargarGasto(e.target.checked)}
              className="h-4 w-4 accent-rosea-400"
            />
            Cargar el gasto en Finanzas
          </label>
        </div>

        <div className="mt-5 rounded-xl bg-rosea-50 p-4 text-sm text-rosea-700">
          <div className="flex items-baseline justify-between">
            <span>Mercadería</span>
            <span className="font-serif text-xl text-neutral-800">
              {formatearPrecio(totalMercaderia)}
            </span>
          </div>
          {envio > 0 && (
            <div className="mt-1 flex items-baseline justify-between text-xs">
              <span>Envío / aduana (gasto aparte, en Envíos)</span>
              <span>{formatearPrecio(envio)}</span>
            </div>
          )}
          {!cargarGasto && (
            <p className="mt-2 text-xs">
              No se carga ningún gasto: usalo si ya lo cargaste a mano en
              Finanzas.
            </p>
          )}
        </div>

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
            {guardando ? "Guardando…" : "Registrar llegada"}
          </button>
        </div>
      </form>
    </div>
  );
}

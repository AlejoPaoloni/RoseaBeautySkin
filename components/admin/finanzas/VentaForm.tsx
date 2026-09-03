"use client";

import { useState } from "react";
import type { Canal, Clienta, Producto } from "@/lib/types";
import { CANALES } from "@/lib/types";
import { crearVenta, type ItemNuevo } from "@/lib/db-finanzas";
import { descontarStock } from "@/lib/db-gestion";
import { fechaHoy } from "@/lib/finanzas";
import { formatearPrecio } from "@/lib/catalog";

interface Props {
  productos: Producto[];
  clientas: Clienta[];
  onClose: () => void;
  onSaved: () => void;
}

interface Linea extends ItemNuevo {
  // Clave estable para React: el id del producto se puede repetir si la
  // clienta lleva el mismo item en dos renglones distintos.
  clave: string;
}

let contador = 0;

function lineaVacia(): Linea {
  contador += 1;
  return {
    clave: `l-${contador}`,
    producto_id: null,
    nombre: "",
    cantidad: 1,
    precio_unitario: 0,
    costo_unitario: 0,
  };
}

export default function VentaForm({
  productos,
  clientas,
  onClose,
  onSaved,
}: Props) {
  const [fecha, setFecha] = useState(fechaHoy());
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [canal, setCanal] = useState<Canal>("Instagram");
  const [nota, setNota] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function elegirProducto(clave: string, id: string) {
    const p = productos.find((x) => x.id === id);
    setLineas((prev) =>
      prev.map((l) =>
        l.clave === clave
          ? {
              ...l,
              producto_id: p?.id ?? null,
              nombre: p?.nombre ?? "",
              // Precio y costo se copian como snapshot: si mañana cambia la
              // lista de precios, esta venta sigue valiendo lo de hoy.
              precio_unitario: p?.precio ?? 0,
              costo_unitario: p?.costo ?? 0,
            }
          : l
      )
    );
  }

  function editarLinea(clave: string, campo: keyof Linea, valor: number) {
    setLineas((prev) =>
      prev.map((l) => (l.clave === clave ? { ...l, [campo]: valor } : l))
    );
  }

  const total = lineas.reduce(
    (t, l) => t + l.precio_unitario * l.cantidad,
    0
  );
  const ganancia = lineas.reduce(
    (t, l) => t + (l.precio_unitario - l.costo_unitario) * l.cantidad,
    0
  );
  const sinCosto = lineas.some(
    (l) => l.producto_id !== null && l.costo_unitario === 0
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = lineas.filter((l) => l.nombre.trim() !== "");
    if (items.length === 0) {
      setError("Elegí al menos un producto");
      return;
    }
    if (items.some((l) => l.cantidad < 1)) {
      setError("La cantidad tiene que ser 1 o más");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const guardados = items.map((l) => ({
        producto_id: l.producto_id,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        costo_unitario: l.costo_unitario,
      }));
      await crearVenta(
        {
          fecha,
          cliente: clienteId === "" ? cliente.trim() || null : null,
          cliente_id: clienteId || null,
          canal,
          nota: nota.trim() || null,
        },
        guardados
      );
      // Después de guardar: si el stock fallara, la venta ya quedó registrada
      // y el número de unidades se corrige a mano desde el producto.
      await descontarStock(guardados, productos);
      onSaved();
    } catch {
      setError("No se pudo guardar la venta. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">Nueva venta</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            Clienta
            {clientas.length > 0 && (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
              >
                <option value="">Sin ficha</option>
                {clientas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
            {clienteId === "" && (
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre suelto (opcional)"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
              />
            )}
          </label>
          <label className="block text-sm text-neutral-600">
            Canal
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value as Canal)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {CANALES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Productos</span>
            <button
              type="button"
              onClick={() => setLineas([...lineas, lineaVacia()])}
              className="rounded-full bg-rosea-50 px-3 py-1 text-xs text-rosea-700 hover:bg-rosea-100"
            >
              + Agregar renglón
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {lineas.map((l, i) => (
              <div
                key={l.clave}
                className="grid grid-cols-[1fr_4rem_6rem_2rem] items-center gap-2"
              >
                <select
                  value={l.producto_id ?? ""}
                  onChange={(e) => elegirProducto(l.clave, e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                  aria-label={`Producto del renglón ${i + 1}`}
                >
                  <option value="">Elegí un producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.marca ? `${p.marca} · ` : ""}
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={l.cantidad}
                  onChange={(e) =>
                    editarLinea(l.clave, "cantidad", Number(e.target.value))
                  }
                  aria-label={`Cantidad del renglón ${i + 1}`}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-rosea-300"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={l.precio_unitario}
                  onChange={(e) =>
                    editarLinea(
                      l.clave,
                      "precio_unitario",
                      Number(e.target.value)
                    )
                  }
                  aria-label={`Precio unitario del renglón ${i + 1}`}
                  className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm outline-none focus:border-rosea-300"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLineas((prev) =>
                      prev.length === 1
                        ? [lineaVacia()]
                        : prev.filter((x) => x.clave !== l.clave)
                    )
                  }
                  aria-label={`Quitar renglón ${i + 1}`}
                  className="rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            El precio se completa solo con el del catálogo. Pisalo si hiciste
            descuento.
          </p>
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Nota
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Opcional: envío, seña, etc."
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <div className="mt-5 rounded-xl bg-rosea-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-rosea-700">Total</span>
            <span className="font-serif text-2xl text-neutral-800">
              {formatearPrecio(total)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between text-xs text-rosea-700">
            <span>Ganancia estimada</span>
            <span>{formatearPrecio(ganancia)}</span>
          </div>
          {sinCosto && (
            <p className="mt-2 text-xs text-rosea-700">
              Hay productos sin costo cargado: la ganancia de esos renglones se
              cuenta entera. Cargá el costo en el producto para que sea real.
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
            {guardando ? "Guardando…" : "Guardar venta"}
          </button>
        </div>
      </form>
    </div>
  );
}

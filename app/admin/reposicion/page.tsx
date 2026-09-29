"use client";

import { useEffect, useMemo, useState } from "react";
import type { Producto, Venta } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import { listarVentas } from "@/lib/db-finanzas";
import { formatearPrecio } from "@/lib/catalog";
import { fechaHoy } from "@/lib/finanzas";
import {
  DIAS_REPOSICION,
  nombreParaPedir,
  paraReponer,
  textoReposicion,
} from "@/lib/gestion";
import LlegadaForm from "@/components/admin/LlegadaForm";

// Lo que hay que volverle a pedir al proveedor: Sin stock y stock bajo, con
// cuanto se vendio de cada uno para decidir cantidades. No guarda nada: la
// lista se arma de nuevo cada vez desde productos y ventas.
export default function ReposicionPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  // Cantidad elegida por producto; si no esta, vale la sugerida.
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [copiado, setCopiado] = useState(false);
  const [llegadaAbierta, setLlegadaAbierta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function cargar() {
    try {
      const [p, v] = await Promise.all([listarProductos(), listarVentas()]);
      setProductos(p);
      setVentas(v);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filas = useMemo(
    () => paraReponer(productos, ventas, fechaHoy()),
    [productos, ventas]
  );

  const elegidas = filas.map((f) => ({
    ...f,
    cantidad: cantidades[f.producto.id] ?? f.sugerido,
  }));
  const aPedir = elegidas.filter((f) => f.cantidad > 0);
  const unidades = aPedir.reduce((t, f) => t + f.cantidad, 0);
  const costoEstimado = aPedir.reduce(
    (t, f) => t + f.cantidad * (f.producto.costo ?? 0),
    0
  );
  const sinCosto = aPedir.filter((f) => f.producto.costo == null).length;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoReposicion(aPedir));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert("No se pudo copiar. Probá de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Reposición</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copiar}
            disabled={aPedir.length === 0}
            className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-40"
          >
            {copiado ? "¡Copiado!" : "Copiar para el proveedor"}
          </button>
          <button
            onClick={() => {
              setAviso(null);
              setLlegadaAbierta(true);
            }}
            className="rounded-full px-4 py-2 text-sm text-rosea-700 ring-1 ring-rosea-200 hover:bg-rosea-50"
          >
            Registrar llegada
          </button>
        </div>
      </header>

      {llegadaAbierta && (
        <LlegadaForm
          productos={productos}
          // Precarga lo que se eligio pedir: lo normal es que llegue eso.
          inicial={aPedir.map((f) => ({ producto_id: f.producto.id, unidades: f.cantidad }))}
          onClose={() => setLlegadaAbierta(false)}
          onSaved={(texto) => {
            setLlegadaAbierta(false);
            setAviso(texto);
            setCantidades({});
            cargar();
          }}
        />
      )}

      <main className="mx-auto max-w-3xl px-4 py-8">
        {aviso && (
          <p
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {aviso}
          </p>
        )}
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : filas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-rosea-200 p-6 text-center text-sm text-neutral-500">
            No hay nada para reponer: ningún producto Sin stock ni con stock
            bajo.
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-500">
              Productos Sin stock y con stock bajo. La cantidad sugerida es lo
              vendido en los últimos {DIAS_REPOSICION} días menos lo que queda,
              y como mínimo lo necesario para pasar el aviso de stock bajo.
              Poné 0 en lo que no quieras pedir.
            </p>

            <ul className="mt-6 space-y-2">
              {elegidas.map((f) => (
                <li
                  key={f.producto.id}
                  className={`flex items-center gap-3 rounded-xl border border-rosea-100 bg-white p-3 ${
                    f.cantidad === 0 ? "opacity-50" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {nombreParaPedir(f.producto)}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      <span
                        className={
                          f.motivo === "Sin stock"
                            ? "text-red-600"
                            : "text-amber-800"
                        }
                      >
                        {f.motivo}
                      </span>
                      {" · "}
                      quedan {f.producto.stock ?? 0} · vendiste {f.vendidas} en{" "}
                      {DIAS_REPOSICION} días
                      {f.producto.costo != null &&
                        ` · costo ${formatearPrecio(f.producto.costo)}`}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
                    Pedir
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={f.cantidad}
                      onChange={(e) => {
                        const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        setCantidades((prev) => ({ ...prev, [f.producto.id]: n }));
                      }}
                      aria-label={`Cantidad a pedir de ${f.producto.nombre}`}
                      className="w-16 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800 outline-none focus:border-rosea-300"
                    />
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-rosea-100 bg-white p-4 text-sm text-neutral-700">
              <p>
                {aPedir.length} producto{aPedir.length === 1 ? "" : "s"} ·{" "}
                {unidades} unidad{unidades === 1 ? "" : "es"}
              </p>
              <p className="mt-1">
                Costo estimado:{" "}
                <strong className="font-medium">
                  {formatearPrecio(costoEstimado)}
                </strong>
                {sinCosto > 0 && (
                  <span className="text-neutral-500">
                    {" "}
                    (sin contar {sinCosto} sin costo cargado)
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Es con el último costo cargado: el pedido nuevo puede venir a
                otro precio.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

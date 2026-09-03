"use client";

import { useEffect, useMemo, useState } from "react";
import type { Clienta, Gasto, Producto, Venta } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import {
  eliminarGasto,
  eliminarVenta,
  listarGastos,
  listarVentas,
} from "@/lib/db-finanzas";
import { listarClientas, reponerStock } from "@/lib/db-gestion";
import {
  formatearFecha,
  gastosPorCategoria,
  mesActual,
  mesAnterior,
  nombreMes,
  resumenMes,
  serieMensual,
  topProductos,
  totalVenta,
  ultimosMeses,
  unidadesVenta,
} from "@/lib/finanzas";
import { formatearPrecio } from "@/lib/catalog";
import ResumenCards from "@/components/admin/finanzas/ResumenCards";
import GraficoEvolucion from "@/components/admin/finanzas/GraficoEvolucion";
import ListaBarras from "@/components/admin/finanzas/ListaBarras";
import VentaForm from "@/components/admin/finanzas/VentaForm";
import GastoForm from "@/components/admin/finanzas/GastoForm";

const MESES_EN_GRAFICO = 6;

export default function FinanzasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [mes, setMes] = useState(mesActual());
  const [cargando, setCargando] = useState(true);
  const [ventaAbierta, setVentaAbierta] = useState(false);
  const [gastoAbierto, setGastoAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);

  async function cargar() {
    try {
      const [p, v, g, c] = await Promise.all([
        listarProductos(),
        listarVentas(),
        listarGastos(),
        listarClientas(),
      ]);
      setProductos(p);
      setVentas(v);
      setGastos(g);
      setClientas(c);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const actual = useMemo(
    () => resumenMes(ventas, gastos, mes),
    [ventas, gastos, mes]
  );
  const anterior = useMemo(
    () => resumenMes(ventas, gastos, mesAnterior(mes)),
    [ventas, gastos, mes]
  );
  const serie = useMemo(
    () => serieMensual(ventas, gastos, ultimosMeses(MESES_EN_GRAFICO, mes)),
    [ventas, gastos, mes]
  );

  const ventasDelMes = ventas.filter((v) => v.fecha.slice(0, 7) === mes);
  const gastosDelMes = gastos.filter((g) => g.fecha.slice(0, 7) === mes);

  // 12 meses para elegir, contando siempre desde hoy: si estamos en enero
  // sigue habiendo meses del año pasado en la lista.
  const mesesElegibles = ultimosMeses(12, mesActual());

  // La ficha manda; `cliente` es el nombre suelto de las ventas viejas.
  function nombreClienta(v: Venta): string {
    if (v.cliente_id) {
      return clientas.find((c) => c.id === v.cliente_id)?.nombre ?? "Sin nombre";
    }
    return v.cliente ?? "Sin nombre";
  }

  async function borrarVenta(v: Venta) {
    if (!confirm(`¿Eliminar la venta del ${formatearFecha(v.fecha)}?`)) return;
    const previo = ventas;
    setVentas((prev) => prev.filter((x) => x.id !== v.id));
    try {
      await eliminarVenta(v.id);
      // La venta no existió: las unidades vuelven al stock.
      await reponerStock(v.items, productos);
    } catch {
      setVentas(previo);
      alert("No se pudo eliminar la venta. Probá de nuevo.");
    }
  }

  async function borrarGasto(g: Gasto) {
    if (!confirm(`¿Eliminar "${g.descripcion}"?`)) return;
    const previo = gastos;
    setGastos((prev) => prev.filter((x) => x.id !== g.id));
    try {
      await eliminarGasto(g.id);
    } catch {
      setGastos(previo);
      alert("No se pudo eliminar el gasto. Probá de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Finanzas</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setVentaAbierta(true)}
            className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
          >
            + Venta
          </button>
          <button
            onClick={() => {
              setGastoEditando(null);
              setGastoAbierto(true);
            }}
            className="rounded-full px-4 py-2 text-sm text-rosea-700 ring-1 ring-rosea-200 hover:bg-rosea-50"
          >
            + Gasto
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm text-neutral-500" htmlFor="mes">
                Mes
              </label>
              <select
                id="mes"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                {mesesElegibles.map((m) => (
                  <option key={m} value={m}>
                    {nombreMes(m)}
                  </option>
                ))}
              </select>
            </div>

            <ResumenCards actual={actual} anterior={anterior} />

            <p className="mt-3 text-xs text-neutral-500">
              <strong className="font-medium">Caja</strong> es la plata que
              entró menos toda la que salió este mes (incluida la compra de
              stock). <strong className="font-medium">Ganancia</strong> descuenta
              solo el costo de lo que se vendió más los gastos operativos, así
              un mes de pedido grande no se ve como pérdida.
            </p>

            <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
              <GraficoEvolucion serie={serie} />
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                <ListaBarras
                  titulo="Top productos del mes"
                  vacio="Todavía no hay ventas este mes."
                  filas={topProductos(ventas, mes).map((f) => ({
                    clave: f.nombre,
                    etiqueta: f.nombre,
                    monto: f.ingresos,
                    detalle: `${f.unidades} u · ${formatearPrecio(f.ganancia)}`,
                  }))}
                />
              </section>
              <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                <ListaBarras
                  titulo="Gastos por categoría"
                  vacio="Sin gastos cargados este mes."
                  color="#4a7fb5"
                  filas={gastosPorCategoria(gastos, mes).map((f) => ({
                    clave: f.categoria,
                    etiqueta: f.categoria,
                    monto: f.monto,
                    detalle: `${Math.round(f.pct)}%`,
                  }))}
                />
              </section>
            </div>

            <section className="mt-8">
              <h2 className="font-serif text-2xl text-rosea-700">
                Ventas de {nombreMes(mes)}
              </h2>
              <div className="mt-3 space-y-2">
                {ventasDelMes.map((v) => (
                  <article
                    key={v.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <span className="w-20 shrink-0 text-sm text-neutral-500 tabular-nums">
                      {formatearFecha(v.fecha)}
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="text-sm text-neutral-800">
                        {nombreClienta(v)}
                        <span className="text-neutral-400"> · {v.canal}</span>
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {unidadesVenta(v)} u
                    </span>
                    <span className="shrink-0 text-sm text-neutral-800 tabular-nums">
                      {formatearPrecio(totalVenta(v))}
                    </span>
                    <button
                      onClick={() => borrarVenta(v)}
                      aria-label={`Eliminar venta del ${formatearFecha(v.fecha)}`}
                      className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </article>
                ))}
                {ventasDelMes.length === 0 && (
                  <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                    Sin ventas cargadas en {nombreMes(mes)}.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="font-serif text-2xl text-rosea-700">
                Gastos de {nombreMes(mes)}
              </h2>
              <div className="mt-3 space-y-2">
                {gastosDelMes.map((g) => (
                  <article
                    key={g.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <span className="w-20 shrink-0 text-sm text-neutral-500 tabular-nums">
                      {formatearFecha(g.fecha)}
                    </span>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {g.categoria}
                    </span>
                    <p className="min-w-40 flex-1 truncate text-sm text-neutral-800">
                      {g.descripcion}
                    </p>
                    <span className="shrink-0 text-sm text-neutral-800 tabular-nums">
                      {formatearPrecio(g.monto)}
                    </span>
                    <button
                      onClick={() => {
                        setGastoEditando(g);
                        setGastoAbierto(true);
                      }}
                      className="shrink-0 rounded-full px-3 py-1 text-xs text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => borrarGasto(g)}
                      aria-label={`Eliminar ${g.descripcion}`}
                      className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </article>
                ))}
                {gastosDelMes.length === 0 && (
                  <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                    Sin gastos cargados en {nombreMes(mes)}.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {ventaAbierta && (
        <VentaForm
          productos={productos}
          clientas={clientas}
          onClose={() => setVentaAbierta(false)}
          onSaved={() => {
            setVentaAbierta(false);
            cargar();
          }}
        />
      )}

      {gastoAbierto && (
        <GastoForm
          gasto={gastoEditando}
          onClose={() => setGastoAbierto(false)}
          onSaved={() => {
            setGastoAbierto(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

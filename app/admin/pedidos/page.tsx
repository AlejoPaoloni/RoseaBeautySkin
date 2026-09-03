"use client";

import { useEffect, useState } from "react";
import type { Clienta, EstadoPedido, Pedido, Producto } from "@/lib/types";
import { ESTADOS_PEDIDO } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import { crearVenta } from "@/lib/db-finanzas";
import {
  actualizarPedido,
  descontarStock,
  eliminarPedido,
  listarClientas,
  listarPedidos,
} from "@/lib/db-gestion";
import { pedidosAbiertos, saldoPedido, totalPedido } from "@/lib/gestion";
import { fechaHoy, formatearFecha } from "@/lib/finanzas";
import { formatearPrecio } from "@/lib/catalog";
import PedidoForm from "@/components/admin/pedidos/PedidoForm";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);

  async function cargar() {
    try {
      const [pe, pr, cl] = await Promise.all([
        listarPedidos(),
        listarProductos(),
        listarClientas(),
      ]);
      setPedidos(pe);
      setProductos(pr);
      setClientas(cl);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const abiertos = pedidosAbiertos(pedidos);
  const cerrados = pedidos.filter((p) => p.estado === "Entregado");

  function nombreDe(p: Pedido): string {
    if (p.cliente_id) {
      return clientas.find((c) => c.id === p.cliente_id)?.nombre ?? "Sin nombre";
    }
    return p.cliente_texto ?? "Sin nombre";
  }

  async function cambiarEstado(p: Pedido, estado: EstadoPedido) {
    const previo = pedidos;
    setPedidos((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, estado } : x))
    );
    try {
      await actualizarPedido(p.id, { estado });
    } catch {
      setPedidos(previo);
      alert("No se pudo actualizar el estado. Probá de nuevo.");
    }
  }

  // El pedido pasa a ser una venta real: recién ahí entra en las finanzas y
  // descuenta stock. El costo sale del catálogo al momento de convertir.
  async function convertirEnVenta(p: Pedido) {
    if (p.venta_id) return;
    if (
      !confirm(
        `¿Registrar el pedido de ${nombreDe(p)} como venta de ${formatearPrecio(
          totalPedido(p)
        )}?`
      )
    ) {
      return;
    }
    const items = p.items.map((i) => ({
      producto_id: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio_unitario: i.precio_estimado,
      costo_unitario:
        productos.find((x) => x.id === i.producto_id)?.costo ?? 0,
    }));
    try {
      const ventaId = await crearVenta(
        {
          fecha: fechaHoy(),
          cliente: p.cliente_id ? null : p.cliente_texto,
          cliente_id: p.cliente_id,
          canal: "WhatsApp",
          nota: `Pedido del ${formatearFecha(p.fecha)}`,
        },
        items
      );
      await descontarStock(items, productos);
      await actualizarPedido(p.id, {
        venta_id: ventaId,
        estado: "Entregado",
      });
      await cargar();
    } catch {
      alert("No se pudo convertir en venta. Probá de nuevo.");
    }
  }

  async function borrar(p: Pedido) {
    if (!confirm(`¿Eliminar el pedido de ${nombreDe(p)}?`)) return;
    const previo = pedidos;
    setPedidos((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await eliminarPedido(p.id);
    } catch {
      setPedidos(previo);
      alert("No se pudo eliminar. Probá de nuevo.");
    }
  }

  function Tarjeta({ p }: { p: Pedido }) {
    return (
      <article className="rounded-xl border border-neutral-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 shrink-0 text-sm text-neutral-500 tabular-nums">
            {formatearFecha(p.fecha)}
          </span>
          <div className="min-w-40 flex-1">
            <p className="text-sm text-neutral-800">{nombreDe(p)}</p>
            <p className="truncate text-xs text-neutral-500">
              {p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
            </p>
          </div>
          <select
            value={p.estado}
            onChange={(e) => cambiarEstado(p, e.target.value as EstadoPedido)}
            aria-label={`Estado del pedido de ${nombreDe(p)}`}
            className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          >
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <div className="shrink-0 text-right">
            <p className="text-sm text-neutral-800 tabular-nums">
              {formatearPrecio(totalPedido(p))}
            </p>
            <p className="text-xs text-neutral-400">
              {p.sena > 0
                ? `seña ${formatearPrecio(p.sena)} · falta ${formatearPrecio(
                    saldoPedido(p)
                  )}`
                : "sin seña"}
            </p>
          </div>
          <button
            onClick={() => borrar(p)}
            aria-label={`Eliminar pedido de ${nombreDe(p)}`}
            className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {p.nota && (
          <p className="mt-2 text-xs text-neutral-500">{p.nota}</p>
        )}

        <div className="mt-2">
          {p.venta_id ? (
            <span className="text-xs text-neutral-400">
              Ya registrado como venta.
            </span>
          ) : (
            <button
              onClick={() => convertirEnVenta(p)}
              className="rounded-full bg-rosea-50 px-3 py-1 text-xs text-rosea-700 hover:bg-rosea-100"
            >
              Registrar como venta
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Pedidos</h1>
        <button
          onClick={() => setFormAbierto(true)}
          className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
        >
          + Pedido
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          <>
            <section>
              <h2 className="font-serif text-2xl text-rosea-700">
                En curso ({abiertos.length})
              </h2>
              <div className="mt-3 space-y-2">
                {abiertos.map((p) => (
                  <Tarjeta key={p.id} p={p} />
                ))}
                {abiertos.length === 0 && (
                  <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                    Sin pedidos abiertos.
                  </p>
                )}
              </div>
            </section>

            {cerrados.length > 0 && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-rosea-700">
                  Entregados
                </h2>
                <div className="mt-3 space-y-2">
                  {cerrados.map((p) => (
                    <Tarjeta key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {formAbierto && (
        <PedidoForm
          productos={productos}
          clientas={clientas}
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

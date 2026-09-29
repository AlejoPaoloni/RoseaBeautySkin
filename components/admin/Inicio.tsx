"use client";

import Link from "next/link";
import type { Clienta, Gasto, Pedido, Producto, Publicacion, Tarea, Venta } from "@/lib/types";
import { formatearPrecio } from "@/lib/catalog";
import {
  formatearFecha,
  mesActual,
  pendientesDeCobro,
  proyeccionMes,
  resumenMes,
  totalVenta,
} from "@/lib/finanzas";
import {
  clientasInactivas,
  nombreParaPedir,
  paraReponer,
  pedidosParaEntregar,
  proximasPublicaciones,
  tareasUrgentes,
  totalPedido,
} from "@/lib/gestion";

export interface DatosInicio {
  productos: Producto[];
  ventas: Venta[];
  gastos: Gasto[];
  clientas: Clienta[];
  pedidos: Pedido[];
  tareas: Tarea[];
  publicaciones: Publicacion[];
}

const MAX_ITEMS = 4;

function fechaLarga(hoy: string): string {
  const [a, m, d] = hoy.split("-").map(Number);
  // Mediodia UTC: el dia no se corre por zona horaria.
  return new Date(Date.UTC(a, m - 1, d, 12)).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// Pantalla de entrada del panel: lo que pide atencion hoy, juntado de las
// demas secciones. No calcula nada nuevo, reusa las mismas funciones que
// Finanzas, Reposicion, Pedidos, Tareas, Contenido y Clientas.
export default function Inicio({ datos, hoy }: { datos: DatosInicio; hoy: string }) {
  const { productos, ventas, gastos, clientas, pedidos, tareas, publicaciones } = datos;
  const mes = mesActual(new Date(`${hoy}T12:00:00`));
  const resumen = resumenMes(ventas, gastos, mes);
  const proyeccion = proyeccionMes(ventas, mes, hoy);

  const nombreClienta = (clienteId: string | null, suelto: string | null) =>
    clienteId
      ? (clientas.find((c) => c.id === clienteId)?.nombre ?? "Sin nombre")
      : (suelto ?? "Sin nombre");

  const cobrar = pendientesDeCobro(ventas);
  const totalCobrar = cobrar.reduce((t, v) => t + totalVenta(v), 0);
  const entregar = pedidosParaEntregar(pedidos);
  const enCamino = pedidos.filter((p) => p.estado === "En camino").length;
  const reponer = paraReponer(productos, ventas, hoy);
  const agotados = reponer.filter((f) => f.motivo === "Sin stock").length;
  const urgentes = tareasUrgentes(tareas, hoy);
  const contenido = proximasPublicaciones(publicaciones, hoy);
  const escribir = clientasInactivas(clientas, ventas, hoy);

  const todoAlDia =
    cobrar.length + entregar.length + reponer.length + urgentes.length + contenido.length === 0;

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Inicio</h1>
        <p className="text-xs text-neutral-500 first-letter:uppercase">{fechaLarga(hoy)}</p>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <Numero
            titulo="Ventas del mes"
            valor={formatearPrecio(resumen.ingresos)}
            pie={
              proyeccion !== null
                ? `Al ritmo actual cerrás en ${formatearPrecio(proyeccion)}`
                : `${resumen.cantidadVentas} venta${resumen.cantidadVentas === 1 ? "" : "s"}`
            }
            href="/admin/finanzas"
            destacado
          />
          <Numero
            titulo="Ganancia del mes"
            valor={formatearPrecio(resumen.gananciaMargen)}
            pie={
              resumen.margenPct === null
                ? "sin ventas todavía"
                : `${Math.round(resumen.margenPct)}% de lo vendido`
            }
            href="/admin/finanzas"
          />
          <Numero
            titulo="Por cobrar"
            valor={formatearPrecio(totalCobrar)}
            pie={
              cobrar.length === 0
                ? "Nadie te debe nada"
                : `${cobrar.length} venta${cobrar.length === 1 ? "" : "s"} sin cobrar`
            }
            href="/admin/finanzas"
            alerta={cobrar.length > 0}
          />
        </div>

        {todoAlDia && (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Todo al día: nada para cobrar, entregar, reponer ni publicar esta semana.
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Bloque
            titulo="Pedidos para entregar"
            cantidad={entregar.length}
            href="/admin/pedidos"
            vacio={enCamino > 0 ? `Nada llegó todavía · ${enCamino} en camino` : "Ningún pedido esperando entrega"}
            extra={enCamino > 0 && entregar.length > 0 ? `${enCamino} más en camino` : undefined}
          >
            {entregar.slice(0, MAX_ITEMS).map((p) => (
              <Item
                key={p.id}
                izquierda={nombreClienta(p.cliente_id, p.cliente_texto)}
                derecha={`saldo ${formatearPrecio(Math.max(0, totalPedido(p) - p.sena))}`}
              />
            ))}
          </Bloque>

          <Bloque
            titulo="Para reponer"
            cantidad={reponer.length}
            href="/admin/reposicion"
            vacio="Stock en orden"
            extra={agotados > 0 ? `${agotados} sin stock` : undefined}
          >
            {reponer.slice(0, MAX_ITEMS).map((f) => (
              <Item
                key={f.producto.id}
                izquierda={nombreParaPedir(f.producto)}
                derecha={f.motivo === "Sin stock" ? "Sin stock" : `quedan ${f.producto.stock ?? 0}`}
                rojo={f.motivo === "Sin stock"}
              />
            ))}
          </Bloque>

          <Bloque
            titulo="Ventas por cobrar"
            cantidad={cobrar.length}
            href="/admin/finanzas"
            vacio="Todo cobrado"
          >
            {cobrar.slice(0, MAX_ITEMS).map((v) => (
              <Item
                key={v.id}
                izquierda={`${formatearFecha(v.fecha)} · ${nombreClienta(v.cliente_id, v.cliente)}`}
                derecha={formatearPrecio(totalVenta(v))}
              />
            ))}
          </Bloque>

          <Bloque
            titulo="Tareas para hoy"
            cantidad={urgentes.length}
            href="/admin/tareas"
            vacio="Nada vence hoy"
          >
            {urgentes.slice(0, MAX_ITEMS).map((t) => (
              <Item
                key={t.id}
                izquierda={t.texto}
                derecha={t.fecha_limite! < hoy ? "vencida" : "hoy"}
                rojo={t.fecha_limite! < hoy}
              />
            ))}
          </Bloque>

          <Bloque
            titulo="Contenido de la semana"
            cantidad={contenido.length}
            href="/admin/contenido"
            vacio="Nada agendado para los próximos 7 días"
          >
            {contenido.slice(0, MAX_ITEMS).map((p) => (
              <Item
                key={p.id}
                izquierda={`${p.titulo} · ${p.formato}`}
                derecha={p.fecha! < hoy ? `atrasada · ${p.estado}` : `${formatearFecha(p.fecha!)} · ${p.estado}`}
                rojo={p.fecha! < hoy}
              />
            ))}
          </Bloque>

          <Bloque
            titulo="Clientas para volver a escribir"
            cantidad={escribir.length}
            href="/admin/clientas"
            vacio="Todas compraron en los últimos 60 días"
          >
            {escribir.slice(0, MAX_ITEMS).map((x) => (
              <Item
                key={x.clienta.id}
                izquierda={x.clienta.nombre}
                derecha={`última ${formatearFecha(x.ultimaCompra)}`}
              />
            ))}
          </Bloque>
        </div>
      </main>
    </div>
  );
}

function Numero({
  titulo,
  valor,
  pie,
  href,
  destacado = false,
  alerta = false,
}: {
  titulo: string;
  valor: string;
  pie: string;
  href: string;
  destacado?: boolean;
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-4 transition-colors hover:border-rosea-300 ${
        alerta
          ? "border-amber-200 bg-amber-50"
          : destacado
            ? "border-rosea-200 bg-rosea-50"
            : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs tracking-wider text-neutral-500 uppercase">{titulo}</p>
      <p className="mt-1 font-serif text-2xl text-neutral-800">{valor}</p>
      <p className={`mt-1 text-xs ${alerta ? "text-amber-800" : "text-neutral-500"}`}>{pie}</p>
    </Link>
  );
}

function Bloque({
  titulo,
  cantidad,
  href,
  vacio,
  extra,
  children,
}: {
  titulo: string;
  cantidad: number;
  href: string;
  vacio: string;
  extra?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg text-rosea-700">
          {titulo}
          {cantidad > 0 && (
            <span className="ml-2 rounded-full bg-rosea-100 px-2 py-0.5 align-middle font-sans text-xs text-rosea-700">
              {cantidad}
            </span>
          )}
        </h2>
        <Link href={href} className="shrink-0 text-xs text-rosea-700 hover:underline">
          Ver todo →
        </Link>
      </div>
      {cantidad === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{vacio}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">{children}</ul>
          {(cantidad > MAX_ITEMS || extra) && (
            <p className="mt-2 text-xs text-neutral-500">
              {[cantidad > MAX_ITEMS ? `y ${cantidad - MAX_ITEMS} más` : null, extra]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Item({
  izquierda,
  derecha,
  rojo = false,
}: {
  izquierda: string;
  derecha: string;
  rojo?: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0 truncate text-neutral-800">{izquierda}</span>
      <span className={`shrink-0 text-xs tabular-nums ${rojo ? "text-red-600" : "text-neutral-500"}`}>
        {derecha}
      </span>
    </li>
  );
}

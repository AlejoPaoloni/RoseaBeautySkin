"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Clienta, Gasto, Producto, Venta } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import { listarGastos, listarVentas } from "@/lib/db-finanzas";
import { listarClientas } from "@/lib/db-gestion";
import { formatearPrecio } from "@/lib/catalog";
import { config } from "@/lib/config";
import {
  fechaHoy,
  formatearFecha,
  gastosPorCategoria,
  mesAnterior,
  metricasClientasMes,
  nombreMes,
  pendientesDeCobro,
  puntoEquilibrio,
  resumenMes,
  topProductos,
  totalVenta,
  variacion,
  ventasPorDimension,
} from "@/lib/finanzas";
import { valorStock } from "@/lib/gestion";

export interface Datos {
  productos: Producto[];
  ventas: Venta[];
  gastos: Gasto[];
  clientas: Clienta[];
}

// Reporte de una pagina con el cierre del mes, pensado para "Imprimir >
// Guardar como PDF". Colores y tipografia de la marca, sin los controles de
// la app al imprimir (el menu lo oculta AdminShell con print:hidden).
export default function CierreMes({ mes }: { mes: string }) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [productos, ventas, gastos, clientas] = await Promise.all([
          listarProductos(),
          listarVentas(),
          listarGastos(),
          listarClientas(),
        ]);
        setDatos({ productos, ventas, gastos, clientas });
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) {
    return (
      <p className="p-8 text-center text-red-600">
        No se pudieron cargar los datos. Probá de nuevo.
      </p>
    );
  }
  if (!datos) {
    return <p className="p-8 text-center text-neutral-400">Armando el cierre…</p>;
  }

  return <ReporteCierre mes={mes} datos={datos} />;
}

// La parte visual, separada de la carga: recibe los datos ya leidos.
export function ReporteCierre({ mes, datos }: { mes: string; datos: Datos }) {
  const { productos, ventas, gastos, clientas } = datos;
  const r = resumenMes(ventas, gastos, mes);
  const previo = resumenMes(ventas, gastos, mesAnterior(mes));
  const clientasMes = metricasClientasMes(ventas, mes);
  const pe = puntoEquilibrio(ventas, gastos, mes);
  const stock = valorStock(productos);
  const top = topProductos(ventas, mes, 10);
  const porCanal = ventasPorDimension(ventas, productos, [mes], "canal");
  const porMarca = ventasPorDimension(ventas, productos, [mes], "marca");
  const gastosCat = gastosPorCategoria(gastos, mes);
  const pendientes = pendientesDeCobro(ventas);
  const nombreDe = (v: Venta) =>
    v.cliente_id
      ? (clientas.find((c) => c.id === v.cliente_id)?.nombre ?? "Sin nombre")
      : (v.cliente ?? "Sin nombre");
  const margen = (ingresos: number, ganancia: number) =>
    `${ingresos ? Math.round((ganancia / ingresos) * 100) : 0}%`;

  function vs(actual: number, anterior: number) {
    const pct = variacion(actual, anterior);
    if (pct === null) return "sin mes anterior";
    return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(pct))}% vs ${nombreMes(mesAnterior(mes))}`;
  }

  const kpis = [
    { t: "Ventas", v: r.ingresos, p: vs(r.ingresos, previo.ingresos) },
    {
      t: "Ganancia",
      v: r.gananciaMargen,
      p: r.margenPct === null ? "sin ventas" : `${Math.round(r.margenPct)}% de lo vendido`,
    },
    { t: "Gastos", v: r.gastosTotal, p: vs(r.gastosTotal, previo.gastosTotal) },
    { t: "Resultado de caja", v: r.resultadoCaja, p: "lo cobrado menos lo gastado" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-4 print:hidden">
        <Link href="/admin/finanzas" className="text-sm text-rosea-700 hover:underline">
          ← Volver a Finanzas
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <article className="mx-auto max-w-[210mm] bg-white p-10 text-neutral-800 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-end justify-between border-b-2 border-rosea-300 pb-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca estatico: no gasta Image Transformations */}
            <img src="/brand/caligrafia.svg" alt={config.marca} className="h-10 w-auto" />
            <h1 className="mt-3 font-serif text-3xl text-rosea-700">
              Cierre de {nombreMes(mes)}
            </h1>
          </div>
          <p className="text-right text-xs text-neutral-500">
            Emitido el {formatearFecha(fechaHoy())}
            <br />
            @{config.instagramUsuario}
          </p>
        </header>

        <section className="mt-6 grid grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.t} className="rounded-lg border border-rosea-100 bg-rosea-50/60 p-3">
              <p className="text-[10px] tracking-wider text-neutral-500 uppercase">{k.t}</p>
              <p className={`mt-1 font-serif text-xl ${k.v < 0 ? "text-red-600" : ""}`}>
                {formatearPrecio(k.v)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">{k.p}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-4 gap-3 text-xs">
          <Dato titulo="Ventas / unidades" valor={`${r.cantidadVentas} / ${r.unidades}`} />
          <Dato titulo="Ticket promedio" valor={formatearPrecio(clientasMes.ticketPromedio)} />
          <Dato
            titulo="Clientas"
            valor={`${clientasMes.nuevas} nuevas · ${clientasMes.volvieron} volvieron`}
          />
          <Dato
            titulo="Cobrado"
            valor={`Transf. ${formatearPrecio(r.cobradoPorMedio.Transferencia)} · Efvo. ${formatearPrecio(r.cobradoPorMedio.Efectivo)}`}
          />
        </section>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <Tabla
            titulo="Más vendidos"
            columnas={["Producto", "U.", "Ventas", "Ganancia"]}
            filas={top.map((f) => [
              f.nombre,
              String(f.unidades),
              formatearPrecio(f.ingresos),
              formatearPrecio(f.ganancia),
            ])}
            vacio="Sin ventas en el mes."
          />
          <div className="space-y-6">
            <Tabla
              titulo="Por canal"
              columnas={["Canal", "Ventas", "Margen"]}
              filas={porCanal.map((f) => [f.clave, formatearPrecio(f.ingresos), margen(f.ingresos, f.ganancia)])}
              vacio="Sin ventas en el mes."
            />
            <Tabla
              titulo="Por marca"
              columnas={["Marca", "Ventas", "Margen"]}
              filas={porMarca.map((f) => [f.clave, formatearPrecio(f.ingresos), margen(f.ingresos, f.ganancia)])}
              vacio="Sin ventas en el mes."
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <Tabla
            titulo="Gastos por categoría"
            columnas={["Categoría", "Monto", "%"]}
            filas={gastosCat.map((g) => [g.categoria, formatearPrecio(g.monto), `${Math.round(g.pct)}%`])}
            vacio="Sin gastos en el mes."
          />
          <div className="space-y-2 text-xs">
            <h2 className="font-serif text-base text-rosea-700">Negocio</h2>
            <Linea etiqueta="Valor del stock (al costo, hoy)" valor={formatearPrecio(stock.alCosto)} />
            <Linea etiqueta="Vendiendo todo el stock" valor={formatearPrecio(stock.alPrecio)} />
            {pe && pe.gastosFijosPromedio > 0 && (
              <Linea
                etiqueta={`Punto de equilibrio (margen ${pe.margenBrutoPct}%)`}
                valor={`${formatearPrecio(pe.ventasNecesarias)} / mes`}
              />
            )}
            <Linea
              etiqueta="Por cobrar (todos los meses)"
              valor={formatearPrecio(pendientes.reduce((t, v) => t + totalVenta(v), 0))}
            />
            {pendientes.length > 0 && (
              <ul className="space-y-0.5 text-neutral-600">
                {pendientes.slice(0, 8).map((v) => (
                  <li key={v.id} className="flex justify-between gap-2">
                    <span>
                      {formatearFecha(v.fecha)} · {nombreDe(v)}
                    </span>
                    <span className="tabular-nums">{formatearPrecio(totalVenta(v))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="mt-8 border-t border-rosea-100 pt-3 text-center text-[10px] text-neutral-400">
          {config.marca} · Generado desde el panel. Ganancia = ventas menos el costo de lo
          vendido y los gastos que no son mercadería. Caja = solo lo cobrado.
        </footer>
      </article>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-2">
      <p className="text-[10px] tracking-wider text-neutral-500 uppercase">{titulo}</p>
      <p className="mt-0.5 text-neutral-800">{valor}</p>
    </div>
  );
}

function Linea({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-neutral-100 pb-1">
      <span className="text-neutral-600">{etiqueta}</span>
      <span className="font-medium tabular-nums">{valor}</span>
    </div>
  );
}

function Tabla({
  titulo,
  columnas,
  filas,
  vacio,
}: {
  titulo: string;
  columnas: string[];
  filas: string[][];
  vacio: string;
}) {
  return (
    <section>
      <h2 className="font-serif text-base text-rosea-700">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-400">{vacio}</p>
      ) : (
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-rosea-200 text-left text-neutral-500">
              {columnas.map((c, i) => (
                <th key={c} className={`pb-1 font-medium ${i > 0 ? "text-right" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="border-b border-neutral-100">
                {f.map((celda, j) => (
                  <td key={j} className={`py-1 ${j > 0 ? "text-right tabular-nums" : "pr-2"}`}>
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

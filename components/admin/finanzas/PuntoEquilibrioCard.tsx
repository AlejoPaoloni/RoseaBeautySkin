"use client";

import { formatearPrecio } from "@/lib/catalog";
import type { PuntoEquilibrio } from "@/lib/finanzas";

// Cuanto hay que vender por mes para cubrir los gastos fijos (todo lo que
// no es mercaderia) con el margen bruto real, y cuanto va el mes.
export default function PuntoEquilibrioCard({
  pe,
  vendidoMes,
}: {
  pe: PuntoEquilibrio | null;
  vendidoMes: number;
}) {
  return (
    <figure className="m-0">
      <figcaption className="font-serif text-lg text-rosea-700">
        Punto de equilibrio
      </figcaption>
      {pe === null ? (
        <p className="mt-3 rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-500">
          Hace falta al menos una venta con costo cargado para calcularlo.
        </p>
      ) : pe.gastosFijosPromedio === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">
          No hay gastos fijos (packaging, publicidad, envíos…) cargados en los
          últimos 3 meses: cualquier venta ya deja ganancia.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-neutral-600">
            Para cubrir tus gastos fijos de{" "}
            <strong className="font-medium text-neutral-800">
              {formatearPrecio(pe.gastosFijosPromedio)}
            </strong>{" "}
            por mes necesitás vender
          </p>
          <p className="mt-1 font-serif text-2xl text-neutral-800">
            {formatearPrecio(pe.ventasNecesarias)}
            <span className="ml-1 text-sm text-neutral-500">por mes</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (vendidoMes / pe.ventasNecesarias) * 100)}%`,
                background: vendidoMes >= pe.ventasNecesarias ? "#2e7d4f" : "#c1554a",
              }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {vendidoMes >= pe.ventasNecesarias
              ? `Este mes ya lo pasaste: vas ${formatearPrecio(vendidoMes)}.`
              : `Este mes vas ${formatearPrecio(vendidoMes)}: faltan ${formatearPrecio(pe.ventasNecesarias - vendidoMes)}.`}{" "}
            Con un margen bruto de {pe.margenBrutoPct}% (últimos 12 meses) y
            el promedio de gastos de los últimos 3.
          </p>
        </>
      )}
    </figure>
  );
}

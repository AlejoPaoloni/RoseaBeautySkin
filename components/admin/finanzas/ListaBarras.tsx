"use client";

import { formatearPrecio } from "@/lib/catalog";

export interface FilaBarra {
  clave: string;
  etiqueta: string;
  monto: number;
  detalle?: string;
}

interface Props {
  titulo: string;
  filas: FilaBarra[];
  vacio: string;
  color?: string;
  // Por defecto el monto es plata; el ranking por unidades pasa su propio.
  formato?: (monto: number) => string;
  // Controles al lado del titulo (ej: selectores de periodo).
  acciones?: React.ReactNode;
}

// Serie unica: la magnitud la lleva el largo de la barra, no el color. Por eso
// todas comparten un solo tono y no hay leyenda que explicar.
export default function ListaBarras({
  titulo,
  filas,
  vacio,
  color = "#c1554a",
  formato = formatearPrecio,
  acciones,
}: Props) {
  const tope = Math.max(...filas.map((f) => f.monto), 1);

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-serif text-lg text-rosea-700">
          {titulo}
        </figcaption>
        {acciones}
      </div>
      {filas.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
          {vacio}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {filas.map((f) => (
            <li key={f.clave}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-neutral-700">
                  {f.etiqueta}
                </span>
                <span className="shrink-0 text-sm text-neutral-800 tabular-nums">
                  {formato(f.monto)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      // Un monto negativo (ranking por ganancia de algo vendido
                      // a perdida) daria un ancho invalido, que el navegador
                      // ignora y dibuja la barra completa.
                      width: `${Math.max(0, (f.monto / tope) * 100)}%`,
                      background: color,
                    }}
                  />
                </div>
                {f.detalle && (
                  <span className="w-24 shrink-0 text-right text-xs text-neutral-400">
                    {f.detalle}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

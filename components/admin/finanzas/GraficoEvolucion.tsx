"use client";

import { useState } from "react";
import { formatearPrecio } from "@/lib/catalog";
import { mesCorto, nombreMes, type ResumenMes } from "@/lib/finanzas";

// Los tonos rosea de la marca son demasiado apagados para ser tinta de datos:
// validados con el chequeo de daltonismo, quedaban por debajo del piso de
// croma y las dos series se confundian. Estos dos pasan las seis pruebas
// (separacion protan 16.2, vision normal 22.6) manteniendo la familia rosa
// para la serie protagonista.
const COLOR_VENTAS = "#c1554a";
const COLOR_GASTOS = "#4a7fb5";

const ANCHO = 640;
const ALTO = 260;
const PAD = { arriba: 16, derecha: 12, abajo: 30, izquierda: 62 };
const PLOT_W = ANCHO - PAD.izquierda - PAD.derecha;
const PLOT_H = ALTO - PAD.arriba - PAD.abajo;

interface Foco {
  x: number;
  y: number;
  mes: string;
  serie: string;
  monto: number;
}

function montoCorto(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

interface Props {
  serie: ResumenMes[];
}

export default function GraficoEvolucion({ serie }: Props) {
  const [foco, setFoco] = useState<Foco | null>(null);

  const maximo = Math.max(...serie.map((s) => Math.max(s.ingresos, s.gastosTotal)));
  // Sin datos el eje arrancaba en 1 peso y los tres ticks quedaban "$1 $1 $0".
  const tope = maximo > 0 ? maximo : 10000;
  const escala = (v: number) => (v / tope) * PLOT_H;

  const anchoGrupo = PLOT_W / serie.length;
  // 2px de separacion entre las dos barras del mismo mes, como pide la guia
  // de marcas: el fondo tiene que verse entre relleno y relleno.
  const anchoBarra = Math.min(20, anchoGrupo / 2 - 4);

  // Dedupe por etiqueta: con montos chicos, 0 y tope/2 redondean al mismo
  // texto y se pisaban dos ticks iguales.
  const ticks = [...new Map(
    [0, tope / 2, tope].map((t) => [montoCorto(Math.round(t)), t])
  ).values()];

  return (
    <figure className="relative m-0">
      <figcaption className="flex items-center justify-between gap-4">
        <h3 className="font-serif text-lg text-rosea-700">
          Ventas y gastos por mes
        </h3>
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR_VENTAS }}
            />
            Ventas
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLOR_GASTOS }}
            />
            Gastos
          </span>
        </div>
      </figcaption>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="w-full"
          role="img"
          aria-label="Gráfico de barras de ventas y gastos por mes"
        >
          {ticks.map((t) => {
            const y = PAD.arriba + PLOT_H - escala(t);
            return (
              <g key={t}>
                <line
                  x1={PAD.izquierda}
                  x2={ANCHO - PAD.derecha}
                  y1={y}
                  y2={y}
                  stroke="#eae4e2"
                  strokeWidth={1}
                />
                <text
                  x={PAD.izquierda - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-neutral-400"
                  fontSize={11}
                >
                  {montoCorto(Math.round(t))}
                </text>
              </g>
            );
          })}

          {serie.map((s, i) => {
            const base = PAD.izquierda + i * anchoGrupo;
            const centro = base + anchoGrupo / 2;
            const barras = [
              { serie: "Ventas", monto: s.ingresos, color: COLOR_VENTAS },
              { serie: "Gastos", monto: s.gastosTotal, color: COLOR_GASTOS },
            ];
            return (
              <g key={s.mes}>
                {barras.map((b, j) => {
                  const alto = escala(b.monto);
                  const x = centro + (j === 0 ? -anchoBarra - 1 : 1);
                  const y = PAD.arriba + PLOT_H - alto;
                  const activa =
                    foco?.mes === s.mes && foco?.serie === b.serie;
                  return (
                    <g key={b.serie}>
                      {alto > 0 && (
                        <rect
                          x={x}
                          y={y}
                          width={anchoBarra}
                          height={alto}
                          rx={4}
                          fill={b.color}
                          opacity={foco && !activa ? 0.45 : 1}
                        />
                      )}
                      {/* Area de hover mas alta que la barra: con montos
                          chicos la barra mide 2px y seria imposible apuntarle. */}
                      <rect
                        x={x - 1}
                        y={PAD.arriba}
                        width={anchoBarra + 2}
                        height={PLOT_H}
                        fill="transparent"
                        onMouseEnter={() =>
                          setFoco({
                            x,
                            y: alto > 0 ? y : PAD.arriba + PLOT_H,
                            mes: s.mes,
                            serie: b.serie,
                            monto: b.monto,
                          })
                        }
                        onMouseLeave={() => setFoco(null)}
                      />
                    </g>
                  );
                })}
                <text
                  x={centro}
                  y={ALTO - 10}
                  textAnchor="middle"
                  className="fill-neutral-400"
                  fontSize={11}
                >
                  {mesCorto(s.mes)}
                </text>
              </g>
            );
          })}
        </svg>

        {foco && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
            style={{
              left: `${((foco.x + 10) / ANCHO) * 100}%`,
              top: `${((foco.y - 6) / ALTO) * 100}%`,
            }}
          >
            <span className="text-neutral-300">
              {foco.serie} · {nombreMes(foco.mes)}
            </span>
            <br />
            {formatearPrecio(foco.monto)}
          </div>
        )}
      </div>
    </figure>
  );
}

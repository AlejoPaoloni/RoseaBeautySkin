"use client";

import { useState } from "react";
import type { Producto, Venta } from "@/lib/types";
import {
  mesActual,
  nombreMes,
  ultimosMeses,
  ventasPorDimension,
  type Dimension,
} from "@/lib/finanzas";
import ListaBarras from "./ListaBarras";

const DIMENSIONES: { valor: Dimension; etiqueta: string }[] = [
  { valor: "canal", etiqueta: "Por canal" },
  { valor: "marca", etiqueta: "Por marca" },
  { valor: "categoria", etiqueta: "Por categoría" },
];

// "De donde viene la plata": las ventas del periodo abiertas por canal,
// marca o categoria, con el margen de cada una. El largo de la barra son
// los ingresos; el margen va en el detalle para ver que vender mucho no es
// lo mismo que ganar mucho.
export default function DesgloseVentas({
  ventas,
  productos,
  mes,
}: {
  ventas: Venta[];
  productos: Producto[];
  mes: string;
}) {
  const [dimension, setDimension] = useState<Dimension>("canal");
  const [periodo, setPeriodo] = useState<"mes" | "12m">("mes");

  const filas = ventasPorDimension(
    ventas,
    productos,
    periodo === "mes" ? [mes] : ultimosMeses(12, mesActual()),
    dimension
  );

  return (
    <ListaBarras
      titulo="De dónde viene la plata"
      vacio={
        periodo === "mes"
          ? "Todavía no hay ventas este mes."
          : "Todavía no hay ventas en los últimos 12 meses."
      }
      acciones={
        <div className="flex gap-2">
          <select
            aria-label="Agrupar ventas"
            value={dimension}
            onChange={(e) => setDimension(e.target.value as Dimension)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
          >
            {DIMENSIONES.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.etiqueta}
              </option>
            ))}
          </select>
          <select
            aria-label="Período"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as "mes" | "12m")}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
          >
            <option value="mes">{nombreMes(mes)}</option>
            <option value="12m">Últimos 12 meses</option>
          </select>
        </div>
      }
      filas={filas.map((f) => ({
        clave: f.clave,
        etiqueta: f.clave,
        monto: f.ingresos,
        detalle:
          f.ingresos > 0
            ? `${Math.round((f.ganancia / f.ingresos) * 100)}% margen`
            : undefined,
      }))}
    />
  );
}

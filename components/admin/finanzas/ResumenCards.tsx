"use client";

import { formatearPrecio } from "@/lib/catalog";
import { variacion, type ResumenMes } from "@/lib/finanzas";

interface Props {
  actual: ResumenMes;
  anterior: ResumenMes;
}

function Variacion({ actual, anterior }: { actual: number; anterior: number }) {
  const pct = variacion(actual, anterior);
  if (pct === null) {
    return <span className="text-xs text-neutral-400">sin mes anterior</span>;
  }
  const sube = pct >= 0;
  return (
    <span
      className={`text-xs ${sube ? "text-emerald-600" : "text-red-500"}`}
      title={`Mes anterior: ${formatearPrecio(anterior)}`}
    >
      {sube ? "▲" : "▼"} {Math.abs(Math.round(pct))}% vs mes anterior
    </span>
  );
}

function Card({
  titulo,
  monto,
  pie,
  destacada = false,
}: {
  titulo: string;
  monto: number;
  pie: React.ReactNode;
  destacada?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destacada
          ? "border-rosea-200 bg-rosea-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs tracking-wider text-neutral-500 uppercase">
        {titulo}
      </p>
      <p
        className={`mt-1 font-serif text-2xl ${
          monto < 0 ? "text-red-600" : "text-neutral-800"
        }`}
      >
        {formatearPrecio(monto)}
      </p>
      <p className="mt-1">{pie}</p>
    </div>
  );
}

export default function ResumenCards({ actual, anterior }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        titulo="Ventas del mes"
        monto={actual.ingresos}
        destacada
        pie={
          <Variacion actual={actual.ingresos} anterior={anterior.ingresos} />
        }
      />
      <Card
        titulo="Ganancia (margen)"
        monto={actual.gananciaMargen}
        pie={
          <span className="text-xs text-neutral-500">
            {actual.margenPct === null
              ? "sin ventas todavía"
              : `${Math.round(actual.margenPct)}% de lo vendido`}
          </span>
        }
      />
      <Card
        titulo="Gastos del mes"
        monto={actual.gastosTotal}
        pie={
          <Variacion actual={actual.gastosTotal} anterior={anterior.gastosTotal} />
        }
      />
      <Card
        titulo="Resultado de caja"
        monto={actual.resultadoCaja}
        pie={
          <span className="text-xs text-neutral-500">
            {actual.cantidadVentas} venta
            {actual.cantidadVentas === 1 ? "" : "s"} · {actual.unidades} unidad
            {actual.unidades === 1 ? "" : "es"}
          </span>
        }
      />
    </div>
  );
}

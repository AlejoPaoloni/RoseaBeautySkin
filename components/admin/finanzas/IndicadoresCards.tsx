"use client";

import { formatearPrecio } from "@/lib/catalog";
import type { MetricasClientas, ResumenMes } from "@/lib/finanzas";
import type { ValorStock } from "@/lib/gestion";

interface Props {
  resumen: ResumenMes;
  clientas: MetricasClientas;
  stock: ValorStock;
}

function Indicador({
  titulo,
  valor,
  pie,
}: {
  titulo: string;
  valor: React.ReactNode;
  pie: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs tracking-wider text-neutral-500 uppercase">
        {titulo}
      </p>
      <p className="mt-1 font-serif text-xl text-neutral-800">{valor}</p>
      <p className="mt-1 text-xs text-neutral-500">{pie}</p>
    </div>
  );
}

// Segunda fila de Finanzas: como se cobro, quien compra y cuanta plata hay
// parada en mercaderia. Los montos grandes (ventas, ganancia, caja) siguen
// en ResumenCards.
export default function IndicadoresCards({ resumen, clientas, stock }: Props) {
  const { Transferencia, Efectivo } = resumen.cobradoPorMedio;
  const sinDato = resumen.cobradoPorMedio["Sin dato"];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Indicador
        titulo="Ticket promedio"
        valor={formatearPrecio(clientas.ticketPromedio)}
        pie={`${resumen.cantidadVentas} venta${resumen.cantidadVentas === 1 ? "" : "s"} en el mes`}
      />
      <Indicador
        titulo="Clientas del mes"
        valor={`${clientas.nuevas} nueva${clientas.nuevas === 1 ? "" : "s"} · ${clientas.volvieron} volvi${clientas.volvieron === 1 ? "ó" : "eron"}`}
        pie="Volvió = ya te había comprado antes"
      />
      <Indicador
        titulo="Cobrado por medio"
        valor={
          <span className="flex flex-col text-base">
            <span>Transferencia {formatearPrecio(Transferencia)}</span>
            <span>Efectivo {formatearPrecio(Efectivo)}</span>
          </span>
        }
        pie={
          resumen.pendienteCobro > 0
            ? `Falta cobrar ${formatearPrecio(resumen.pendienteCobro)} de este mes`
            : sinDato > 0
              ? `${formatearPrecio(sinDato)} de ventas sin medio cargado`
              : "Todo lo del mes está cobrado"
        }
      />
      <Indicador
        titulo="Valor del stock"
        valor={formatearPrecio(stock.alCosto)}
        pie={
          <>
            Invertido en {stock.unidades} unidad{stock.unidades === 1 ? "" : "es"}{" "}
            · vendiendo todo: {formatearPrecio(stock.alPrecio)}
            {stock.sinCosto > 0 &&
              ` · ${stock.sinCosto} sin costo cargado`}
          </>
        }
      />
    </div>
  );
}

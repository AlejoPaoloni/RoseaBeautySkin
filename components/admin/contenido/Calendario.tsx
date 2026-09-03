"use client";

import type { EstadoPublicacion, Publicacion } from "@/lib/types";
import { agruparPorDia, DIAS_SEMANA, grillaMes } from "@/lib/gestion";

// El estado es una progresión, no categorías sueltas: una sola rampa rosea de
// claro a oscuro deja ver de un vistazo qué tan avanzada está la semana.
export const COLOR_ESTADO: Record<EstadoPublicacion, string> = {
  Idea: "#d4d4d4",
  Guionado: "#edc7c0",
  Grabado: "#d5998f",
  Editado: "#bd7c72",
  Publicado: "#8f5a52",
};

interface Props {
  mes: string;
  publicaciones: Publicacion[];
  hoy: string;
  onNuevo: (fecha: string) => void;
  onEditar: (publicacion: Publicacion) => void;
}

export default function Calendario({
  mes,
  publicaciones,
  hoy,
  onNuevo,
  onEditar,
}: Props) {
  const celdas = grillaMes(mes);
  const porDia = agruparPorDia(publicaciones);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((fecha, i) => {
          if (fecha === null) {
            return <div key={`vacio-${i}`} className="min-h-24 rounded-lg" />;
          }
          const delDia = porDia[fecha] ?? [];
          const esHoy = fecha === hoy;
          return (
            <div
              key={fecha}
              className={`min-h-24 rounded-lg border p-1.5 ${
                esHoy
                  ? "border-rosea-300 bg-rosea-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <button
                onClick={() => onNuevo(fecha)}
                aria-label={`Agregar publicación el ${fecha}`}
                className={`flex w-full items-center justify-between text-xs ${
                  esHoy ? "text-rosea-700" : "text-neutral-400"
                } hover:text-rosea-700`}
              >
                <span className="tabular-nums">{Number(fecha.slice(8))}</span>
                <span aria-hidden>+</span>
              </button>

              <div className="mt-1 space-y-1">
                {delDia.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onEditar(p)}
                    title={`${p.formato} · ${p.estado}`}
                    className="flex w-full items-center gap-1.5 rounded bg-neutral-50 px-1.5 py-0.5 text-left text-[11px] leading-tight text-neutral-700 hover:bg-neutral-100"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: COLOR_ESTADO[p.estado] }}
                    />
                    <span className="truncate">{p.titulo}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

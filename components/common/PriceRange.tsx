"use client";

import { formatearPrecio } from "@/lib/catalog";

// Dos <input type="range"> superpuestos: el elemento no recibe eventos, solo
// el thumb, asi ambos circulos quedan agarrables sobre el mismo riel.
const THUMB = [
  "pointer-events-none absolute inset-x-0 top-0 h-5 w-full cursor-pointer appearance-none bg-transparent focus:outline-none",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-rosea-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110",
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-rosea-500 [&::-moz-range-thumb]:shadow-md",
  "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-rosea-400 focus-visible:[&::-webkit-slider-thumb]:ring-offset-1",
].join(" ");

export default function PriceRange({
  min,
  max,
  piso,
  tope,
  paso,
  onChange,
}: {
  min: number;
  max: number;
  piso: number;
  tope: number;
  paso: number;
  onChange: (min: number, max: number) => void;
}) {
  const span = tope - piso;
  if (span <= 0) return null;

  const pctMin = ((min - piso) / span) * 100;
  const pctMax = ((max - piso) / span) * 100;

  return (
    <div className="w-full max-w-xs sm:max-w-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="tabular-nums text-neutral-500">
          {formatearPrecio(min)}
        </span>
        <span className="tracking-wide text-rosea-700">Precio</span>
        <span className="tabular-nums text-neutral-500">
          {formatearPrecio(max)}
        </span>
      </div>

      <div className="relative mt-2 h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-rosea-100" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-rosea-400"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />

        <input
          type="range"
          min={piso}
          max={tope}
          step={paso}
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max), max)}
          aria-label="Precio mínimo"
          // Cuando el minimo se acerca al tope queda tapado por el otro input:
          // se lo sube de capa para que siga siendo agarrable.
          className={`${THUMB} ${pctMin > 60 ? "z-20" : "z-10"}`}
        />
        <input
          type="range"
          min={piso}
          max={tope}
          step={paso}
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min))}
          aria-label="Precio máximo"
          className={`${THUMB} z-10`}
        />
      </div>
    </div>
  );
}

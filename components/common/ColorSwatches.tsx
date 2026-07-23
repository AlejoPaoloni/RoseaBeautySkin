"use client";

import { useState } from "react";
import type { Tono } from "@/lib/types";

export default function ColorSwatches({ tonos }: { tonos: Tono[] }) {
  const [hover, setHover] = useState<string | null>(null);

  if (!tonos || tonos.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      {tonos.map((tono) => (
        <div key={tono.hex} className="relative">
          <button
            aria-label={`Tono: ${tono.nombre}`}
            className="h-6 w-6 rounded-full border border-neutral-200 transition-transform hover:scale-125"
            style={{ backgroundColor: tono.hex }}
            onMouseEnter={() => setHover(tono.hex)}
            onMouseLeave={() => setHover(null)}
          />
          {hover === tono.hex && (
            <div className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-32 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-center text-xs text-white">
              {tono.nombre}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

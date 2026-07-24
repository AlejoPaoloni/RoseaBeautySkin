"use client";

import { useEffect, useRef, useState } from "react";
import type { Tono } from "@/lib/types";

const MARGEN = 8;
const MITAD_TOOLTIP = 64; // max-w-32 (128px) / 2

export default function ColorSwatches({ tonos }: { tonos: Tono[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [corrimiento, setCorrimiento] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});

  // Tap fuera cierra el tooltip (el mouseleave no dispara en touch)
  useEffect(() => {
    if (!abierto) return;
    function onClickFuera(e: MouseEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(null);
    }
    document.addEventListener("click", onClickFuera);
    return () => document.removeEventListener("click", onClickFuera);
  }, [abierto]);

  if (!tonos || tonos.length === 0) return null;

  function mostrar(hex: string) {
    const btn = botones.current[hex];
    if (btn) {
      const r = btn.getBoundingClientRect();
      const centro = r.left + r.width / 2;
      let c = 0;
      if (centro - MITAD_TOOLTIP < MARGEN) {
        c = MARGEN - (centro - MITAD_TOOLTIP);
      } else if (centro + MITAD_TOOLTIP > window.innerWidth - MARGEN) {
        c = window.innerWidth - MARGEN - (centro + MITAD_TOOLTIP);
      }
      setCorrimiento(c);
    }
    setAbierto(hex);
  }

  return (
    <div ref={raiz} className="mt-2 flex items-center gap-2">
      {tonos.map((tono) => (
        <div key={tono.hex} className="relative">
          <button
            ref={(el) => {
              botones.current[tono.hex] = el;
            }}
            aria-label={`Tono: ${tono.nombre}`}
            className="h-6 w-6 rounded-full border border-neutral-200 transition-transform hover:scale-125"
            style={{ backgroundColor: tono.hex }}
            onMouseEnter={() => mostrar(tono.hex)}
            onMouseLeave={() => setAbierto(null)}
            onClick={(e) => {
              e.stopPropagation();
              mostrar(tono.hex);
            }}
          />
          {abierto === tono.hex && (
            <div
              style={{ transform: `translateX(calc(-50% + ${corrimiento}px))` }}
              className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-32 text-wrap rounded bg-neutral-900 px-2 py-1 text-center text-xs text-white"
            >
              {tono.nombre}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

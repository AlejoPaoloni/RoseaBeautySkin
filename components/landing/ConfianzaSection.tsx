"use client";

import { motion } from "framer-motion";

// Godets: rampa rosea completa. light/base/dark arman el degrade radial de
// cada polvo prensado (luz arriba-izq, sombra al borde).
const PANS = [
  { light: "#f6e0db", base: "#edc7c0", dark: "#dba99f" },
  { light: "#eec6bf", base: "#e0a89f", dark: "#c98d83" },
  { light: "#e6bab2", base: "#d5998f", dark: "#bd8076" },
  { light: "#e0b0a8", base: "#cd8e84", dark: "#b3746a" },
  { light: "#d29e96", base: "#bd7c72", dark: "#a3665d" },
  { light: "#b07f77", base: "#8f5a52", dark: "#74463f" },
];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Geo {
  id: string;
  vb: { w: number; h: number };
  estuche: Rect;
  espejo: Rect;
  bandeja: Rect;
  pans: { x: number; y: number }[];
  panW: number;
  panH: number;
  // Bisagra: barriles + linea de plegado.
  barriles: Rect[];
  pliegue: { x1: number; y1: number; x2: number; y2: number };
  // El degrade metalico corre perpendicular al eje del barril.
  bisagraVertical: boolean;
  reflejos: string[];
}

// Desktop: paleta abierta a lo ancho (espejo izquierda, godets derecha).
const GEO_ANCHA: Geo = {
  id: "rbH",
  vb: { w: 400, h: 260 },
  estuche: { x: 16, y: 16, w: 368, h: 228 },
  espejo: { x: 30, y: 30, w: 156, h: 200 },
  bandeja: { x: 211, y: 27, w: 162, h: 206 },
  pans: [
    { x: 214, y: 30 },
    { x: 302, y: 30 },
    { x: 214, y: 101 },
    { x: 302, y: 101 },
    { x: 214, y: 172 },
    { x: 302, y: 172 },
  ],
  panW: 68,
  panH: 58,
  barriles: [
    { x: 193, y: 48, w: 14, h: 46 },
    { x: 193, y: 166, w: 14, h: 46 },
  ],
  pliegue: { x1: 200, y1: 30, x2: 200, y2: 230 },
  bisagraVertical: false,
  reflejos: ["30,150 92,30 128,30 30,215", "138,30 164,30 30,250 30,225"],
};

// Mobile: misma paleta plegada al reves (espejo arriba a todo el ancho,
// godets abajo), para que el texto entre comodo dentro del espejo.
// Espejo y bandeja ocupan el mismo hueco (266x148, contando el marco de
// 3px que rodea al espejo) para que la paleta se vea simetrica en mobile.
const GEO_ALTA: Geo = {
  id: "rbV",
  vb: { w: 320, h: 381 },
  estuche: { x: 16, y: 16, w: 288, h: 349 },
  espejo: { x: 30, y: 30, w: 260, h: 142 },
  bandeja: { x: 27, y: 203, w: 266, h: 148 },
  pans: [
    { x: 30, y: 206 },
    { x: 122, y: 206 },
    { x: 214, y: 206 },
    { x: 30, y: 284 },
    { x: 122, y: 284 },
    { x: 214, y: 284 },
  ],
  panW: 76,
  panH: 64,
  barriles: [
    { x: 60, y: 181, w: 46, h: 14 },
    { x: 214, y: 181, w: 46, h: 14 },
  ],
  pliegue: { x1: 30, y1: 188, x2: 290, y2: 188 },
  bisagraVertical: true,
  reflejos: ["30,130 105,30 145,30 30,190", "165,30 192,30 55,218 30,218 30,196"],
};

function Paleta({ geo, className }: { geo: Geo; className?: string }) {
  const { id, vb, estuche, espejo, bandeja, panW, panH } = geo;

  return (
    <svg viewBox={`0 0 ${vb.w} ${vb.h}`} aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}Case`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf7f5" />
          <stop offset="0.16" stopColor="#e0a89f" />
          <stop offset="0.4" stopColor="#faf1ef" />
          <stop offset="0.6" stopColor="#cd8e84" />
          <stop offset="0.84" stopColor="#e0a89f" />
          <stop offset="1" stopColor="#fdf7f5" />
        </linearGradient>

        <linearGradient
          id={`${id}Hinge`}
          x1="0"
          y1="0"
          x2={geo.bisagraVertical ? "0" : "1"}
          y2={geo.bisagraVertical ? "1" : "0"}
        >
          <stop offset="0" stopColor="#8f5a52" />
          <stop offset="0.28" stopColor="#faf1ef" />
          <stop offset="0.56" stopColor="#cd8e84" />
          <stop offset="1" stopColor="#8f5a52" />
        </linearGradient>

        <linearGradient id={`${id}Glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f8fbfc" />
          <stop offset="0.6" stopColor="#eef4f5" />
          <stop offset="1" stopColor="#fbf4f2" />
        </linearGradient>

        {PANS.map((p, i) => (
          <radialGradient key={p.base} id={`${id}Pan${i}`} cx="0.34" cy="0.28" r="0.85">
            <stop offset="0" stopColor={p.light} />
            <stop offset="0.55" stopColor={p.base} />
            <stop offset="1" stopColor={p.dark} />
          </radialGradient>
        ))}

        <filter id={`${id}Shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#8f5a52" floodOpacity="0.3" />
        </filter>

        <clipPath id={`${id}MirrorClip`}>
          <rect x={espejo.x} y={espejo.y} width={espejo.w} height={espejo.h} rx="10" />
        </clipPath>
      </defs>

      {/* Estuche + bisel */}
      <g filter={`url(#${id}Shadow)`}>
        <rect
          x={estuche.x}
          y={estuche.y}
          width={estuche.w}
          height={estuche.h}
          rx="20"
          fill={`url(#${id}Case)`}
        />
      </g>
      <rect
        x={estuche.x + 3}
        y={estuche.y + 3}
        width={estuche.w - 6}
        height={estuche.h - 6}
        rx="17"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <rect
        x={estuche.x + 0.5}
        y={estuche.y + 0.5}
        width={estuche.w - 1}
        height={estuche.h - 1}
        rx="19.5"
        fill="none"
        stroke="#8f5a52"
        strokeOpacity="0.35"
      />

      {/* Espejo: hueco, vidrio y reflejos */}
      <rect
        x={espejo.x - 3}
        y={espejo.y - 3}
        width={espejo.w + 6}
        height={espejo.h + 6}
        rx="13"
        fill="#b98b83"
        opacity="0.5"
      />
      <rect
        x={espejo.x}
        y={espejo.y}
        width={espejo.w}
        height={espejo.h}
        rx="10"
        fill={`url(#${id}Glass)`}
      />
      <g clipPath={`url(#${id}MirrorClip)`}>
        {geo.reflejos.map((puntos, i) => (
          <polygon key={puntos} points={puntos} fill="#ffffff" opacity={i === 0 ? 0.5 : 0.28} />
        ))}
      </g>
      <rect
        x={espejo.x}
        y={espejo.y}
        width={espejo.w}
        height={espejo.h}
        rx="10"
        fill="none"
        stroke="#8f5a52"
        strokeOpacity="0.28"
      />

      {/* Bisagra */}
      <line
        x1={geo.pliegue.x1}
        y1={geo.pliegue.y1}
        x2={geo.pliegue.x2}
        y2={geo.pliegue.y2}
        stroke="#8f5a52"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {geo.barriles.map((b) => (
        <rect
          key={`${b.x}-${b.y}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="7"
          fill={`url(#${id}Hinge)`}
        />
      ))}

      {/* Bandeja + godets */}
      <rect
        x={bandeja.x}
        y={bandeja.y}
        width={bandeja.w}
        height={bandeja.h}
        rx="13"
        fill="#b98b83"
        opacity="0.38"
      />
      {geo.pans.map((pos, i) => (
        <g key={`${pos.x}-${pos.y}`}>
          <rect
            x={pos.x - 2}
            y={pos.y - 2}
            width={panW + 4}
            height={panH + 4}
            rx="10"
            fill="#a8756c"
            opacity="0.4"
          />
          <rect x={pos.x} y={pos.y} width={panW} height={panH} rx="8" fill={`url(#${id}Pan${i})`} />
          <rect
            x={pos.x + 0.75}
            y={pos.y + 0.75}
            width={panW - 1.5}
            height={panH - 1.5}
            rx="7.25"
            fill="none"
            stroke="#fdf7f5"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <rect
            x={pos.x}
            y={pos.y}
            width={panW}
            height={panH}
            rx="8"
            fill="none"
            stroke="#8f5a52"
            strokeOpacity="0.3"
          />
        </g>
      ))}
    </svg>
  );
}

export default function ConfianzaSection() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-[420px] md:max-w-none"
      >
        <Paleta geo={GEO_ALTA} className="w-full md:hidden" />
        <Paleta geo={GEO_ANCHA} className="hidden w-full md:block" />

        {/* Siempre dentro del espejo: arriba en mobile, a la izquierda en md+.
            Espejo mobile mide menos alto que el desktop (148 vs 320 en
            viewBox) asi que el texto va mas chico ahi, y crece de nuevo
            desde md: en adelante. */}
        <div className="absolute left-[9.4%] top-[7.9%] flex h-[37.3%] w-[81.2%] flex-col items-center justify-center px-3 text-center md:bottom-0 md:left-[7.5%] md:top-0 md:h-full md:w-[39%]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rosea-50 text-rosea-700 ring-1 ring-rosea-200/70 md:h-10 md:w-10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px] md:h-5 md:w-5"
            >
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h2 className="mt-1.5 font-serif text-base text-rosea-700 md:mt-3 md:text-lg lg:text-xl">
            Productos 100% originales
          </h2>
          <p className="mt-1 text-xs leading-snug text-neutral-600 md:mt-2 md:text-xs lg:text-sm">
            Importamos directo de 🇺🇸. Nada de réplicas: cada producto llega
            sellado, en su empaque original.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

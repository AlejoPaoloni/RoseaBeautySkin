"use client";

import { config, instagramDmUrl } from "@/lib/config";

export default function InstagramButton() {
  return (
    <a
      href={instagramDmUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por Instagram"
      onClick={() => {
        // Instagram no soporta precargar texto en el DM via URL (a diferencia
        // de wa.me). Copiamos el mensaje para que quede listo para pegar.
        navigator.clipboard?.writeText(config.mensajeConsulta).catch(() => {});
      }}
      className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg transition-transform duration-200 hover:scale-110 md:bottom-8 md:right-8 md:h-14 md:w-14"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-pink-500/30 [animation-duration:2.5s]" />
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    </a>
  );
}

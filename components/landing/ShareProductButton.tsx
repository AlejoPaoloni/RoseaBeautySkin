"use client";

import { useState } from "react";
import { compartirProducto } from "@/lib/share";
import type { Producto } from "@/lib/types";

// Compartir vive aca y no en la card: desde el detalle comparte el link
// directo al producto (compartirProducto usa la URL de la pagina), que es
// justo lo que sirve mandar por WhatsApp o Instagram.
export default function ShareProductButton({
  producto,
}: {
  producto: Producto;
}) {
  const [compartido, setCompartido] = useState(false);

  async function onCompartir() {
    const ok = await compartirProducto(producto);
    if (ok) {
      setCompartido(true);
      setTimeout(() => setCompartido(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={onCompartir}
      aria-label={`Compartir ${producto.nombre}`}
      className="flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-rosea-500 ring-1 ring-rosea-200 transition-colors hover:bg-rosea-50 md:mt-3 md:w-full md:max-w-xs md:px-0"
    >
      {compartido ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          ¡Listo!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
            <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
          </svg>
          Compartir
        </>
      )}
    </button>
  );
}

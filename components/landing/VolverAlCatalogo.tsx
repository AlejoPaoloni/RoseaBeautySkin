"use client";

import { useRouter } from "next/navigation";
import { hayVueltaPendiente } from "@/lib/catalogoEstado";

// Volver atras en el historial cuando la visita llego desde el catalogo: es
// lo unico que devuelve la pagina al mismo lugar (y el catalogo repone sus
// filtros y su altura al montarse). Si el link del producto llego por
// Instagram o WhatsApp no hay a donde volver, asi que va al inicio.
export default function VolverAlCatalogo() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (hayVueltaPendiente()) router.back();
        else router.push("/");
      }}
      className="-mr-2 flex items-center gap-1.5 px-2 py-3 text-sm text-neutral-600 transition-colors hover:text-rosea-500"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Volver al catálogo
    </button>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Icono = ({ className }: { className?: string }) => React.ReactElement;

function trazo(d: string) {
  return function Icono({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };
}

const IconoProductos = trazo(
  "M3.5 6.5h13l-1 10.5h-11l-1-10.5ZM7 6.5V5a3 3 0 0 1 6 0v1.5"
);
const IconoContenido = trazo(
  "M4 5.5h12v11H4v-11ZM4 8.8h12M7.5 3.5v3M12.5 3.5v3M7 12h2M11 12h2"
);
const IconoFinanzas = trazo(
  "M3.5 16.5h13M5.5 14V9.5h3V14M12.5 14V6h3v8"
);
const IconoPedidos = trazo(
  "M3.5 7.5 10 4l6.5 3.5v5L10 16l-6.5-3.5v-5ZM3.5 7.5 10 11m0 0 6.5-3.5M10 11v5"
);
const IconoClientas = trazo(
  "M10 10a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM4.5 16.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4"
);
const IconoTareas = trazo(
  "M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M10.5 6.5h5.5M10.5 12.5h5.5"
);
const IconoCalculadora = trazo(
  "M5.5 3.5h9v13h-9v-13ZM7.5 6.5h5M7.5 10h.01M10 10h.01M12.5 10h.01M7.5 13h.01M10 13h.01M12.5 13h.01"
);
const IconoMas = trazo("M10 5.5v9M5.5 10h9");
const IconoLanding = trazo(
  "M11.5 4.5h4v4M15.5 4.5 9 11M13.5 11.5v4h-9v-9h4"
);
const IconoSalir = trazo(
  "M12.5 6V4.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V14M8.5 10h8m0 0-2.2-2.2M16.5 10l-2.2 2.2"
);

interface Seccion {
  href: string;
  etiqueta: string;
  icono: Icono;
}

const SECCIONES: Seccion[] = [
  { href: "/admin", etiqueta: "Productos", icono: IconoProductos },
  { href: "/admin/contenido", etiqueta: "Contenido", icono: IconoContenido },
  { href: "/admin/finanzas", etiqueta: "Finanzas", icono: IconoFinanzas },
  { href: "/admin/calculadora", etiqueta: "Calculadora", icono: IconoCalculadora },
  { href: "/admin/pedidos", etiqueta: "Pedidos", icono: IconoPedidos },
  { href: "/admin/clientas", etiqueta: "Clientas", icono: IconoClientas },
  { href: "/admin/tareas", etiqueta: "Tareas", icono: IconoTareas },
];

// En el celular no entran seis destinos abajo sin que queden inclickeables.
const EN_BARRA_MOBILE = 3;

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // El login no lleva navegación: todavía no hay sesión que navegar.
  if (pathname === "/admin/login") return <>{children}</>;

  async function salir() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function esActiva(href: string) {
    // /admin es prefijo de todo lo demás, así que solo matchea exacto.
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  const principales = SECCIONES.slice(0, EN_BARRA_MOBILE);
  const secundarias = SECCIONES.slice(EN_BARRA_MOBILE);
  const hayActivaEnMenu = secundarias.some((s) => esActiva(s.href));

  return (
    <div className="md:pl-56">
      {/* Escritorio: panel lateral fijo. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-rosea-100 bg-white md:flex">
        <div className="flex items-center gap-3 px-5 py-4">
          <Image src="/brand/monogram.svg" alt="RB" width={40} height={30} />
          <span className="font-serif text-lg text-neutral-800">Panel</span>
        </div>

        <nav className="flex-1 px-3">
          {SECCIONES.map(({ href, etiqueta, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={esActiva(href) ? "page" : undefined}
              className={`mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                esActiva(href)
                  ? "bg-rosea-50 text-rosea-700"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
            >
              <Icono className="h-5 w-5" />
              {etiqueta}
            </Link>
          ))}
        </nav>

        <div className="border-t border-neutral-100 px-3 py-3">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
          >
            <IconoLanding className="h-5 w-5" />
            Ver landing
          </a>
          <button
            onClick={salir}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
          >
            <IconoSalir className="h-5 w-5" />
            Salir
          </button>
        </div>
      </aside>

      {/* Mobile: barra abajo. Se carga desde el celular con una mano, los
          destinos tienen que caer donde llega el pulgar. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-rosea-100 bg-white md:hidden">
        {principales.map(({ href, etiqueta, icono: Icono }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuAbierto(false)}
            aria-current={esActiva(href) ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
              esActiva(href) ? "text-rosea-700" : "text-neutral-500"
            }`}
          >
            <Icono className="h-5 w-5" />
            {etiqueta}
          </Link>
        ))}
        <button
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
            menuAbierto || hayActivaEnMenu ? "text-rosea-700" : "text-neutral-500"
          }`}
        >
          <IconoMas className="h-5 w-5" />
          Más
        </button>
      </nav>

      {menuAbierto && (
        <>
          <button
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 z-20 bg-black/20 md:hidden"
          />
          <div className="fixed inset-x-0 bottom-14 z-30 border-t border-rosea-100 bg-white p-2 md:hidden">
            {secundarias.map(({ href, etiqueta, icono: Icono }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  esActiva(href) ? "bg-rosea-50 text-rosea-700" : "text-neutral-600"
                }`}
              >
                <Icono className="h-5 w-5" />
                {etiqueta}
              </Link>
            ))}
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-600"
            >
              <IconoLanding className="h-5 w-5" />
              Ver landing
            </a>
            <button
              onClick={salir}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-600"
            >
              <IconoSalir className="h-5 w-5" />
              Salir
            </button>
          </div>
        </>
      )}

      {/* Espacio para que la barra de abajo no tape la última fila. */}
      <div className="pb-16 md:pb-0">{children}</div>
    </div>
  );
}

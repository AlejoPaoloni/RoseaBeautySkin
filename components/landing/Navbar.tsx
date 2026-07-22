"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Categoria } from "@/lib/types";

const LINKS: { label: string; categoria: Categoria | null; href: string }[] = [
  { label: "Maquillajes", categoria: "Maquillajes", href: "#catalogo" },
  { label: "Skincare", categoria: "Skincare", href: "#catalogo" },
  { label: "Por Encargo", categoria: null, href: "#por-encargo" },
  { label: "Contacto", categoria: null, href: "#contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function clickLink(categoria: Categoria | null) {
    if (categoria) {
      window.dispatchEvent(
        new CustomEvent("rosea:set-filter", { detail: { categoria } })
      );
    }
    setOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#inicio" aria-label="Inicio">
          <Image src="/brand/monogram.svg" alt="RB" width={48} height={36} />
        </a>

        {/* Desktop */}
        <ul className="hidden gap-8 text-sm tracking-wide md:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={() => clickLink(l.categoria)}
                className="text-neutral-700 transition-colors hover:text-rosea-500"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburguesa mobile */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
          className="text-neutral-700 md:hidden"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Panel mobile */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-white/95 backdrop-blur-md md:hidden"
          >
            {LINKS.map((l) => (
              <li key={l.label} className="border-t border-rosea-50">
                <a
                  href={l.href}
                  onClick={() => clickLink(l.categoria)}
                  className="block px-6 py-3 text-sm text-neutral-700"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

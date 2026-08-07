"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const catalogo = document.getElementById("catalogo");
      if (!catalogo) return setVisible(false);
      const rect = catalogo.getBoundingClientRect();
      // Visible mientras la seccion catalogo esta "debajo" del navbar: su
      // top ya lo cruzo pero su bottom todavia no.
      setVisible(rect.top <= 80 && rect.bottom > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            const catalogo = document.getElementById("catalogo");
            if (!catalogo) return;
            // Offset para que el titulo no quede tapado por el navbar fijo.
            const y =
              catalogo.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
          }}
          aria-label="Volver al catálogo"
          // Esquina opuesta al boton de Instagram para no superponerse.
          className="fixed bottom-5 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-rosea-500 shadow-lg ring-1 ring-rosea-100 transition-transform duration-200 hover:scale-110 md:bottom-8 md:left-8"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

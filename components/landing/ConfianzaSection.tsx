"use client";

import { motion } from "framer-motion";

export default function ConfianzaSection() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col items-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosea-50 text-rosea-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
            <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <h2 className="mt-4 font-serif text-3xl text-rosea-700 md:text-4xl">
          Productos 100% originales
        </h2>
        <p className="mt-3 max-w-md text-sm text-neutral-500">
          Importamos directo de Sephora US. Nada de réplicas: cada producto
          llega sellado, en su empaque original.
        </p>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";

const PASOS = [
  {
    numero: 1,
    titulo: "Elegí",
    texto: "Recorré el catálogo y encontrá el producto que buscás.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    numero: 2,
    titulo: "Consultanos",
    texto: "Tocá \"Consultar\" y escribinos por Instagram con el producto elegido.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    numero: 3,
    titulo: "Coordinamos",
    texto: "Confirmamos precio, forma de pago y envío por DM.",
    icono: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
];

export default function ComoComprarSection() {
  return (
    <section id="como-comprar" className="mx-auto max-w-5xl px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center font-serif text-4xl text-rosea-700 md:text-5xl"
      >
        Cómo comprar
      </motion.h2>

      <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
        {PASOS.map((paso, i) => (
          <motion.div
            key={paso.numero}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rosea-50 text-rosea-500">
              {paso.icono}
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rosea-500 font-serif text-xs text-white">
                {paso.numero}
              </span>
            </div>
            <h3 className="mt-4 font-serif text-xl text-neutral-900">
              {paso.titulo}
            </h3>
            <p className="mt-1 max-w-[22ch] text-sm text-neutral-500">
              {paso.texto}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

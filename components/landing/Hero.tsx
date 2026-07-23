"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { config } from "@/lib/config";

export default function Hero() {
  const { scrollY } = useScroll();
  const yBlob1 = useTransform(scrollY, [0, 600], [0, 150]);
  const yBlob2 = useTransform(scrollY, [0, 600], [0, -100]);
  const yLogo = useTransform(scrollY, [0, 600], [0, 80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      id="inicio"
      className="relative flex h-svh items-center justify-center overflow-hidden bg-gradient-to-b from-rosea-100 via-rosea-50 to-white"
    >
      {/* Blobs con parallax */}
      <motion.div
        style={{ y: yBlob1 }}
        className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-rosea-200/50 blur-3xl"
      />
      <motion.div
        style={{ y: yBlob2 }}
        className="absolute -right-20 bottom-24 h-[28rem] w-[28rem] rounded-full bg-rosea-300/40 blur-3xl"
      />

      <motion.div
        style={{ y: yLogo, opacity }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <Image
          src="/brand/caligrafia.svg"
          alt={config.marca}
          width={640}
          height={205}
          priority
          className="w-[min(82vw,640px)]"
        />
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 font-serif text-xl tracking-wide text-rosea-700 md:text-2xl"
        >
          {config.tagline}
        </motion.p>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.a
        href="#catalogo"
        aria-label="Ir al catálogo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-rosea-500"
      >
        <motion.svg
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.a>
    </section>
  );
}

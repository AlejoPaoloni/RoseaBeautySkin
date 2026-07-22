"use client";

import { motion } from "framer-motion";
import type { Producto } from "@/lib/types";
import { productosPorEncargo } from "@/lib/catalog";
import { config } from "@/lib/config";
import ProductCard from "./ProductCard";

export default function PorEncargoSection({
  productos,
}: {
  productos: Producto[];
}) {
  const items = productosPorEncargo(productos);
  if (items.length === 0) return null;

  return (
    <section id="por-encargo" className="bg-rosea-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-serif text-4xl text-rosea-700 md:text-5xl"
        >
          Productos por Encargo
        </motion.h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          {config.notaPorEncargo}
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} producto={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

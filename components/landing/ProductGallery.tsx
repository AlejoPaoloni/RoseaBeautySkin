"use client";

import Image from "next/image";
import { useState } from "react";

// Galeria simple de 1 a 3 fotos: la grande arriba, miniaturas clickeables
// abajo si hay mas de una. Sin libreria de carrusel — con este maximo de
// fotos alcanza y sobra.
export default function ProductGallery({
  imagenes,
  alt,
}: {
  imagenes: string[];
  alt: string;
}) {
  const [activa, setActiva] = useState(0);

  if (imagenes.length === 0) {
    return <div className="aspect-square rounded-2xl bg-rosea-50" />;
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-rosea-50">
        <Image
          key={imagenes[activa]}
          src={imagenes[activa]}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${alt}`}
              aria-current={i === activa}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition-colors ${
                i === activa ? "ring-rosea-400" : "ring-transparent"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

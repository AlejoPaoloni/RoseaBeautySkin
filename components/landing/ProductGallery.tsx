"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Galeria de 1 a 3 fotos. La mayoria entra desde el celular, asi que la
// pista se desliza con el dedo (scroll-snap nativo, sin libreria) y las
// miniaturas de abajo son el atajo en desktop. Con una sola foto no hay
// miniaturas ni nada que deslizar.
//
// object-contain, no cover: la foto se ve entera como la subio la duena,
// aunque no sea cuadrada. Recortar para llenar el cuadro le comia medio
// producto a las fotos verticales.
//
// En el celular el marco se mide contra el alto de la pantalla (38vh) para
// que nombre, precio y botones entren sin scrollear; en desktop es cuadrado,
// donde comparte fila con los datos del producto.
export default function ProductGallery({
  imagenes,
  alt,
}: {
  imagenes: string[];
  alt: string;
}) {
  const [activa, setActiva] = useState(0);
  const pista = useRef<HTMLDivElement>(null);

  if (imagenes.length === 0) {
    return <div className="h-[38vh] rounded-2xl bg-rosea-50 md:h-auto md:aspect-square" />;
  }

  function irA(i: number) {
    setActiva(i);
    pista.current?.scrollTo({
      left: i * pista.current.clientWidth,
      behavior: "smooth",
    });
  }

  // Deslizar con el dedo tambien mueve la miniatura marcada.
  function alDeslizar() {
    const p = pista.current;
    if (!p) return;
    const i = Math.round(p.scrollLeft / p.clientWidth);
    if (i !== activa) setActiva(i);
  }

  return (
    <div className="relative">
      <div
        ref={pista}
        onScroll={alDeslizar}
        className="flex h-[38vh] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl bg-rosea-50 [-ms-overflow-style:none] [scrollbar-width:none] md:h-auto md:aspect-square [&::-webkit-scrollbar]:hidden"
      >
        {imagenes.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} — foto ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={i === 0}
              className="object-contain"
            />
          </div>
        ))}
      </div>
      {/* En el celular el indicador va sobre la foto (no suma alto: la ficha
          tiene que entrar entera en una pantalla) y se navega deslizando;
          las miniaturas quedan para desktop, donde hay lugar de sobra. */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1.5 backdrop-blur-sm md:hidden">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver foto ${i + 1} de ${alt}`}
              aria-current={i === activa}
              className={`h-1.5 rounded-full transition-all ${
                i === activa ? "w-4 bg-rosea-500" : "w-1.5 bg-rosea-300"
              }`}
            />
          ))}
        </div>
      )}
      {imagenes.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver foto ${i + 1} de ${alt}`}
              aria-current={i === activa}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-rosea-50 ring-2 transition-colors ${
                i === activa ? "ring-rosea-400" : "ring-transparent"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

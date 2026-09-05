"use client";

import Image from "next/image";
import { config } from "@/lib/config";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Image
        src="/brand/caligrafia.svg"
        alt={config.marca}
        width={180}
        height={58}
      />
      <div>
        <h1 className="font-serif text-4xl text-rosea-700 md:text-5xl">
          Algo salió mal
        </h1>
        <p className="mt-3 text-neutral-500">
          Probá de nuevo en un momento. Si el problema sigue, escribinos por
          Instagram.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-full bg-rosea-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rosea-700"
      >
        Reintentar
      </button>
    </div>
  );
}

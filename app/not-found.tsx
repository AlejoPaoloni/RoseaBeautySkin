import Image from "next/image";
import Link from "next/link";
import { config } from "@/lib/config";

export default function NotFound() {
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
          Página no encontrada
        </h1>
        <p className="mt-3 text-neutral-500">
          Puede que el link esté vencido o el producto ya no esté disponible.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-rosea-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rosea-700"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}

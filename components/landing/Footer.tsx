import Image from "next/image";
import { config } from "@/lib/config";

export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-rosea-100 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <Image src="/brand/monogram.svg" alt="RB" width={64} height={48} />
        <div className="flex gap-6 text-sm text-neutral-500">
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-rosea-500"
          >
            Instagram
          </a>
          <a
            href={`mailto:${config.email}`}
            className="transition-colors hover:text-rosea-500"
          >
            {config.email}
          </a>
        </div>
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} {config.marca}. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}

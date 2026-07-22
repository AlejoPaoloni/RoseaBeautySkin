import Image from "next/image";
import { config } from "@/lib/config";

export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-rosea-100 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <Image src="/brand/monogram.svg" alt="RB" width={64} height={48} />
        <a
          href={config.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-neutral-500 transition-colors hover:text-rosea-500"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} {config.marca}. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}

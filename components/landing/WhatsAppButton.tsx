import { whatsappUrl } from "@/lib/config";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110 md:bottom-8 md:right-8 md:h-14 md:w-14"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/30 [animation-duration:2.5s]" />
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.05 31.31l6.128-1.96A15.9 15.9 0 0 0 16.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.31 22.594c-.386 1.09-1.918 1.994-3.14 2.258-.836.178-1.928.32-5.604-1.204-4.702-1.948-7.73-6.726-7.966-7.036-.226-.31-1.9-2.53-1.9-4.826s1.166-3.414 1.634-3.892c.386-.394.928-.574 1.448-.574.168 0 .32.008.456.016.4.016.6.04.864.668.328.79 1.126 2.74 1.222 2.944.098.204.196.48.06.79-.128.318-.24.458-.444.694-.204.236-.398.416-.602.668-.186.22-.396.454-.162.86.234.4 1.042 1.718 2.232 2.776 1.536 1.368 2.782 1.804 3.232 1.99.336.14.736.106 1.006-.18.34-.368.762-.98 1.19-1.582.306-.432.692-.486 1.096-.334.412.144 2.604 1.228 3.052 1.452.448.226.744.336.852.522.108.19.108 1.086-.278 2.176z" />
      </svg>
    </a>
  );
}

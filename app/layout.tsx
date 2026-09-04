import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { config } from "@/lib/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: `${config.marca} | Make Up & Skin Care Importado 💄`,
  description: config.tagline,
  // Sin esto, Google puede llegar a indexar por separado la URL real y una
  // preview de Vercel (o con/sin "www") como si fueran paginas distintas.
  alternates: { canonical: "/" },
  openGraph: {
    title: config.marca,
    description: config.tagline,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        {/* "user" respeta prefers-reduced-motion del sistema para todas las
            animaciones de framer-motion en el arbol, sin tocar cada uso. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}

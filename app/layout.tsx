import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { config, siteUrl } from "@/lib/config";
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
  metadataBase: new URL(siteUrl()),
  title: {
    // Las paginas hijas (la ficha de producto) solo declaran su nombre y
    // heredan la marca, sin repetirla a mano en cada archivo.
    default: `${config.marca} | Maquillaje y skincare importado`,
    template: `%s | ${config.marca}`,
  },
  // La description es lo que se lee abajo del titulo en Google: conviene que
  // diga que se vende, de que marcas y donde, no solo el lema.
  description:
    "Maquillaje y skincare importado de rhode, Rare Beauty, e.l.f., Fenty Beauty y más. Envíos desde Rosario a todo el país. Consultá por Instagram.",
  keywords: [
    "maquillaje importado",
    "skincare importado",
    "rhode Argentina",
    "Rare Beauty Argentina",
    "e.l.f. Cosmetics Argentina",
    "Fenty Beauty Argentina",
    "cosmética importada Rosario",
    config.marca,
  ],
  applicationName: config.marca,
  category: "shopping",
  // Sin esto, Google puede llegar a indexar por separado la URL real y una
  // preview de Vercel (o con/sin "www") como si fueran paginas distintas.
  alternates: { canonical: "/" },
  // max-image-preview large es lo que habilita la miniatura grande en los
  // resultados. Para un catalogo que se compra por la foto, es la diferencia
  // entre aparecer con una estampilla o con la imagen del producto.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${config.marca} | Maquillaje y skincare importado`,
    description: config.tagline,
    type: "website",
    url: "/",
    siteName: config.marca,
    locale: "es_AR",
  },
};

// theme-color: pinta la barra del navegador en el celular con el rosa de
// marca en vez del blanco por defecto.
export const viewport: Viewport = {
  themeColor: "#bd7c72",
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

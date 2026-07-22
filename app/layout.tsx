import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
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
  title: `${config.marca} — Maquillaje y Skincare importado`,
  description: config.tagline,
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
      <body>{children}</body>
    </html>
  );
}

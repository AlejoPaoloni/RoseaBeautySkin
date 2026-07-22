import CatalogSection from "@/components/landing/CatalogSection";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Navbar from "@/components/landing/Navbar";
import PorEncargoSection from "@/components/landing/PorEncargoSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { obtenerProductos } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function Home() {
  const productos = await obtenerProductos();

  return (
    <main>
      <Navbar />
      <Hero />
      <CatalogSection productos={productos} />
      <PorEncargoSection productos={productos} />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

import BackToTopButton from "@/components/landing/BackToTopButton";
import CatalogSection from "@/components/landing/CatalogSection";
import DestacadosSection from "@/components/landing/DestacadosSection";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import InstagramButton from "@/components/landing/InstagramButton";
import Navbar from "@/components/landing/Navbar";
import PorEncargoSection from "@/components/landing/PorEncargoSection";
import ProductosJsonLd from "@/components/landing/ProductosJsonLd";
import { obtenerProductos } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function Home() {
  const { productos, huboError } = await obtenerProductos();

  return (
    <main>
      <ProductosJsonLd productos={productos} />
      <Navbar />
      <Hero />
      <DestacadosSection productos={productos} />
      <CatalogSection productos={productos} huboError={huboError} />
      <PorEncargoSection productos={productos} />
      <Footer />
      <InstagramButton />
      <BackToTopButton />
    </main>
  );
}

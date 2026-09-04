import { config, siteUrl } from "@/lib/config";

// Schema.org Organization, para que Google entienda que el sitio es un
// negocio real (no solo un catalogo de paginas) y pueda mostrar el nombre,
// logo, contacto e Instagram en resultados enriquecidos.
export default function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.marca,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/monogram.svg`,
    description: config.tagline,
    sameAs: [config.instagram],
    contactPoint: {
      "@type": "ContactPoint",
      email: config.email,
      contactType: "customer service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

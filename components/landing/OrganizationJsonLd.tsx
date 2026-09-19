import { config, siteUrl } from "@/lib/config";

// Schema.org del negocio y del sitio.
//
// OnlineStore (y no Organization a secas) le dice a Google que esto es una
// tienda: habilita el panel de marca y da contexto a los Product de cada
// ficha. No se declara una direccion postal porque no hay local a la calle —
// inventar una es justo lo que Google penaliza; lo honesto es decir desde
// donde se vende (Rosario) y hasta donde se envia (todo el pais).
export default function OrganizationJsonLd() {
  const tienda = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${siteUrl()}/#tienda`,
    name: config.marca,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/monogram.svg`,
    image: `${siteUrl()}/opengraph-image`,
    description: config.tagline,
    slogan: config.tagline,
    email: config.email,
    sameAs: [config.instagram],
    currenciesAccepted: "ARS",
    areaServed: { "@type": "Country", name: "Argentina" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Rosario",
      addressRegion: "Santa Fe",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: config.email,
      contactType: "customer service",
      availableLanguage: "Spanish",
      areaServed: "AR",
    },
  };

  const sitio = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#sitio`,
    url: siteUrl(),
    name: config.marca,
    inLanguage: "es-AR",
    publisher: { "@id": `${siteUrl()}/#tienda` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tienda) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitio) }}
      />
    </>
  );
}

import { config, siteUrl } from "@/lib/config";
import { jsonLd } from "@/lib/jsonld";

// Schema.org del negocio y del sitio.
//
// OnlineStore (y no Organization a secas) le dice a Google que esto es una
// tienda: habilita el panel de marca y da contexto a los Product de cada
// ficha. No se declara una direccion postal porque no hay local a la calle —
// inventar una es justo lo que Google penaliza; lo honesto es decir desde
// donde se vende (Rosario) y hasta donde se envia hoy (Gran Rosario —
// todavia no hay envios a todo el pais, eso viene despues).
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
    areaServed: "Rosario y alrededores (consultar zona de envíos)",
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
    // Declarada una sola vez a nivel tienda: Google la aplica a los 38
    // productos sin repetirla en cada Offer. 7 dias, la clienta cubre el
    // envio de vuelta — es la politica real, no un valor de relleno para
    // pasar la validacion de Search Console.
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "AR",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
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
        dangerouslySetInnerHTML={{ __html: jsonLd(tienda) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(sitio) }}
      />
    </>
  );
}

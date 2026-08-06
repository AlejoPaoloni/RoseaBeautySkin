import type { Producto } from "@/lib/types";

const DISPONIBILIDAD: Record<Producto["estado"], string> = {
  Disponible: "https://schema.org/InStock",
  "Por Encargo": "https://schema.org/PreOrder",
  "Sin stock": "https://schema.org/OutOfStock",
};

// Schema.org Product por cada item del catalogo, para que Google pueda
// mostrar precio/disponibilidad directo en los resultados de busqueda.
export default function ProductosJsonLd({
  productos,
}: {
  productos: Producto[];
}) {
  if (productos.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: productos.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.nombre,
        description: p.descripcion_corta,
        image: p.imagen_url,
        ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
        offers: {
          "@type": "Offer",
          priceCurrency: "ARS",
          price: p.precio,
          availability: DISPONIBILIDAD[p.estado],
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

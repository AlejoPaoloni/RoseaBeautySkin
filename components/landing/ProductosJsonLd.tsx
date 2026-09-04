import type { Producto } from "@/lib/types";
import { tienePrecioPublico } from "@/lib/catalog";

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
          // Sin price en los por encargo: el JSON-LD queda en el HTML y lo
          // indexa Google, asi que publicar aca el precio que la card
          // esconde seria filtrarlo igual.
          ...(tienePrecioPublico(p) ? { price: p.precio } : {}),
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

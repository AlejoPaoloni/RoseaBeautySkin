import { imagenesProducto, tienePrecioPublico } from "@/lib/catalog";
import { config, siteUrl } from "@/lib/config";
import { rutaProducto } from "@/lib/slug";
import type { Producto } from "@/lib/types";

const DISPONIBILIDAD: Record<Producto["estado"], string> = {
  Disponible: "https://schema.org/InStock",
  "Por Encargo": "https://schema.org/PreOrder",
  "Sin stock": "https://schema.org/OutOfStock",
};

// Schema.org de la ficha: el Product con su Offer (precio, moneda,
// disponibilidad) es lo que habilita el resultado enriquecido en Google —
// foto grande, precio y "En stock" abajo del titulo. El BreadcrumbList hace
// que en vez de la URL cruda se vea "Rosea Beauty › Maquillajes › Labios".
export default function ProductoJsonLd({ producto }: { producto: Producto }) {
  const url = `${siteUrl()}${rutaProducto(producto)}`;
  const descripcion =
    producto.descripcion_larga ?? producto.descripcion_corta ?? undefined;

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: producto.nombre,
    url,
    ...(descripcion ? { description: descripcion } : {}),
    image: imagenesProducto(producto),
    // El uuid es el identificador estable del producto aunque cambie el slug.
    sku: producto.id,
    ...(producto.marca ? { brand: { "@type": "Brand", name: producto.marca } } : {}),
    category: `${producto.categoria} > ${producto.subcategoria}`,
    ...(producto.tonos && producto.tonos.length > 0
      ? { color: producto.tonos.map((t) => t.nombre).join(", ") }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "ARS",
      // Sin price en los por encargo: se cotizan por consulta, y el JSON-LD
      // queda en el HTML — publicarlo aca filtraria el precio que la ficha
      // justamente no muestra.
      ...(tienePrecioPublico(producto) ? { price: producto.precio } : {}),
      availability: DISPONIBILIDAD[producto.estado],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: config.marca },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: producto.categoria,
        item: `${siteUrl()}/#catalogo`,
      },
      { "@type": "ListItem", position: 3, name: producto.nombre, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

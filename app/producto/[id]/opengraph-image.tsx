import { ImageResponse } from "next/og";
import sharp from "sharp";
import { formatearPrecio, tienePrecioPublico } from "@/lib/catalog";
import { config, siteUrl } from "@/lib/config";
import { obtenerProductoPorId } from "@/lib/supabase/server";

// Se rearma como mucho una vez por hora: convertir la foto cuesta, y
// WhatsApp igual cachea la previa por su cuenta bastante mas que eso.
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = config.marca;

// Vista previa del link cuando se comparte un producto por WhatsApp o
// Instagram. Se genera en PNG (satori) y no se apunta directo a la foto del
// bucket porque esas son .webp, formato que los previsualizadores de
// WhatsApp/Facebook no leen: la previa saldria sin imagen.
//
// Por lo mismo la foto se pasa a PNG antes de incrustarla: satori tampoco
// decodifica webp ("Unsupported image type: image/webp") y la previa salia
// con el nombre y el precio pero sin producto.
async function fotoComoPng(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(440, 550, { fit: "inside" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    // Sin foto la previa igual sale, con el nombre y el precio.
    return null;
  }
}
export default async function OgProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producto = await obtenerProductoPorId(id);
  // satori exige una URL absoluta; si la foto quedo guardada como ruta
  // relativa se resuelve contra el sitio en vez de reventar la previa.
  const origen = producto?.imagen_url
    ? producto.imagen_url.startsWith("http")
      ? producto.imagen_url
      : `${siteUrl()}${producto.imagen_url}`
    : null;
  const foto = origen ? await fotoComoPng(origen) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #edc7c0 0%, #faf1ef 55%, #ffffff 100%)",
        }}
      >
        {foto && (
          <div
            style={{
              display: "flex",
              width: 520,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <img
              src={foto}
              alt=""
              width={440}
              height={550}
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            padding: 64,
          }}
        >
          <div style={{ fontSize: 30, color: "#bd7c72", letterSpacing: 4 }}>
            {producto?.marca?.toUpperCase() ?? config.marca.toUpperCase()}
          </div>
          <div style={{ fontSize: 60, color: "#5c3b36", marginTop: 16 }}>
            {producto?.nombre ?? config.marca}
          </div>
          {producto && (
            <div style={{ fontSize: 52, color: "#bd7c72", marginTop: 28 }}>
              {tienePrecioPublico(producto)
                ? formatearPrecio(producto.precio)
                : "Precio a consultar"}
            </div>
          )}
          <div style={{ fontSize: 28, color: "#8f5a52", marginTop: 40 }}>
            {config.marca}
          </div>
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";
import sharp from "sharp";
import { config, siteUrl } from "@/lib/config";
import { obtenerProductoPorId } from "@/lib/supabase/server";

// Se rearma como mucho una vez por hora: convertir la foto cuesta, y
// WhatsApp igual cachea la previa por su cuenta bastante mas que eso.
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = config.marca;

// Vista previa del link cuando se comparte un producto: la foto del
// producto y nada mas. Se pasa a PNG porque las fotos del bucket son .webp,
// formato que el previsualizador de WhatsApp no lee — la previa saldria
// vacia si se apuntara directo al archivo del bucket.

// La foto se centra entera (contain) sobre un lienzo apaisado, que es el
// formato de tarjeta grande de WhatsApp. El relleno de los costados sale
// del color de la esquina de la propia foto, asi el lienzo se funde con
// ella en vez de dibujarle un marco alrededor.
async function colorDeFondo(imagen: sharp.Sharp) {
  try {
    const { data } = await imagen
      .clone()
      .extract({ left: 0, top: 0, width: 4, height: 4 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let r = 0, g = 0, b = 0, a = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      a += data[i + 3];
    }
    const pixeles = data.length / 4;
    // Esquina transparente (foto recortada sin fondo): blanco antes que un
    // gris raro promediado contra la nada.
    if (a / pixeles < 128) return { r: 255, g: 255, b: 255 };
    return {
      r: Math.round(r / pixeles),
      g: Math.round(g / pixeles),
      b: Math.round(b / pixeles),
    };
  } catch {
    return { r: 255, g: 255, b: 255 };
  }
}

async function fotoDelProducto(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const original = sharp(Buffer.from(await res.arrayBuffer()));
    const fondo = await colorDeFondo(original);
    return await original
      .resize(size.width, size.height, {
        fit: "contain",
        background: fondo,
      })
      .flatten({ background: fondo })
      .png()
      .toBuffer();
  } catch {
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
  // satori/sharp necesitan una URL absoluta; si la foto quedo guardada como
  // ruta relativa se resuelve contra el sitio en vez de reventar la previa.
  const origen = producto?.imagen_url
    ? producto.imagen_url.startsWith("http")
      ? producto.imagen_url
      : `${siteUrl()}${producto.imagen_url}`
    : null;
  const foto = origen ? await fotoDelProducto(origen) : null;

  if (foto) {
    return new Response(new Uint8Array(foto), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  }

  // Sin foto (producto sin imagen, o el bucket no respondio): queda la marca
  // en vez de una previa rota.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #edc7c0 0%, #faf1ef 55%, #ffffff 100%)",
          fontSize: 88,
          fontStyle: "italic",
          color: "#8f5a52",
        }}
      >
        {config.marca}
      </div>
    ),
    size
  );
}

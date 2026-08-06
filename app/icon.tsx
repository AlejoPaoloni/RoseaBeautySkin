import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon generado en runtime (satori) — sin asset raster en el repo.
// "R" simple sobre rosea-500 para que la pestaña del navegador tenga
// identidad de marca en vez del icono generico de Next.js.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#bd7c72",
          borderRadius: "50%",
          color: "#ffffff",
          fontFamily: "serif",
          fontStyle: "italic",
          fontSize: 22,
        }}
      >
        R
      </div>
    ),
    size
  );
}

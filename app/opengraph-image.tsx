import { ImageResponse } from "next/og";
import { config } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = config.marca;

// Imagen OG generada en runtime (satori) — sin asset raster en el repo.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #edc7c0 0%, #faf1ef 55%, #ffffff 100%)",
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontStyle: "italic",
            color: "#8f5a52",
          }}
        >
          {config.marca}
        </div>
        <div style={{ fontSize: 38, color: "#bd7c72", marginTop: 28 }}>
          {config.tagline}
        </div>
      </div>
    ),
    size
  );
}

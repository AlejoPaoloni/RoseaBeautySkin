import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

// Web app manifest: deja instalar el catalogo como acceso directo en el
// celular y le da a Google/Android el nombre, el color y el icono correctos.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${config.marca} | Maquillaje y skincare importado`,
    short_name: config.marca,
    description: config.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#faf1ef", // rosea-50
    theme_color: "#bd7c72", // rosea-500
    lang: "es-AR",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        // Lo genera app/icon.tsx (misma "R" sobre rosea-500 del favicon).
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}

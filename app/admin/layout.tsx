import type { Metadata, Viewport } from "next";
import AdminShell from "@/components/admin/AdminShell";

// robots.ts ya bloquea /admin, esto es la segunda capa: por si un crawler
// ignora robots.txt o la pagina ya quedo indexada de antes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  // Manifest propio para "Agregar a inicio": el de la raiz tiene start_url
  // "/" y el iPhone abria la web publica en vez del panel. Vive en public/
  // y no bajo /admin porque el proxy mandaria el pedido del manifest al login.
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "Rosea Admin" },
};

// viewport-fit=cover: sin esto el iPhone no informa cuanto mide la zona de
// la rayita de abajo (env(safe-area-inset-bottom) vale 0) y la barra de
// navegacion del celular quedaba pegada al borde, debajo de la rayita. Solo
// en el admin: la landing no tiene barra fija abajo.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

import type { Metadata } from "next";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

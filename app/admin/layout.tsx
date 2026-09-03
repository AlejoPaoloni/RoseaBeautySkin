import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

// robots.ts ya bloquea /admin, esto es la segunda capa: por si un crawler
// ignora robots.txt o la pagina ya quedo indexada de antes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

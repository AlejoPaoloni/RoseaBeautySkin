import CierreMes from "@/components/admin/finanzas/CierreMes";
import { mesActual } from "@/lib/finanzas";

// Cierre de mes imprimible: /admin/finanzas/cierre?mes=2026-09. Un mes mal
// formado cae al mes en curso en vez de romper.
export default async function CierrePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mes } = await searchParams;
  const valido = typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
  return <CierreMes mes={valido ? mes : mesActual()} />;
}

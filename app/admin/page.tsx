"use client";

import { useEffect, useState } from "react";
import Inicio, { type DatosInicio } from "@/components/admin/Inicio";
import { listarProductos } from "@/lib/db";
import { listarGastos, listarVentas } from "@/lib/db-finanzas";
import {
  listarClientas,
  listarPedidos,
  listarPublicaciones,
  listarTareas,
} from "@/lib/db-gestion";
import { fechaHoy } from "@/lib/finanzas";

// Entrada del panel (/admin). Productos se mudo a /admin/productos.
export default function InicioPage() {
  const [datos, setDatos] = useState<DatosInicio | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [productos, ventas, gastos, clientas, pedidos, tareas, publicaciones] =
          await Promise.all([
            listarProductos(),
            listarVentas(),
            listarGastos(),
            listarClientas(),
            listarPedidos(),
            listarTareas(),
            listarPublicaciones(),
          ]);
        setDatos({ productos, ventas, gastos, clientas, pedidos, tareas, publicaciones });
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) {
    return (
      <p className="p-8 text-center text-red-600">
        No se pudieron cargar los datos. Probá de nuevo.
      </p>
    );
  }
  if (!datos) return <p className="p-8 text-center text-neutral-400">Cargando…</p>;
  return <Inicio datos={datos} hoy={fechaHoy()} />;
}

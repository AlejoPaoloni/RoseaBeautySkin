"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Estado, Producto } from "@/lib/types";
import { CATEGORIAS } from "@/lib/types";
import { agruparPorSubcategoria } from "@/lib/catalog";
import {
  actualizarProducto,
  eliminarProducto,
  listarProductos,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";
import ProductRow from "@/components/admin/ProductRow";

export default function AdminPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);

  async function cargar() {
    try {
      setProductos(await listarProductos());
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarEstado(p: Producto, estado: Estado) {
    setProductos((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, estado } : x))
    );
    await actualizarProducto(p.id, { estado });
  }

  async function borrar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    setProductos((prev) => prev.filter((x) => x.id !== p.id));
    await eliminarProducto(p.id);
  }

  async function salir() {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Image src="/brand/monogram.svg" alt="RB" width={40} height={30} />
          <h1 className="font-serif text-xl">Panel Admin</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditando(null);
              setFormAbierto(true);
            }}
            className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
          >
            + Nuevo producto
          </button>
          <a
            href="/"
            target="_blank"
            className="rounded-full px-4 py-2 text-sm text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            Ver landing
          </a>
          <button
            onClick={salir}
            className="rounded-full px-4 py-2 text-sm text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          CATEGORIAS.map((cat) => (
            <section key={cat} className="mb-10">
              <h2 className="font-serif text-2xl text-rosea-700">{cat}</h2>
              {Object.entries(agruparPorSubcategoria(productos, cat)).map(
                ([sub, items]) => (
                  <div key={sub} className="mt-4">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-400">
                      {sub}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {items.map((p) => (
                        <ProductRow
                          key={p.id}
                          producto={p}
                          onEstado={(e) => cambiarEstado(p, e)}
                          onEditar={() => {
                            setEditando(p);
                            setFormAbierto(true);
                          }}
                          onBorrar={() => borrar(p)}
                        />
                      ))}
                      {items.length === 0 && (
                        <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                          Sin productos
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </section>
          ))
        )}
      </main>

      {formAbierto && (
        <ProductForm
          producto={editando}
          onClose={() => setFormAbierto(false)}
          onSaved={() => {
            setFormAbierto(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Estado, Producto } from "@/lib/types";
import { CATEGORIAS } from "@/lib/types";
import type { Categoria } from "@/lib/types";
import { agruparPorSubcategoria } from "@/lib/catalog";
import {
  actualizarProducto,
  eliminarProducto,
  listarProductos,
  guardarOrden,
} from "@/lib/db";
import { conOrden } from "@/lib/orden";
import { createClient } from "@/lib/supabase/client";
import ProductForm from "@/components/admin/ProductForm";
import SortableRow from "@/components/admin/SortableRow";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
    const anterior = productos;
    setProductos((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, estado } : x))
    );
    try {
      await actualizarProducto(p.id, { estado });
    } catch {
      setProductos(anterior);
      alert("No se pudo actualizar el estado. Probá de nuevo.");
    }
  }

  async function borrar(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    const anterior = productos;
    setProductos((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await eliminarProducto(p.id);
    } catch {
      setProductos(anterior);
      alert("No se pudo eliminar el producto. Probá de nuevo.");
    }
  }

  async function cambiarDestacado(p: Producto) {
    const anterior = productos;
    setProductos((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, destacado: !x.destacado } : x
      )
    );
    try {
      await actualizarProducto(p.id, { destacado: !p.destacado });
    } catch {
      setProductos(anterior);
      alert("No se pudo actualizar destacado. Probá de nuevo.");
    }
  }

  function onDragEnd(cat: Categoria, sub: string) {
    return async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const grupo = agruparPorSubcategoria(productos, cat)[sub];
      const desde = grupo.findIndex((p) => p.id === active.id);
      const hasta = grupo.findIndex((p) => p.id === over.id);
      if (desde === -1 || hasta === -1) return;
      const nuevo = arrayMove(grupo, desde, hasta);
      const orden = conOrden(nuevo);
      const anterior = productos;
      setProductos((prev) =>
        prev.map((p) => {
          const o = orden.find((x) => x.id === p.id);
          return o ? { ...p, orden_display: o.orden_display } : p;
        })
      );
      try {
        await guardarOrden(orden);
      } catch {
        setProductos(anterior);
        alert("No se pudo guardar el orden. Probá de nuevo.");
      }
    };
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
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={onDragEnd(cat, sub)}
                    >
                      <SortableContext
                        items={items.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mt-2 space-y-2">
                          {items.map((p) => (
                            <SortableRow
                              key={p.id}
                              producto={p}
                              onEstado={(e) => cambiarEstado(p, e)}
                              onDestacado={() => cambiarDestacado(p)}
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
                      </SortableContext>
                    </DndContext>
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

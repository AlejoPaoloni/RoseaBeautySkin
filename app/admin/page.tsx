"use client";

import { useEffect, useState } from "react";
import type { Estado, Producto } from "@/lib/types";
import { CATEGORIAS, ESTADOS } from "@/lib/types";
import type { Categoria } from "@/lib/types";
import {
  agruparPorEstado,
  agruparPorSubcategoria,
  ordenarProductos,
  productosPorEncargo,
} from "@/lib/catalog";
import { productosStockBajo } from "@/lib/gestion";
import {
  actualizarProducto,
  eliminarProducto,
  listarProductos,
  guardarOrden,
} from "@/lib/db";
import { conOrden } from "@/lib/orden";
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

// Mismos colores que el badge de estado en la card publica, para que el
// admin use el mismo codigo visual.
const ESTADO_COLOR: Record<Estado, string> = {
  Disponible: "text-emerald-700",
  "Por Encargo": "text-amber-800",
  "Sin stock": "text-red-600",
};

// Los Por Encargo no van por subcategoria: tienen su propia lista al final,
// todos juntos, igual que en la web publica (el catalogo los excluye y
// PorEncargoSection los muestra en una sola grilla).
const ESTADOS_CATALOGO = ESTADOS.filter((e) => e !== "Por Encargo");

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);

  const bajoStock = productosStockBajo(productos);
  const enCatalogo = productos.filter((p) => p.estado !== "Por Encargo");
  // Mismo orden que la seccion "Productos por encargo" de la web.
  const porEncargo = ordenarProductos(productosPorEncargo(productos));

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
      await eliminarProducto(p.id, p.imagen_url);
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

  // Lista de una subcategoria tal como se ve: Disponibles y despues Sin stock.
  function grupoDeSubcategoria(cat: Categoria, sub: string): Producto[] {
    const porEstado = agruparPorEstado(
      agruparPorSubcategoria(enCatalogo, cat)[sub]
    );
    return ESTADOS_CATALOGO.flatMap((e) => porEstado[e]);
  }

  // `grupo` tiene que ser la lista en el mismo orden que se ve en pantalla.
  function onDragEnd(grupo: Producto[]) {
    return async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
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

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Productos</h1>
        <button
          onClick={() => {
            setEditando(null);
            setFormAbierto(true);
          }}
          className="rounded-full bg-rosea-400 px-4 py-2 text-sm text-white hover:bg-rosea-500"
        >
          + Nuevo producto
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {cargando ? (
          <p className="text-center text-neutral-400">Cargando…</p>
        ) : (
          <>
            {bajoStock.length > 0 && (
              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  {bajoStock.length} producto{bajoStock.length === 1 ? "" : "s"}{" "}
                  con poco stock
                </p>
                <ul className="mt-2 space-y-1">
                  {bajoStock.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => {
                          setEditando(p);
                          setFormAbierto(true);
                        }}
                        className="text-sm text-amber-700 underline-offset-2 hover:underline"
                      >
                        {p.nombre} — {p.stock} en stock
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {CATEGORIAS.map((cat) => (
            <section key={cat} className="mb-10">
              <h2 className="font-serif text-2xl text-rosea-700">{cat}</h2>
              {Object.entries(agruparPorSubcategoria(enCatalogo, cat)).map(
                ([sub, items]) => {
                  const porEstado = agruparPorEstado(items);
                  const grupo = grupoDeSubcategoria(cat, sub);
                  return (
                  <div key={sub} className="mt-4">
                    <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-400">
                      {sub}
                    </h3>
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={onDragEnd(grupo)}
                    >
                      <SortableContext
                        items={grupo.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mt-2 space-y-4">
                          {ESTADOS_CATALOGO.map((estado) => {
                            const grupo = porEstado[estado];
                            if (grupo.length === 0) return null;
                            return (
                              <div key={estado}>
                                <p
                                  className={`mb-1 text-xs font-medium ${ESTADO_COLOR[estado]}`}
                                >
                                  {estado} ({grupo.length})
                                </p>
                                <div className="space-y-2">
                                  {grupo.map((p) => (
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
                                </div>
                              </div>
                            );
                          })}
                          {items.length === 0 && (
                            <p className="rounded-lg border border-dashed border-rosea-200 p-3 text-sm text-neutral-400">
                              Sin productos
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                  );
                }
              )}
            </section>
          ))}
            {porEncargo.length > 0 && (
              <section className="mb-10 border-t border-rosea-100 pt-8">
                <h2 className="font-serif text-2xl text-amber-800">
                  Por Encargo ({porEncargo.length})
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Todos juntos, sin importar la categoría. El orden es el de la
                  sección &quot;Productos por encargo&quot; de la web.
                </p>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd(porEncargo)}
                >
                  <SortableContext
                    items={porEncargo.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="mt-4 space-y-2">
                      {porEncargo.map((p) => (
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
                    </div>
                  </SortableContext>
                </DndContext>
              </section>
            )}
          </>
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

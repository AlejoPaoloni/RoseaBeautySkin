"use client";

import { useState } from "react";
import type { Categoria, Estado, Producto, Tono } from "@/lib/types";
import { CATEGORIAS, ESTADOS, SUBCATEGORIAS } from "@/lib/types";
import { actualizarProducto, crearProducto, subirImagen } from "@/lib/db";
import { comprimirImagen } from "@/lib/imagen";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductForm({ producto, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [marca, setMarca] = useState(producto?.marca ?? "");
  const [descripcion, setDescripcion] = useState(
    producto?.descripcion_corta ?? ""
  );
  const [precio, setPrecio] = useState(
    producto ? String(producto.precio) : ""
  );
  const [categoria, setCategoria] = useState<Categoria>(
    producto?.categoria ?? "Maquillajes"
  );
  const [subcategoria, setSubcategoria] = useState(
    producto?.subcategoria ?? SUBCATEGORIAS["Maquillajes"][0]
  );
  const [estado, setEstado] = useState<Estado>(
    producto?.estado ?? "Disponible"
  );
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [tonos, setTonos] = useState<Tono[]>(producto?.tonos ?? []);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    producto?.imagen_url ?? null
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarCategoria(c: Categoria) {
    setCategoria(c);
    setSubcategoria(SUBCATEGORIAS[c][0]);
  }

  function elegirArchivo(f: File | null) {
    setArchivo(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  function agregarTono() {
    setTonos([...tonos, { nombre: "", hex: "#d5998f" }]);
  }

  function actualizarTono(i: number, campo: keyof Tono, valor: string) {
    setTonos(tonos.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)));
  }

  function quitarTono(i: number) {
    setTonos(tonos.filter((_, j) => j !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const precioNumero = Number(precio);
    if (!Number.isInteger(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número entero mayor o igual a 0");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      let imagen_url = producto?.imagen_url ?? null;
      if (archivo) {
        const blob = await comprimirImagen(archivo);
        imagen_url = await subirImagen(blob, `${crypto.randomUUID()}.webp`);
      }
      const tonosLimpios = tonos
        .map((t) => ({ ...t, nombre: t.nombre.trim() }))
        .filter((t) => t.nombre !== "");
      const datos = {
        nombre: nombre.trim(),
        marca: marca.trim() || null,
        descripcion_corta: descripcion.trim(),
        imagen_url,
        categoria,
        subcategoria,
        estado,
        precio: precioNumero,
        destacado,
        tonos: tonosLimpios.length > 0 ? tonosLimpios : null,
      };
      if (producto) {
        await actualizarProducto(producto.id, datos);
      } else {
        await crearProducto({ ...datos, orden_display: 999 });
      }
      onSaved();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-serif text-xl text-rosea-700">
          {producto ? "Editar producto" : "Nuevo producto"}
        </h2>

        <label className="mt-4 block text-sm text-neutral-600">
          Nombre *
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Marca
          <input
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej: Maybelline"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Descripción corta ({descripcion.length}/150)
          <textarea
            value={descripcion}
            maxLength={150}
            rows={3}
            onChange={(e) => setDescripcion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Precio (ARS) *
          <input
            type="number"
            min={0}
            step={1}
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm text-neutral-600">
            Categoría
            <select
              value={categoria}
              onChange={(e) => cambiarCategoria(e.target.value as Categoria)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-neutral-600">
            Subcategoría
            <select
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
            >
              {SUBCATEGORIAS[categoria].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Estado
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
          >
            {ESTADOS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={destacado}
            onChange={(e) => setDestacado(e.target.checked)}
            className="h-4 w-4 accent-rosea-400"
          />
          Destacado
        </label>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Tonos</span>
            <button
              type="button"
              onClick={agregarTono}
              className="rounded-full bg-rosea-50 px-3 py-1 text-xs text-rosea-700 hover:bg-rosea-100"
            >
              + Agregar tono
            </button>
          </div>
          {tonos.length > 0 && (
            <div className="mt-2 space-y-2">
              {tonos.map((tono, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tono.hex}
                    onChange={(e) => actualizarTono(i, "hex", e.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-neutral-200"
                    aria-label={`Color del tono ${i + 1}`}
                  />
                  <input
                    value={tono.nombre}
                    placeholder="Nombre del tono"
                    onChange={(e) =>
                      actualizarTono(i, "nombre", e.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
                  />
                  <button
                    type="button"
                    onClick={() => quitarTono(i)}
                    aria-label={`Quitar tono ${i + 1}`}
                    className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="mt-4 block text-sm text-neutral-600">
          Imagen
          <input
            type="file"
            accept="image/*"
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-xs text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-rosea-50 file:px-4 file:py-2 file:text-xs file:text-rosea-700"
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="mt-3 h-32 w-32 rounded-lg object-cover"
          />
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-rosea-400 px-5 py-2 text-sm text-white hover:bg-rosea-500 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

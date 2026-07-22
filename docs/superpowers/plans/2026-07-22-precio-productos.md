# Precio de Productos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar precio (ARS, entero, obligatorio) a los productos: base de datos, tipos/lógica, admin y landing.

**Architecture:** Incremento sobre el catálogo ya en producción (branch `main`). Migración SQL separada para el proyecto Supabase existente; `schema.sql`/`seed.sql` también se actualizan para que un setup nuevo desde cero ya incluya precio. `Producto.precio: number` fluye por los mismos tipos/componentes ya existentes.

**Tech Stack:** Next.js 16, TypeScript, Supabase (Postgres), vitest.

**Spec:** `docs/superpowers/specs/2026-07-22-precio-productos-design.md`

## Global Constraints

- Precio: entero (sin decimales), pesos argentinos, `>= 0`, obligatorio (`not null`).
- Formato de visualización: `Intl`/`toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })` — produce algo como `$12.500`. Los tests verifican con `toContain` sobre `"$"` y el separador de miles `.`, no el string exacto completo (el símbolo puede variar levemente entre entornos ICU).
- Los 15 productos ya cargados en el Supabase de producción del usuario reciben backfill `9999` vía migración aparte — no se tocan `schema.sql`/`seed.sql` como si fueran a re-ejecutarse ahí.
- `ProductRow` (lista del admin) NO muestra precio — fuera de alcance.
- UI en español.
- No introducir decimales, multi-moneda, ni descuentos.

---

### Task 1: Migración SQL + actualizar schema/seed

**Files:**
- Create: `supabase/migrations/001_add_precio.sql`
- Modify: `supabase/schema.sql:2-16` (bloque `create table`)
- Modify: `supabase/seed.sql` (statement completo)

**Interfaces:**
- Produces: columna `productos.precio integer not null check (precio >= 0)`, consistente entre migración (proyecto existente) y schema fresco (proyecto nuevo).

- [ ] **Step 1: Crear `supabase/migrations/001_add_precio.sql`** — para correr a mano en el Supabase de producción ya existente (que ya tiene los 15 productos del seed original):

```sql
-- Migracion incremental: agrega precio a un proyecto que ya tiene la tabla productos.
-- Correr una sola vez en el SQL Editor del proyecto Supabase existente.
alter table public.productos add column precio integer;
update public.productos set precio = 9999 where precio is null;
alter table public.productos alter column precio set not null;
alter table public.productos add constraint precio_no_negativo check (precio >= 0);
```

- [ ] **Step 2: Modificar `supabase/schema.sql`** — agregar la columna directo en el `create table` (para que un proyecto Supabase nuevo la tenga desde el inicio, sin necesitar la migración). Reemplazar:

```sql
-- Tabla de productos
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta varchar(150),
  imagen_url text,
  categoria text not null check (categoria in ('Maquillajes', 'Skincare')),
  subcategoria text not null check (subcategoria in (
    'Bases & Correctores', 'Sombras & Delineadores', 'Labiales',
    'Limpiadoras', 'Hidratantes', 'Serums & Tratamientos'
  )),
  estado text not null default 'Disponible'
    check (estado in ('Disponible', 'Por Encargo', 'Sin stock')),
  orden_display int not null default 0,
  created_at timestamptz not null default now()
);
```

por:

```sql
-- Tabla de productos
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta varchar(150),
  imagen_url text,
  categoria text not null check (categoria in ('Maquillajes', 'Skincare')),
  subcategoria text not null check (subcategoria in (
    'Bases & Correctores', 'Sombras & Delineadores', 'Labiales',
    'Limpiadoras', 'Hidratantes', 'Serums & Tratamientos'
  )),
  estado text not null default 'Disponible'
    check (estado in ('Disponible', 'Por Encargo', 'Sin stock')),
  precio integer not null check (precio >= 0),
  orden_display int not null default 0,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Modificar `supabase/seed.sql`** — reemplazar el archivo completo agregando la columna `precio` a la lista de columnas y un valor por fila:

```sql
insert into public.productos
  (nombre, descripcion_corta, imagen_url, categoria, subcategoria, estado, precio, orden_display)
values
  ('Base Líquida Matte', 'Cobertura media a alta con acabado mate natural que dura todo el día.', 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 18500, 0),
  ('Corrector Alta Cobertura', 'Cubre ojeras e imperfecciones sin marcar líneas. Fórmula cremosa.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 12000, 1),
  ('Base Serum Glow', 'Base híbrida con skincare: luminosidad y cobertura ligera.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Por Encargo', 21000, 2),
  ('Paleta Sombras Nude', '12 tonos tierra mate y shimmer de alta pigmentación.', 'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Disponible', 16500, 0),
  ('Delineador Líquido Precision', 'Punta ultra fina para un trazo intenso de larga duración.', 'https://images.unsplash.com/photo-1631214540242-6b5b0e0e0b0e?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Sin stock', 9800, 1),
  ('Labial Mate Velvet', 'Color intenso con textura aterciopelada que no reseca.', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Disponible', 8900, 0),
  ('Gloss Hidratante Shine', 'Brillo espejo con ácido hialurónico. Efecto labios más llenos.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Por Encargo', 7500, 1),
  ('Espuma Limpiadora Suave', 'Limpia sin resecar. Ideal para uso diario, todo tipo de piel.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 11000, 0),
  ('Agua Micelar Rosas', 'Desmaquilla y tonifica en un solo paso. Con agua de rosas.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 9500, 1),
  ('Bálsamo Desmaquillante', 'Derrite el maquillaje resistente al agua. Textura sorbete.', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Por Encargo', 13500, 2),
  ('Crema Hidratante Ligera', 'Gel-crema con niacinamida. Hidratación 24hs sin sensación grasa.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Disponible', 15000, 0),
  ('Crema Nutritiva Noche', 'Repara la barrera de la piel mientras dormís. Con ceramidas.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Sin stock', 19000, 1),
  ('Serum Vitamina C', 'Ilumina y unifica el tono. Antioxidante de uso diario.', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Disponible', 23000, 0),
  ('Serum Ácido Hialurónico', 'Hidratación profunda multicapa. Piel más lisa al instante.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Por Encargo', 24500, 1),
  ('Rubor Cremoso Rosé', 'Acabado natural que se funde con la piel. Tono rosa empolvado.', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 10500, 3);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_add_precio.sql supabase/schema.sql supabase/seed.sql
git commit -m "feat: agregar columna precio a productos (migracion + schema + seed)"
```

---

### Task 2: Tipos, lógica y formato de precio (TDD)

**Files:**
- Modify: `lib/types.ts:4-14` (interface `Producto`)
- Modify: `lib/catalog.ts` (agregar función)
- Modify: `tests/catalog.test.ts` (agregar test + actualizar factory)

**Interfaces:**
- Consumes: nada nuevo (extiende tipos existentes).
- Produces: `Producto.precio: number`; `formatearPrecio(precio: number): string` en `lib/catalog.ts` — usado por Task 3 (`ProductCard`).

- [ ] **Step 1: Escribir el test que falla** — en `tests/catalog.test.ts`, agregar `formatearPrecio` al import y actualizar la factory `producto()` para incluir `precio: 10000` por defecto (si no se agrega acá, todos los tests existentes rompen tipos al faltar `precio` en el objeto `Producto`):

```ts
import { describe, expect, it } from "vitest";
import {
  agruparPorSubcategoria,
  filtrarProductos,
  formatearPrecio,
  ordenarProductos,
  productosPorEncargo,
} from "@/lib/catalog";
import { conOrden } from "@/lib/orden";
import type { Producto } from "@/lib/types";

let n = 0;
function producto(over: Partial<Producto> = {}): Producto {
  n += 1;
  return {
    id: `id-${n}`,
    nombre: `Producto ${n}`,
    descripcion_corta: null,
    imagen_url: null,
    categoria: "Maquillajes",
    subcategoria: "Labiales",
    estado: "Disponible",
    precio: 10000,
    orden_display: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}
```

(el resto del archivo —`describe` de `ordenarProductos`, `filtrarProductos`, `productosPorEncargo`, `agruparPorSubcategoria`, `conOrden`— queda igual, no se toca). Agregar al final del archivo:

```ts

describe("formatearPrecio", () => {
  it("formatea con separador de miles y sin decimales", () => {
    const resultado = formatearPrecio(12500);
    expect(resultado).toContain("12.500");
    expect(resultado).toContain("$");
  });

  it("formatea precio cero", () => {
    const resultado = formatearPrecio(0);
    expect(resultado).toContain("0");
    expect(resultado).toContain("$");
  });
});
```

- [ ] **Step 2: Correr tests, verificar que fallan**

Run: `npm run test`
Expected: FAIL — `formatearPrecio` no existe en `@/lib/catalog`, y errores de tipo por `precio` faltante en `Producto` (TypeScript vía vitest).

- [ ] **Step 3: Agregar `precio` a `lib/types.ts`** — reemplazar la interfaz:

```ts
export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: Categoria;
  subcategoria: string;
  estado: Estado;
  precio: number;
  orden_display: number;
  created_at: string;
}
```

- [ ] **Step 4: Agregar `formatearPrecio` a `lib/catalog.ts`** — al final del archivo:

```ts

export function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
```

- [ ] **Step 5: Correr tests, verificar que pasan**

Run: `npm run test`
Expected: PASS (todos, incluyendo los 2 nuevos de `formatearPrecio`).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/catalog.ts tests/catalog.test.ts
git commit -m "feat: agregar precio a Producto y formatearPrecio con tests"
```

---

### Task 3: Admin form + ProductCard

**Files:**
- Modify: `components/admin/ProductForm.tsx`
- Modify: `components/landing/ProductCard.tsx`

**Interfaces:**
- Consumes: `Producto.precio: number` (Task 2), `formatearPrecio` (Task 2). `lib/db.ts`'s `ProductoNuevo = Omit<Producto, "id" | "created_at">` ya incluye `precio` automáticamente vía el tipo genérico — no requiere modificación.

- [ ] **Step 1: Modificar `components/admin/ProductForm.tsx`** — agregar estado `precio` (como string, para permitir edición libre) justo después de `descripcion`:

```tsx
  const [descripcion, setDescripcion] = useState(
    producto?.descripcion_corta ?? ""
  );
  const [precio, setPrecio] = useState(
    producto ? String(producto.precio) : ""
  );
```

- [ ] **Step 2: Validar precio en `onSubmit`** — reemplazar la validación y el objeto `datos`:

```tsx
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const precioNumero = Number(precio);
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número válido mayor o igual a 0");
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
      const datos = {
        nombre: nombre.trim(),
        descripcion_corta: descripcion.trim(),
        imagen_url,
        categoria,
        subcategoria,
        estado,
        precio: precioNumero,
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
```

- [ ] **Step 3: Agregar el input de precio al JSX** — insertar entre el bloque de "Descripción corta" y el `<div className="mt-4 grid grid-cols-2 gap-3">` de Categoría/Subcategoría:

```tsx
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
```

- [ ] **Step 4: Modificar `components/landing/ProductCard.tsx`** — importar `formatearPrecio` y mostrar el precio debajo de la descripción:

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { formatearPrecio } from "@/lib/catalog";
import type { Producto } from "@/lib/types";
```

y en el JSX, reemplazar:

```tsx
      <div className="p-4">
        <h3 className="font-serif text-lg text-neutral-900">
          {producto.nombre}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          {producto.descripcion_corta}
        </p>
      </div>
```

por:

```tsx
      <div className="p-4">
        <h3 className="font-serif text-lg text-neutral-900">
          {producto.nombre}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          {producto.descripcion_corta}
        </p>
        <p className="mt-2 font-serif text-lg text-rosea-500">
          {formatearPrecio(producto.precio)}
        </p>
      </div>
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: PASS sin errores de tipos (todo lugar que construye un `Producto` o `ProductoNuevo` ya pasa por `Task 2`/`Task 1`).

- [ ] **Step 6: Commit**

```bash
git add components/admin/ProductForm.tsx components/landing/ProductCard.tsx
git commit -m "feat: input de precio en admin y precio visible en ProductCard"
```

---

### Task 4: Verificación final

**Files:** ninguno (solo verificación)

**Interfaces:** ninguna nueva.

- [ ] **Step 1: Correr suite completa**

Run: `npm run test`
Expected: PASS (11 tests: los 9 originales + 2 de `formatearPrecio`).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Smoke test manual** — con `npm run dev` y `.env.local` ya configurado (Supabase real conectado): abrir `/`, confirmar que cada card muestra precio formateado; abrir `/admin`, editar un producto existente, confirmar que el campo "Precio (ARS)" aparece precargado con el valor actual y que guardar sin tocar nada no rompe; crear un producto nuevo con precio vacío y confirmar que muestra el error de validación en vez de guardar.

No requiere commit (paso de verificación, no de código).

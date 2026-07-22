# Productos Destacados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sección "Productos Destacados" con marquee automático entre el Hero y el Catálogo, y toggle destacado (estrella en lista + checkbox en form) en el admin.

**Architecture:** Columna booleana `destacado` en Supabase (migración incremental + schema/seed para setups nuevos). `productosDestacados()` en la capa de lógica. Marquee CSS puro (keyframes + lista duplicada) en un componente nuevo; admin reutiliza el patrón optimista-con-rollback existente.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Tailwind v4, vitest. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-07-22-productos-destacados-design.md`

## Global Constraints

- Marquee: pista se mueve hacia la izquierda (productos aparecen desde la derecha), lenta (`items.length * 6s`, mínimo 20s), loop infinito sin salto, sin flechas, pausa on hover, `prefers-reduced-motion` la desactiva.
- Destacados se muestran siempre, incluso "Sin stock" (con su gris habitual heredado de ProductCard).
- Sección no se renderiza si no hay destacados.
- Migración incremental separada (producción ya corrió 001; no re-ejecutar schema/seed ahí).
- UI en español. Sin flechas, sin drag manual, sin límite de destacados, sin link en navbar.
- Estrella admin: ámbar cuando activo (`text-amber-400`), gris cuando no (`text-neutral-300`).

---

### Task 1: Migración SQL + schema/seed + tipos + lógica (TDD)

**Files:**
- Create: `supabase/migrations/002_add_destacado.sql`
- Modify: `supabase/schema.sql` (create table), `supabase/seed.sql` (insert), `lib/types.ts` (interface), `lib/catalog.ts` (nueva función)
- Test: `tests/catalog.test.ts`

**Interfaces:**
- Produces: columna `productos.destacado boolean not null default false`; `Producto.destacado: boolean`; `productosDestacados(ps: Producto[]): Producto[]` (filtra `destacado`, ordena con `ordenarProductos`) — usada por Task 2.

- [ ] **Step 1: Crear `supabase/migrations/002_add_destacado.sql`**

```sql
-- Migracion incremental: agrega flag destacado.
-- Correr una sola vez en el SQL Editor del proyecto Supabase existente.
alter table public.productos add column destacado boolean not null default false;
```

- [ ] **Step 2: Modificar `supabase/schema.sql`** — en el `create table`, agregar después de la línea `precio integer not null check (precio >= 0),`:

```sql
  destacado boolean not null default false,
```

- [ ] **Step 3: Modificar `supabase/seed.sql`** — reemplazar el archivo completo (agrega columna `destacado`; `true` solo en Paleta Sombras Nude, Labial Mate Velvet y Serum Vitamina C):

```sql
insert into public.productos
  (nombre, descripcion_corta, imagen_url, categoria, subcategoria, estado, precio, destacado, orden_display)
values
  ('Base Líquida Matte', 'Cobertura media a alta con acabado mate natural que dura todo el día.', 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 18500, false, 0),
  ('Corrector Alta Cobertura', 'Cubre ojeras e imperfecciones sin marcar líneas. Fórmula cremosa.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 12000, false, 1),
  ('Base Serum Glow', 'Base híbrida con skincare: luminosidad y cobertura ligera.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Por Encargo', 21000, false, 2),
  ('Paleta Sombras Nude', '12 tonos tierra mate y shimmer de alta pigmentación.', 'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Disponible', 16500, true, 0),
  ('Delineador Líquido Precision', 'Punta ultra fina para un trazo intenso de larga duración.', 'https://images.unsplash.com/photo-1631214540242-6b5b0e0e0b0e?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Sin stock', 9800, false, 1),
  ('Labial Mate Velvet', 'Color intenso con textura aterciopelada que no reseca.', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Disponible', 8900, true, 0),
  ('Gloss Hidratante Shine', 'Brillo espejo con ácido hialurónico. Efecto labios más llenos.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Por Encargo', 7500, false, 1),
  ('Espuma Limpiadora Suave', 'Limpia sin resecar. Ideal para uso diario, todo tipo de piel.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 11000, false, 0),
  ('Agua Micelar Rosas', 'Desmaquilla y tonifica en un solo paso. Con agua de rosas.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 9500, false, 1),
  ('Bálsamo Desmaquillante', 'Derrite el maquillaje resistente al agua. Textura sorbete.', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Por Encargo', 13500, false, 2),
  ('Crema Hidratante Ligera', 'Gel-crema con niacinamida. Hidratación 24hs sin sensación grasa.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Disponible', 15000, false, 0),
  ('Crema Nutritiva Noche', 'Repara la barrera de la piel mientras dormís. Con ceramidas.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Sin stock', 19000, false, 1),
  ('Serum Vitamina C', 'Ilumina y unifica el tono. Antioxidante de uso diario.', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Disponible', 23000, true, 0),
  ('Serum Ácido Hialurónico', 'Hidratación profunda multicapa. Piel más lisa al instante.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Por Encargo', 24500, false, 1),
  ('Rubor Cremoso Rosé', 'Acabado natural que se funde con la piel. Tono rosa empolvado.', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 10500, false, 3);
```

- [ ] **Step 4: Escribir el test que falla** — en `tests/catalog.test.ts`: agregar `productosDestacados` al import de `@/lib/catalog`, agregar `destacado: false,` a la factory `producto()` (después de `precio: 10000,`), y agregar al final del archivo:

```ts

describe("productosDestacados", () => {
  it("devuelve solo destacados, ordenados", () => {
    const a = producto({ destacado: true, orden_display: 2 });
    const b = producto({ destacado: true, orden_display: 1 });
    const c = producto();
    expect(productosDestacados([a, b, c]).map((p) => p.id)).toEqual([
      b.id,
      a.id,
    ]);
  });

  it("devuelve vacio si no hay destacados", () => {
    expect(productosDestacados([producto(), producto()])).toEqual([]);
  });
});
```

- [ ] **Step 5: Correr tests, verificar que fallan**

Run: `npm run test`
Expected: FAIL — `productosDestacados` no existe; error de tipo por `destacado` faltante en `Producto`.

- [ ] **Step 6: Agregar `destacado` a `lib/types.ts`** — en la interfaz `Producto`, después de `precio: number;`:

```ts
  destacado: boolean;
```

- [ ] **Step 7: Agregar `productosDestacados` a `lib/catalog.ts`** — al final del archivo:

```ts

export function productosDestacados(productos: Producto[]): Producto[] {
  return ordenarProductos(productos.filter((p) => p.destacado));
}
```

- [ ] **Step 8: Correr tests, verificar que pasan**

Run: `npm run test`
Expected: PASS (13 tests: 11 previos + 2 nuevos).

- [ ] **Step 9: Commit**

```bash
git add supabase lib/types.ts lib/catalog.ts tests/catalog.test.ts
git commit -m "feat: columna destacado, tipos y productosDestacados con tests"
```

---

### Task 2: DestacadosSection con marquee + montaje en page

**Files:**
- Create: `components/landing/DestacadosSection.tsx`
- Modify: `app/globals.css` (keyframes al final), `app/page.tsx` (import + montaje)

**Interfaces:**
- Consumes: `productosDestacados` y `Producto` (Task 1), `ProductCard` existente (props `{ producto, index? }`).
- Produces: `DestacadosSection({ productos: Producto[] })` — se monta entre `<Hero />` y `<CatalogSection />`.

- [ ] **Step 1: Agregar al final de `app/globals.css`**

```css

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;
  }
}
```

- [ ] **Step 2: Crear `components/landing/DestacadosSection.tsx`**

```tsx
"use client";

import type { Producto } from "@/lib/types";
import { productosDestacados } from "@/lib/catalog";
import ProductCard from "./ProductCard";

export default function DestacadosSection({
  productos,
}: {
  productos: Producto[];
}) {
  const items = productosDestacados(productos);
  if (items.length === 0) return null;

  // Duracion proporcional a la cantidad para velocidad constante y lenta.
  const duracion = Math.max(20, items.length * 6);
  // Lista duplicada: la animacion translada -50% y el loop queda sin salto.
  const pista = [...items, ...items];

  return (
    <section id="destacados" className="py-16">
      <h2 className="text-center font-serif text-4xl text-rosea-700 md:text-5xl">
        Productos Destacados
      </h2>
      <div className="group mt-10 overflow-hidden motion-reduce:overflow-x-auto">
        <div
          className="animate-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duracion}s` }}
        >
          {pista.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="w-56 shrink-0"
              aria-hidden={i >= items.length}
            >
              <ProductCard producto={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Modificar `app/page.tsx`** — agregar import y montar entre Hero y CatalogSection:

```tsx
import CatalogSection from "@/components/landing/CatalogSection";
import DestacadosSection from "@/components/landing/DestacadosSection";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import Navbar from "@/components/landing/Navbar";
import PorEncargoSection from "@/components/landing/PorEncargoSection";
import WhatsAppButton from "@/components/landing/WhatsAppButton";
import { obtenerProductos } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function Home() {
  const productos = await obtenerProductos();

  return (
    <main>
      <Navbar />
      <Hero />
      <DestacadosSection productos={productos} />
      <CatalogSection productos={productos} />
      <PorEncargoSection productos={productos} />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: PASS. (Nota: si el Supabase conectado en `.env.local` todavía no corrió la migración 002, el fetch devuelve filas sin `destacado` → `productosDestacados` filtra `undefined` como falsy → sección oculta, build no rompe. No agregar código defensivo por esto.)

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/landing/DestacadosSection.tsx app/page.tsx
git commit -m "feat: seccion productos destacados con marquee automatico"
```

---

### Task 3: Admin — estrella en fila + checkbox en form

**Files:**
- Modify: `components/admin/ProductRow.tsx`, `components/admin/SortableRow.tsx`, `app/admin/page.tsx`, `components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: `Producto.destacado` (Task 1), `actualizarProducto(id, Partial<ProductoNuevo>)` existente en `lib/db.ts` (ya acepta `destacado` vía tipo derivado — sin cambios en `lib/db.ts`).
- Produces: prop `onDestacado: () => void` en `ProductRow` y `SortableRow`; handler `cambiarDestacado(p: Producto)` en `AdminPage`; campo `destacado` en el objeto `datos` del form.

- [ ] **Step 1: Modificar `components/admin/ProductRow.tsx`** — agregar prop y botón estrella. Interfaz:

```tsx
interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
  onDestacado: () => void;
  dragHandle?: React.ReactNode;
}
```

Firma del componente: agregar `onDestacado` a la desestructuración. En el JSX, insertar entre el `<div>` del thumbnail y el `<span>` del nombre:

```tsx
      <button
        type="button"
        onClick={onDestacado}
        aria-label={
          producto.destacado
            ? "Quitar de destacados"
            : "Marcar como destacado"
        }
        className={`px-1 text-lg leading-none transition-colors ${
          producto.destacado
            ? "text-amber-400 hover:text-amber-500"
            : "text-neutral-300 hover:text-amber-400"
        }`}
      >
        ★
      </button>
```

- [ ] **Step 2: Modificar `components/admin/SortableRow.tsx`** — agregar `onDestacado: () => void;` a su interfaz `Props` (el spread `{...acciones}` ya lo reenvía a `ProductRow` sin más cambios):

```tsx
interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
  onDestacado: () => void;
}
```

- [ ] **Step 3: Modificar `app/admin/page.tsx`** — agregar handler después de `borrar` (mismo patrón optimista):

```tsx
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
```

Y en el render, agregar la prop al `<SortableRow>`:

```tsx
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
```

- [ ] **Step 4: Modificar `components/admin/ProductForm.tsx`** — estado nuevo después de `estado`:

```tsx
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
```

En `onSubmit`, agregar `destacado,` al objeto `datos` (después de `precio: precioNumero,`). En el JSX, insertar entre el `<label>` de Estado y el de Imagen:

```tsx
        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={destacado}
            onChange={(e) => setDestacado(e.target.checked)}
            className="h-4 w-4 accent-rosea-400"
          />
          Destacado
        </label>
```

- [ ] **Step 5: Verificar suite completa y build**

Run: `npm run test`
Expected: PASS (13 tests).

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Smoke test manual** — con `npm run dev` y la migración 002 ya corrida en Supabase: marcar un producto con la estrella en `/admin`, refrescar la landing y confirmar que aparece en el marquee deslizándose; desmarcarlo y confirmar que desaparece (la sección se oculta si queda vacía). Verificar checkbox en crear/editar.

- [ ] **Step 7: Commit**

```bash
git add components/admin app/admin/page.tsx
git commit -m "feat: toggle destacado con estrella en lista y checkbox en form"
```

# Rosea Beauty — Landing Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Landing catalog animada (parallax, scroll-reveal, filtros) + panel admin CRUD para Rosea Beauty, con Supabase como backend.

**Architecture:** Next.js 15 App Router. Landing = server component con ISR (60s) que lee Supabase y pasa datos a componentes client animados con Framer Motion. Admin = ruta `/admin` client-side protegida por middleware + Supabase Auth; escritura protegida por RLS. Lógica pura (filtros, orden, config) en `lib/` con tests vitest.

**Tech Stack:** Next.js 15 (TypeScript), Tailwind CSS v4, Supabase (`@supabase/supabase-js` + `@supabase/ssr`), Framer Motion, @dnd-kit, vitest.

**Spec:** `docs/superpowers/specs/2026-07-22-catalogo-rb-design.md`

## Global Constraints

- Directorio raíz del proyecto = raíz del repo: `C:\Users\Alejo\OneDrive\Escritorio\Catalogo RB` (en bash: `/c/Users/Alejo/OneDrive/Escritorio/Catalogo RB`).
- UI en español. Sin carrito ni checkout.
- Paleta exacta: `#faf1ef` (rosea-50, derivado claro), `#edc7c0` (rosea-100), `#e0a89f` (rosea-200), `#d5998f` (rosea-300), `#cd8e84` (rosea-400), `#bd7c72` (rosea-500), `#8f5a52` (rosea-700, derivado oscuro para texto).
- Categorías fijas — Maquillajes: `Bases & Correctores`, `Sombras & Delineadores`, `Labiales`. Skincare: `Limpiadoras`, `Hidratantes`, `Serums & Tratamientos`.
- Estados fijos: `Disponible`, `Por Encargo`, `Sin stock`.
- Fuentes: Cormorant Garamond (serif, títulos) + Jost (sans, cuerpo) vía `next/font`.
- La app debe compilar (`npm run build`) y testear (`npm run test`) sin Supabase configurado: fetch server-side devuelve `[]` si faltan env vars.
- Alias de imports: `@/*` = raíz del proyecto.
- Commits frecuentes, mensajes en español estilo `feat:`/`chore:`/`test:`.

---

### Task 1: Scaffold Next.js + dependencias + branding

**Files:**
- Create: proyecto Next.js completo en raíz (via create-next-app), `vitest.config.ts`, `public/brand/caligrafia.svg`, `public/brand/monogram.svg`, `app/icon.svg`
- Modify: `package.json` (script test), `next.config.ts`

**Interfaces:**
- Produces: proyecto compilable, alias `@/*`, Tailwind v4, deps instaladas: `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `vitest` (dev). SVGs en `public/brand/`.

- [ ] **Step 1: Scaffold en subcarpeta temporal y mover a raíz** (create-next-app no scaffoldea en carpeta no vacía; detecta repo git padre y no crea `.git` propio)

```bash
cd "/c/Users/Alejo/OneDrive/Escritorio/Catalogo RB"
npx create-next-app@latest tmp-app --typescript --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
shopt -s dotglob
mv tmp-app/* .
rmdir tmp-app
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm i @supabase/supabase-js @supabase/ssr framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm i -D vitest
```

- [ ] **Step 3: Copiar SVGs de marca y favicon**

```bash
mkdir -p public/brand
cp "/c/Users/Alejo/Downloads/Rosea Beauty Caligrafia.svg" public/brand/caligrafia.svg
cp "/c/Users/Alejo/Downloads/RB Monogram.svg" public/brand/monogram.svg
cp public/brand/monogram.svg app/icon.svg
rm -f app/favicon.ico
```

- [ ] **Step 4: Configurar `next.config.ts`** (reemplazar contenido)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 6: Agregar script test a `package.json`** — en `"scripts"` agregar `"test": "vitest run"`.

- [ ] **Step 7: Verificar build**

Run: `npm run build`
Expected: build exitoso (página default de create-next-app).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + deps + branding SVGs"
```

---

### Task 2: Config, tipos y lógica de catálogo (TDD)

**Files:**
- Create: `lib/types.ts`, `lib/config.ts`, `lib/catalog.ts`, `lib/orden.ts`
- Test: `tests/config.test.ts`, `tests/catalog.test.ts`

**Interfaces:**
- Produces:
  - `lib/types.ts`: `type Categoria = 'Maquillajes' | 'Skincare'`; `type Estado = 'Disponible' | 'Por Encargo' | 'Sin stock'`; `interface Producto { id: string; nombre: string; descripcion_corta: string | null; imagen_url: string | null; categoria: Categoria; subcategoria: string; estado: Estado; orden_display: number; created_at: string }`; `const CATEGORIAS: Categoria[]`; `const ESTADOS: Estado[]`; `const SUBCATEGORIAS: Record<Categoria, string[]>`.
  - `lib/config.ts`: objeto `config` (marca, tagline, whatsapp {numero, mensaje}, instagram, email, notaPorEncargo) y `whatsappUrl(): string`.
  - `lib/catalog.ts`: `ordenarProductos(ps: Producto[]): Producto[]`; `filtrarProductos(ps: Producto[], c: Categoria | null, s: string | null): Producto[]`; `productosPorEncargo(ps: Producto[]): Producto[]`; `agruparPorSubcategoria(ps: Producto[], c: Categoria): Record<string, Producto[]>`.
  - `lib/orden.ts`: `conOrden(ps: Producto[]): { id: string; orden_display: number }[]`.

- [ ] **Step 1: Crear `lib/types.ts`**

```ts
export type Categoria = "Maquillajes" | "Skincare";
export type Estado = "Disponible" | "Por Encargo" | "Sin stock";

export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: Categoria;
  subcategoria: string;
  estado: Estado;
  orden_display: number;
  created_at: string;
}

export const CATEGORIAS: Categoria[] = ["Maquillajes", "Skincare"];

export const ESTADOS: Estado[] = ["Disponible", "Por Encargo", "Sin stock"];

export const SUBCATEGORIAS: Record<Categoria, string[]> = {
  Maquillajes: ["Bases & Correctores", "Sombras & Delineadores", "Labiales"],
  Skincare: ["Limpiadoras", "Hidratantes", "Serums & Tratamientos"],
};
```

- [ ] **Step 2: Escribir tests que fallan** — `tests/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { config, whatsappUrl } from "@/lib/config";

describe("whatsappUrl", () => {
  it("arma url sin numero", () => {
    config.whatsapp.numero = "";
    config.whatsapp.mensaje = "Hola, tengo una consulta";
    expect(whatsappUrl()).toBe(
      "https://wa.me/?text=Hola%2C%20tengo%20una%20consulta"
    );
  });

  it("arma url con numero", () => {
    config.whatsapp.numero = "5491112345678";
    config.whatsapp.mensaje = "Hola";
    expect(whatsappUrl()).toBe("https://wa.me/5491112345678?text=Hola");
  });
});
```

`tests/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  agruparPorSubcategoria,
  filtrarProductos,
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
    orden_display: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("ordenarProductos", () => {
  it("ordena por orden_display y luego created_at", () => {
    const a = producto({ orden_display: 2 });
    const b = producto({ orden_display: 1, created_at: "2026-01-02T00:00:00Z" });
    const c = producto({ orden_display: 1, created_at: "2026-01-01T00:00:00Z" });
    expect(ordenarProductos([a, b, c]).map((p) => p.id)).toEqual([
      c.id,
      b.id,
      a.id,
    ]);
  });
});

describe("filtrarProductos", () => {
  const ps = [
    producto({ categoria: "Maquillajes", subcategoria: "Labiales" }),
    producto({ categoria: "Skincare", subcategoria: "Hidratantes" }),
  ];
  it("sin filtros devuelve todo", () => {
    expect(filtrarProductos(ps, null, null)).toHaveLength(2);
  });
  it("filtra por categoria", () => {
    expect(filtrarProductos(ps, "Skincare", null)).toHaveLength(1);
  });
  it("filtra por subcategoria", () => {
    expect(filtrarProductos(ps, "Maquillajes", "Labiales")).toHaveLength(1);
    expect(filtrarProductos(ps, "Maquillajes", "Bases & Correctores")).toHaveLength(0);
  });
});

describe("productosPorEncargo", () => {
  it("devuelve solo estado Por Encargo", () => {
    const ps = [producto(), producto({ estado: "Por Encargo" })];
    expect(productosPorEncargo(ps)).toHaveLength(1);
  });
});

describe("agruparPorSubcategoria", () => {
  it("agrupa con todas las subcategorias presentes", () => {
    const ps = [producto({ subcategoria: "Labiales", orden_display: 1 })];
    const grupos = agruparPorSubcategoria(ps, "Maquillajes");
    expect(Object.keys(grupos)).toEqual([
      "Bases & Correctores",
      "Sombras & Delineadores",
      "Labiales",
    ]);
    expect(grupos["Labiales"]).toHaveLength(1);
    expect(grupos["Bases & Correctores"]).toHaveLength(0);
  });
});

describe("conOrden", () => {
  it("asigna orden secuencial", () => {
    const ps = [producto(), producto()];
    expect(conOrden(ps)).toEqual([
      { id: ps[0].id, orden_display: 0 },
      { id: ps[1].id, orden_display: 1 },
    ]);
  });
});
```

- [ ] **Step 3: Correr tests, verificar que fallan**

Run: `npm run test`
Expected: FAIL (módulos `@/lib/config`, `@/lib/catalog`, `@/lib/orden` no existen).

- [ ] **Step 4: Implementar `lib/config.ts`**

```ts
export const config = {
  marca: "Rosea Beauty",
  tagline: "Belleza importada, elegida para vos",
  whatsapp: {
    // Codigo de pais + numero, sin "+" ni espacios. Ej: "5491112345678"
    numero: "",
    mensaje: "Hola, tengo una consulta",
  },
  instagram: "https://instagram.com/",
  email: "contacto@roseabeauty.com",
  notaPorEncargo:
    "Los productos por encargo se piden al momento y llegan en 15 a 20 días.",
};

export function whatsappUrl(): string {
  const { numero, mensaje } = config.whatsapp;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
```

- [ ] **Step 5: Implementar `lib/catalog.ts`**

```ts
import type { Categoria, Producto } from "./types";
import { SUBCATEGORIAS } from "./types";

export function ordenarProductos(productos: Producto[]): Producto[] {
  return [...productos].sort(
    (a, b) =>
      a.orden_display - b.orden_display ||
      a.created_at.localeCompare(b.created_at)
  );
}

export function filtrarProductos(
  productos: Producto[],
  categoria: Categoria | null,
  subcategoria: string | null
): Producto[] {
  return productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!subcategoria || p.subcategoria === subcategoria)
  );
}

export function productosPorEncargo(productos: Producto[]): Producto[] {
  return productos.filter((p) => p.estado === "Por Encargo");
}

export function agruparPorSubcategoria(
  productos: Producto[],
  categoria: Categoria
): Record<string, Producto[]> {
  const grupos: Record<string, Producto[]> = {};
  for (const sub of SUBCATEGORIAS[categoria]) {
    grupos[sub] = ordenarProductos(
      productos.filter(
        (p) => p.categoria === categoria && p.subcategoria === sub
      )
    );
  }
  return grupos;
}
```

- [ ] **Step 6: Implementar `lib/orden.ts`**

```ts
import type { Producto } from "./types";

export function conOrden(
  productos: Producto[]
): { id: string; orden_display: number }[] {
  return productos.map((p, i) => ({ id: p.id, orden_display: i }));
}
```

- [ ] **Step 7: Correr tests, verificar que pasan**

Run: `npm run test`
Expected: PASS (todos).

- [ ] **Step 8: Commit**

```bash
git add lib tests
git commit -m "feat: tipos, config y logica de catalogo con tests"
```

---

### Task 3: SQL — schema, RLS y seed

**Files:**
- Create: `supabase/schema.sql`, `supabase/seed.sql`

**Interfaces:**
- Produces: scripts que el usuario corre en Supabase SQL Editor. Tabla `public.productos`, bucket `productos-img`, políticas RLS (lectura pública, escritura autenticada). Seed con 14 productos.

- [ ] **Step 1: Crear `supabase/schema.sql`**

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

-- RLS: lectura publica, escritura solo autenticados
alter table public.productos enable row level security;

create policy "lectura publica" on public.productos
  for select using (true);

create policy "insert autenticado" on public.productos
  for insert to authenticated with check (true);

create policy "update autenticado" on public.productos
  for update to authenticated using (true);

create policy "delete autenticado" on public.productos
  for delete to authenticated using (true);

-- Bucket de imagenes: lectura publica, escritura autenticada
insert into storage.buckets (id, name, public)
values ('productos-img', 'productos-img', true);

create policy "img lectura publica" on storage.objects
  for select using (bucket_id = 'productos-img');

create policy "img insert autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos-img');

create policy "img update autenticado" on storage.objects
  for update to authenticated using (bucket_id = 'productos-img');

create policy "img delete autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'productos-img');
```

- [ ] **Step 2: Crear `supabase/seed.sql`** (14 productos, estados mezclados, imágenes Unsplash)

```sql
insert into public.productos
  (nombre, descripcion_corta, imagen_url, categoria, subcategoria, estado, orden_display)
values
  ('Base Líquida Matte', 'Cobertura media a alta con acabado mate natural que dura todo el día.', 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 0),
  ('Corrector Alta Cobertura', 'Cubre ojeras e imperfecciones sin marcar líneas. Fórmula cremosa.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 1),
  ('Base Serum Glow', 'Base híbrida con skincare: luminosidad y cobertura ligera.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Por Encargo', 2),
  ('Paleta Sombras Nude', '12 tonos tierra mate y shimmer de alta pigmentación.', 'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Disponible', 0),
  ('Delineador Líquido Precision', 'Punta ultra fina para un trazo intenso de larga duración.', 'https://images.unsplash.com/photo-1631214540242-6b5b0e0e0b0e?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Sombras & Delineadores', 'Sin stock', 1),
  ('Labial Mate Velvet', 'Color intenso con textura aterciopelada que no reseca.', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Disponible', 0),
  ('Gloss Hidratante Shine', 'Brillo espejo con ácido hialurónico. Efecto labios más llenos.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Labiales', 'Por Encargo', 1),
  ('Espuma Limpiadora Suave', 'Limpia sin resecar. Ideal para uso diario, todo tipo de piel.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 0),
  ('Agua Micelar Rosas', 'Desmaquilla y tonifica en un solo paso. Con agua de rosas.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Disponible', 1),
  ('Bálsamo Desmaquillante', 'Derrite el maquillaje resistente al agua. Textura sorbete.', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Limpiadoras', 'Por Encargo', 2),
  ('Crema Hidratante Ligera', 'Gel-crema con niacinamida. Hidratación 24hs sin sensación grasa.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Disponible', 0),
  ('Crema Nutritiva Noche', 'Repara la barrera de la piel mientras dormís. Con ceramidas.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Hidratantes', 'Sin stock', 1),
  ('Serum Vitamina C', 'Ilumina y unifica el tono. Antioxidante de uso diario.', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Disponible', 0),
  ('Serum Ácido Hialurónico', 'Hidratación profunda multicapa. Piel más lisa al instante.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', 'Skincare', 'Serums & Tratamientos', 'Por Encargo', 1),
  ('Rubor Cremoso Rosé', 'Acabado natural que se funde con la piel. Tono rosa empolvado.', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=80', 'Maquillajes', 'Bases & Correctores', 'Disponible', 3);
```

Nota: URLs de Unsplash son placeholders — si alguna devuelve 404, la card muestra fondo rosa pálido (fallback ya contemplado en `ProductCard`). El usuario reemplaza imágenes desde el admin.

- [ ] **Step 3: Revisar consistencia** — verificar que categorías/subcategorías/estados en seed coinciden exactamente con los checks del schema y con `lib/types.ts` (a mano, sin correr nada).

- [ ] **Step 4: Commit**

```bash
git add supabase
git commit -m "feat: schema SQL con RLS, bucket y seed de 14 productos"
```

---

### Task 4: Clientes Supabase + middleware de protección

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`, `.env.example`
- Modify: `.gitignore` (asegurar `.env*.local` ignorado — create-next-app ya lo trae)

**Interfaces:**
- Consumes: `Producto`, `ordenarProductos` (Task 2).
- Produces:
  - `lib/supabase/client.ts`: `createClient(): SupabaseClient` (browser).
  - `lib/supabase/server.ts`: `obtenerProductos(): Promise<Producto[]>` — devuelve `[]` si faltan env vars o hay error.
  - `middleware.ts`: redirige `/admin/*` sin sesión a `/admin/login`; con sesión en `/admin/login` redirige a `/admin`.

- [ ] **Step 1: Crear `.env.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Crear `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Crear `lib/supabase/server.ts`**

```ts
import { createClient } from "@supabase/supabase-js";
import { ordenarProductos } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

// Lectura publica para la landing (sin cookies ni sesion).
// Devuelve [] si Supabase no esta configurado para que build/dev no fallen.
export async function obtenerProductos(): Promise<Producto[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.from("productos").select("*");
    if (error || !data) return [];
    return ordenarProductos(data as Producto[]);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Crear `middleware.ts`** (raíz del proyecto)

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/admin") && path !== "/admin/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/admin/login") {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase middleware.ts .env.example
git commit -m "feat: clientes Supabase y middleware de auth para /admin"
```

---

### Task 5: Layout global, estilos y fuentes

**Files:**
- Modify: `app/globals.css` (reemplazar), `app/layout.tsx` (reemplazar)

**Interfaces:**
- Consumes: `config` (Task 2).
- Produces: tokens Tailwind `rosea-50..700`, variables `--font-serif`/`--font-sans`, clases `font-serif`/`font-sans` funcionando. Metadata OG.

- [ ] **Step 1: Reemplazar `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-rosea-50: #faf1ef;
  --color-rosea-100: #edc7c0;
  --color-rosea-200: #e0a89f;
  --color-rosea-300: #d5998f;
  --color-rosea-400: #cd8e84;
  --color-rosea-500: #bd7c72;
  --color-rosea-700: #8f5a52;
  --font-serif: var(--font-cormorant), Georgia, serif;
  --font-sans: var(--font-jost), system-ui, sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  background: #ffffff;
  color: #262626;
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Reemplazar `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { config } from "@/lib/config";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: `${config.marca} — Maquillaje y Skincare importado`,
  description: config.tagline,
  openGraph: {
    title: config.marca,
    description: config.tagline,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: paleta rosea, fuentes y layout global"
```

---

### Task 6: Hero, Navbar, WhatsApp y Footer

**Files:**
- Create: `components/landing/Hero.tsx`, `components/landing/Navbar.tsx`, `components/landing/WhatsAppButton.tsx`, `components/landing/Footer.tsx`

**Interfaces:**
- Consumes: `config`, `whatsappUrl` (Task 2), tokens rosea (Task 5).
- Produces: componentes sin props (autocontenidos). Navbar emite `CustomEvent('rosea:set-filter', { detail: { categoria } })` en `window` — Task 7 lo escucha.

- [ ] **Step 1: Crear `components/landing/Hero.tsx`**

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { config } from "@/lib/config";

export default function Hero() {
  const { scrollY } = useScroll();
  const yBlob1 = useTransform(scrollY, [0, 600], [0, 150]);
  const yBlob2 = useTransform(scrollY, [0, 600], [0, -100]);
  const yLogo = useTransform(scrollY, [0, 600], [0, 80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      id="inicio"
      className="relative flex h-svh items-center justify-center overflow-hidden bg-gradient-to-b from-rosea-100 via-rosea-50 to-white"
    >
      {/* Blobs con parallax */}
      <motion.div
        style={{ y: yBlob1 }}
        className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-rosea-200/50 blur-3xl"
      />
      <motion.div
        style={{ y: yBlob2 }}
        className="absolute -right-20 bottom-24 h-[28rem] w-[28rem] rounded-full bg-rosea-300/40 blur-3xl"
      />

      <motion.div
        style={{ y: yLogo, opacity }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <Image
          src="/brand/caligrafia.svg"
          alt={config.marca}
          width={560}
          height={179}
          priority
          className="w-[min(80vw,560px)]"
        />
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 font-serif text-xl tracking-wide text-rosea-700 md:text-2xl"
        >
          {config.tagline}
        </motion.p>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.a
        href="#catalogo"
        aria-label="Ir al catálogo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-rosea-500"
      >
        <motion.svg
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.a>
    </section>
  );
}
```

- [ ] **Step 2: Crear `components/landing/Navbar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Categoria } from "@/lib/types";

const LINKS: { label: string; categoria: Categoria | null; href: string }[] = [
  { label: "Maquillajes", categoria: "Maquillajes", href: "#catalogo" },
  { label: "Skincare", categoria: "Skincare", href: "#catalogo" },
  { label: "Por Encargo", categoria: null, href: "#por-encargo" },
  { label: "Contacto", categoria: null, href: "#contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function clickLink(categoria: Categoria | null) {
    if (categoria) {
      window.dispatchEvent(
        new CustomEvent("rosea:set-filter", { detail: { categoria } })
      );
    }
    setOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/80 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#inicio" aria-label="Inicio">
          <Image src="/brand/monogram.svg" alt="RB" width={48} height={36} />
        </a>

        {/* Desktop */}
        <ul className="hidden gap-8 text-sm tracking-wide md:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={() => clickLink(l.categoria)}
                className="text-neutral-700 transition-colors hover:text-rosea-500"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburguesa mobile */}
        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
          className="text-neutral-700 md:hidden"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Panel mobile */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-white/95 backdrop-blur-md md:hidden"
          >
            {LINKS.map((l) => (
              <li key={l.label} className="border-t border-rosea-50">
                <a
                  href={l.href}
                  onClick={() => clickLink(l.categoria)}
                  className="block px-6 py-3 text-sm text-neutral-700"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
```

- [ ] **Step 3: Crear `components/landing/WhatsAppButton.tsx`**

```tsx
import { whatsappUrl } from "@/lib/config";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110 md:bottom-8 md:right-8 md:h-14 md:w-14"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/30 [animation-duration:2.5s]" />
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.05 31.31l6.128-1.96A15.9 15.9 0 0 0 16.004 32C24.83 32 32 24.822 32 16S24.83 0 16.004 0zm9.31 22.594c-.386 1.09-1.918 1.994-3.14 2.258-.836.178-1.928.32-5.604-1.204-4.702-1.948-7.73-6.726-7.966-7.036-.226-.31-1.9-2.53-1.9-4.826s1.166-3.414 1.634-3.892c.386-.394.928-.574 1.448-.574.168 0 .32.008.456.016.4.016.6.04.864.668.328.79 1.126 2.74 1.222 2.944.098.204.196.48.06.79-.128.318-.24.458-.444.694-.204.236-.398.416-.602.668-.186.22-.396.454-.162.86.234.4 1.042 1.718 2.232 2.776 1.536 1.368 2.782 1.804 3.232 1.99.336.14.736.106 1.006-.18.34-.368.762-.98 1.19-1.582.306-.432.692-.486 1.096-.334.412.144 2.604 1.228 3.052 1.452.448.226.744.336.852.522.108.19.108 1.086-.278 2.176z" />
      </svg>
    </a>
  );
}
```

- [ ] **Step 4: Crear `components/landing/Footer.tsx`**

```tsx
import Image from "next/image";
import { config } from "@/lib/config";

export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-rosea-100 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <Image src="/brand/monogram.svg" alt="RB" width={64} height={48} />
        <div className="flex gap-6 text-sm text-neutral-500">
          <a
            href={config.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-rosea-500"
          >
            Instagram
          </a>
          <a
            href={`mailto:${config.email}`}
            className="transition-colors hover:text-rosea-500"
          >
            {config.email}
          </a>
        </div>
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} {config.marca}. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Verificar build** (componentes aún no montados en page — build igual chequea tipos)

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/landing
git commit -m "feat: Hero con parallax, Navbar, boton WhatsApp y Footer"
```

---

### Task 7: Catálogo — cards, filtros, secciones y page

**Files:**
- Create: `components/landing/ProductCard.tsx`, `components/landing/FilterBar.tsx`, `components/landing/CatalogSection.tsx`, `components/landing/PorEncargoSection.tsx`
- Modify: `app/page.tsx` (reemplazar)

**Interfaces:**
- Consumes: `Producto`, `Categoria`, `SUBCATEGORIAS`, `filtrarProductos`, `productosPorEncargo`, `config` (Task 2); `obtenerProductos` (Task 4); Hero/Navbar/Footer/WhatsAppButton (Task 6); evento `rosea:set-filter` (Task 6).
- Produces:
  - `ProductCard({ producto: Producto; index?: number })` — Tasks 7 (grid) y reuso en PorEncargo.
  - `FilterBar({ categoria, subcategoria, onCategoria, onSubcategoria })`.
  - `CatalogSection({ productos: Producto[] })`, `PorEncargoSection({ productos: Producto[] })`.

- [ ] **Step 1: Crear `components/landing/ProductCard.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Producto } from "@/lib/types";

const BADGE: Record<Producto["estado"], string> = {
  Disponible: "bg-emerald-100 text-emerald-700",
  "Por Encargo": "bg-amber-100 text-amber-800",
  "Sin stock": "bg-neutral-200 text-neutral-500",
};

export default function ProductCard({
  producto,
  index = 0,
}: {
  producto: Producto;
  index?: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        delay: (index % 4) * 0.06,
      }}
      className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-rosea-100/60 transition-shadow hover:shadow-xl hover:shadow-rosea-200/40"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-rosea-50">
        {producto.imagen_url && (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              producto.estado === "Sin stock" ? "opacity-80 saturate-50" : ""
            }`}
          />
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${BADGE[producto.estado]}`}
        >
          {producto.estado}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-neutral-900">
          {producto.nombre}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          {producto.descripcion_corta}
        </p>
      </div>
    </motion.article>
  );
}
```

- [ ] **Step 2: Crear `components/landing/FilterBar.tsx`**

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Categoria } from "@/lib/types";
import { SUBCATEGORIAS } from "@/lib/types";

interface Props {
  categoria: Categoria | null;
  subcategoria: string | null;
  onCategoria: (c: Categoria | null) => void;
  onSubcategoria: (s: string | null) => void;
}

const OPCIONES: (Categoria | null)[] = [null, "Maquillajes", "Skincare"];

export default function FilterBar({
  categoria,
  subcategoria,
  onCategoria,
  onSubcategoria,
}: Props) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {OPCIONES.map((c) => {
          const activo = categoria === c;
          return (
            <button
              key={c ?? "todos"}
              onClick={() => onCategoria(c)}
              className={`rounded-full px-5 py-2 text-sm tracking-wide transition-colors ${
                activo
                  ? "bg-rosea-400 text-white"
                  : "bg-rosea-50 text-neutral-600 hover:bg-rosea-100"
              }`}
            >
              {c ?? "Todos"}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {categoria && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {SUBCATEGORIAS[categoria].map((s) => {
              const activo = subcategoria === s;
              return (
                <button
                  key={s}
                  onClick={() => onSubcategoria(activo ? null : s)}
                  className={`rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors ${
                    activo
                      ? "bg-rosea-400 text-white"
                      : "bg-white text-neutral-500 ring-1 ring-rosea-200 hover:bg-rosea-50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Crear `components/landing/CatalogSection.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Categoria, Producto } from "@/lib/types";
import { filtrarProductos } from "@/lib/catalog";
import FilterBar from "./FilterBar";
import ProductCard from "./ProductCard";

export default function CatalogSection({
  productos,
}: {
  productos: Producto[];
}) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(null);

  // La Navbar emite este evento al clickear Maquillajes/Skincare
  useEffect(() => {
    function onSetFilter(e: Event) {
      const detail = (e as CustomEvent).detail as {
        categoria: Categoria | null;
      };
      setCategoria(detail.categoria);
      setSubcategoria(null);
    }
    window.addEventListener("rosea:set-filter", onSetFilter);
    return () => window.removeEventListener("rosea:set-filter", onSetFilter);
  }, []);

  const visibles = filtrarProductos(productos, categoria, subcategoria);

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center font-serif text-4xl text-rosea-700 md:text-5xl"
      >
        Catálogo
      </motion.h2>

      <FilterBar
        categoria={categoria}
        subcategoria={subcategoria}
        onCategoria={(c) => {
          setCategoria(c);
          setSubcategoria(null);
        }}
        onSubcategoria={setSubcategoria}
      />

      <motion.div
        layout
        className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {visibles.map((p, i) => (
            <ProductCard key={p.id} producto={p} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {visibles.length === 0 && (
        <p className="mt-10 text-center text-neutral-400">
          No hay productos en esta categoría todavía.
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Crear `components/landing/PorEncargoSection.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import type { Producto } from "@/lib/types";
import { productosPorEncargo } from "@/lib/catalog";
import { config } from "@/lib/config";
import ProductCard from "./ProductCard";

export default function PorEncargoSection({
  productos,
}: {
  productos: Producto[];
}) {
  const items = productosPorEncargo(productos);
  if (items.length === 0) return null;

  return (
    <section id="por-encargo" className="bg-rosea-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-serif text-4xl text-rosea-700 md:text-5xl"
        >
          Productos por Encargo
        </motion.h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          {config.notaPorEncargo}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} producto={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Reemplazar `app/page.tsx`**

```tsx
import CatalogSection from "@/components/landing/CatalogSection";
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
      <CatalogSection productos={productos} />
      <PorEncargoSection productos={productos} />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
```

- [ ] **Step 6: Verificar build + smoke test dev**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev` (background) y abrir `http://localhost:3000`.
Expected: hero con logo + tagline, indicador scroll, navbar cambia con scroll, catálogo vacío muestra "No hay productos..." (sin Supabase aún), footer y botón WhatsApp visibles.

- [ ] **Step 7: Commit**

```bash
git add components/landing app/page.tsx
git commit -m "feat: catalogo con filtros animados, seccion por encargo y landing completa"
```

---

### Task 8: Admin — login, logout y protección

**Files:**
- Create: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `createClient` (Task 4, browser), middleware (Task 4).
- Produces: página `/admin/login`. Redirect a `/admin` post-login.

- [ ] **Step 1: Crear `app/admin/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Credenciales inválidas");
      setCargando(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-rosea-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-rosea-100"
      >
        <div className="flex flex-col items-center gap-2">
          <Image src="/brand/monogram.svg" alt="RB" width={72} height={54} />
          <h1 className="font-serif text-2xl text-rosea-700">Panel Admin</h1>
        </div>

        <label className="mt-6 block text-sm text-neutral-600">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        <label className="mt-4 block text-sm text-neutral-600">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-rosea-300"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="mt-6 w-full rounded-full bg-rosea-400 py-2.5 text-sm text-white transition-colors hover:bg-rosea-500 disabled:opacity-50"
        >
          {cargando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: PASS. Ruta `/admin/login` listada.

- [ ] **Step 3: Commit**

```bash
git add app/admin
git commit -m "feat: login de admin con Supabase Auth"
```

---

### Task 9: Admin — CRUD completo con upload de imagen

**Files:**
- Create: `lib/db.ts`, `lib/imagen.ts`, `components/admin/ProductRow.tsx`, `components/admin/ProductForm.tsx`, `app/admin/page.tsx`

**Interfaces:**
- Consumes: `createClient` (Task 4), `Producto`/`CATEGORIAS`/`ESTADOS`/`SUBCATEGORIAS` (Task 2), `agruparPorSubcategoria`/`ordenarProductos` (Task 2).
- Produces:
  - `lib/db.ts`: `listarProductos(): Promise<Producto[]>`; `crearProducto(p: Omit<Producto, "id" | "created_at">): Promise<void>`; `actualizarProducto(id: string, p: Partial<Omit<Producto, "id" | "created_at">>): Promise<void>`; `eliminarProducto(id: string): Promise<void>`; `guardarOrden(items: { id: string; orden_display: number }[]): Promise<void>`; `subirImagen(blob: Blob, nombre: string): Promise<string>`.
  - `lib/imagen.ts`: `comprimirImagen(file: File, maxDim?: number): Promise<Blob>` (webp, default 800px).
  - `ProductRow({ producto, onEstado, onEditar, onBorrar, dragHandle? })` — root `<div>` (para envolver con sortable en Task 10).
  - `ProductForm({ producto: Producto | null, onClose, onSaved })` — modal crear/editar.

- [ ] **Step 1: Crear `lib/db.ts`**

```ts
import { createClient } from "@/lib/supabase/client";
import { ordenarProductos } from "@/lib/catalog";
import type { Producto } from "@/lib/types";

type ProductoNuevo = Omit<Producto, "id" | "created_at">;

export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await createClient().from("productos").select("*");
  if (error) throw error;
  return ordenarProductos((data ?? []) as Producto[]);
}

export async function crearProducto(p: ProductoNuevo): Promise<void> {
  const { error } = await createClient().from("productos").insert(p);
  if (error) throw error;
}

export async function actualizarProducto(
  id: string,
  p: Partial<ProductoNuevo>
): Promise<void> {
  const { error } = await createClient()
    .from("productos")
    .update(p)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarProducto(id: string): Promise<void> {
  const { error } = await createClient()
    .from("productos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function guardarOrden(
  items: { id: string; orden_display: number }[]
): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    items.map(({ id, orden_display }) =>
      supabase.from("productos").update({ orden_display }).eq("id", id)
    )
  );
}

export async function subirImagen(blob: Blob, nombre: string): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("productos-img")
    .upload(nombre, blob, { contentType: "image/webp" });
  if (error) throw error;
  return supabase.storage.from("productos-img").getPublicUrl(nombre).data
    .publicUrl;
}
```

- [ ] **Step 2: Crear `lib/imagen.ts`**

```ts
// Comprime una imagen en el browser: resize a maxDim y convierte a webp.
export async function comprimirImagen(
  file: File,
  maxDim = 800
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compresión falló"))),
      "image/webp",
      0.85
    );
  });
}
```

- [ ] **Step 3: Crear `components/admin/ProductRow.tsx`**

```tsx
"use client";

import Image from "next/image";
import type { Estado, Producto } from "@/lib/types";
import { ESTADOS } from "@/lib/types";

interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
  dragHandle?: React.ReactNode;
}

export default function ProductRow({
  producto,
  onEstado,
  onEditar,
  onBorrar,
  dragHandle,
}: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-rosea-100/60">
      {dragHandle}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-rosea-50">
        {producto.imagen_url && (
          <Image
            src={producto.imagen_url}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <span className="flex-1 truncate text-sm">{producto.nombre}</span>
      <select
        value={producto.estado}
        onChange={(e) => onEstado(e.target.value as Estado)}
        className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
      >
        {ESTADOS.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <button
        onClick={onEditar}
        className="px-2 text-xs text-rosea-500 hover:underline"
      >
        Editar
      </button>
      <button
        onClick={onBorrar}
        className="px-2 text-xs text-red-400 hover:underline"
      >
        Eliminar
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Crear `components/admin/ProductForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Categoria, Estado, Producto } from "@/lib/types";
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
  const [descripcion, setDescripcion] = useState(
    producto?.descripcion_corta ?? ""
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
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
          Descripción corta ({descripcion.length}/150)
          <textarea
            value={descripcion}
            maxLength={150}
            rows={3}
            onChange={(e) => setDescripcion(e.target.value)}
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
```

Nota: preview usa `<img>` nativo porque la URL puede ser `blob:` (no soportada por `next/image`).

- [ ] **Step 5: Crear `app/admin/page.tsx`**

```tsx
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
```

- [ ] **Step 6: Verificar build**

Run: `npm run build`
Expected: PASS. Rutas `/admin` y `/admin/login` listadas.

- [ ] **Step 7: Commit**

```bash
git add lib/db.ts lib/imagen.ts components/admin app/admin/page.tsx
git commit -m "feat: panel admin con CRUD, toggle de estado y upload de imagen"
```

---

### Task 10: Admin — drag & drop para reordenar

**Files:**
- Create: `components/admin/SortableRow.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `ProductRow` con prop `dragHandle` (Task 9), `conOrden` (Task 2), `guardarOrden` (Task 9), `agruparPorSubcategoria` (Task 2), `@dnd-kit`.
- Produces: `SortableRow({ producto, onEstado, onEditar, onBorrar })` — reorden persiste en `orden_display`.

- [ ] **Step 1: Crear `components/admin/SortableRow.tsx`**

```tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Estado, Producto } from "@/lib/types";
import ProductRow from "./ProductRow";

interface Props {
  producto: Producto;
  onEstado: (e: Estado) => void;
  onEditar: () => void;
  onBorrar: () => void;
}

export default function SortableRow({ producto, ...acciones }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: producto.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60" : ""}
    >
      <ProductRow
        producto={producto}
        {...acciones}
        dragHandle={
          <button
            type="button"
            aria-label="Reordenar"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none px-1 text-neutral-300 hover:text-neutral-500"
          >
            ⠿
          </button>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Modificar `app/admin/page.tsx`** — agregar imports:

```tsx
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
import type { Categoria } from "@/lib/types";
import { conOrden } from "@/lib/orden";
import { guardarOrden } from "@/lib/db";
import SortableRow from "@/components/admin/SortableRow";
```

(`guardarOrden` se suma al import existente de `@/lib/db`; `Categoria` al de `@/lib/types`; `ProductRow` deja de importarse si ya no se usa directo.)

Agregar handler dentro de `AdminPage`:

```tsx
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
      setProductos((prev) =>
        prev.map((p) => {
          const o = orden.find((x) => x.id === p.id);
          return o ? { ...p, orden_display: o.orden_display } : p;
        })
      );
      await guardarOrden(orden);
    };
  }
```

Reemplazar el bloque de render de cada grupo (el `div.mt-2.space-y-2` con sus `ProductRow`) por:

```tsx
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
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/admin/SortableRow.tsx app/admin/page.tsx
git commit -m "feat: drag and drop para reordenar productos por subcategoria"
```

---

### Task 11: README + verificación final

**Files:**
- Create: `README.md` (reemplazar el de create-next-app)
- Modify: ninguno más

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: documentación de setup completo (Supabase, Vercel, branding).

- [ ] **Step 1: Reemplazar `README.md`**

````markdown
# Rosea Beauty — Landing Catalog

Landing catalog + panel admin para maquillaje y skincare importado.
Next.js 15 · Tailwind v4 · Supabase · Framer Motion.

## Setup local

```bash
npm install
cp .env.example .env.local   # completar con datos de Supabase
npm run dev
```

## Configurar Supabase (una sola vez)

1. Crear proyecto en [supabase.com](https://supabase.com) (free tier).
2. En **SQL Editor**, correr `supabase/schema.sql` y después `supabase/seed.sql`.
3. En **Authentication → Users**, crear el usuario admin (email + password). Desactivar signups en **Authentication → Sign In / Up** si está habilitado.
4. En **Project Settings → API**, copiar `URL` y `anon public key` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Deploy en Vercel

1. Subir el repo a GitHub.
2. En [vercel.com](https://vercel.com): **New Project** → importar el repo.
3. Agregar las dos env vars de arriba.
4. Deploy. Cada push a `main` redeploya solo.

## Personalizar (sin tocar componentes)

- **WhatsApp, tagline, Instagram, email, nota por encargo** → `lib/config.ts`.
  - Número WhatsApp: código de país + número, sin `+` ni espacios. Ej: `5491112345678`.
- **Paleta de colores** → `app/globals.css` (`@theme`, tokens `--color-rosea-*`).
- **Logos** → `public/brand/caligrafia.svg` (hero) y `public/brand/monogram.svg` (navbar/footer). Favicon: `app/icon.svg`.
- **Fuentes** → `app/layout.tsx` (`next/font`).
- **Productos** → todo desde `/admin` (crear, editar, eliminar, reordenar con drag & drop, cambiar estado, subir fotos).

## Estructura

- `app/page.tsx` — landing (ISR 60s)
- `app/admin` — panel admin (protegido por Supabase Auth)
- `components/landing`, `components/admin` — UI
- `lib/` — config, tipos, lógica, clientes Supabase
- `supabase/` — schema + seed SQL
- `tests/` — tests de lógica (`npm run test`)
````

- [ ] **Step 2: Verificación completa**

Run: `npm run test`
Expected: PASS (todos los tests).

Run: `npm run build`
Expected: PASS sin warnings de tipos.

- [ ] **Step 3: Smoke test manual con dev server**

Run: `npm run dev` (background), abrir `http://localhost:3000`:
- Hero: logo caligrafía + tagline + parallax al scrollear.
- Navbar: transparente arriba, blur al scrollear; hamburguesa en mobile (probar con viewport 375px).
- Catálogo: sin Supabase muestra estado vacío; con Supabase muestra seed con filtros animados.
- Botón WhatsApp fijo abajo-derecha.
- `/admin` redirige a `/admin/login` sin sesión.

- [ ] **Step 4: Commit final**

```bash
git add README.md
git commit -m "docs: README con setup de Supabase, Vercel y personalizacion"
```

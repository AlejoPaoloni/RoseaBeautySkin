# Spec — Rosea Beauty: Landing Catalog + Panel Admin

**Fecha:** 2026-07-22
**Proyecto:** Landing catalog para emprendimiento de maquillaje y skincare importado ("Rosea Beauty").
**Carpeta:** `C:\Users\Alejo\OneDrive\Escritorio\Catalogo RB` (repo git propio, independiente del repo Escritorio).

## Decisiones tomadas

- Proyecto Supabase **nuevo e independiente** (no comparte nada con "Rouse Beauty Hub").
- Auth admin: **Supabase Auth email+password**, sin registro público, escritura protegida por RLS.
- Alcance admin **V1 enfocada**: CRUD + upload imagen + toggle estado + drag & drop. CSV export/import y preview live quedan para fase 2 (fuera de esta spec).
- Tagline placeholder: *"Belleza importada, elegida para vos"* (editable en config).
- Sin carrito ni checkout. Contacto por WhatsApp.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (Postgres + Auth + Storage, free tier)
- Framer Motion (animaciones, parallax)
- @dnd-kit (drag & drop admin)
- Deploy: Vercel (auto-deploy por push a GitHub)

## Branding

- Paleta (de clara a oscura): `#edc7c0`, `#e0a89f`, `#d5998f`, `#cd8e84`, `#bd7c72`.
- Logos SVG provistos (copiar a `public/brand/`):
  - `Rosea Beauty Caligrafia.svg` (wordmark caligráfico con gradiente) — hero.
  - `RB Monogram.svg` (monograma RB) — navbar, footer, favicon.
- Tipografía: Cormorant Garamond (títulos, serif) + Jost (cuerpo, sans). Via `next/font`.
- Badges estado: Disponible = verde suave, Por Encargo = dorado/ámbar, Sin stock = gris.
- WhatsApp: verde estándar (#25D366).

## Estructura de archivos

```
catalogo-rb/
├─ app/
│  ├─ page.tsx              → Landing (server component, ISR revalidate 60s)
│  ├─ layout.tsx            → Fonts, metadata, OG tags
│  ├─ admin/
│  │  ├─ login/page.tsx     → Login
│  │  └─ page.tsx           → Panel admin (client, protegido)
├─ components/
│  ├─ landing/  → Hero, Navbar, FilterBar, CatalogGrid, ProductCard,
│  │             PorEncargoSection, Footer, WhatsAppButton
│  └─ admin/    → ProductList (dnd), ProductForm, StatusToggle, ImageUpload
├─ lib/
│  ├─ supabase/ → client browser, client server, types
│  └─ config.ts → tagline, número WhatsApp, redes, email (único lugar a editar)
├─ supabase/
│  ├─ schema.sql → tabla + RLS + bucket
│  └─ seed.sql   → ~14 productos ejemplo
├─ public/brand/ → SVGs logo
└─ README.md     → setup Supabase, Vercel, branding
```

## Base de datos

Tabla `productos`:

```sql
id uuid primary key default gen_random_uuid()
nombre text not null
descripcion_corta varchar(150)
imagen_url text
categoria text not null check (categoria in ('Maquillajes','Skincare'))
subcategoria text not null check (subcategoria in (
  'Bases & Correctores','Sombras & Delineadores','Labiales',
  'Limpiadoras','Hidratantes','Serums & Tratamientos'))
estado text not null check (estado in ('Disponible','Por Encargo','Sin stock')) default 'Disponible'
orden_display int not null default 0
created_at timestamptz not null default now()
```

- Categorías/subcategorías fijas por check constraint:
  - Maquillajes: Bases & Correctores, Sombras & Delineadores, Labiales.
  - Skincare: Limpiadoras, Hidratantes, Serums & Tratamientos.
- RLS: `SELECT` público; `INSERT/UPDATE/DELETE` solo rol autenticado.
- Storage bucket `productos-img`: lectura pública, escritura autenticada.
- Seed: 7 productos maquillaje + 7 skincare, imágenes Unsplash, estados mezclados (Disponible / Por Encargo / Sin stock).

## Landing

**Hero** — full viewport. Fondo gradiente suave (#edc7c0 → blanco) con blobs difusos en parallax (Framer Motion `useScroll`). Wordmark caligráfico centrado, entra con fade+scale. Tagline debajo. Indicador de scroll animado. Scroll suave al catálogo.

**Navbar** — fija; transparente sobre hero, con blur+fondo al scrollear. Monograma RB a la izquierda. Links: Maquillajes / Skincare / Por Encargo / Contacto (anchors). Mobile: hamburguesa con panel deslizante animado.

**Filtros** — pills "Todos / Maquillajes / Skincare". Al elegir categoría aparecen sub-pills de sus subcategorías (animadas). Activo: fondo #cd8e84, texto blanco. "Todos" resetea.

**Grid** — 4 columnas desktop / 2 tablet / 1-2 mobile. Card: imagen 4:5, nombre (serif), descripción corta, badge estado en esquina. Hover: elevación + zoom sutil de imagen. Filtrado con `AnimatePresence` (spring). Scroll-reveal escalonado. Productos "Sin stock" se muestran con imagen levemente desaturada.

**Sección Por Encargo** — separada, fondo rosa pálido distinto, título grande serif, grid solo con productos estado "Por Encargo". Nota corta editable en config.

**Footer** — monograma, links Instagram/email (placeholders en config), copyright.

**WhatsApp flotante** — botón circular fijo abajo-derecha, pulso sutil, hover suave. Link `https://wa.me/<numero>?text=<mensaje>` armado desde `lib/config.ts` (número vacío por ahora). Tamaño adaptado en mobile.

**SEO/Compartir** — metadata + OG tags (título, descripción, imagen) para que el link se vea bien en Instagram/WhatsApp.

## Admin (`/admin`)

- Login email+password (Supabase Auth). Sin signup. Middleware redirige a `/admin/login` si no hay sesión.
- Lista de productos agrupada por categoría → subcategoría.
- Drag & drop reordena dentro de subcategoría; al soltar persiste `orden_display`.
- Crear/editar en modal: nombre, descripción (contador 150), select categoría → subcategoría dependiente, estado, imagen.
- Upload imagen: click o drag, compresión client-side (~800px, webp) antes de subir a Storage.
- Cambio rápido de estado desde la lista (sin abrir modal).
- Eliminar con confirmación.
- UI admin usa misma paleta pero sobria, funcional.

## Responsive

- Desktop ≥1024: grid 4 col. Tablet 768–1023: 2-3 col. Mobile <768: 1-2 col.
- Mobile first. WhatsApp button no tapa contenido.

## Deploy

- Repo git propio en `Catalogo RB`, push a GitHub, Vercel auto-deploy.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Setup Supabase/Vercel manual del usuario siguiendo README:
  1. Crear proyecto Supabase, correr `supabase/schema.sql` y `seed.sql`.
  2. Crear bucket y usuario admin desde dashboard.
  3. Conectar repo a Vercel + env vars.
  4. Editar `lib/config.ts` (WhatsApp, redes, email, tagline).

## Criterios de éxito

- Landing responsive, animada (parallax hero, scroll-reveal, filtros animados), estética acorde a branding.
- Filtros funcionan con transiciones suaves; "Ver todos" resetea.
- Admin permite alta/edición/baja/reorden/estado/imagen sin tocar código.
- Escritura en DB imposible sin autenticarse (RLS verificada).
- `npm run build` pasa sin errores; listo para Vercel.

## Fuera de alcance (fase 2)

- CSV export/import, preview en tiempo real en admin, múltiples imágenes por producto, analytics.

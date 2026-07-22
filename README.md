# Rosea Beauty — Landing Catalog

Landing catalog + panel admin para maquillaje y skincare importado.
Next.js 16 · Tailwind v4 · Supabase · Framer Motion.

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

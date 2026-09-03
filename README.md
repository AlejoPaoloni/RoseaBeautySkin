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
2. En **SQL Editor**, correr `supabase/schema.sql`, después los archivos de `supabase/migrations/` en orden numérico, y por último `supabase/seed.sql`.
   - Si las policies de storage fallan con "must be owner of table objects": crear el bucket `productos-img` (público) desde **Storage** y las 4 policies desde **Storage → Policies** en el dashboard (SELECT para todos; INSERT/UPDATE/DELETE solo `authenticated`, todas con condición `bucket_id = 'productos-img'`). El resto del script corre igual.
3. En **Authentication → Users**, crear el usuario admin (email + password). Desactivar signups en **Authentication → Sign In / Up** si está habilitado.
4. En **Project Settings → API**, copiar `URL` y `anon public key` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Finanzas (`/admin/finanzas`)

Ventas, gastos y seguimiento de margen. Se habilita corriendo
`supabase/migrations/005_finanzas.sql`.

- **Ventas** — se arman eligiendo productos del catálogo; el precio se
  autocompleta y se puede pisar si hubo descuento. Cada renglón guarda un
  snapshot de nombre, precio y costo, así una venta vieja no cambia de valor
  cuando actualizás la lista de precios.
- **Costo por producto** — campo opcional en el formulario de producto. Sin él
  la ganancia de ese producto se cuenta entera.
- **Caja vs. ganancia** — caja es lo que entró menos todo lo que salió
  (incluida la compra de stock); ganancia descuenta el costo de lo vendido más
  los gastos operativos. Se muestran las dos para que un mes de pedido grande
  no se lea como pérdida.
- **Privacidad** — a diferencia de `productos`, las tablas de finanzas exigen
  sesión iniciada hasta para leer (la anon key vive en el browser).

## Gestión (`006_gestion.sql`)

El panel tiene panel lateral fijo en escritorio y barra inferior en el celular
(los destinos que no entran caen en "Más").

- **Contenido** (`/admin/contenido`) — calendario mensual de publicaciones con
  semana de lunes a domingo, checklist por publicación y banco de ideas. Una
  idea es una publicación sin fecha: cargarle una la manda al calendario. Cada
  publicación puede apuntar a productos del catálogo.
- **Stock** — campo `stock` en el producto (vacío = no se controla) más un
  umbral de aviso. Cada venta descuenta unidades y borrar una venta las
  repone. Se mueve desde la app y no con un trigger, para que el movimiento
  esté a la vista en el código.
- **Pedidos** (`/admin/pedidos`) — encargos con estado, seña y saldo. El botón
  "Registrar como venta" lo pasa a finanzas y descuenta stock una sola vez.
- **Clientas** (`/admin/clientas`) — ficha con contacto y nota; el historial de
  compras se arma solo desde las ventas.
- **Tareas** (`/admin/tareas`) — pendientes con fecha límite opcional.

### Espejo en Google Sheets

`scripts/sheets-sync.gs` copia ventas, gastos y un resumen mensual a una Google
Sheet cada hora. La fuente de verdad sigue siendo Supabase; la hoja es solo
lectura y se reescribe entera en cada corrida.

1. En la Sheet: **Extensiones → Apps Script**, pegar el archivo.
2. **Configuración del proyecto → Propiedades del script**: cargar
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_EMAIL`, `SUPABASE_PASSWORD`.
3. Ejecutar `instalarTrigger()` una vez.

Entra con email y contraseña (no con la `service_role` key), así respeta las
policies de RLS. Conviene crear en **Authentication → Users** un usuario
dedicado solo para la sincro.

## Deploy en Vercel

1. Subir el repo a GitHub.
2. En [vercel.com](https://vercel.com): **New Project** → importar el repo.
3. Agregar las dos env vars de arriba, más `NEXT_PUBLIC_SITE_URL` con la URL final (ej: `https://catalogo-rb.vercel.app`) para que la imagen de preview (og:image) funcione al compartir el link.
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
- `app/admin/finanzas` — dashboard de ventas, gastos y margen
- `components/landing`, `components/admin` — UI
- `lib/` — config, tipos, lógica, clientes Supabase
- `supabase/` — schema + seed SQL
- `tests/` — tests de lógica (`npm run test`)

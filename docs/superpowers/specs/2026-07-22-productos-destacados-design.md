# Spec — Productos Destacados

**Fecha:** 2026-07-22
**Proyecto:** Catálogo RB (Rosea Beauty), incremento sobre catálogo en producción (Vercel + Supabase).

## Decisiones tomadas

- Sección "Productos Destacados" **entre el Hero y el Catálogo** en la landing.
- Presentación: **marquee horizontal automático** — los productos se deslizan continuamente (la pista se mueve hacia la izquierda, los productos aparecen desde la derecha), velocidad lenta, loop infinito sin salto, **sin flechas**.
- Pausa al hacer hover (desktop). Respeta `prefers-reduced-motion` (pista quieta, scrolleable con overflow).
- Cualquier producto puede ser destacado y **se muestra siempre**, incluso "Sin stock" (con su gris habitual).
- Admin: **estrella ★ en cada fila** (toggle rápido, optimista con rollback) **y checkbox "Destacado"** en el modal crear/editar.
- Si no hay destacados, la sección no se renderiza.

## Alcance

- Migración SQL incremental `supabase/migrations/002_add_destacado.sql` (producción ya migró 001; ésta se corre a mano igual que aquella).
- `supabase/schema.sql` y `supabase/seed.sql` actualizados para setups desde cero (3 productos seed con `destacado = true`: Labial Mate Velvet, Serum Vitamina C, Paleta Sombras Nude).
- `lib/types.ts`: `destacado: boolean` en `Producto`.
- `lib/catalog.ts`: `productosDestacados(ps: Producto[]): Producto[]` (filtra `destacado`, ordena con `ordenarProductos`).
- `components/landing/DestacadosSection.tsx`: nueva sección marquee.
- `app/page.tsx`: montar `<DestacadosSection productos={productos} />` entre `<Hero />` y `<CatalogSection />`.
- `components/admin/ProductRow.tsx`: botón estrella antes del select de estado.
- `components/admin/ProductForm.tsx`: checkbox "Destacado" (entre Estado e Imagen).
- `app/admin/page.tsx`: handler `cambiarDestacado` (optimista + rollback + alert, mismo patrón que `cambiarEstado`).
- Test para `productosDestacados` en `tests/catalog.test.ts` (factory suma `destacado: false` default).

## Base de datos

`supabase/migrations/002_add_destacado.sql` (correr una vez en el proyecto existente):

```sql
alter table public.productos add column destacado boolean not null default false;
```

`schema.sql`: misma columna en el `create table` (después de `precio`). `seed.sql`: columna `destacado` en el insert, `true` en los 3 productos mencionados, `false` el resto.

## Landing — DestacadosSection

- `"use client"`. Recibe `productos: Producto[]`, filtra con `productosDestacados`; si queda vacío devuelve `null`.
- Título: `Productos Destacados` (mismo estilo serif/rosea-700 que "Catálogo"), fondo blanco, `py-16`.
- Marquee CSS puro:
  - Contenedor `overflow-hidden` con `group` (para pausa on hover).
  - Pista flex con la lista de cards **duplicada** (`[...items, ...items]`), animación `animate-marquee` definida en `globals.css`:
    ```css
    @keyframes marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    ```
  - Duración proporcional a la cantidad (`items.length * 6s`, mínimo 20s) vía style inline `animationDuration`.
  - `group-hover:[animation-play-state:paused]`.
  - `@media (prefers-reduced-motion: reduce)`: animación desactivada (regla en `globals.css`), pista con `overflow-x-auto` natural.
  - Cards con ancho fijo: `w-56 shrink-0` (224px) + gap.
  - Duplicado marcado `aria-hidden` en la segunda copia para no repetir contenido a lectores de pantalla.
- Reusa `ProductCard` sin cambios (hereda gris "Sin stock", precio, badge).
- Anchor `id="destacados"` (sin link en navbar por ahora — YAGNI).

## Admin

**ProductRow** — botón estrella después del thumbnail y antes del nombre:

```tsx
<button
  type="button"
  onClick={onDestacado}
  aria-label={producto.destacado ? "Quitar de destacados" : "Marcar como destacado"}
  className={producto.destacado ? "px-1 text-amber-400 hover:text-amber-500" : "px-1 text-neutral-300 hover:text-amber-400"}
>
  ★
</button>
```

Prop nueva: `onDestacado: () => void`.

**AdminPage** — handler:

```tsx
async function cambiarDestacado(p: Producto) {
  const anterior = productos;
  setProductos((prev) =>
    prev.map((x) => (x.id === p.id ? { ...x, destacado: !x.destacado } : x))
  );
  try {
    await actualizarProducto(p.id, { destacado: !p.destacado });
  } catch {
    setProductos(anterior);
    alert("No se pudo actualizar destacado. Probá de nuevo.");
  }
}
```

Se pasa por `SortableRow` → `ProductRow` (prop `onDestacado`).

**ProductForm** — estado `destacado` (boolean, init `producto?.destacado ?? false`), checkbox entre Estado e Imagen:

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

`destacado` se suma al objeto `datos` del submit.

## Criterios de éxito

- Migración corrida en producción sin afectar productos existentes (todos arrancan `destacado = false`).
- Marquee se desliza suave hacia la izquierda, loop sin salto visible, pausa on hover.
- Estrella del admin marca/desmarca al instante y persiste; checkbox del form funciona en crear y editar.
- Sección no aparece si no hay destacados.
- `npm run test` (12 tests: 11 + `productosDestacados`) y `npm run build` pasan.

## Fuera de alcance

- Link "Destacados" en navbar.
- Orden propio de destacados (usa `orden_display` existente).
- Límite de cantidad de destacados.
- Drag para deslizar el carrusel manualmente.

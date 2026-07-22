# Spec — Agregar precio a productos

**Fecha:** 2026-07-22
**Proyecto:** Catálogo RB (Rosea Beauty), incremento sobre el catálogo ya en producción.

## Decisiones tomadas

- Moneda: pesos argentinos, monto entero (sin centavos).
- Campo obligatorio (`not null`, `>= 0`) para todo producto, nuevo o existente.
- Los 15 productos ya cargados en Supabase (vía `supabase/seed.sql`) reciben backfill con precio placeholder `9999` en la migración; el usuario los edita después desde `/admin` con el precio real.
- Ubicación en la card: debajo de la descripción, en `text-rosea-500`.
- Formato de visualización: `$12.500` (es-AR, sin decimales, separador de miles con punto).

## Alcance

- Migración SQL incremental (no se reescribe `schema.sql`/`seed.sql` originales — ya corrieron en producción).
- `lib/types.ts`: agregar `precio: number` a `Producto`.
- `lib/catalog.ts`: agregar `formatearPrecio(precio: number): string`.
- `components/admin/ProductForm.tsx`: input numérico "Precio (ARS)", requerido, `min={0}`.
- `components/admin/ProductRow.tsx`: opcional, no requerido por spec — el precio no es crítico en la lista de admin (se edita en el modal). Fuera de alcance.
- `components/landing/ProductCard.tsx`: mostrar precio formateado debajo de la descripción.

## Base de datos — migración

Nuevo archivo `supabase/migrations/001_add_precio.sql` (se corre a mano en SQL Editor, una sola vez, sobre el proyecto ya existente):

```sql
alter table public.productos add column precio integer;
update public.productos set precio = 9999 where precio is null;
alter table public.productos alter column precio set not null;
alter table public.productos add constraint precio_no_negativo check (precio >= 0);
```

`supabase/schema.sql` y `supabase/seed.sql` también se actualizan (para que un proyecto Supabase nuevo desde cero ya incluya `precio` sin necesitar la migración): la columna se agrega directo en el `create table`, y el `insert` del seed lleva precios de ejemplo variados (no todos 9999) por prolijidad del demo.

## Lógica

`lib/types.ts`:
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

`lib/catalog.ts`:
```ts
export function formatearPrecio(precio: number): string {
  return precio.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
```

Test (`tests/catalog.test.ts`, agregar caso): `formatearPrecio(12500)` → contiene `"12.500"` y símbolo `$` (verificar con `toContain`, ya que el símbolo exacto de `Intl` para ARS varía por entorno Node — `$` está garantizado, el separador de miles `.` es lo que se valida estrictamente).

## Admin — ProductForm

Nuevo campo entre "Descripción corta" y el grid Categoría/Subcategoría:

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

Estado local `precio` (string, para permitir campo vacío mientras se escribe) inicializado en `producto?.precio?.toString() ?? ""`. Validación en `onSubmit`: si `Number(precio)` no es un número finito `>= 0`, error "El precio debe ser un número válido mayor o igual a 0" (mismo patrón que la validación de `nombre` ya existente). Se envía como `Number(precio)` en el objeto `datos`.

## Landing — ProductCard

Debajo del párrafo de descripción:

```tsx
<p className="mt-2 font-serif text-lg text-rosea-500">
  {formatearPrecio(producto.precio)}
</p>
```

## Criterios de éxito

- Migración corrida en Supabase de producción sin romper los 15 productos existentes (quedan en $9.999, editables).
- `schema.sql`/`seed.sql` actualizados para que un setup nuevo desde cero incluya precio sin pasos extra.
- Admin: no se puede guardar un producto sin precio válido (número `>= 0`).
- Landing: toda card muestra el precio formateado.
- `npm run test` y `npm run build` pasan.

## Fuera de alcance

- Mostrar precio en `ProductRow` (lista del admin).
- Precios con decimales / centavos.
- Multi-moneda.
- Descuentos o precio tachado.

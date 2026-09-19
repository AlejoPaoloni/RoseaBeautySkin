-- URL legible para la ficha de producto: /producto/rhode-pocket-blush en vez
-- de /producto/<uuid>. El uuid sigue siendo la clave primaria; el slug es
-- solo la cara publica, y las URLs viejas redirigen (308) a la nueva.
--
-- Nullable a proposito: si algun dia entra una fila sin slug (carga manual,
-- import), la ficha sigue resolviendo por uuid en vez de romperse.
alter table public.productos add column slug text;

-- Unico entre los que lo tienen cargado: dos productos no pueden compartir
-- URL, pero varios pueden estar sin slug todavia.
create unique index productos_slug_key on public.productos (slug)
  where slug is not null;

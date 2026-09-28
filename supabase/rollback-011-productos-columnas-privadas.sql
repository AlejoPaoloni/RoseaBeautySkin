-- Deshace 011: anon vuelve a poder leer todas las columnas de productos
-- (incluidos costo y stock). Solo si algo de la web publica se rompio.
revoke select (
  id, slug, nombre, marca, descripcion_corta, imagen_url, descripcion_larga,
  imagenes_extra, categoria, subcategoria, estado, precio, destacado, tonos,
  orden_display, created_at
) on public.productos from anon;

grant select on public.productos to anon;

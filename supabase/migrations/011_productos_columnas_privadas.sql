-- 011: costo y stock de productos dejan de ser publicos.
--
-- La politica "lectura publica" de productos deja leer las filas a
-- cualquiera (la landing las necesita), y RLS filtra filas, no columnas: con
-- la anon key -la que viaja en la web- se podia pedir el costo de cada
-- producto, y con eso los margenes. Tambien el stock exacto y el aviso de
-- stock bajo, que la web no muestra en ningun lado.
--
-- Arreglo: permisos por columna para anon. Sigue leyendo todo lo que la web
-- muestra; costo, stock y stock_minimo solo los ve una sesion iniciada
-- (admin y lector, que siguen pasando por sus politicas de 010).
--
-- OJO al agregar una columna a productos que la web publica necesite: hay
-- que sumarla al grant de abajo Y a COLUMNAS_PUBLICAS en
-- lib/supabase/server.ts, o la landing deja de cargar productos.
-- (Un select=* de anon ahora falla con "permission denied": por eso la web
-- pide las columnas por nombre.)

revoke select on public.productos from anon;

grant select (
  id, slug, nombre, marca, descripcion_corta, imagen_url, descripcion_larga,
  imagenes_extra, categoria, subcategoria, estado, precio, destacado, tonos,
  orden_display, created_at
) on public.productos to anon;

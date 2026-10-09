-- Suma el tono al nombre de los renglones de ventas y pedidos YA cargados.
--
-- Desde hoy el panel guarda "Camo Concealer (Fair Warm)" al cargar una venta;
-- las de antes guardaron solo "Camo Concealer", y por eso la lista de ventas
-- y "Mas vendidos" (que agrupa por ese nombre) juntaban todos los tonos.
--
-- Toma el tono del producto vinculado al renglon. No toca:
--   - renglones de productos sin tono, o con mas de uno cargado;
--   - renglones cuyo producto se borro del catalogo (no hay de donde sacar
--     el tono);
--   - renglones que ya tienen el tono (se puede correr dos veces sin
--     duplicar el parentesis).
--
-- Cada update devuelve las filas que cambio, para revisarlas.

update public.venta_items vi
set nombre = vi.nombre || ' (' || (p.tonos -> 0 ->> 'nombre') || ')'
from public.productos p
where vi.producto_id = p.id
  and (case when jsonb_typeof(p.tonos) = 'array'
            then jsonb_array_length(p.tonos) else 0 end) = 1
  and coalesce(p.tonos -> 0 ->> 'nombre', '') <> ''
  and right(vi.nombre, length(p.tonos -> 0 ->> 'nombre') + 3)
      <> ' (' || (p.tonos -> 0 ->> 'nombre') || ')'
returning vi.nombre as venta_renglon_actualizado;

update public.pedido_items pi
set nombre = pi.nombre || ' (' || (p.tonos -> 0 ->> 'nombre') || ')'
from public.productos p
where pi.producto_id = p.id
  and (case when jsonb_typeof(p.tonos) = 'array'
            then jsonb_array_length(p.tonos) else 0 end) = 1
  and coalesce(p.tonos -> 0 ->> 'nombre', '') <> ''
  and right(pi.nombre, length(p.tonos -> 0 ->> 'nombre') + 3)
      <> ' (' || (p.tonos -> 0 ->> 'nombre') || ')'
returning pi.nombre as pedido_renglon_actualizado;

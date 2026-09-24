-- Deshace 010_admin_mfa.sql: vuelve a las politicas anteriores ("to
-- authenticated using (true)") y borra admins/lectores y las funciones.
--
-- Usalo solo si la 010 te dejo afuera del panel y no podes resolverlo de otra
-- forma. Ojo: vuelve a la situacion donde cualquier usuario logueado ve todo;
-- con el registro cerrado en Authentication eso es lo que habia antes.
--
-- Antes de usarlo, probablemente alcance con quitar el factor MFA:
--
--   delete from auth.mfa_factors
--   where user_id = (select id from auth.users where email = 'TU-EMAIL');

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where (
      schemaname = 'public'
      and tablename in (
        'productos', 'gastos', 'ventas', 'venta_items', 'clientas',
        'pedidos', 'pedido_items', 'publicaciones', 'publicacion_productos',
        'tareas'
      )
    ) or (
      schemaname = 'storage' and tablename = 'objects' and policyname like 'img %'
    )
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- productos (schema.sql)
create policy "lectura publica" on public.productos
  for select using (true);
create policy "insert autenticado" on public.productos
  for insert to authenticated with check (true);
create policy "update autenticado" on public.productos
  for update to authenticated using (true);
create policy "delete autenticado" on public.productos
  for delete to authenticated using (true);

-- tablas privadas (005 y 006)
do $$
declare
  t text;
begin
  foreach t in array array[
    'gastos', 'ventas', 'venta_items', 'clientas', 'pedidos', 'pedido_items',
    'publicaciones', 'publicacion_productos', 'tareas'
  ]
  loop
    execute format(
      'create policy "%s solo autenticado" on public.%I for all to authenticated using (true) with check (true)',
      t, t);
  end loop;
end $$;

-- bucket (schema.sql)
create policy "img lectura publica" on storage.objects
  for select using (bucket_id = 'productos-img');
create policy "img insert autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos-img');
create policy "img update autenticado" on storage.objects
  for update to authenticated using (bucket_id = 'productos-img');
create policy "img delete autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'productos-img');

drop function public.es_admin();
drop function public.es_lector();
drop table public.admins;
drop table public.lectores;

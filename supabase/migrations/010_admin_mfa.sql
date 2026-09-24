-- 010: quien puede entrar al panel, y con segundo factor.
--
-- Hasta ahora todas las politicas decian "to authenticated using (true)":
-- cualquier usuario logueado veia y escribia todo. Con el registro cerrado
-- eso alcanza en la practica, pero es una sola barrera. Esto agrega la
-- segunda: solo los usuarios de public.admins tienen acceso, y si activaron
-- MFA (TOTP) la base exige la sesion verificada con codigo (aal2).
--
-- El MFA se exige ACA, en la base, y no solo en la pantalla del panel: si
-- solo se pidiera en la app, quien tuviera la contrasena podria entrar por la
-- API directo y saltearselo.
--
-- Roles:
--   admins    -> leen y escriben todo. Con MFA activado, solo con aal2.
--   lectores  -> solo lectura (el usuario del script de Google Sheets, que
--                entra con email y contrasena y no puede pasar por MFA).
--
-- Si nadie activo MFA todavia, esta migracion no cambia nada de lo que ves en
-- el panel. El MFA se exige recien cuando el admin lo activa.
--
-- ANTES de activar MFA (paso final, ver el final de este archivo): crear el
-- usuario del script de Sheets y registrarlo como lector, si no el mirror de
-- Sheets deja de sincronizar.

-- Seguro: hoy debe existir un solo usuario (el admin). El registro estuvo
-- abierto un tiempo; si aparece otro, esto frena en vez de darle admin a un
-- desconocido en silencio.
do $$
declare
  n int;
begin
  select count(*) into n from auth.users;
  if n <> 1 then
    raise exception
      'Hay % usuarios en auth.users y se esperaba 1 (el admin). Revisa Authentication > Users: borra los que no sean tuyos y volve a correr esto. Si hay mas de un admin legitimo, insertalos a mano en public.admins y quita este bloque.',
      n;
  end if;
end $$;

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado timestamptz not null default now()
);

create table public.lectores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado timestamptz not null default now()
);

-- Sin policies a proposito: por la API nadie las lee ni las escribe. Solo las
-- consultan las funciones de abajo, que corren con permisos del duenio.
alter table public.admins enable row level security;
alter table public.lectores enable row level security;
revoke all on public.admins, public.lectores from anon, authenticated;

insert into public.admins (user_id) select id from auth.users;

-- Admin: esta en public.admins Y (tiene sesion aal2 O no tiene ningun factor
-- verificado). Un factor a medio activar (unverified) no cuenta: enrolar el
-- MFA no puede dejarte afuera antes de terminar.
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.admins a where a.user_id = (select auth.uid())
    )
    and (
      (select auth.jwt() ->> 'aal') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = (select auth.uid()) and f.status = 'verified'
      )
    );
$$;

create function public.es_lector()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lectores l where l.user_id = (select auth.uid())
  );
$$;

revoke all on function public.es_admin() from public, anon;
revoke all on function public.es_lector() from public, anon;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.es_lector() to authenticated;

-- Politicas viejas afuera. Se borran por consulta y no por nombre: si alguien
-- agrego una a mano desde el dashboard, tambien se va, y no queda una puerta
-- abierta que esta migracion no vio.
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

-- Catalogo: lo ve cualquiera, lo escribe el admin.
create policy "lectura publica" on public.productos
  for select using (true);
create policy "admin inserta" on public.productos
  for insert to authenticated with check ((select public.es_admin()));
create policy "admin edita" on public.productos
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "admin borra" on public.productos
  for delete to authenticated using ((select public.es_admin()));

-- Tablas privadas: las lee el admin o el lector, las escribe solo el admin.
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
      'create policy "admin o lector lee" on public.%I for select to authenticated using ((select public.es_admin()) or (select public.es_lector()))',
      t);
    execute format(
      'create policy "admin inserta" on public.%I for insert to authenticated with check ((select public.es_admin()))',
      t);
    execute format(
      'create policy "admin edita" on public.%I for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()))',
      t);
    execute format(
      'create policy "admin borra" on public.%I for delete to authenticated using ((select public.es_admin()))',
      t);
  end loop;
end $$;

-- Bucket de fotos: sin politica de lectura publica. El bucket es publico
-- (public = true), asi que las fotos se siguen sirviendo por su URL sin
-- ninguna politica; lo que se cierra es LISTAR el bucket sin login. Las
-- politicas de abajo son solo para el panel.
create policy "img admin lee" on storage.objects
  for select to authenticated
  using (bucket_id = 'productos-img' and (select public.es_admin()));
create policy "img admin sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos-img' and (select public.es_admin()));
create policy "img admin edita" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos-img' and (select public.es_admin()))
  with check (bucket_id = 'productos-img' and (select public.es_admin()));
create policy "img admin borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos-img' and (select public.es_admin()));

-- ---------------------------------------------------------------------------
-- PASOS MANUALES (no corren solos):
--
-- 1) Usuario de solo lectura para el script de Sheets. En el dashboard:
--    Authentication > Users > Add user > Create new user (email y contrasena
--    propios para Sheets; marcar "Auto Confirm User"). Despues:
--
--      insert into public.lectores (user_id)
--      select id from auth.users where email = 'EL-EMAIL-DE-SHEETS';
--
--    y cargar ese email y contrasena en las Script Properties del Google
--    Sheet (SUPABASE_EMAIL y SUPABASE_PASSWORD).
--
-- 2) Recien ahi, activar MFA en el panel (Seguridad).
--
-- Si perdes el celular con MFA activado, se quita el factor desde el SQL
-- Editor (corre como postgres, no pasa por las politicas):
--
--      delete from auth.mfa_factors
--      where user_id = (select id from auth.users where email = 'TU-EMAIL');
-- ---------------------------------------------------------------------------

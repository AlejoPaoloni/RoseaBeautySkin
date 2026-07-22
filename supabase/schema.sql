-- Tabla de productos
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta varchar(150),
  imagen_url text,
  categoria text not null check (categoria in ('Maquillajes', 'Skincare')),
  subcategoria text not null check (subcategoria in (
    'Bases & Correctores', 'Sombras & Delineadores', 'Labiales',
    'Limpiadoras', 'Hidratantes', 'Serums & Tratamientos'
  )),
  estado text not null default 'Disponible'
    check (estado in ('Disponible', 'Por Encargo', 'Sin stock')),
  orden_display int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS: lectura publica, escritura solo autenticados
alter table public.productos enable row level security;

create policy "lectura publica" on public.productos
  for select using (true);

create policy "insert autenticado" on public.productos
  for insert to authenticated with check (true);

create policy "update autenticado" on public.productos
  for update to authenticated using (true);

create policy "delete autenticado" on public.productos
  for delete to authenticated using (true);

-- Bucket de imagenes: lectura publica, escritura autenticada
insert into storage.buckets (id, name, public)
values ('productos-img', 'productos-img', true);

create policy "img lectura publica" on storage.objects
  for select using (bucket_id = 'productos-img');

create policy "img insert autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos-img');

create policy "img update autenticado" on storage.objects
  for update to authenticated using (bucket_id = 'productos-img');

create policy "img delete autenticado" on storage.objects
  for delete to authenticated using (bucket_id = 'productos-img');

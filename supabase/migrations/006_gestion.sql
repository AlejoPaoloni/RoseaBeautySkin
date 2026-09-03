-- Gestión del emprendimiento: contenido, stock, pedidos, clientas y tareas.

-- --- Stock ---
-- null = ese producto no lleva control de stock (ej: los que son por encargo).
alter table public.productos add column stock integer check (stock >= 0);
alter table public.productos add column stock_minimo integer not null default 2
  check (stock_minimo >= 0);

-- --- Clientas ---
create table public.clientas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto text,
  nota text,
  created_at timestamptz not null default now()
);

-- Las ventas viejas guardaron el nombre suelto en `cliente`; se mantiene como
-- fallback para no perder historial al pasar a la ficha de clienta.
alter table public.ventas add column cliente_id uuid
  references public.clientas(id) on delete set null;

-- --- Pedidos y encargos ---
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente_id uuid references public.clientas(id) on delete set null,
  cliente_texto text,
  estado text not null default 'Pedido' check (estado in (
    'Pedido', 'En camino', 'Llegó', 'Entregado'
  )),
  sena integer not null default 0 check (sena >= 0),
  nota text,
  -- Se completa al convertir el pedido en venta, para no convertirlo dos veces.
  venta_id uuid references public.ventas(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_estimado integer not null default 0 check (precio_estimado >= 0)
);

-- --- Contenido ---
-- Una idea es una publicación sin fecha: misma tabla, `fecha` null. Así pasar
-- del banco de ideas al calendario es cargarle la fecha, no mover de tabla.
create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  fecha date,
  red text not null default 'Instagram' check (red in (
    'Instagram', 'TikTok', 'Otro'
  )),
  formato text not null default 'Reel' check (formato in (
    'Post', 'Reel', 'Story', 'Video', 'Otro'
  )),
  titulo text not null,
  copy text,
  estado text not null default 'Idea' check (estado in (
    'Idea', 'Guionado', 'Grabado', 'Editado', 'Publicado'
  )),
  -- [{ "paso": "Grabar", "hecho": false }, ...]
  checklist jsonb,
  nota text,
  created_at timestamptz not null default now()
);

create table public.publicacion_productos (
  publicacion_id uuid not null
    references public.publicaciones(id) on delete cascade,
  producto_id uuid not null
    references public.productos(id) on delete cascade,
  primary key (publicacion_id, producto_id)
);

-- --- Tareas ---
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  hecha boolean not null default false,
  fecha_limite date,
  created_at timestamptz not null default now()
);

create index pedido_items_pedido_id_idx on public.pedido_items (pedido_id);
create index pedidos_fecha_idx on public.pedidos (fecha);
create index publicaciones_fecha_idx on public.publicaciones (fecha);
create index publicacion_productos_producto_idx
  on public.publicacion_productos (producto_id);

-- RLS: gestión interna, igual que finanzas. Sesión iniciada hasta para leer.
alter table public.clientas enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.publicaciones enable row level security;
alter table public.publicacion_productos enable row level security;
alter table public.tareas enable row level security;

create policy "clientas solo autenticado" on public.clientas
  for all to authenticated using (true) with check (true);

create policy "pedidos solo autenticado" on public.pedidos
  for all to authenticated using (true) with check (true);

create policy "pedido_items solo autenticado" on public.pedido_items
  for all to authenticated using (true) with check (true);

create policy "publicaciones solo autenticado" on public.publicaciones
  for all to authenticated using (true) with check (true);

create policy "publicacion_productos solo autenticado"
  on public.publicacion_productos
  for all to authenticated using (true) with check (true);

create policy "tareas solo autenticado" on public.tareas
  for all to authenticated using (true) with check (true);

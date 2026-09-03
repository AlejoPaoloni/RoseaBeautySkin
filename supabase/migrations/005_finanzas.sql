-- Dashboard de finanzas: ventas, gastos y margen por producto.

-- Costo de compra del producto, para calcular ganancia real.
-- Nullable: los productos ya cargados no lo tienen todavia.
alter table public.productos add column costo integer check (costo >= 0);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  categoria text not null check (categoria in (
    'Mercaderia', 'Envios', 'Packaging', 'Publicidad', 'Comisiones', 'Otros'
  )),
  descripcion text not null,
  monto integer not null check (monto >= 0),
  created_at timestamptz not null default now()
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente text,
  canal text not null default 'Instagram' check (canal in (
    'Instagram', 'WhatsApp', 'Presencial', 'Otro'
  )),
  nota text,
  created_at timestamptz not null default now()
);

create table public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  -- set null: si se borra el producto del catalogo la venta vieja sobrevive.
  producto_id uuid references public.productos(id) on delete set null,
  -- Snapshot del producto al momento de la venta: si despues cambia de
  -- precio o de costo, la venta vieja tiene que seguir valiendo lo que
  -- valio ese dia.
  nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario integer not null check (precio_unitario >= 0),
  costo_unitario integer not null default 0 check (costo_unitario >= 0)
);

create index venta_items_venta_id_idx on public.venta_items (venta_id);
create index ventas_fecha_idx on public.ventas (fecha);
create index gastos_fecha_idx on public.gastos (fecha);

-- RLS: a diferencia de productos, las finanzas NO son publicas.
-- La anon key vive en el browser, asi que hasta el select tiene que exigir
-- sesion iniciada.
alter table public.gastos enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;

create policy "gastos solo autenticado" on public.gastos
  for all to authenticated using (true) with check (true);

create policy "ventas solo autenticado" on public.ventas
  for all to authenticated using (true) with check (true);

create policy "venta_items solo autenticado" on public.venta_items
  for all to authenticated using (true) with check (true);

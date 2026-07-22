-- Migracion incremental: agrega precio a un proyecto que ya tiene la tabla productos.
-- Correr una sola vez en el SQL Editor del proyecto Supabase existente.
alter table public.productos add column precio integer;
update public.productos set precio = 9999 where precio is null;
alter table public.productos alter column precio set not null;
alter table public.productos add constraint precio_no_negativo check (precio >= 0);

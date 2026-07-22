-- Migracion incremental: agrega flag destacado.
-- Correr una sola vez en el SQL Editor del proyecto Supabase existente.
alter table public.productos add column destacado boolean not null default false;

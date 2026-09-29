-- Deshace 012. Se pierde el medio de pago y el estado de cobro cargados.
alter table public.ventas drop column if exists cobrada;
alter table public.ventas drop column if exists medio_pago;

-- Stock minimo por default: 2 -> 1. Solo cambia el default para productos
-- nuevos, no toca el valor ya cargado de los productos existentes.
alter table public.productos alter column stock_minimo set default 1;

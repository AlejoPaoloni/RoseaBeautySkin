-- 012: como se cobro cada venta y si ya se cobro.
--
-- medio_pago: por ahora solo Efectivo y Transferencia (los dos que usa el
-- emprendimiento). null = venta cargada antes de esta migracion, sin dato.
-- cobrada: false = la clienta todavia debe la venta. Las ventas viejas
-- quedan como cobradas (default true), que es lo que eran en la practica.
--
-- Las politicas de 010 son por tabla, asi que las columnas nuevas ya quedan
-- cubiertas: admin lee y escribe, lector (Sheets) solo lee.

alter table public.ventas
  add column medio_pago text check (medio_pago in ('Efectivo', 'Transferencia'));

alter table public.ventas
  add column cobrada boolean not null default true;

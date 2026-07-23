-- Marca del producto (opcional, se muestra arriba del nombre en la card)
alter table public.productos add column marca text;

-- Nuevas subcategorias: Maquillajes (Rostro, Ojos, Labios) y Skincare unica
alter table public.productos drop constraint productos_subcategoria_check;

update public.productos set subcategoria = 'Rostro' where subcategoria = 'Bases & Correctores';
update public.productos set subcategoria = 'Ojos' where subcategoria = 'Sombras & Delineadores';
update public.productos set subcategoria = 'Labios' where subcategoria = 'Labiales';
update public.productos set subcategoria = 'Skincare' where categoria = 'Skincare';

alter table public.productos add constraint productos_subcategoria_check
  check (subcategoria in ('Rostro', 'Ojos', 'Labios', 'Skincare'));

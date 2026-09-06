-- Página de detalle de producto: descripción completa y hasta 2 fotos
-- adicionales (imagen_url sigue siendo la portada que se ve en las cards).
alter table public.productos add column descripcion_larga text;
alter table public.productos add column imagenes_extra text[];

-- Carga real de productos (pedido Sephora) — reemplaza los 15 productos de ejemplo.
-- Precio: placeholder 9999, cargar valores reales despues desde /admin.

delete from public.productos;

insert into public.productos
  (nombre, marca, descripcion_corta, imagen_url, categoria, subcategoria, estado, precio, destacado, tonos, orden_display)
values
  ('Highlight Milk Multipurpose Luminizer', 'rhode',
   'Luminizer híbrido con Glazing Milk que da un brillo radiante natural a piel y maquillaje.',
   'https://www.sephora.com/productimages/sku/s2981108-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Sin stock', 9999, false,
   '[{"nombre":"02 - pearly champagne","hex":"#F0D9B5"},{"nombre":"03 - pearly warm bronze","hex":"#C9975E"}]',
   0),

  ('Mini Positive Light Liquid Luminizer', 'Rare Beauty by Selena Gomez',
   'Iluminador líquido con acabado dorado luminoso, mezcla fácil.',
   'https://www.sephora.com/productimages/sku/s2801520-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Disponible', 9999, false,
   '[{"nombre":"Exhilarate - champagne gold","hex":"#E8C989"}]',
   1),

  ('Pocket Bronze Long-Wearing Cream Bronzer', 'rhode',
   'Bronceador cremoso de larga duración, acabado natural buildable.',
   'https://www.sephora.com/productimages/sku/s2981041-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Disponible', 9999, false,
   '[{"nombre":"sunbed","hex":"#B8895F"},{"nombre":"sip","hex":"#D9A876"}]',
   2),

  ('Mini Major Headlines Double-Take Crème & Powder Blush Duo', 'PATRICK TA',
   'Dúo de rubor crema y polvo en un mismo tono para un color duradero y natural.',
   'https://www.sephora.com/productimages/sku/s2906113-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Disponible', 9999, false,
   '[{"nombre":"She''s That Girl - soft pink","hex":"#E8A0A5"}]',
   3),

  ('Pocket Blush Buildable Hydrating Cream Blush', 'rhode',
   'Rubor cremoso hidratante de cobertura buildable, acabado natural.',
   'https://www.sephora.com/productimages/sku/s2998102-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Disponible', 9999, false,
   '[{"nombre":"Teacup - raspberry pink","hex":"#D65B72"}]',
   4),

  ('Soft Pinch Liquid Blush', 'Rare Beauty by Selena Gomez',
   'Rubor líquido de larga duración con acabado natural aterciopelado.',
   'https://www.sephora.com/productimages/sku/s2712867-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Rostro', 'Disponible', 9999, false,
   '[{"nombre":"Hope - nude mauve","hex":"#C98A82"},{"nombre":"Happy - cool pink","hex":"#E68CA0"}]',
   5),

  ('Mini 24-HR Brow Setter Clear Brow Gel with Lamination Effect', 'Benefit Cosmetics',
   'Gel transparente de larga duración con efecto laminado para cejas prolijas todo el día.',
   'https://www.sephora.com/productimages/sku/s2295046-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Ojos', 'Disponible', 9999, false, null, 0),

  ('Perfect Strokes Universal Volumizing Mascara', 'Rare Beauty by Selena Gomez',
   'Máscara voluminizadora que separa y curva las pestañas sin grumos.',
   'https://www.sephora.com/productimages/sku/s2474138-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Ojos', 'Disponible', 9999, false,
   '[{"nombre":"Black","hex":"#1A1A1A"}]',
   1),

  ('Soft Pinch Lip Oil Stick', 'Rare Beauty by Selena Gomez',
   'Bálsamo labial en stick con aceites nutritivos y un toque de color.',
   'https://www.sephora.com/productimages/sku/s3000239-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Labios', 'Disponible', 9999, false,
   '[{"nombre":"Muse - nude beige","hex":"#C9927E"}]',
   0),

  ('Gloss Bomb Universal Lip Luminizer', 'Fenty Beauty by Rihanna',
   'Gloss universal halagador con brillo espejo y sensación suave.',
   'https://www.sephora.com/productimages/sku/s1925965-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Labios', 'Disponible', 9999, false,
   '[{"nombre":"Fenty Glow - shimmering rose nude","hex":"#D9A093"},{"nombre":"FU$$Y - shimmering pink","hex":"#E0708A"}]',
   1),

  ('Peptide Lip Tint Nourishing Glaze', 'rhode',
   'Tinta labial nutritiva con péptidos, color buildable y brillo glaseado.',
   'https://www.sephora.com/productimages/sku/s2896132-main-zoom.jpg?imwidth=600',
   'Maquillajes', 'Labios', 'Disponible', 9999, false,
   '[{"nombre":"Espresso - rich brown","hex":"#6B3A2E"},{"nombre":"Salty Tan - soft mauve","hex":"#B9807A"}]',
   2),

  ('Glazing Mist Hydrating Face Spray', 'rhode',
   'Bruma hidratante con ácido hialurónico para un efecto glazed instantáneo.',
   'https://www.sephora.com/productimages/sku/s2895977-main-zoom.jpg?imwidth=600',
   'Skincare', 'Skincare', 'Disponible', 9999, false, null, 0),

  ('Glazing Milk Hydrating Ceramide Facial Essence', 'rhode',
   'Esencia facial con ceramidas que hidrata y da efecto glazed a la piel.',
   'https://www.sephora.com/productimages/sku/s2898419-main-zoom.jpg?imwidth=600',
   'Skincare', 'Skincare', 'Sin stock', 9999, false, null, 1);

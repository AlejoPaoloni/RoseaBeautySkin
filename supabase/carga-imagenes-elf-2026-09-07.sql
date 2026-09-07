-- Imagenes principales + HEX real de tono para los 22 productos e.l.f. Cosmetics
-- ya cargados (estaban con imagen_url null y tonos placeholder #D9D9D9).
--
-- Fuente: elfcosmetics.com (pagina oficial de cada producto). El HEX sale del
-- swatch de color que la propia pagina expone por variante (--swatch-color).
-- 3 tonos (Black Velvet, Fair/Light, Dazzling Peony) ya no aparecen en el
-- selector actual del producto pero siguen resueltos en su URL legacy con el
-- HEX marcado como variante activa (aria-current) -- mismo dato oficial, solo
-- que la pagina "nueva" del producto ya no los lista.
-- Excepcion: Daily Dew Stick (Iridescent) esta discontinuado en el sitio
-- oficial de e.l.f. (404) -- imagen tomada de Amazon a pedido.
--
-- Correr una sola vez en el SQL Editor del proyecto Supabase actual.

-- 1. Primer-Infused Matte Blush -- Always Crushing
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83091_OpenA_V5_R.png?v=1776967371',
  tonos = jsonb_set(tonos, '{0,hex}', '"#FFC0CB"')
where id = 'b6509f3a-7e34-41ad-ba58-ed50209236e7';

-- 2/9. Halo Glow Liquid Filter -- 4 Medium Neutral / 3.5 Medium Neutral Olive
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83565_OpenA_V2_R_d02ae91d-8a71-4bba-bfbb-ab663a9b18f0.png?v=1780430096',
  tonos = jsonb_set(tonos, '{0,hex}', '"#BE926D"')
where id = 'fed983d6-7fa8-487b-b6ad-408d8ceb7b08';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83565_OpenA_V2_R_d02ae91d-8a71-4bba-bfbb-ab663a9b18f0.png?v=1780430096',
  tonos = jsonb_set(tonos, '{0,hex}', '"#C39B6A"')
where id = 'd5424ce4-4662-478e-9a7e-cebaae77e305';

-- 3. Glow Reviver Lip Oil Glimmer -- Candy Coded
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83045_OPEN-A_v4_R.png?v=1776967242',
  tonos = jsonb_set(tonos, '{0,hex}', '"#FFA7A6"')
where id = '52a72569-4bb5-4913-af74-f67d0e063220';

-- 4/21. Cream Glide Lip Liner -- Pinky Swear / Mauve Aside
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/22090_OpenB_R_4430b13c-7eb0-4a5a-9a37-d77dc3ad182e.png?v=1780264273',
  tonos = jsonb_set(tonos, '{0,hex}', '"#C37B75"')
where id = 'a1892f2a-7696-4d12-90a0-72209fd0458e';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/22090_OpenB_R_4430b13c-7eb0-4a5a-9a37-d77dc3ad182e.png?v=1780264273',
  tonos = jsonb_set(tonos, '{0,hex}', '"#9F5758"')
where id = 'f6d8586d-efa7-4399-850c-8a1b9b2ecdf7';

-- 5. Brow Laminating Gel -- Clear (sin swatch oficial: beige/gel translucido aproximado)
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/81765_OpenA_2_R.png?v=1776967205',
  tonos = jsonb_set(tonos, '{0,hex}', '"#F2EFEA"')
where id = 'de4d7a0a-e994-4545-98c9-d145893e4594';

-- 6. Lash 'N Roll Mascara -- Black (matcheado a "Pitch Black" del lineup actual)
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83071_OPEN_A_R.png?v=1777056067',
  tonos = jsonb_set(tonos, '{0,hex}', '"#19191D"')
where id = 'af41252a-0ce5-412a-944c-c770ba827629';

-- 7/13/17. Hydrating Camo Concealer -- Fair Beige / Fair Warm / Light Ivory
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/84820_Open_A_R.png?v=1776967306',
  tonos = jsonb_set(tonos, '{0,hex}', '"#E4B6A6"')
where id = '8552afd5-b235-4d3c-af7b-d83c5b3f8c00';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/84820_Open_A_R.png?v=1776967306',
  tonos = jsonb_set(tonos, '{0,hex}', '"#EEC8A3"')
where id = 'ae5908c0-60f9-4850-acd6-2c44ee10f9c0';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/84820_Open_A_R.png?v=1776967306',
  tonos = jsonb_set(tonos, '{0,hex}', '"#E2B7A6"')
where id = '811f62f9-9b52-4548-9208-a9b06a09f2e7';

-- 8. Halo Glow Setting Powder -- Fair/Light (URL legacy, ya no esta en el selector actual)
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/83390_OpenA_R.png?v=1776967276',
  tonos = jsonb_set(tonos, '{0,hex}', '"#E5DAC8"')
where id = 'd8a344a8-a144-4dcf-b420-e569dafcb95a';

-- 10. Glow Reviver Plumping Lip Oil -- Piggy Bank
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/82221_OpenA_V2_R.png?v=1779830534',
  tonos = jsonb_set(tonos, '{0,hex}', '"#E9B8B3"')
where id = '9df2cb6f-b008-45c6-9515-2d9dc80ad329';

-- 11/12. Smoky Kohl Eyeliner -- Black Velvet (URL legacy) / Brownie Points
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/22010_OpenA_R.png?v=1779830240',
  tonos = jsonb_set(tonos, '{0,hex}', '"#323335"')
where id = 'b0dc4975-1c4a-4860-9376-dcc885935134';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/22010_OpenA_R.png?v=1779830240',
  tonos = jsonb_set(tonos, '{0,hex}', '"#72483A"')
where id = '31075fe1-d812-403b-bf33-7917b1204f98';

-- 14. Bronzing Drops -- Rose Gold
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/57527_Fair_20Gold.jpg?v=1776967200',
  tonos = jsonb_set(tonos, '{0,hex}', '"#B17A58"')
where id = '945ee40d-c858-45e8-88fc-d1a4e443af7a';

-- 15. Power Grip Primer -- sin tono
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/84713_OpenA_v2_R.avif?v=1778272105'
where id = '1a063864-ce2c-4d4f-99c7-081f50194d2c';

-- 16. Primer-Infused Matte Bronzer -- Catching Rays
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/FCBRZ_83095_OpenA_R.png?v=1776967368',
  tonos = jsonb_set(tonos, '{0,hex}', '"#CA875D"')
where id = '2721441b-aa35-4757-b3e5-62efa5ebdda6';

-- 18/19. Monochromatic Multi-Stick -- Bronzed Cherry / Dazzling Peony (URL legacy)
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/81346_OpenA_R.png?v=1776967351',
  tonos = jsonb_set(tonos, '{0,hex}', '"#B2584D"')
where id = 'fcb91c86-b422-44cc-b5c5-8e4eada0fd71';

update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/81346_OpenA_R.png?v=1776967351',
  tonos = jsonb_set(tonos, '{0,hex}', '"#DD8184"')
where id = 'e3ba61a6-5591-48c1-9d2c-519829291238';

-- 20. Daily Dew Stick -- Iridescent (discontinuado en elfcosmetics.com, imagen de Amazon a pedido)
update public.productos set
  imagen_url = 'https://m.media-amazon.com/images/I/41CIYWn1G3L._SL1500_.jpg',
  tonos = jsonb_set(tonos, '{0,hex}', '"#EFE3D8"')
where id = 'b85a715f-66ca-4899-a476-71ee0eeccdb6';

-- 22. Power Grip Dewy Setting Spray -- sin tono
update public.productos set
  imagen_url = 'https://cdn.shopify.com/s/files/1/0661/2251/4520/files/84759_Open_A_V9_R.png?v=1776967370'
where id = 'c1df7f6a-2884-4c71-986f-1d76c0ea67f8';

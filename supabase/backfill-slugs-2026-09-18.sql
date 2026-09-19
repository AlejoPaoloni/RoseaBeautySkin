-- Backfill de slugs para los 38 productos ya cargados.
-- Generado con slugProducto() de lib/slug.ts sobre los datos reales, en
-- orden por created_at: el primero de cada nombre repetido se queda con el
-- slug base y el resto lleva el tono como desempate.
-- Correr DESPUES de la migracion 009.

-- Pocket Bronze Long-Wearing Cream Bronzer
update public.productos set slug = 'rhode-pocket-bronze-long-wearing-cream-bronzer'
where id = '0875aa12-77d9-4f57-b353-5d4a4e3fef18';

-- Glazing Mist Hydrating Face Spray
update public.productos set slug = 'rhode-glazing-mist-hydrating-face-spray'
where id = '0f39b8a8-8bce-4f84-932b-7f214d53e1f9';

-- Mini Major Headlines Double-Take Crème & Powder Blush Duo
update public.productos set slug = 'patrick-ta-mini-major-headlines-double-take-creme-y-powder-blush-duo'
where id = '35327be8-696f-44a5-9a74-030b9783cdd1';

-- Glazing Milk Hydrating Ceramide Facial Essence
update public.productos set slug = 'rhode-glazing-milk-hydrating-ceramide-facial-essence'
where id = '5e9deb3a-f7e3-4780-9c95-ab858a1ee8a5';

-- Pocket Blush Buildable Hydrating Cream Blush
update public.productos set slug = 'rhode-pocket-blush-buildable-hydrating-cream-blush'
where id = '62c04ed7-636d-4cfc-8b54-6686901e1ed3';

-- Soft Pinch Liquid Blush
update public.productos set slug = 'rare-beauty-by-selena-gomez-soft-pinch-liquid-blush'
where id = '635230d0-ebcf-41d5-9f4e-684bd62c45d6';

-- Soft Pinch Lip Oil Stick
update public.productos set slug = 'rare-beauty-by-selena-gomez-soft-pinch-lip-oil-stick'
where id = '811a8356-77bc-4de4-b4de-fd819d00445f';

-- Perfect Strokes Universal Volumizing Mascara
update public.productos set slug = 'rare-beauty-by-selena-gomez-perfect-strokes-universal-volumizing'
where id = '9cb8c0f1-2fe8-4408-a128-9a93ee001acf';

-- Gloss Bomb Universal Lip Luminizer
update public.productos set slug = 'fenty-beauty-by-rihanna-gloss-bomb-universal-lip-luminizer'
where id = 'af2247aa-7ce4-4fbc-9ad4-f67a65f6339f';

-- Peptide Lip Tint Nourishing Glaze
update public.productos set slug = 'rhode-peptide-lip-tint-nourishing-glaze'
where id = 'b989949e-e5ab-4f71-98f4-d5fb56fbbe13';

-- Mini 24-HR Brow Setter Clear Brow Gel with Lamination Effect
update public.productos set slug = 'benefit-cosmetics-mini-24-hr-brow-setter-clear-brow-gel-with'
where id = 'c571309a-380e-499a-a9fb-6e909dae18a0';

-- Mini Positive Light Liquid Luminizer
update public.productos set slug = 'rare-beauty-by-selena-gomez-mini-positive-light-liquid-luminizer'
where id = 'e4c31816-599a-4b6d-b197-6340e2ea56e6';

-- Highlight Milk Multipurpose Luminizer
update public.productos set slug = 'rhode-highlight-milk-multipurpose-luminizer'
where id = 'fa507fe1-bd7b-476e-a4c0-556bdfea84f6';

-- Barrier Butter Intensive Moisturizing Balm
update public.productos set slug = 'rhode-barrier-butter-intensive-moisturizing-balm'
where id = '9b2e9953-98c9-4ea9-8ea6-c363b2f16cd8';

-- Mini Mix Eyeshadow Palette
update public.productos set slug = 'sephora-collection-mini-mix-eyeshadow-palette'
where id = '74c130c7-1578-4fa7-8716-d9d75e2103d9';

-- Power Grip Primer (24 ml)
update public.productos set slug = 'elf-cosmetics-power-grip-primer-24-ml'
where id = '1a063864-ce2c-4d4f-99c7-081f50194d2c';

-- Primer-Infused Matte Bronzer
update public.productos set slug = 'elf-cosmetics-primer-infused-matte-bronzer'
where id = '2721441b-aa35-4757-b3e5-62efa5ebdda6';

-- Smoky Kohl Eyeliner
update public.productos set slug = 'elf-cosmetics-smoky-kohl-eyeliner'
where id = '31075fe1-d812-403b-bf33-7917b1204f98';

-- Glow Reviver Lip Oil Glimmer
update public.productos set slug = 'elf-cosmetics-glow-reviver-lip-oil-glimmer'
where id = '52a72569-4bb5-4913-af74-f67d0e063220';

-- Hydrating Camo Concealer
update public.productos set slug = 'elf-cosmetics-hydrating-camo-concealer'
where id = '811f62f9-9b52-4548-9208-a9b06a09f2e7';

-- Hydrating Camo Concealer
update public.productos set slug = 'elf-cosmetics-hydrating-camo-concealer-fair-beige'
where id = '8552afd5-b235-4d3c-af7b-d83c5b3f8c00';

-- Bronzing Drops
update public.productos set slug = 'elf-cosmetics-bronzing-drops'
where id = '945ee40d-c858-45e8-88fc-d1a4e443af7a';

-- Glow Reviver Plumping Lip Oil
update public.productos set slug = 'elf-cosmetics-glow-reviver-plumping-lip-oil'
where id = '9df2cb6f-b008-45c6-9515-2d9dc80ad329';

-- Hydrating Camo Concealer
update public.productos set slug = 'elf-cosmetics-hydrating-camo-concealer-fair-warm'
where id = 'ae5908c0-60f9-4850-acd6-2c44ee10f9c0';

-- Lash 'N Roll Mascara
update public.productos set slug = 'elf-cosmetics-lash-n-roll-mascara'
where id = 'af41252a-0ce5-412a-944c-c770ba827629';

-- Primer-Infused Matte Blush
update public.productos set slug = 'elf-cosmetics-primer-infused-matte-blush'
where id = 'b6509f3a-7e34-41ad-ba58-ed50209236e7';

-- Daily Dew Stick
update public.productos set slug = 'elf-cosmetics-daily-dew-stick'
where id = 'b85a715f-66ca-4899-a476-71ee0eeccdb6';

-- Power Grip Dewy Setting Spray (80 ml)
update public.productos set slug = 'elf-cosmetics-power-grip-dewy-setting-spray-80-ml'
where id = 'c1df7f6a-2884-4c71-986f-1d76c0ea67f8';

-- Halo Glow Setting Powder
update public.productos set slug = 'elf-cosmetics-halo-glow-setting-powder'
where id = 'd8a344a8-a144-4dcf-b420-e569dafcb95a';

-- Brow Laminating Gel
update public.productos set slug = 'elf-cosmetics-brow-laminating-gel'
where id = 'de4d7a0a-e994-4545-98c9-d145893e4594';

-- Monochromatic Multi-Stick
update public.productos set slug = 'elf-cosmetics-monochromatic-multi-stick'
where id = 'e3ba61a6-5591-48c1-9d2c-519829291238';

-- Cream Glide Lip Liner
update public.productos set slug = 'elf-cosmetics-cream-glide-lip-liner'
where id = 'f6d8586d-efa7-4399-850c-8a1b9b2ecdf7';

-- Monochromatic Multi-Stick
update public.productos set slug = 'elf-cosmetics-monochromatic-multi-stick-bronzed-cherry'
where id = 'fcb91c86-b422-44cc-b5c5-8e4eada0fd71';

-- Halo Glow Liquid Filter
update public.productos set slug = 'elf-cosmetics-halo-glow-liquid-filter'
where id = 'fed983d6-7fa8-487b-b6ad-408d8ceb7b08';

-- Halo Glow Liquid Filter
update public.productos set slug = 'elf-cosmetics-halo-glow-liquid-filter-4-medium-neutral'
where id = '873ccfa9-aafc-4740-90d5-dbbba294f4dd';

-- Smoky Kohl Eyeliner
update public.productos set slug = 'elf-cosmetics-smoky-kohl-eyeliner-brownie-points'
where id = 'a1c93785-78d1-4996-8083-6e4f78b56fac';

-- Cream Glide Lip Liner
update public.productos set slug = 'elf-cosmetics-cream-glide-lip-liner-pinky-swear'
where id = '83dc8038-623c-4266-afba-ebc4ebac5399';

-- Soft Pinch Liquid Blush
update public.productos set slug = 'rare-beauty-by-selena-gomez-soft-pinch-liquid-blush-hope'
where id = '1467a40c-4941-4e95-8e48-0c98821672dd';



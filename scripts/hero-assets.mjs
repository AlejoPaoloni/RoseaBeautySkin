/**
 * Genera los recortes transparentes del hero a partir de las fotos del catalogo.
 *
 * Se corre UNA sola vez (o cuando cambien los productos del hero); el resultado
 * queda como asset estatico en public/hero/. En runtime no se hace ningun
 * procesamiento de imagen.
 *
 *   node scripts/hero-assets.mjs
 *
 * Nota: usa `sharp`, que ya viene instalado como dependencia de Next.js. No se
 * agrego ninguna dependencia nueva al proyecto.
 *
 * Tecnica: las fotos de catalogo son de estudio sobre blanco puro (255,255,255).
 * Se extrae el alpha con un "white matte":
 *   1. flood fill desde los bordes atravesando solo pixeles claros -> zona fondo
 *      (evita perder partes blancas del producto que no tocan el borde)
 *   2. alpha por rampa de luminancia dentro de esa zona (bordes suaves)
 *   3. descontaminacion de color: se le quita el blanco mezclado a los pixeles
 *      semi-transparentes, que es lo que produce el halo blanco
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SALIDA = path.join(process.cwd(), "public", "hero");

// Pixeles con luminancia >= UMBRAL_FONDO son candidatos a fondo. Tambien define
// la rampa de alpha: 255 -> transparente, UMBRAL_FONDO -> opaco.
const UMBRAL_FONDO = 236;
// Alto final del recorte. En CSS se muestran como maximo a ~210px de alto, asi
// que 520 cubre pantallas de 2.5x sin cargar imagenes gigantes.
const ALTO_SALIDA = 520;
const PADDING = 6;

// `origen` recorta la foto original (1000x1000) antes de extraer el alpha. Se
// usa cuando la foto de catalogo trae mas de un objeto y solo queremos uno.
const PRODUCTOS = [
  {
    slug: "soft-pinch-blush",
    sku: "s2712867",
    // La foto original muestra la caja + el frasco; nos quedamos con el frasco.
    origen: { left: 650, top: 0, width: 350, height: 1000 },
  },
  { slug: "highlight-milk", sku: "s2981108" },
  { slug: "pocket-bronze", sku: "s2981041" },
  { slug: "peptide-lip-tint", sku: "s2896132" },
];

const urlDe = (sku) =>
  `https://www.sephora.com/productimages/sku/${sku}-main-zoom.jpg?imwidth=1000`;

const luminancia = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Marca la zona de fondo: flood fill desde los bordes por pixeles claros. */
function zonaFondo(data, w, h, ch) {
  const fondo = new Uint8Array(w * h);
  const cola = new Int32Array(w * h);
  let cabeza = 0;
  let cima = 0;

  const encolar = (x, y) => {
    const i = y * w + x;
    if (fondo[i]) return;
    const p = i * ch;
    if (luminancia(data[p], data[p + 1], data[p + 2]) < UMBRAL_FONDO) return;
    fondo[i] = 1;
    cola[cima++] = i;
  };

  for (let x = 0; x < w; x++) {
    encolar(x, 0);
    encolar(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    encolar(0, y);
    encolar(w - 1, y);
  }

  while (cabeza < cima) {
    const i = cola[cabeza++];
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) encolar(x - 1, y);
    if (x < w - 1) encolar(x + 1, y);
    if (y > 0) encolar(x, y - 1);
    if (y < h - 1) encolar(x, y + 1);
  }

  return fondo;
}

async function recortar({ slug, sku, origen }) {
  const respuesta = await fetch(urlDe(sku));
  if (!respuesta.ok) throw new Error(`${slug}: HTTP ${respuesta.status}`);
  const original = Buffer.from(await respuesta.arrayBuffer());

  let fuente = sharp(original);
  if (origen) fuente = sharp(await fuente.extract(origen).toBuffer());

  const { data, info } = await fuente
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  const fondo = zonaFondo(data, w, h, ch);
  const rango = 255 - UMBRAL_FONDO;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < w * h; i++) {
    const p = i * ch;
    let alpha = 255;

    if (fondo[i]) {
      const lum = luminancia(data[p], data[p + 1], data[p + 2]);
      const a = Math.min(1, Math.max(0, (255 - lum) / rango));
      alpha = Math.round(a * 255);

      if (a > 0 && a < 1) {
        // Descontaminacion: el pixel observado es producto mezclado con blanco.
        // Se despeja el color real para que no quede halo claro en el borde.
        for (let c = 0; c < 3; c++) {
          const real = (data[p + c] - (1 - a) * 255) / a;
          data[p + c] = Math.round(Math.min(255, Math.max(0, real)));
        }
      }
    }

    data[p + 3] = alpha;

    if (alpha > 8) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`${slug}: no quedo contenido opaco`);

  const izq = Math.max(0, minX - PADDING);
  const arr = Math.max(0, minY - PADDING);
  const ancho = Math.min(w - izq, maxX - minX + 1 + PADDING * 2);
  const alto = Math.min(h - arr, maxY - minY + 1 + PADDING * 2);

  const recorte = sharp(data, { raw: { width: w, height: h, channels: ch } })
    .extract({ left: izq, top: arr, width: ancho, height: alto })
    .resize({ height: ALTO_SALIDA, fit: "inside", withoutEnlargement: true });

  const webp = await recorte.clone().webp({ quality: 86, alphaQuality: 100 }).toBuffer();
  await writeFile(path.join(SALIDA, `${slug}.webp`), webp);

  const meta = await sharp(webp).metadata();
  console.log(
    `${slug.padEnd(18)} ${String(meta.width).padStart(4)}x${meta.height}  ` +
      `${(webp.length / 1024).toFixed(1)} KB`
  );

  return { slug, buffer: await recorte.clone().png().toBuffer(), meta };
}

/** Hoja de contacto sobre fondo rosea para revisar halos y sombras residuales. */
async function hojaDeContacto(items) {
  const alto = 560;
  const anchos = items.map((i) => i.meta.width + 40);
  const ancho = anchos.reduce((a, b) => a + b, 0);

  let x = 0;
  const capas = items.map((item) => {
    const left = x + 20;
    x += item.meta.width + 40;
    return { input: item.buffer, left, top: Math.round((alto - item.meta.height) / 2) };
  });

  const fondoSvg = Buffer.from(
    `<svg width="${ancho}" height="${alto}">
       <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#edc7c0"/><stop offset="1" stop-color="#faf1ef"/>
       </linearGradient></defs>
       <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
     </svg>`
  );

  await sharp(fondoSvg)
    .composite(capas)
    .png()
    .toFile(path.join(SALIDA, "_revision.png"));
  console.log("\nhoja de contacto -> public/hero/_revision.png");
}

await mkdir(SALIDA, { recursive: true });
const items = [];
for (const p of PRODUCTOS) items.push(await recortar(p));

// La hoja de contacto es solo para revisar el recorte a ojo; no es un asset del
// sitio, por eso hay que pedirla explicitamente.
if (process.argv.includes("--revision")) await hojaDeContacto(items);

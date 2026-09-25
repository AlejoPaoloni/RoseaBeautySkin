/**
 * Deja las fotos de producto con fondo transparente.
 *
 * Las fotos de catalogo de las tiendas vienen sobre fondo blanco de estudio.
 * En la landing las cards y la ficha van sobre rosea-50, asi que un fondo
 * blanco se recorta como un rectangulo visible alrededor del producto. Las
 * fotos que ya estaban en el catalogo tienen fondo transparente; esto pone al
 * resto en la misma condicion.
 *
 *   node scripts/quitar-fondo.mjs
 *
 * Es seguro repetirlo: saltea las fotos que ya tienen el borde transparente.
 * Con --probar no toca nada, solo informa cuales procesaria.
 *
 * COMO RECORTA — y por que no es "borrar todo lo blanco":
 * varios productos son blancos o casi (envases claros, texto blanco, el espejo
 * de un compact). Borrar todo pixel blanco les haria agujeros. En vez de eso
 * se hace un relleno por inundacion desde los cuatro bordes de la imagen: solo
 * desaparece el blanco CONECTADO AL MARCO, que es el fondo. Todo blanco
 * rodeado de producto queda intacto.
 */
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  actualizarImagenUrl,
  borrarDelBucket,
  descargar,
  leerEnv,
  listarProductos,
  login,
  subirAlBucket,
} from "./supabase-cli.mjs";

const CALIDAD_WEBP = 85;
// Un pixel es fondo si es casi blanco Y casi gris (sin color): entra el blanco
// del estudio y su sombra suave, pero no un rosa o un beige palido.
const UMBRAL_CLARO = 238;
const MAX_CROMA = 12;

const esFondo = (r, g, b) =>
  Math.min(r, g, b) >= UMBRAL_CLARO && Math.max(r, g, b) - Math.min(r, g, b) <= MAX_CROMA;

/** true si el marco de la imagen ya es transparente (nada que hacer). */
async function yaRecortada(buffer) {
  const meta = await sharp(buffer).metadata();
  if (!meta.hasAlpha) return false;
  const { data } = await sharp(buffer)
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: 4, height: 4 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data[3] < 10;
}

async function recortar(entrada) {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  // 1) Relleno por inundacion desde los bordes.
  const fondo = new Uint8Array(w * h);
  const cola = new Int32Array(w * h);
  let ini = 0;
  let fin = 0;
  const empujar = (x, y) => {
    const i = y * w + x;
    if (fondo[i]) return;
    const o = i * 4;
    if (!esFondo(data[o], data[o + 1], data[o + 2])) return;
    fondo[i] = 1;
    cola[fin++] = i;
  };
  for (let x = 0; x < w; x++) {
    empujar(x, 0);
    empujar(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    empujar(0, y);
    empujar(w - 1, y);
  }
  while (ini < fin) {
    const i = cola[ini++];
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) empujar(x - 1, y);
    if (x < w - 1) empujar(x + 1, y);
    if (y > 0) empujar(x, y - 1);
    if (y < h - 1) empujar(x, y + 1);
  }

  // 2) Morder 1px hacia adentro: el borde real del producto viene mezclado con
  // el blanco del fondo (antialias). Si se deja, sobre un fondo que no es
  // blanco queda un hilo claro rodeando al producto.
  const previo = fondo.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (previo[i]) continue;
      if (previo[i - 1] || previo[i + 1] || previo[i - w] || previo[i + w]) fondo[i] = 1;
    }
  }

  for (let i = 0; i < w * h; i++) if (fondo[i]) data[i * 4 + 3] = 0;

  // 3) Suavizar el filo del alfa para que el contorno no quede escalonado.
  const crudo = { raw: { width: w, height: h, channels: 4 } };
  const alfa = await sharp(data, crudo).extractChannel(3).blur(0.6).toBuffer();
  const rgb = await sharp(data, crudo).removeAlpha().toBuffer();
  const buffer = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(alfa, { raw: { width: w, height: h, channels: 1 } })
    .webp({ quality: CALIDAD_WEBP })
    .toBuffer();

  const quitado = fondo.reduce((a, b) => a + b, 0);
  return { buffer, pct: (quitado / (w * h)) * 100 };
}

async function main() {
  const soloProbar = process.argv.includes("--probar");
  const url = leerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = leerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(`Fondo transparente en las fotos de producto${soloProbar ? " (modo prueba: no escribe nada)" : ""}\n`);
  let token;
  try {
    token = await login(url, anon, rl);
  } finally {
    rl.close();
  }

  const productos = await listarProductos(url, anon, token);
  console.log(`\nRevisando ${productos.length} producto(s)...\n`);

  let ok = 0;
  let saltados = 0;
  let fallidos = 0;
  for (const p of productos) {
    if (!p.imagen_url) continue;
    try {
      const original = await descargar(p.imagen_url);
      if (await yaRecortada(original)) {
        saltados += 1;
        continue;
      }
      process.stdout.write(`- ${p.nombre}... `);
      const { buffer, pct } = await recortar(original);
      if (soloProbar) {
        console.log(`quitaría ${pct.toFixed(0)}% de fondo (${(buffer.length / 1024).toFixed(0)} KB)`);
        ok += 1;
        continue;
      }
      const nueva = await subirAlBucket(url, anon, token, buffer, `${randomUUID()}.webp`);
      await actualizarImagenUrl(url, anon, token, p.id, nueva);
      // Recien despues de que la base apunta a la nueva se borra la vieja, para
      // no dejar al producto sin foto si algo falla en el medio.
      await borrarDelBucket(url, anon, token, p.imagen_url);
      console.log(`OK (${pct.toFixed(0)}% de fondo, ${(buffer.length / 1024).toFixed(0)} KB)`);
      ok += 1;
    } catch (e) {
      console.log(`FALLÓ: ${e.message}`);
      fallidos += 1;
    }
  }

  console.log(
    `\nListo: ${ok} ${soloProbar ? "para procesar" : "recortada(s)"}, ${saltados} ya estaban, ${fallidos} fallida(s).`
  );
}

main().catch((e) => {
  console.error("\nError:", e.message);
  process.exitCode = 1;
});

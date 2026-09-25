/**
 * Migra las fotos de producto que hoy son hotlinks a un sitio ajeno hacia el
 * bucket propio de Supabase (productos-img). Sephora, Shopify y compania
 * pueden reordenar o borrar esas rutas en cualquier momento sin avisar — al
 * pasar la foto al bucket propio, el catalogo deja de depender de un sitio que
 * no se controla. Ademas el optimizador de imagenes solo acepta el bucket
 * propio (ver lib/imagenes.ts), asi que una foto externa ni siquiera se ve.
 *
 * Se corre cada vez que se cargan productos con foto externa. Es seguro
 * repetirlo: los que ya tienen foto propia se saltean.
 *
 *   node scripts/migrar-imagenes.mjs
 *
 * Pide email, contraseña y, si la cuenta tiene verificacion en dos pasos, el
 * codigo de 6 digitos. Nada de eso se guarda: es solo la sesion de esta corrida.
 *
 * Usa `sharp`, que ya viene instalado como dependencia de Next.js: mismo
 * resize + calidad que lib/imagen.ts (800px, webp 0.85), asi las fotos
 * migradas pesan igual que las que suba el admin desde el formulario.
 */
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  actualizarImagenUrl,
  descargar,
  esPropia,
  leerEnv,
  listarProductos,
  login,
  subirAlBucket,
} from "./supabase-cli.mjs";

const MAX_DIM = 800;
const CALIDAD_WEBP = 85;

async function comprimir(buffer) {
  // fit "inside" + withoutEnlargement replica el scale-down de lib/imagen.ts
  // sin agrandar fotos que ya vinieran chicas.
  return sharp(buffer)
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .webp({ quality: CALIDAD_WEBP })
    .toBuffer();
}

async function main() {
  const url = leerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = leerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("Migración de fotos externas → tu bucket de Supabase\n");
  let token;
  try {
    token = await login(url, anon, rl);
  } finally {
    // En finally: si el login falla, la consola tiene que cerrarse igual o Node
    // aborta al salir con un "Assertion failed" de libuv que tapa el error real.
    rl.close();
  }

  console.log("Buscando productos con foto externa...");
  const productos = await listarProductos(url, anon, token);
  const pendientes = productos.filter((p) => p.imagen_url && !esPropia(p.imagen_url));

  if (pendientes.length === 0) {
    console.log("Nada para migrar: todas las fotos ya son propias.");
    return;
  }
  console.log(`${pendientes.length} producto(s) con foto externa.\n`);

  let ok = 0;
  let fallidos = 0;
  for (const p of pendientes) {
    process.stdout.write(`- ${p.nombre}... `);
    try {
      const buffer = await comprimir(await descargar(p.imagen_url));
      const nueva = await subirAlBucket(url, anon, token, buffer, `${randomUUID()}.webp`);
      await actualizarImagenUrl(url, anon, token, p.id, nueva);
      console.log(`OK (${(buffer.length / 1024).toFixed(0)} KB)`);
      ok += 1;
    } catch (e) {
      console.log(`FALLÓ: ${e.message}`);
      fallidos += 1;
    }
  }

  console.log(`\nListo: ${ok} migrada(s), ${fallidos} fallida(s).`);
  if (fallidos > 0) {
    console.log("Las que fallaron siguen apuntando afuera. Es seguro correr el script de nuevo.");
  }
}

main().catch((e) => {
  console.error("\nError:", e.message);
  // exitCode y no process.exit(): salir de golpe mientras la consola todavia
  // tiene handles abiertos hace que Node aborte con un "Assertion failed" de
  // libuv que se imprime despues del error y lo tapa.
  process.exitCode = 1;
});

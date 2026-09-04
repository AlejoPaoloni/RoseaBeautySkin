/**
 * Migra las fotos de producto que hoy son hotlinks a sephora.com hacia el
 * bucket propio de Supabase (productos-img). Sephora puede reordenar o
 * borrar esas rutas en cualquier momento sin avisar — al pasar la foto al
 * bucket propio, el catalogo deja de depender de un sitio que no se controla.
 *
 * Se corre UNA sola vez (o de nuevo mas adelante si aparece algun producto
 * con foto externa). Es seguro repetirlo: los productos que ya tienen foto
 * propia se saltean.
 *
 *   node scripts/migrar-imagenes.mjs
 *
 * Pide el email y la contraseña del usuario admin por consola — no se
 * guardan en ningun lado, solo se usan para la sesion de esta corrida.
 *
 * Usa `sharp`, que ya viene instalado como dependencia de Next.js: mismo
 * resize + calidad que lib/imagen.ts (800px, webp 0.85), asi las fotos
 * migradas pesan igual que las que suba el admin desde el formulario.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_DIM = 800;
const CALIDAD_WEBP = 85;
const BUCKET = "productos-img";
// Sin esto, Sephora devuelve 403 a un fetch sin cara de navegador.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function leerEnv(clave) {
  const env = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(new RegExp(`${clave}=(.*)`));
  if (!m) throw new Error(`Falta ${clave} en .env.local`);
  return m[1].trim();
}

async function iniciarSesion(url, anon, email, password) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anon },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`No se pudo iniciar sesión: ${data.error_description || data.msg || r.status}`);
  }
  return data.access_token;
}

async function descargarYComprimir(imagenUrl) {
  const r = await fetch(imagenUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!r.ok) throw new Error(`no se pudo descargar (${r.status})`);
  const original = Buffer.from(await r.arrayBuffer());
  // fit: "inside" + withoutEnlargement replica el scale-down de
  // lib/imagen.ts sin agrandar fotos que ya vinieran chicas.
  return sharp(original)
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .webp({ quality: CALIDAD_WEBP })
    .toBuffer();
}

async function subirAlBucket(url, anon, token, buffer, nombre) {
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/webp",
    },
    body: buffer,
  });
  if (!r.ok) throw new Error(`no se pudo subir (${r.status}): ${await r.text()}`);
  return `${url}/storage/v1/object/public/${BUCKET}/${nombre}`;
}

async function actualizarImagenUrl(url, anon, token, id, imagenUrl) {
  const r = await fetch(`${url}/rest/v1/productos?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ imagen_url: imagenUrl }),
  });
  if (!r.ok) throw new Error(`no se pudo actualizar el producto (${r.status}): ${await r.text()}`);
}

async function main() {
  const url = leerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = leerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("Migración de fotos: sephora.com → tu bucket de Supabase\n");
  const email = (await rl.question("Email de admin: ")).trim();
  const password = (await rl.question("Contraseña: ")).trim();
  rl.close();

  console.log("\nIniciando sesión...");
  const token = await iniciarSesion(url, anon, email, password);

  console.log("Buscando productos con foto externa...");
  const r = await fetch(`${url}/rest/v1/productos?select=id,nombre,imagen_url`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  const productos = await r.json();
  const marcadorPropio = `/storage/v1/object/public/${BUCKET}/`;
  const pendientes = productos.filter(
    (p) => p.imagen_url && !p.imagen_url.includes(marcadorPropio)
  );

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
      const buffer = await descargarYComprimir(p.imagen_url);
      const nombreArchivo = `${randomUUID()}.webp`;
      const nuevaUrl = await subirAlBucket(url, anon, token, buffer, nombreArchivo);
      await actualizarImagenUrl(url, anon, token, p.id, nuevaUrl);
      console.log(`OK (${(buffer.length / 1024).toFixed(0)} KB)`);
      ok += 1;
    } catch (e) {
      console.log(`FALLÓ: ${e.message}`);
      fallidos += 1;
    }
  }

  console.log(`\nListo: ${ok} migrada(s), ${fallidos} fallida(s).`);
  if (fallidos > 0) {
    console.log(
      "Las que fallaron siguen apuntando a sephora.com. Es seguro correr el script de nuevo: las que ya se migraron se saltean."
    );
  }
}

main().catch((e) => {
  console.error("\nError:", e.message);
  process.exit(1);
});

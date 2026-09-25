/**
 * Piezas compartidas por los scripts de mantenimiento que corren a mano
 * (migrar-imagenes.mjs, quitar-fondo.mjs): leer el .env.local, iniciar sesion
 * como admin —incluido el segundo factor— y tocar el bucket y la tabla.
 *
 * Vive aca y no duplicado en cada script porque el login con MFA es la parte
 * mas facil de romper: si cambia, tiene que cambiar en un solo lugar.
 */
import fs from "node:fs";
import path from "node:path";

export const BUCKET = "productos-img";
export const MARCADOR_PROPIO = `/storage/v1/object/public/${BUCKET}/`;

// Sin esto, algunos sitios (Sephora entre ellos) devuelven 403 a un fetch que
// no tiene cara de navegador.
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export function leerEnv(clave) {
  const env = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(new RegExp(`${clave}=(.*)`));
  if (!m) throw new Error(`Falta ${clave} en .env.local (¿estás parado en la raíz del proyecto?)`);
  return m[1].trim();
}

export function esPropia(imagenUrl) {
  return !!imagenUrl && imagenUrl.includes(MARCADOR_PROPIO);
}

/**
 * Devuelve un token que sirve para escribir. Si la cuenta tiene verificacion
 * en dos pasos, la contrasena sola da una sesion "aal1" y las politicas de la
 * base (migracion 010) rechazan toda escritura: hay que subirla a "aal2" con
 * el codigo de la app, igual que hace el panel al entrar.
 */
export async function iniciarSesion(url, anon, email, password, rl) {
  const pedir = async (ruta, cuerpo, token) => {
    const r = await fetch(`${url}/auth/v1/${ruta}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(cuerpo),
    });
    const data = await r.json();
    if (!r.ok) {
      throw new Error(data.error_description || data.msg || data.error || `HTTP ${r.status}`);
    }
    return data;
  };

  let sesion;
  try {
    sesion = await pedir("token?grant_type=password", { email, password });
  } catch (e) {
    throw new Error(`No se pudo iniciar sesión: ${e.message}`);
  }

  const factor = (sesion.user?.factors || []).find(
    (f) => f.status === "verified" && f.factor_type === "totp"
  );
  if (!factor) return sesion.access_token;

  console.log("\nLa cuenta tiene verificación en dos pasos.");
  const codigo = (await rl.question("Código de 6 dígitos de tu app: ")).replace(/\D/g, "");
  if (codigo.length !== 6) throw new Error("El código tiene que ser de 6 dígitos.");

  try {
    const desafio = await pedir(`factors/${factor.id}/challenge`, {}, sesion.access_token);
    const verificado = await pedir(
      `factors/${factor.id}/verify`,
      { challenge_id: desafio.id, code: codigo },
      sesion.access_token
    );
    return verificado.access_token;
  } catch (e) {
    throw new Error(
      `No se pudo verificar el código (${e.message}). Ojo que vence cada 30 segundos: probá con el que muestre la app en este momento.`
    );
  }
}

export async function listarProductos(url, anon, token, campos = "id,nombre,imagen_url") {
  const r = await fetch(`${url}/rest/v1/productos?select=${campos}`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`No se pudieron leer los productos (${r.status})`);
  return r.json();
}

export async function descargar(imagenUrl) {
  const r = await fetch(imagenUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!r.ok) throw new Error(`no se pudo descargar (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

export async function subirAlBucket(url, anon, token, buffer, nombre, tipo = "image/webp") {
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": tipo },
    body: buffer,
  });
  if (!r.ok) throw new Error(`no se pudo subir (${r.status}): ${await r.text()}`);
  return `${url}/storage/v1/object/public/${BUCKET}/${nombre}`;
}

/** No relanza: dejar un archivo huerfano es molesto, no grave. */
export async function borrarDelBucket(url, anon, token, imagenUrl) {
  if (!esPropia(imagenUrl)) return;
  const nombre = decodeURIComponent(imagenUrl.split(MARCADOR_PROPIO)[1]);
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: "DELETE",
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) console.warn(`    (no se pudo borrar la foto anterior: ${r.status})`);
}

export async function actualizarImagenUrl(url, anon, token, id, imagenUrl) {
  const r = await fetch(`${url}/rest/v1/productos?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ imagen_url: imagenUrl }),
  });
  if (!r.ok) throw new Error(`no se pudo actualizar el producto (${r.status}): ${await r.text()}`);
  // Con RLS, una fila que no pasa la politica no da error: devuelve 0 filas.
  // Sin este chequeo el script diria "OK" sin haber guardado nada.
  const filas = await r.json();
  if (!Array.isArray(filas) || filas.length === 0) {
    throw new Error("la base aceptó el pedido pero no actualizó ninguna fila (¿sesión sin permisos?)");
  }
}

/** Pide email, contraseña y (si hace falta) el código, y devuelve el token. */
export async function login(url, anon, rl) {
  const email = (await rl.question("Email de admin: ")).trim();
  const password = (await rl.question("Contraseña: ")).trim();
  console.log("\nIniciando sesión...");
  return iniciarSesion(url, anon, email, password, rl);
}

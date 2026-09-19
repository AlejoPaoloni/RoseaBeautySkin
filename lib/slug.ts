import type { Producto } from "./types";

// Largo maximo del slug. Google no penaliza por largo, pero una URL que no
// entra en una linea al compartirla por WhatsApp se lee peor.
const LARGO_MAXIMO = 70;

// Kebab-case sin acentos ni simbolos: "Crème & Powder" -> "creme-y-powder".
export function slugificar(texto: string): string {
  return texto
    // Siglas con puntos a una sola palabra: "e.l.f." -> "elf". Sin esto
    // quedaba "e-l-f-cosmetics", que ademas de feo no matchea como la busca
    // la gente ("elf cosmetics", igual que el dominio de la marca).
    .replace(/\b(?:[a-zA-Z]\.){2,}/g, (sigla) => sigla.replace(/\./g, ""))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas de acento que dejo el NFD
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Corta en el guion anterior al limite para no dejar una palabra partida al
// medio ("...luminiz" en vez de "...luminizer").
function recortar(slug: string): string {
  if (slug.length <= LARGO_MAXIMO) return slug;
  const corte = slug.lastIndexOf("-", LARGO_MAXIMO);
  return slug.slice(0, corte > 20 ? corte : LARGO_MAXIMO).replace(/-+$/, "");
}

// El nombre del tono suele venir con la descripcion pegada
// ("Hope - nude mauve", "Fair Beige — Fair with neutral undertones"):
// para la URL alcanza con la primera parte.
function nombreCortoDeTono(producto: Pick<Producto, "tonos">): string | null {
  const tono = producto.tonos?.[0]?.nombre;
  if (!tono) return null;
  return slugificar(tono.split(/\s[-—–]\s/)[0]) || null;
}

type DatosSlug = Pick<Producto, "nombre" | "marca" | "tonos">;

/**
 * Slug de un producto: marca + nombre, con el tono como desempate.
 *
 * La marca va adelante porque es como se busca ("rhode pocket blush") y
 * porque varios nombres no la incluyen ("Halo Glow Liquid Filter").
 *
 * `tomados` son los slugs que ya existen: 6 productos del catalogo comparten
 * nombre con otro (mismo producto en distinto tono), asi que el tono entra
 * como desempate y recien despues se numera.
 */
export function slugProducto(
  producto: DatosSlug,
  tomados: Iterable<string> = []
): string {
  const ocupados = new Set(tomados);
  const base = recortar(
    slugificar([producto.marca, producto.nombre].filter(Boolean).join(" "))
  );
  if (base && !ocupados.has(base)) return base;

  const tono = nombreCortoDeTono(producto);
  if (tono) {
    const conTono = recortar(`${base}-${tono}`);
    if (!ocupados.has(conTono)) return conTono;
  }

  for (let n = 2; ; n++) {
    const numerado = `${recortar(base)}-${n}`;
    if (!ocupados.has(numerado)) return numerado;
  }
}

// Ruta canonica de la ficha. Cae al uuid si el producto todavia no tiene
// slug (fila cargada a mano, import): la pagina resuelve por los dos.
export function rutaProducto(producto: Pick<Producto, "id" | "slug">): string {
  return `/producto/${producto.slug ?? producto.id}`;
}

// Los ids de Supabase son uuid v4: sirve para distinguir una URL vieja
// (/producto/<uuid>) de una con slug y redirigir la primera a la segunda.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: string): boolean {
  return UUID.test(valor);
}

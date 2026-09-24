// Logica del segundo factor (TOTP), separada de las pantallas para poder
// probarla sin un login real.
//
// Supabase habla de "niveles de garantia" (AAL): aal1 es haber puesto la
// contrasena, aal2 es haber puesto ademas el codigo de la app. La combinacion
// de nivel actual y siguiente dice en que paso esta la persona.

// Los niveles son "aal1" y "aal2", pero el tipo de Supabase los deja como texto
// abierto, asi que aca tambien: un tipo mas estricto no encaja con lo que
// devuelve su API.
export type Garantia = { currentLevel: string | null; nextLevel: string | null };

// Puso la contrasena pero tiene un factor activado y todavia no puso el codigo.
export function faltaSegundoFactor(g: Garantia | null | undefined): boolean {
  return !!g && g.nextLevel === "aal2" && g.currentLevel !== "aal2";
}

// Tiene la verificacion en dos pasos activada (haya puesto ya el codigo o no).
export function tieneMfa(g: Garantia | null | undefined): boolean {
  return !!g && g.nextLevel === "aal2";
}

// El teclado numerico del celular a veces mete espacios ("123 456") y las apps
// de autenticacion muestran el codigo separado en dos mitades.
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, 6);
}

export function codigoCompleto(codigo: string): boolean {
  return /^\d{6}$/.test(codigo);
}

// El QR llega como un data URI de SVG. Si el SVG viene en crudo, el "#" de un
// color (fill="#fff") se lee como el inicio del fragmento y corta el archivo:
// la imagen sale rota y no hay forma de activar nada. Escapado, funciona siempre.
// Si ya viene escapado o en base64, se deja como esta.
export function qrComoImagen(qr: string): string {
  const coma = qr.indexOf(",");
  if (coma === -1) return qr;
  const cuerpo = qr.slice(coma + 1);
  if (!cuerpo.trimStart().startsWith("<")) return qr;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cuerpo)}`;
}

// Supabase exige un nombre distinto por factor de cada usuario: si quedara uno
// a medio activar con el mismo nombre, el siguiente intento fallaria.
export function nombreDeFactor(ahora: Date = new Date()): string {
  return `Rosea Beauty ${ahora.toISOString()}`;
}

import type { Categoria } from "./types";

// Al entrar al detalle de un producto y volver, el catalogo tiene que
// aparecer como quedo: mismos filtros y misma altura de scroll. El estado
// de los filtros vive en React (se pierde al cambiar de pagina), asi que se
// guarda en sessionStorage — por pestaña y sin ensuciar la URL.
//
// La marca de scroll la escribe la card justo antes de navegar al detalle:
// solo cuando existe se restaura, para que entrar al inicio de cero muestre
// el catalogo limpio y no los filtros de la visita anterior.

export interface FiltrosCatalogo {
  categoria: Categoria | null;
  subcategoria: string | null;
  soloDisponibles: boolean;
  busqueda: string;
  precioMin: number;
  precioMax: number;
}

const CLAVE_FILTROS = "rosea:catalogo:filtros";
const CLAVE_SCROLL = "rosea:catalogo:scroll";

// sessionStorage puede tirar excepcion (modo privado viejo, cookies
// bloqueadas): que no ande la restauracion nunca puede romper la landing.
function seguro<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export function guardarFiltrosCatalogo(filtros: FiltrosCatalogo): void {
  seguro(() =>
    sessionStorage.setItem(CLAVE_FILTROS, JSON.stringify(filtros))
  );
}

// La llama la card al navegar al detalle: deja anotado a que altura estaba
// el catalogo para poder devolver a la clienta al mismo lugar.
export function marcarVueltaAlCatalogo(): void {
  seguro(() => sessionStorage.setItem(CLAVE_SCROLL, String(window.scrollY)));
}

export function hayVueltaPendiente(): boolean {
  return seguro(() => sessionStorage.getItem(CLAVE_SCROLL) !== null) ?? false;
}

// Lee lo guardado SIN consumirlo: la marca se borra recien cuando la vuelta
// se aplico de verdad (ver olvidarVuelta). Si se consumiera al leer, el
// doble montaje de efectos de StrictMode se comeria la restauracion — el
// primer montaje la lee, el cleanup cancela el frame y el segundo ya no
// encuentra nada.
export function leerVueltaAlCatalogo(): {
  filtros: FiltrosCatalogo | null;
  scrollY: number;
} | null {
  const scroll = seguro(() => sessionStorage.getItem(CLAVE_SCROLL));
  if (scroll === null) return null;
  const crudo = seguro(() => sessionStorage.getItem(CLAVE_FILTROS));
  let filtros: FiltrosCatalogo | null = null;
  if (crudo) filtros = seguro(() => JSON.parse(crudo) as FiltrosCatalogo);
  return { filtros, scrollY: Number(scroll) || 0 };
}

// La restauracion es de un solo uso: despues de aplicarla, un refresh del
// inicio ya no la repite.
export function olvidarVuelta(): void {
  seguro(() => sessionStorage.removeItem(CLAVE_SCROLL));
}

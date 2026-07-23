export type Categoria = "Maquillajes" | "Skincare";
export type Estado = "Disponible" | "Por Encargo" | "Sin stock";

export interface Tono {
  nombre: string;
  hex: string;
}

export interface Producto {
  id: string;
  nombre: string;
  marca: string | null;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: Categoria;
  subcategoria: string;
  estado: Estado;
  precio: number;
  destacado: boolean;
  tonos: Tono[] | null;
  orden_display: number;
  created_at: string;
}

export const CATEGORIAS: Categoria[] = ["Maquillajes", "Skincare"];

export const ESTADOS: Estado[] = ["Disponible", "Por Encargo", "Sin stock"];

export const SUBCATEGORIAS: Record<Categoria, string[]> = {
  Maquillajes: ["Rostro", "Ojos", "Labios"],
  // Skincare no tiene filtros: subcategoria unica
  Skincare: ["Skincare"],
};

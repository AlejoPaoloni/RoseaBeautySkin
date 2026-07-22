export type Categoria = "Maquillajes" | "Skincare";
export type Estado = "Disponible" | "Por Encargo" | "Sin stock";

export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: Categoria;
  subcategoria: string;
  estado: Estado;
  precio: number;
  destacado: boolean;
  orden_display: number;
  created_at: string;
}

export const CATEGORIAS: Categoria[] = ["Maquillajes", "Skincare"];

export const ESTADOS: Estado[] = ["Disponible", "Por Encargo", "Sin stock"];

export const SUBCATEGORIAS: Record<Categoria, string[]> = {
  Maquillajes: ["Bases & Correctores", "Sombras & Delineadores", "Labiales"],
  Skincare: ["Limpiadoras", "Hidratantes", "Serums & Tratamientos"],
};

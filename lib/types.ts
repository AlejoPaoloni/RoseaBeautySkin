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
  // Costo de compra. null en los productos cargados antes de finanzas.
  costo: number | null;
  // Unidades en mano. null = ese producto no lleva control de stock.
  stock: number | null;
  stock_minimo: number;
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

// --- Finanzas ---

export type CategoriaGasto =
  | "Mercaderia"
  | "Envios"
  | "Packaging"
  | "Publicidad"
  | "Comisiones"
  | "Otros";

export type Canal = "Instagram" | "WhatsApp" | "Presencial" | "Otro";

export interface Gasto {
  id: string;
  // Fecha del gasto en formato YYYY-MM-DD (columna date de Postgres).
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  created_at: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  // null si el producto se borro del catalogo despues de la venta.
  producto_id: string | null;
  // Snapshot: nombre, precio y costo tal como estaban el dia de la venta.
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
}

export interface Venta {
  id: string;
  fecha: string;
  // Nombre suelto tipeado en la venta; queda como fallback de las ventas
  // cargadas antes de que existieran las fichas de clienta.
  cliente: string | null;
  cliente_id: string | null;
  canal: Canal;
  nota: string | null;
  created_at: string;
  items: VentaItem[];
}

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "Mercaderia",
  "Envios",
  "Packaging",
  "Publicidad",
  "Comisiones",
  "Otros",
];

export const CANALES: Canal[] = [
  "Instagram",
  "WhatsApp",
  "Presencial",
  "Otro",
];

// --- Gestión ---

export interface Clienta {
  id: string;
  nombre: string;
  contacto: string | null;
  nota: string | null;
  created_at: string;
}

export type EstadoPedido = "Pedido" | "En camino" | "Llegó" | "Entregado";

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  nombre: string;
  cantidad: number;
  precio_estimado: number;
}

export interface Pedido {
  id: string;
  fecha: string;
  cliente_id: string | null;
  // Nombre suelto, para cuando todavía no hay ficha de clienta.
  cliente_texto: string | null;
  estado: EstadoPedido;
  sena: number;
  nota: string | null;
  // Se completa al convertirlo en venta; sirve para no convertirlo dos veces.
  venta_id: string | null;
  created_at: string;
  items: PedidoItem[];
}

export type Red = "Instagram" | "TikTok" | "Otro";
export type Formato = "Post" | "Reel" | "Story" | "Video" | "Otro";
export type EstadoPublicacion =
  | "Idea"
  | "Guionado"
  | "Grabado"
  | "Editado"
  | "Publicado";

export interface PasoChecklist {
  paso: string;
  hecho: boolean;
}

export interface Publicacion {
  id: string;
  // null = está en el banco de ideas, todavía sin fecha en el calendario.
  fecha: string | null;
  red: Red;
  formato: Formato;
  titulo: string;
  copy: string | null;
  estado: EstadoPublicacion;
  checklist: PasoChecklist[] | null;
  nota: string | null;
  created_at: string;
  // Ids de los productos que promociona la publicación.
  productos: string[];
}

export interface Tarea {
  id: string;
  texto: string;
  hecha: boolean;
  fecha_limite: string | null;
  created_at: string;
}

export const ESTADOS_PEDIDO: EstadoPedido[] = [
  "Pedido",
  "En camino",
  "Llegó",
  "Entregado",
];

export const REDES: Red[] = ["Instagram", "TikTok", "Otro"];

export const FORMATOS: Formato[] = ["Post", "Reel", "Story", "Video", "Otro"];

export const ESTADOS_PUBLICACION: EstadoPublicacion[] = [
  "Idea",
  "Guionado",
  "Grabado",
  "Editado",
  "Publicado",
];

export const PASOS_POR_DEFECTO: string[] = [
  "Guion",
  "Grabar",
  "Editar",
  "Copy",
  "Hashtags",
  "Publicar",
];

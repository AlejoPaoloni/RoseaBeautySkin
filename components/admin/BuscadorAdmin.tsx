"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

// Buscador chico para las listas del admin que crecen con el tiempo
// (Pedidos, Clientas, Tareas): sin esto, encontrar algo puntual se vuelve
// scrollear todo a mano.
export default function BuscadorAdmin({ value, onChange, placeholder }: Props) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Buscar…"}
      aria-label={placeholder ?? "Buscar"}
      className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-rosea-300"
    />
  );
}

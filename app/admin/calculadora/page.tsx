"use client";

import { useEffect, useState } from "react";
import type { Producto } from "@/lib/types";
import { listarProductos } from "@/lib/db";
import { actualizarProducto } from "@/lib/db";
import { formatearPrecio } from "@/lib/catalog";
import {
  calcularPrecio,
  MARGEN_MAXIMO,
  variacionContraActual,
} from "@/lib/precios";

// Estos valores se repiten entre un producto y el siguiente (el dolar del
// dia, el courier de ese pedido), asi que se recuerdan en el navegador para
// no volver a tipearlos en cada calculo. Es comodidad local nada mas: no es
// dato compartido ni que haga falta en otro dispositivo.
const CLAVE_CONTEXTO = "rb-calculadora-contexto";

interface Contexto {
  tipoCambio: string;
  envioPedidoUsd: string;
  unidadesPedido: string;
  costosLocalesArs: string;
  margenPct: string;
  redondeoArs: string;
}

const CONTEXTO_INICIAL: Contexto = {
  tipoCambio: "",
  envioPedidoUsd: "",
  unidadesPedido: "",
  costosLocalesArs: "",
  margenPct: "40",
  redondeoArs: "500",
};

const REDONDEOS = [
  { valor: "0", etiqueta: "Sin redondear" },
  { valor: "100", etiqueta: "A $100" },
  { valor: "500", etiqueta: "A $500" },
  { valor: "1000", etiqueta: "A $1.000" },
];

function Campo({
  etiqueta,
  valor,
  onChange,
  prefijo,
  sufijo,
  placeholder,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  prefijo?: string;
  sufijo?: string;
  placeholder?: string;
  ayuda?: string;
}) {
  return (
    <label className="block text-sm text-neutral-600">
      {etiqueta}
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-neutral-200 px-3 focus-within:border-rosea-300">
        {prefijo && <span className="text-sm text-neutral-400">{prefijo}</span>}
        <input
          type="number"
          min={0}
          step="any"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2 text-sm outline-none"
        />
        {sufijo && <span className="text-sm text-neutral-400">{sufijo}</span>}
      </div>
      {ayuda && <p className="mt-1 text-xs text-neutral-400">{ayuda}</p>}
    </label>
  );
}

function Renglon({
  concepto,
  monto,
  detalle,
}: {
  concepto: string;
  monto: number;
  detalle?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-neutral-600">
        {concepto}
        {detalle && (
          <span className="ml-1 text-xs text-neutral-400">{detalle}</span>
        )}
      </span>
      <span className="shrink-0 text-neutral-800 tabular-nums">
        {formatearPrecio(monto)}
      </span>
    </div>
  );
}

export default function CalculadoraPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [productoId, setProductoId] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [ctx, setCtx] = useState<Contexto>(CONTEXTO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    listarProductos()
      .then(setProductos)
      .finally(() => setCargando(false));
  }, []);

  // localStorage no existe en el servidor y esta pagina se prerenderiza, asi
  // que el primer render tiene que ser igual en los dos lados y los valores
  // guardados entran despues de montar. Leerlos durante el render romperia
  // la hidratacion, que es peor que el re-render que marca la regla.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_CONTEXTO);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setCtx({ ...CONTEXTO_INICIAL, ...JSON.parse(guardado) });
    } catch {
      // Modo incognito o storage bloqueado: se arranca con los valores por
      // defecto, la calculadora funciona igual.
    }
  }, []);

  function actualizarCtx(campo: keyof Contexto, valor: string) {
    const nuevo = { ...ctx, [campo]: valor };
    setCtx(nuevo);
    setGuardado(false);
    try {
      localStorage.setItem(CLAVE_CONTEXTO, JSON.stringify(nuevo));
    } catch {
      // Si no se puede persistir, no pasa nada: solo hay que retipear la
      // proxima vez.
    }
  }

  const producto = productos.find((p) => p.id === productoId) ?? null;

  const resultado = calcularPrecio({
    precioUsd: Number(precioUsd) || 0,
    tipoCambio: Number(ctx.tipoCambio) || 0,
    envioPedidoUsd: Number(ctx.envioPedidoUsd) || 0,
    unidadesPedido: Number(ctx.unidadesPedido) || 0,
    costosLocalesArs: Number(ctx.costosLocalesArs) || 0,
    margenPct: Number(ctx.margenPct) || 0,
    redondeoArs: Number(ctx.redondeoArs) || 0,
  });

  const hayCuenta = resultado.costoTotal > 0;
  const variacion = producto
    ? variacionContraActual(resultado.precioSugerido, producto.precio)
    : null;

  async function guardarEnProducto() {
    if (!producto || !hayCuenta) return;
    setGuardando(true);
    try {
      // El costo que se guarda es el TOTAL, no solo el precio de origen: es
      // lo que tiene que descontar Finanzas para que la ganancia sea real.
      await actualizarProducto(producto.id, {
        precio: resultado.precioSugerido,
        costo: Math.round(resultado.costoTotal),
      });
      setProductos((prev) =>
        prev.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                precio: resultado.precioSugerido,
                costo: Math.round(resultado.costoTotal),
              }
            : p
        )
      );
      setGuardado(true);
    } catch {
      alert("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen bg-rosea-50/50">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rosea-100 bg-white px-6 py-3">
        <h1 className="font-serif text-xl">Calculadora de precios</h1>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-serif text-lg text-rosea-700">El producto</h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-neutral-600">
                  Producto del catálogo
                  <select
                    value={productoId}
                    onChange={(e) => {
                      setProductoId(e.target.value);
                      setGuardado(false);
                    }}
                    disabled={cargando}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                  >
                    <option value="">
                      {cargando ? "Cargando…" : "Sin elegir (solo calcular)"}
                    </option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.marca ? `${p.marca} · ` : ""}
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <Campo
                  etiqueta="Precio en la tienda"
                  valor={precioUsd}
                  onChange={(v) => {
                    setPrecioUsd(v);
                    setGuardado(false);
                  }}
                  prefijo="US$"
                  placeholder="Ej: 24"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-serif text-lg text-rosea-700">Tu pedido</h2>
              <p className="mt-1 text-xs text-neutral-400">
                Se recuerda para el próximo cálculo. Actualizá el dólar cuando
                cambie.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta="Dólar"
                  valor={ctx.tipoCambio}
                  onChange={(v) => actualizarCtx("tipoCambio", v)}
                  prefijo="$"
                  placeholder="Ej: 1450"
                  ayuda="Pesos por dólar"
                />
                <Campo
                  etiqueta="Courier del pedido"
                  valor={ctx.envioPedidoUsd}
                  onChange={(v) => actualizarCtx("envioPedidoUsd", v)}
                  prefijo="US$"
                  placeholder="Ej: 120"
                  ayuda="Lo que salió traer el pedido entero"
                />
                <Campo
                  etiqueta="Unidades del pedido"
                  valor={ctx.unidadesPedido}
                  onChange={(v) => actualizarCtx("unidadesPedido", v)}
                  placeholder="Ej: 12"
                  ayuda="Entre cuántas se reparte el courier"
                />
                <Campo
                  etiqueta="Packaging y envío"
                  valor={ctx.costosLocalesArs}
                  onChange={(v) => actualizarCtx("costosLocalesArs", v)}
                  prefijo="$"
                  placeholder="Ej: 2000"
                  ayuda="Por unidad, en pesos"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-serif text-lg text-rosea-700">Tu margen</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="block text-sm text-neutral-600"
                    htmlFor="margen"
                  >
                    Margen objetivo
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="margen"
                      type="range"
                      min={0}
                      max={MARGEN_MAXIMO}
                      step={1}
                      value={Number(ctx.margenPct) || 0}
                      onChange={(e) =>
                        actualizarCtx("margenPct", e.target.value)
                      }
                      className="w-full accent-rosea-400"
                    />
                    <span className="w-12 shrink-0 text-right text-sm text-neutral-800 tabular-nums">
                      {Number(ctx.margenPct) || 0}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    De cada $100 que cobrás, te quedan $
                    {Number(ctx.margenPct) || 0}.
                  </p>
                </div>

                <label className="block text-sm text-neutral-600">
                  Redondeo
                  <select
                    value={ctx.redondeoArs}
                    onChange={(e) => actualizarCtx("redondeoArs", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm"
                  >
                    {REDONDEOS.map((r) => (
                      <option key={r.valor} value={r.valor}>
                        {r.etiqueta}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-neutral-400">
                    Siempre para arriba, para no comerte margen.
                  </p>
                </label>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-rosea-200 bg-white p-5">
              <h2 className="font-serif text-lg text-rosea-700">Resultado</h2>

              <div className="mt-4 space-y-2 border-b border-neutral-100 pb-4">
                <Renglon
                  concepto="Producto"
                  monto={resultado.costoProducto}
                  detalle={precioUsd ? `US$${precioUsd}` : undefined}
                />
                <Renglon
                  concepto="Courier"
                  monto={resultado.envioPorUnidad}
                  detalle="por unidad"
                />
                <Renglon
                  concepto="Packaging y envío"
                  monto={resultado.costosLocales}
                />
                <div className="flex items-baseline justify-between gap-3 border-t border-neutral-100 pt-2 text-sm font-medium">
                  <span className="text-neutral-700">Te sale</span>
                  <span className="text-neutral-900 tabular-nums">
                    {formatearPrecio(resultado.costoTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs tracking-wider text-neutral-500 uppercase">
                  Precio sugerido
                </p>
                <p className="mt-1 font-serif text-3xl text-neutral-800">
                  {formatearPrecio(resultado.precioSugerido)}
                </p>
                <p className="mt-1 text-sm text-rosea-700">
                  Ganás {formatearPrecio(resultado.ganancia)} ·{" "}
                  {Math.round(resultado.margenReal)}% real
                </p>
              </div>

              {producto && (
                <div className="mt-4 rounded-xl bg-rosea-50 p-3 text-sm">
                  <p className="text-neutral-600">
                    Hoy está a{" "}
                    <span className="text-neutral-900">
                      {formatearPrecio(producto.precio)}
                    </span>
                  </p>
                  {variacion !== null && (
                    <p
                      className={`mt-0.5 text-xs ${
                        variacion >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {variacion >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(Math.round(variacion))}% contra el precio
                      cargado
                    </p>
                  )}
                </div>
              )}

              {!hayCuenta && (
                <p className="mt-4 text-xs text-neutral-400">
                  Cargá el precio en dólares y el tipo de cambio para ver el
                  cálculo.
                </p>
              )}

              <button
                onClick={guardarEnProducto}
                disabled={!producto || !hayCuenta || guardando}
                className="mt-5 w-full rounded-full bg-rosea-400 px-5 py-2.5 text-sm text-white hover:bg-rosea-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardando
                  ? "Guardando…"
                  : guardado
                    ? "Guardado ✓"
                    : "Guardar en el producto"}
              </button>
              {!producto && (
                <p className="mt-2 text-center text-xs text-neutral-400">
                  Elegí un producto para poder guardarlo.
                </p>
              )}
              {guardado && (
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Precio y costo actualizados en el catálogo.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

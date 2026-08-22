import Image from "next/image";
import { config } from "@/lib/config";

/**
 * La bolsa se dibuja en dos capas con el mismo viewBox, superpuestas. Entre
 * medio van los productos: asi la cara frontal los tapa de verdad mientras
 * estan "adentro", sin necesidad de mascaras ni clip-paths.
 *
 * Criterio de dibujo: una bolsa de papel es de caras PLANAS con un quiebre
 * neto entre frente y fuelle. El volumen sale del salto de valor entre esas
 * dos caras, no de sombrear el frente como si fuera un cilindro.
 *
 * Todo son gradientes: ni un solo filtro SVG, que en mobile son caros.
 */

const VIEW_BOX = "0 0 320 400";

/** Cara frontal: lados rectos, labio de la boca apenas curvado hacia abajo. */
const CARA = "M 46 122 Q 149 136 252 122 L 252 372 L 50 372 Q 46 372 46 368 Z";
/** Fuelle lateral derecho, en sombra. Su canto superior sube: se aleja. */
const FUELLE = "M 252 122 L 291 107 L 294 358 L 252 372 Z";

/** Sombra de apoyo, asas e interior. Va detras de los productos. */
export function BolsaAtras({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={VIEW_BOX}
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Sombra en tono de marca, nunca negra */}
        <radialGradient id="rb-sombra" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8f5a52" stopOpacity="0.42" />
          <stop offset="42%" stopColor="#9c6a62" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#9c6a62" stopOpacity="0" />
        </radialGradient>
        {/* Interior en penumbra: calido y desaturado */}
        <linearGradient id="rb-interior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c524b" />
          <stop offset="100%" stopColor="#9a7b73" />
        </linearGradient>
        <linearGradient id="rb-asa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8bab1" />
          <stop offset="55%" stopColor="#d2968b" />
          <stop offset="100%" stopColor="#bd7c72" />
        </linearGradient>
      </defs>

      {/* Apoyo en la superficie: una difusa y ancha, otra corta y densa */}
      <ellipse cx="164" cy="380" rx="152" ry="20" fill="url(#rb-sombra)" />
      <ellipse cx="166" cy="375" rx="108" ry="9" fill="#8f5a52" opacity="0.22" />

      {/*
        Asa TRASERA. Va aca, en la capa de atras, y sus patas mueren dentro
        de la boca oscura (el relleno del interior se dibuja despues y las
        tapa): se lee atada al panel de atras, que es lo correcto.
        La de adelante NO va aca -va en BolsaAdelante- porque si las dos se
        dibujan en esta capa, las dos parecen salir de atras.
        Es la mas alta de las dos y va corrida a la derecha, como en la
        referencia dibujada a mano.
      */}
      <g strokeLinecap="round" fill="none">
        <g stroke="url(#rb-asa)" strokeWidth="6.5">
          <path d="M166 120 C 165 58, 224 58, 223 126" />
        </g>
        <g stroke="#a8756b" strokeOpacity="0.4" strokeWidth="2">
          <path d="M166 120 C 165 58, 224 58, 223 126" />
        </g>
      </g>

      {/* Interior visible: entre el canto trasero (alto) y el labio frontal */}
      <path
        d="M 46 122 Q 160 98 291 107 L 291 118 Q 149 142 46 132 Z"
        fill="url(#rb-interior)"
      />
      {/* Canto trasero, tocado por la luz */}
      <path
        d="M 46 122 Q 160 98 291 107"
        stroke="#f9eeeb"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Cara frontal, fuelle lateral y marca. Va delante de los productos. */
export function BolsaAdelante({ className = "" }: { className?: string }) {
  return (
    <div className={`${className} isolate`}>
      <svg
        viewBox={VIEW_BOX}
        className="h-full w-full"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Papel mate: blanco calido, casi plano. La luz entra por arriba. */}
          <linearGradient id="rb-papel" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#fffefd" />
            <stop offset="52%" stopColor="#fdf7f4" />
            <stop offset="100%" stopColor="#f4e7e2" />
          </linearGradient>
          {/* Fuelle claramente mas oscuro: de ahi sale el volumen */}
          <linearGradient id="rb-fuelle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2c7c0" />
            <stop offset="100%" stopColor="#cda69d" />
          </linearGradient>
          {/* Sombra que proyecta el labio de la boca sobre el papel */}
          <linearGradient id="rb-sombraLabio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9c6a62" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#9c6a62" stopOpacity="0" />
          </linearGradient>
          {/* Base: la bolsa se asienta, no flota */}
          <linearGradient id="rb-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a49d" stopOpacity="0" />
            <stop offset="100%" stopColor="#bb9188" stopOpacity="0.45" />
          </linearGradient>
          {/* Cordon del asa delantera. Se redefine aca (no se reusa el id de
              BolsaAtras) para que esta capa no dependa de que la otra este
              montada. */}
          <linearGradient id="rb-asa-frente" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8bab1" />
            <stop offset="55%" stopColor="#d2968b" />
            <stop offset="100%" stopColor="#bd7c72" />
          </linearGradient>
        </defs>

        {/* Fuelle lateral */}
        <path d={FUELLE} fill="url(#rb-fuelle)" />

        {/* Cara frontal. El contorno tenue evita que el papel se funda con el
            fondo claro en la parte baja del escenario. */}
        <path
          d={CARA}
          fill="url(#rb-papel)"
          stroke="#e9d1cb"
          strokeWidth="1"
        />

        {/* Labio frontal iluminado + su sombra sobre el papel */}
        <path
          d="M 46 122 Q 149 136 252 122"
          stroke="#fffbf9"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 46 122 Q 149 136 252 122 L 252 148 Q 149 163 46 148 Z"
          fill="url(#rb-sombraLabio)"
        />

        {/*
          Asa DELANTERA. Va en esta capa -no en BolsaAtras- justamente para
          que sus dos patas se vean bajando POR DELANTE del papel blanco,
          cruzando el labio hacia abajo, tal como estaba marcado en la
          referencia. Si se dibujara atras quedaria tapada por la cara y
          pareceria que tambien nace del panel trasero.
          Es la mas baja de las dos y va corrida a la izquierda; se solapa
          con la trasera y la pisa, que es el cruce del dibujo.
        */}
        <g strokeLinecap="round" fill="none">
          {/* Sombra que el cordon proyecta sobre el papel */}
          <g stroke="#9c6a62" strokeOpacity="0.18" strokeWidth="7">
            <path d="M126 160 C 125 86, 190 86, 189 156" />
          </g>
          <g stroke="url(#rb-asa-frente)" strokeWidth="6.5">
            <path d="M123 158 C 122 84, 187 84, 186 154" />
          </g>
          <g stroke="#a8756b" strokeOpacity="0.4" strokeWidth="2">
            <path d="M123 158 C 122 84, 187 84, 186 154" />
          </g>
        </g>

        {/* Quiebre neto entre cara y fuelle: el canto que da la lectura 3D */}
        <path d="M 252 122 L 252 372" stroke="#e5cbc4" strokeWidth="1.6" />
        {/* Canto izquierdo, apenas insinuado */}
        <path d="M 60 126 L 60 371" stroke="#efdcd7" strokeOpacity="0.8" strokeWidth="1.2" />

        {/* Base: el pliegue donde dobla el fondo de la bolsa, mas su sombra */}
        <path
          d="M 46 322 L 252 322 L 252 372 L 50 372 Q 46 372 46 368 Z"
          fill="url(#rb-base)"
        />
        <path d="M 47 330 Q 149 335 252 330" stroke="#e0c0b9" strokeOpacity="0.75" strokeWidth="1.2" />
        <path d="M 50 372 L 252 372" stroke="#c9a49d" strokeOpacity="0.55" strokeWidth="1.4" />
      </svg>

      {/*
        La marca va impresa sobre la cara: `multiply` la funde con el papel en
        vez de dejarla pegada encima. El `isolate` del contenedor mantiene la
        mezcla dentro de la bolsa. Va centrada en la cara (que no coincide con
        el centro del viewBox, porque a la derecha esta el fuelle).
      */}
      <Image
        src="/brand/caligrafia.svg"
        alt={config.marca}
        width={640}
        height={205}
        priority
        className="pointer-events-none absolute left-[46.5%] top-[57%] w-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.88] mix-blend-multiply"
      />
    </div>
  );
}

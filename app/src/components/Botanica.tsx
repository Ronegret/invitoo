/**
 * Las ramas de Invitoo.
 *
 * La web original llevaba hojas de acuarela. La idea es buena y hay que
 * conservarla, pero en acuarela pesa megas, no se tiñe y no se anima. Aquí
 * son de línea, dibujadas con el mismo trazo fino de las alianzas del logo
 * — así la marca es una sola cosa: aros, ramas y titulares comparten grosor.
 *
 * Y hacen algo que una acuarela no puede: **se dibujan solas** al entrar en
 * pantalla, con `stroke-dashoffset`. Cada rama pesa menos de 2 KB.
 *
 * Ya no lleva JavaScript propio: es un componente de servidor con
 * `data-rama`, y el revelado de la invitación (`movimiento/programa.ts`)
 * la pone a la espera y la suelta al llegar a ella. El ritmo sale de las
 * variables `--mov-ornamento` y `--mov-curva` del lienzo, así que una boda
 * «cinematográfica» dibuja más despacio que una «mínima». Sin JavaScript,
 * con menos movimiento o con «ornamentos» apagado: la rama ya dibujada.
 */

type Forma = "olivo" | "eucalipto" | "espiga" | "guirnalda" | "brote";

const RAMAS: Record<Forma, { vb: string; tallo: string; hojas: string[] }> = {
  // Rama de olivo: tallo curvo con hojas lanceoladas alternas.
  olivo: {
    vb: "0 0 240 120",
    tallo: "M4 108C48 104 104 88 150 62 178 46 208 28 236 14",
    hojas: [
      "M40 100c-9-8-9-20 1-27 8 7 8 20-1 27Z",
      "M52 88c11-4 20 3 20 14-11 4-21-3-20-14Z",
      "M84 82c-8-9-6-21 5-26 7 8 5 21-5 26Z",
      "M98 70c11-3 20 5 18 16-11 3-20-5-18-16Z",
      "M128 58c-7-10-4-22 7-25 6 9 3 21-7 25Z",
      "M144 46c11-1 19 7 16 18-11 1-19-8-16-18Z",
      "M172 36c-6-10-1-22 10-24 5 10 0 22-10 24Z",
      "M188 24c11 0 18 9 14 19-11 0-18-9-14-19Z",
      "M214 16c-5-11 1-22 12-23 4 10-2 22-12 23Z",
    ],
  },
  // Eucalipto: hojas redondas enfrentadas.
  eucalipto: {
    vb: "0 0 200 120",
    tallo: "M6 112C44 96 82 74 116 50 142 32 166 18 194 8",
    hojas: [
      "M30 96a11 11 0 1 1 0-22 11 11 0 0 1 0 22Z",
      "M44 112a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
      "M66 78a12 12 0 1 1 0-24 12 12 0 0 1 0 24Z",
      "M80 96a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
      "M104 58a11 11 0 1 1 0-22 11 11 0 0 1 0 22Z",
      "M118 76a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
      "M144 40a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
      "M158 58a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
      "M180 26a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
    ],
  },
  // Espiga: vertical, fina, para separar secciones.
  espiga: {
    vb: "0 0 40 160",
    tallo: "M20 158V16",
    hojas: [
      "M20 32c-10-4-14-14-9-22 9 3 13 14 9 22Z",
      "M20 32c10-4 14-14 9-22-9 3-13 14-9 22Z",
      "M20 58c-10-4-14-14-9-22 9 3 13 14 9 22Z",
      "M20 58c10-4 14-14 9-22-9 3-13 14-9 22Z",
      "M20 84c-10-4-14-14-9-22 9 3 13 14 9 22Z",
      "M20 84c10-4 14-14 9-22-9 3-13 14-9 22Z",
      "M20 110c-10-4-14-14-9-22 9 3 13 14 9 22Z",
      "M20 110c10-4 14-14 9-22-9 3-13 14-9 22Z",
      "M20 16a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z",
    ],
  },
  // Guirnalda: dos ramas que se abren. Va debajo de los titulares.
  guirnalda: {
    vb: "0 0 300 60",
    tallo: "M150 46C120 46 84 38 54 22M150 46c30 0 66-8 96-24",
    hojas: [
      "M118 44c-6-7-4-16 4-19 5 7 3 16-4 19Z",
      "M96 38c7-5 15-2 17 6-7 5-16 2-17-6Z",
      "M74 30c-5-8-2-16 6-18 4 8 1 16-6 18Z",
      "M182 44c6-7 4-16-4-19-5 7-3 16 4 19Z",
      "M204 38c-7-5-15-2-17 6 7 5 16 2 17-6Z",
      "M226 30c5-8 2-16-6-18-4 8-1 16 6 18Z",
      "M150 46a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z",
    ],
  },
  // Brote pequeño: acento suelto junto a un número o un icono.
  brote: {
    vb: "0 0 60 60",
    tallo: "M30 56V26",
    hojas: [
      "M30 30c-12-2-18-12-14-22 11 1 18 12 14 22Z",
      "M30 34c12-3 17-13 12-22-11 2-17 13-12 22Z",
    ],
  },
};

export default function Rama({
  forma = "olivo",
  ancho = 200,
  className,
  style,
  /** Milisegundos antes de empezar a dibujarse. */
  retraso = 0,
  /** Espejo horizontal, para la esquina contraria. */
  espejo = false,
  /** En la portada: se dibuja al entrar en la invitación, no al llegar a ella. */
  alCargar = false,
}: {
  forma?: Forma;
  ancho?: number;
  className?: string;
  style?: React.CSSProperties;
  retraso?: number;
  espejo?: boolean;
  alCargar?: boolean;
}) {
  const r = RAMAS[forma];
  const [w, h] = r.vb.split(" ").slice(2).map(Number);

  return (
    <svg
      viewBox={r.vb}
      width={ancho}
      height={(ancho * h) / w}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-rama={alCargar ? "al-cargar" : ""}
      // El revelado le pone `data-espera`/`data-entrando` antes de hidratar.
      suppressHydrationWarning
      className={`rama ${className ?? ""}`}
      style={
        {
          ...style,
          "--r": `${retraso}ms`,
          transform: espejo ? "scaleX(-1)" : style?.transform,
        } as React.CSSProperties
      }
    >
      {/* El tallo se dibuja primero y las hojas van brotando detrás. */}
      <path d={r.tallo} className="rama-tallo" />
      {r.hojas.map((d, i) => (
        <path key={i} d={d} className="rama-hoja" style={{ "--h": i } as React.CSSProperties} />
      ))}
    </svg>
  );
}

import type { CSSProperties } from "react";
import { FAMILIA } from "./fuentesPlantillas";
import s from "./portadas.module.css";

/**
 * La portada viva de una plantilla, pintada con HTML y no con una foto.
 *
 * Por eso puede decir VUESTROS nombres y vestirse con el color que elijáis
 * sin recargar nada: es la misma composición que la invitación (su letra,
 * su papel, su tinta, su acento y su gesto), en pequeño. Cada plantilla
 * tiene su dibujo: el lacre de Carta, el horizonte de Mar, las estrellas de
 * Constelación, el sello de Registro, las piezas de Azulejo…
 *
 * Es decorativa para el lector de pantalla (`aria-hidden`): quien la usa
 * pone el nombre accesible en el botón que la envuelve.
 */

export type Colores = { papel: string; tinta: string; acento: string };

export default function MiniPortada({
  id,
  a,
  b,
  fecha,
  colores,
  className = "",
  style,
}: {
  id: string;
  a: string;
  b: string;
  fecha: string;
  colores: Colores;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = {
    "--p-papel": colores.papel,
    "--p-tinta": colores.tinta,
    "--p-acento": colores.acento,
    "--p-letra": FAMILIA[id] ?? "var(--display)",
    ...style,
  } as CSSProperties;

  return (
    <div aria-hidden className={`${s.portada} ${className}`} data-p={id} style={vars}>
      <Dibujo id={id} />
      <div className={s.texto}>
        <p className={s.sobre}>{id === "registro" ? "Nos casamos." : "Nos casamos"}</p>
        <p className={s.nombres}>
          <span>{a}</span>
          <span className={s.y}>{id === "registro" ? "+" : id === "velo" ? "y" : "&"}</span>
          <span>{b}</span>
        </p>
        <p className={s.fecha}>{fecha}</p>
      </div>
      <span className={s.brillo} />
    </div>
  );
}

/** El gesto de cada plantilla, dibujado en SVG o con CSS. */
function Dibujo({ id }: { id: string }) {
  switch (id) {
    case "carta":
      return (
        <svg className={s.dibujo} viewBox="0 0 100 160" preserveAspectRatio="none">
          <path d="M14 22H86V58L50 80 14 58Z" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".5" />
          <path d="M14 22 50 48 86 22" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".5" />
          <circle cx="50" cy="48" r="6" className={s.lacre} />
          <path d="M8 6H92V154H8Z" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth=".4" />
        </svg>
      );
    case "sobre":
      return (
        <svg className={s.dibujo} viewBox="0 0 100 160" preserveAspectRatio="none">
          <rect x="7" y="7" width="86" height="146" fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth=".5" />
          <rect x="9.5" y="9.5" width="81" height="141" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth=".4" />
          <path d="M38 124h10M52 124h10" stroke="currentColor" strokeOpacity=".5" strokeWidth=".5" />
          <path d="M50 121.5l2.5 2.5-2.5 2.5-2.5-2.5Z" className={s.relleno} />
        </svg>
      );
    case "floracion":
      return (
        <svg className={`${s.dibujo} ${s.ramas}`} viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet">
          <g fill="none" stroke="currentColor" strokeWidth=".7" strokeLinecap="round">
            <path d="M18 132C30 112 30 92 22 70" />
            <path d="M82 132C70 112 70 92 78 70" />
            <path d="M24 112c-6-2-9-6-9-11 5 0 9 4 9 11ZM27 96c6-3 8-8 7-12-5 1-8 5-7 12ZM23 82c-6-1-9-5-10-10 5 0 9 4 10 10Z" className={s.hoja} />
            <path d="M76 112c6-2 9-6 9-11-5 0-9 4-9 11ZM73 96c-6-3-8-8-7-12 5 1 8 5 7 12ZM77 82c6-1 9-5 10-10-5 0-9 4-10 10Z" className={s.hoja} />
          </g>
          <circle cx="50" cy="34" r="5" className={s.flor} />
          <circle cx="50" cy="34" r="2" className={s.relleno} />
        </svg>
      );
    case "mar":
      return <span className={s.horizonte} />;
    case "velo":
      return (
        <>
          <span className={s.veloTela} />
          <svg className={s.dibujo} viewBox="0 0 100 160" preserveAspectRatio="none">
            <rect x="12" y="14" width="76" height="132" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".35" />
          </svg>
        </>
      );
    case "constelacion":
      return (
        <svg className={`${s.dibujo} ${s.cielo}`} viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice">
          {ESTRELLAS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} className={s.estrella} style={{ "--e": i } as CSSProperties} />
          ))}
          <g fill="none" className={s.trazo} strokeWidth=".35">
            <circle cx="44" cy="40" r="9" />
            <circle cx="56" cy="40" r="9" />
          </g>
          <path d="M20 22 34 30 44 31M66 50 78 60 84 74" fill="none" className={s.trazo} strokeWidth=".25" />
        </svg>
      );
    case "tinta":
      return (
        <svg className={`${s.dibujo} ${s.gota}`} viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet">
          <path d="M50 30c8 0 13 5 13 11 0 7-6 9-6 14 0 4 4 5 4 8 0 3-4 5-8 4-4-1-5-5-9-5s-7 3-10 1c-3-2-2-6 0-9 2-3 0-6-2-9-3-6 6-15 18-15Z" className={s.relleno} />
        </svg>
      );
    case "registro":
      return <span className={s.sello}>Registro civil</span>;
    case "azulejo":
      return <span className={s.azulejos} />;
    default:
      return null;
  }
}

const ESTRELLAS: [number, number, number][] = [
  [12, 14, 0.6], [20, 22, 0.8], [34, 30, 0.5], [44, 31, 0.7], [70, 12, 0.6], [86, 20, 0.9],
  [92, 44, 0.5], [8, 52, 0.5], [66, 50, 0.7], [78, 60, 0.6], [84, 74, 0.8], [14, 96, 0.6],
  [26, 140, 0.7], [72, 132, 0.5], [90, 112, 0.6], [6, 124, 0.4], [50, 150, 0.6], [38, 8, 0.4],
];

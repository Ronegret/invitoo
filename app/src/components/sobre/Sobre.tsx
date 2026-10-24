import type { SobreResuelto } from "./config";
import { fechaMatasellos, iniciales } from "./config";
import Forro from "./Forro";
import Lacre from "./Lacre";
import Matasellos from "./Matasellos";

/**
 * El sobre de papel, en SVG y CSS. Sin vídeo, sin imágenes, sin JavaScript
 * propio: es un Server Component que también se pinta en el cliente (la
 * vista previa de `AjustesSobre`).
 *
 * Capas, de atrás adelante:
 *   interior (forro) · cartulina · bolsillo · «Para Carmen» y matasellos ·
 *   solapa (papel fuera, forro dentro) · lacre
 *
 * El gesto lo dispara un atributo en cualquier antepasado:
 * `[data-fase="abriendo"]`. Lo pone el guion de la apertura
 * (`aperturas/programa.ts`) al tocar el lacre, o `AjustesSobre` al probarlo.
 *
 *    0 ms   el lacre cede (se hunde un 4 %)
 *  120 ms   se agrieta y cada mitad cae hacia su lado      → 700 ms
 *  420 ms   la solapa gira sobre el pliegue (ease-velo)    → 1 160 ms
 *  900 ms   la cartulina sube con los nombres (ease-carta) → 1 680 ms
 * 1 550 ms  fundido a la portada (140 + 700 ms)            → 2 390 ms
 *
 * Con `prefers-reduced-motion`, nada de eso: el orquestador funde.
 */
export type PropsSobre = {
  a: string;
  b: string;
  /** ISO de la boda, para la cartulina y el matasellos. */
  fechaIso: string;
  ajustes: SobreResuelto;
  /** Prefijo único para los ids de SVG. */
  pid: string;
  /** Lo escrito a mano en el sobre («Para Carmen»). Cliente: `NombreEnSobre`. */
  escrito?: React.ReactNode;
  /** Botón que abre (`data-abrir`): solo en la apertura de verdad. */
  boton?: boolean;
  /** Texto de ayuda bajo el sobre. `null` lo quita. */
  pista?: string | null;
  /** Clase de la fuente manuscrita (next/font). */
  claseManuscrita?: string;
  /** Más pequeño y sin pie (miniaturas del panel). */
  compacto?: boolean;
};

const MESES = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "Europe/Madrid" });

function fechaCarta(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const p = new Intl.DateTimeFormat("es-ES", { day: "numeric", year: "numeric", timeZone: "Europe/Madrid" }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${v("day")} · ${MESES.format(d)} · ${v("year")}`;
}

export default function Sobre({
  a,
  b,
  fechaIso,
  ajustes,
  pid,
  escrito,
  boton = false,
  pista = "Toca el lacre para abrir",
  claseManuscrita = "",
  compacto = false,
}: PropsSobre) {
  const s = ajustes;
  const fecha = fechaCarta(fechaIso);
  const ini = iniciales(a, b);

  const cuerpo = (
    <span className="sc-sobre" aria-hidden="true">
      {/* Interior: el forro que se ve al levantar la solapa. */}
      <span className="sc-capa sc-interior">
        <svg viewBox="0 0 142 100" preserveAspectRatio="none">
          <rect width="142" height="100" fill="var(--sc-papel)" />
          <rect width="142" height="100" fill="#000" fillOpacity=".08" />
          <g clipPath={`url(#${pid}-recorte-interior)`}>
            <Forro id={s.forro} color={s.forroColor} pid={`${pid}-i`} />
          </g>
          <defs>
            <clipPath id={`${pid}-recorte-interior`}>
              <path d="M3.5 3.5H138.5L80 52Q71 58 62 52Z" />
            </clipPath>
          </defs>
        </svg>
      </span>

      {/* La cartulina: sube con los nombres. */}
      <span className="sc-carta">
        <span className="sc-carta-fecha">{fecha}</span>
        <span className="sc-carta-nombres">
          {a}
          <span className="sc-carta-amp"> &amp; </span>
          {b}
        </span>
        <span className="sc-carta-filete" />
      </span>

      {/* El bolsillo: las dos alas y la pestaña de abajo. */}
      <span className="sc-capa sc-bolsillo">
        <svg viewBox="0 0 142 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${pid}-ala-i`} x1="0" y1="0" x2="1" y2=".3">
              <stop offset="0" stopColor="#fff" stopOpacity=".22" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${pid}-ala-d`} x1="1" y1="0" x2="0" y2=".3">
              <stop offset="0" stopColor="#000" stopOpacity=".07" />
              <stop offset="1" stopColor="#000" stopOpacity=".01" />
            </linearGradient>
            <linearGradient id={`${pid}-pestana`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".2" />
              <stop offset=".6" stopColor="#fff" stopOpacity=".05" />
              <stop offset="1" stopColor="#000" stopOpacity=".05" />
            </linearGradient>
            <filter id={`${pid}-sombra-pestana`} x="-5%" y="-10%" width="110%" height="120%">
              <feDropShadow dx="0" dy="-.5" stdDeviation=".7" floodColor="#2a1a10" floodOpacity=".16" />
            </filter>
          </defs>
          <path d="M0 0L69 55L0 100Z" fill="var(--sc-papel)" />
          <path d="M0 0L69 55L0 100Z" fill={`url(#${pid}-ala-i)`} />
          <path d="M142 0L73 55L142 100Z" fill="var(--sc-papel)" />
          <path d="M142 0L73 55L142 100Z" fill={`url(#${pid}-ala-d)`} />
          <g filter={`url(#${pid}-sombra-pestana)`}>
            <path d="M0 100L63 51Q71 45.5 79 51L142 100Z" fill="var(--sc-papel)" />
          </g>
          <path d="M0 100L63 51Q71 45.5 79 51L142 100Z" fill={`url(#${pid}-pestana)`} />
          {/* El canto de la pestaña coge luz. */}
          <path d="M.5 99.6L63 51Q71 45.5 79 51L141.5 99.6" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".35" />
        </svg>
        <span className="sc-grano" />
      </span>

      {/* Lo escrito y lo estampado, sobre el papel. */}
      <span className={`sc-escrito ${claseManuscrita}`}>{escrito}</span>
      {s.matasellos && (
        <span className="sc-matasellos">
          <Matasellos ciudad={s.ciudad} fecha={fechaMatasellos(fechaIso)} pid={pid} />
        </span>
      )}

      {/* La solapa: papel por fuera, forro por dentro. Gira sobre el pliegue. */}
      <span className="sc-solapa">
        <span className="sc-solapa-cara sc-solapa-fuera">
          <svg viewBox="0 0 142 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`${pid}-solapa`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".16" />
                <stop offset=".75" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".05" />
              </linearGradient>
            </defs>
            <path d="M0 0H142L80 53Q71 59.5 62 53Z" fill="var(--sc-papel)" />
            <path d="M0 0H142L80 53Q71 59.5 62 53Z" fill={`url(#${pid}-solapa)`} />
            <path d="M.4 .3L62 53Q71 59.5 80 53L141.6 .3" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".35" />
          </svg>
          <span className="sc-grano sc-grano-solapa" />
        </span>
        <span className="sc-solapa-cara sc-solapa-dentro">
          <svg viewBox="0 0 142 60" preserveAspectRatio="none">
            <defs>
              <clipPath id={`${pid}-recorte-solapa`}>
                <path d="M0 60H142L80 7Q71 .5 62 7Z" />
              </clipPath>
              <clipPath id={`${pid}-recorte-forro`}>
                <path d="M4 60H138L79.5 10Q71 4 62.5 10Z" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${pid}-recorte-solapa)`}>
              <rect width="142" height="60" fill="var(--sc-papel)" />
              <rect width="142" height="60" fill="#000" fillOpacity=".06" />
            </g>
            <g clipPath={`url(#${pid}-recorte-forro)`}>
              <Forro id={s.forro} color={s.forroColor} pid={`${pid}-s`} alto={60} />
            </g>
          </svg>
        </span>
      </span>

      <span className="sc-lacre">
        <Lacre color={s.lacreColor} grabado={s.lacre} iniciales={ini} pid={pid} />
      </span>
    </span>
  );

  return (
    <div
      className={`sc ${compacto ? "sc-compacto" : ""}`}
      style={
        {
          "--sc-papel": s.papel,
          "--sc-forro": s.forroColor,
        } as React.CSSProperties
      }
    >
      <style>{CSS_SOBRE}</style>
      {boton ? (
        <button type="button" data-abrir="" data-cursor="abrir" className="sc-escena" aria-label={`Abrir la invitación de ${a} y ${b}`}>
          <span className="sc-sombra" aria-hidden="true" />
          {cuerpo}
        </button>
      ) : (
        <div className="sc-escena">
          <span className="sc-sombra" aria-hidden="true" />
          {cuerpo}
        </div>
      )}

      {!compacto && (
        <div className="sc-pie">
          <p className="sc-pie-nombres">
            {a}
            <span className="sc-pie-amp"> &amp; </span>
            {b}
          </p>
          <p className="sc-pie-fecha">{fecha}</p>
          {pista && <p className="sc-pista">{pista}</p>}
        </div>
      )}
    </div>
  );
}

/*
 * Un único bloque de estilos para el sobre. Las curvas son las de la casa
 * (`src/lib/movimiento.ts`): --ease-carta, --ease-velo; aquí van con su
 * valor de reserva porque la vista previa del panel no lleva el <main>.
 */
export const CSS_SOBRE = `
.sc {
  --sc-carta: var(--ease-carta, cubic-bezier(.22,.61,.36,1));
  --sc-velo: var(--ease-velo, cubic-bezier(.65,0,.35,1));
  --sc-tinta-pluma: color-mix(in srgb, var(--tinta, #241a16) 72%, #1c2840);
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: clamp(1.6rem, 5vh, 2.6rem);
  padding: 4.5rem 1rem calc(env(safe-area-inset-bottom, 0px) + 6rem);
  color: var(--tinta, #241a16);
  background:
    radial-gradient(120% 70% at 50% 40%, color-mix(in srgb, var(--sc-papel) 78%, #fff) 0%, transparent 62%),
    radial-gradient(140% 100% at 50% 50%, color-mix(in srgb, var(--sc-papel) 90%, var(--tinta, #241a16)) 0%, color-mix(in srgb, var(--sc-papel) 74%, var(--tinta, #241a16)) 100%);
  -webkit-tap-highlight-color: transparent;
}
.sc-compacto { position: relative; inset: auto; padding: 0; gap: 0; background: none; }

.sc-escena {
  display: block; position: relative; border: 0; padding: 0; margin: 0; background: none; font: inherit; color: inherit;
  cursor: pointer;
  animation: sc-llega 900ms var(--sc-carta) both;
}
.sc-compacto .sc-escena { animation: none; cursor: default; }
.sc-escena:focus { outline: none; }
.sc-escena:focus-visible .sc-sobre { outline: 3px solid var(--tinta, #241a16); outline-offset: 10px; }
[data-fase="abriendo"] .sc-escena { cursor: default; }
@keyframes sc-llega { from { opacity: 0; transform: translateY(14px) scale(.985); } }

.sc-sobre {
  position: relative; display: block;
  width: min(88vw, 420px, 52vh * 1.42);
  aspect-ratio: 142 / 100;
  container-type: inline-size;
  /* La perspectiva aquí y sin preserve-3d: las capas se ordenan por
     z-index (nada de z-fighting) y solo la solapa vive en 3D. */
  perspective: 1400px; perspective-origin: 50% 10%;
  transition: transform 900ms var(--sc-carta) 1000ms;
}
.sc-compacto .sc-sobre { width: 100%; }

/* —— que se vea de verdad: luz, contacto e inclinación ——
   El sobre se inclina hasta ±5° siguiendo al ratón o al giroscopio
   (--sc-rx / --sc-ry, los pone LuzSobre.tsx) y, quieto, flota apenas. Solo
   transform y opacity. Al abrirse, vuelve a plano. */
.sc:not(.sc-compacto) .sc-sobre {
  transform: perspective(1100px) rotateX(var(--sc-rx, 0deg)) rotateY(var(--sc-ry, 0deg));
  transition: transform 520ms var(--sc-carta);
}
.sc:not(.sc-compacto) .sc-escena { animation: sc-llega 900ms var(--sc-carta) both, sc-flota 7s cubic-bezier(.45,0,.55,1) 900ms infinite alternate; }
@keyframes sc-flota { from { translate: 0 0; } to { translate: 0 -4px; } }
/* La sombra de contacto: apretada y oscura en la base, se abre al flotar. */
.sc-sombra {
  position: absolute; left: 4%; right: 4%; bottom: -2.2%; height: 6%;
  border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(38,22,12,.5), rgba(38,22,12,.18) 62%, transparent);
  filter: blur(4px);
  translate: var(--sc-sx, 0px) 0;
}
.sc:not(.sc-compacto) .sc-sombra { animation: sc-sombra 7s cubic-bezier(.45,0,.55,1) 900ms infinite alternate; }
@keyframes sc-sombra { from { opacity: 1; scale: 1 1; } to { opacity: .78; scale: 1.04 1.15; } }
.sc-compacto .sc-sombra { display: none; }
/* La luz: un brillo ancho que resbala por el papel según la inclinación. */
.sc-sobre::after {
  content: ""; position: absolute; inset: 0; z-index: 8; pointer-events: none;
  background:
    linear-gradient(112deg, transparent calc(12% + var(--sc-luz, 0%)), rgba(255,253,246,.34) calc(32% + var(--sc-luz, 0%)), transparent calc(54% + var(--sc-luz, 0%))),
    linear-gradient(180deg, rgba(255,255,255,.12), transparent 30%, transparent 78%, rgba(40,25,15,.07));
  mix-blend-mode: screen;
  transition: opacity 300ms ease-out;
}
/* El canto del papel coge luz (1 px), arriba. */
.sc-interior::after { content: ""; position: absolute; inset: 0 0 auto; height: 1px; background: rgba(255,255,255,.7); }
[data-fase="abriendo"] .sc-sobre::after { opacity: 0; }
/* Con el sobre 3D (components/tresd) ya pintado, el de papel se aparta: el
   botón sigue recibiendo el toque y el pie sigue a la vista. */
.apertura[data-sobre3d="1"] :is(.sc-sobre, .sc-sombra) { opacity: 0; }
.sc-capa, .sc-capa > svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.sc-interior { z-index: 1; box-shadow: 0 1px 1px rgba(40,25,15,.08), 0 10px 22px -8px rgba(40,25,15,.28), 0 34px 70px -24px rgba(40,25,15,.42); }
.sc-compacto .sc-interior { box-shadow: 0 1px 2px rgba(40,25,15,.12), 0 8px 16px -8px rgba(40,25,15,.3); }
.sc-bolsillo { z-index: 3; }
.sc-grano {
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply; opacity: .5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .3 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.sc-grano-solapa { clip-path: polygon(0 0, 100% 0, 56.3% 88%, 50% 99%, 43.7% 88%); }

/* —— la cartulina —— */
.sc-carta {
  position: absolute; z-index: 2; left: 5%; right: 5%; top: 5%; bottom: 5%;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2.4cqi;
  padding-top: 8cqi;
  background: color-mix(in srgb, var(--papel, #f6f1e9) 70%, #fff);
  box-shadow: inset 0 0 0 1.4cqi color-mix(in srgb, var(--papel, #f6f1e9) 70%, #fff), inset 0 0 0 calc(1.4cqi + 1px) color-mix(in srgb, #b08d57 70%, transparent), 0 1px 2px rgba(0,0,0,.08);
  color: var(--tinta, #241a16);
  text-align: center;
}
.sc-carta-fecha { font-size: 3.2cqi; letter-spacing: .38em; text-transform: uppercase; opacity: .78; font-family: var(--texto, system-ui), sans-serif; }
.sc-carta-nombres { font-family: var(--display, serif); font-style: italic; font-size: 10.5cqi; line-height: 1; letter-spacing: -.01em; padding-inline: 4cqi; overflow-wrap: anywhere; }
.sc-carta-amp { color: #a3814c; }
.sc-carta-filete { display: block; width: 14cqi; height: 1px; background: #b08d57; }

/* —— lo escrito y el matasellos —— */
.sc-escrito {
  position: absolute; z-index: 4; left: 8%; right: 8%; top: 75.5%;
  text-align: center; pointer-events: none;
  font-family: var(--f-manuscrita), "Snell Roundhand", cursive;
  font-size: 8.6cqi; line-height: 1.1;
  color: var(--sc-tinta-pluma);
  transition: opacity 260ms ease-out;
}
.sc-matasellos {
  position: absolute; z-index: 4; right: 3.5%; top: 16%; width: 20%;
  color: color-mix(in srgb, var(--tinta, #241a16) 80%, #1c2840);
  opacity: .5; rotate: -14deg; mix-blend-mode: multiply; pointer-events: none;
  transition: opacity 260ms ease-out;
}
.sc-matasellos svg { display: block; width: 100%; height: auto; }
[data-fase="abriendo"] .sc-escrito, [data-fase="abriendo"] .sc-matasellos { opacity: 0; transition-delay: 880ms; }

/* —— la solapa —— */
.sc-solapa {
  position: absolute; z-index: 5; left: 0; right: 0; top: 0; height: 60%;
  transform-origin: 50% 0; transform-style: preserve-3d;
}
.sc-solapa-cara { position: absolute; inset: 0; display: block; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.sc-solapa-cara > svg { display: block; width: 100%; height: 100%; overflow: visible; }
.sc-solapa-fuera > svg { filter: drop-shadow(0 .5cqi .45cqi rgba(40,25,15,.16)); }
.sc-solapa-dentro { transform: rotateX(180deg); }
[data-fase="abriendo"] .sc-solapa { animation: sc-solapa 740ms var(--sc-velo) 420ms both; }
@keyframes sc-solapa {
  0%   { transform: rotateX(0deg); z-index: 5; }
  49%  { z-index: 5; }
  51%  { z-index: 1; }
  100% { transform: rotateX(-180deg); z-index: 1; }
}

/* —— el lacre —— */
.sc-lacre {
  position: absolute; z-index: 6; left: 50%; top: 56%; width: 23%;
  translate: -50% -50%;
  filter: drop-shadow(0 .6cqi .5cqi rgba(30,10,5,.35)) drop-shadow(0 .15cqi .1cqi rgba(30,10,5,.3));
  animation: sc-lacre-llega 700ms var(--sc-carta) 250ms both;
  transition: scale 160ms ease-out;
}
.sc-lacre svg { display: block; width: 100%; height: auto; overflow: visible; }
@keyframes sc-lacre-llega { from { opacity: 0; scale: .9; } }
@media (hover: hover) and (pointer: fine) {
  .sc-escena:hover .sc-lacre { scale: 1.03; }
}
.sc-escena:active .sc-lacre { scale: .96; }
.sc-lacre-mitad { transform-box: fill-box; transform-origin: 50% 50%; }
.sc-lacre-grieta { stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }
.sc-lacre-reflejo { transform-box: view-box; animation: sc-reflejo 600ms var(--sc-velo) 1100ms both; }
@keyframes sc-reflejo { from { translate: -40px 0; } to { translate: 80px 0; } }
.sc-compacto .sc-lacre-reflejo { animation: none; translate: 80px 0; }

[data-fase="abriendo"] .sc-lacre { scale: .96; animation: none; }
[data-fase="abriendo"] .sc-lacre-grieta { animation: sc-grieta 700ms linear both; }
[data-fase="abriendo"] .sc-lacre-izq { animation: sc-mitad-i 580ms var(--sc-carta) 120ms both; }
[data-fase="abriendo"] .sc-lacre-der { animation: sc-mitad-d 580ms var(--sc-carta) 120ms both; }
@keyframes sc-grieta {
  0%   { opacity: 1; stroke-dashoffset: 1; }
  18%  { opacity: 1; stroke-dashoffset: 0; }
  40%  { opacity: 0; stroke-dashoffset: 0; }
  100% { opacity: 0; stroke-dashoffset: 0; }
}
@keyframes sc-mitad-i {
  0%   { transform: none; opacity: 1; }
  25%  { transform: translate(-3px, 0) rotate(-4deg); opacity: 1; }
  100% { transform: translate(-30px, 46px) rotate(-26deg); opacity: 0; }
}
@keyframes sc-mitad-d {
  0%   { transform: none; opacity: 1; }
  25%  { transform: translate(3px, 0) rotate(4deg); opacity: 1; }
  100% { transform: translate(30px, 52px) rotate(22deg); opacity: 0; }
}

/* —— la cartulina sube y el sobre baja un poco —— */
[data-fase="abriendo"] .sc-sobre, [data-fase="abriendo"] .sc:not(.sc-compacto) .sc-sobre { transform: perspective(1100px) translateY(20%); transition: transform 900ms var(--sc-carta) 900ms; }
[data-fase="abriendo"] .sc:not(.sc-compacto) .sc-escena, [data-fase="abriendo"] .sc:not(.sc-compacto) .sc-sombra { animation-play-state: paused; }
[data-fase="abriendo"] .sc-carta { animation: sc-carta 780ms var(--sc-carta) 900ms both; }
@keyframes sc-carta {
  0%   { transform: translateY(0); z-index: 2; }
  1%   { z-index: 2; }
  100% { transform: translateY(-64%); z-index: 2; box-shadow: inset 0 0 0 1.4cqi color-mix(in srgb, var(--papel, #f6f1e9) 70%, #fff), inset 0 0 0 calc(1.4cqi + 1px) color-mix(in srgb, #b08d57 70%, transparent), 0 18px 40px -12px rgba(40,25,15,.35); }
}

/* —— el pie: quién os escribe —— */
.sc-pie { text-align: center; animation: sc-llega 900ms var(--sc-carta) 180ms both; transition: opacity 240ms ease-out, translate 240ms ease-out; }
[data-fase="abriendo"] .sc-pie { opacity: 0; translate: 0 8px; }
.sc-pie-nombres {
  font-family: var(--display, serif); font-style: italic;
  font-size: clamp(2.4rem, 11vw, 3.6rem); line-height: 1; letter-spacing: -.01em;
  text-wrap: balance;
}
.sc-pie-amp { color: var(--acento-texto, var(--acento, #8c1d2c)); }
.sc-pie-fecha {
  margin-top: 1rem; font-size: 1.0625rem; letter-spacing: .34em; text-transform: uppercase;
  font-variant-numeric: tabular-nums; opacity: .85;
}
.sc-pista {
  margin-top: 1.6rem; font-size: 1.0625rem; letter-spacing: .08em; opacity: .78;
  animation: sc-pista 900ms ease-out 1500ms both;
}
@keyframes sc-pista { from { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .sc-escena, .sc-lacre, .sc-pie, .sc-pista, .sc-lacre-reflejo,
  [data-fase="abriendo"] .sc-solapa, [data-fase="abriendo"] .sc-carta,
  [data-fase="abriendo"] .sc-lacre-izq, [data-fase="abriendo"] .sc-lacre-der, [data-fase="abriendo"] .sc-lacre-grieta { animation: none; }
  .sc-sobre, .sc-pie, .sc-lacre, .sc-escrito, .sc-matasellos { transition: none; }
  .sc-lacre-reflejo { translate: 80px 0; }
  [data-fase="abriendo"] .sc-sobre { transform: none; }
  .sc:not(.sc-compacto) .sc-sobre { transform: none; transition: none; }
  .sc:not(.sc-compacto) .sc-escena, .sc-sombra { animation: none; }
}
`;

import { partesMadrid } from "@/lib/fecha";
import type { Invitacion } from "@/lib/tipos";
import { registroFuente } from "../fuentes/registro";
import { resolverTokens, variablesCss } from "../tokens";
import SelloRegistro from "./SelloRegistro";

/**
 * Apertura de REGISTRO, sin vídeo: 2,4 s de CSS y SVG, unos 4 KB.
 *
 *   0,0 s  la ficha en blanco: «Boda civil», los nombres, renglones.
 *   0,25 s el sello cae desde arriba, grande y desenfocado…
 *   1,0 s  …golpea: la hoja tiembla 3 px y la tinta se abre en un aro.
 *   1,1–2,4 s queda estampado, con la fecha y la hora. La capa se cierra
 *          (el temporizador lo pone el orquestador: `duracionMs`).
 *
 * Server Component, sin estado: la animación arranca sola cuando la capa
 * de la apertura pasa de `display:none` a visible. `prefers-reduced-motion`
 * ni la ve: el orquestador se la salta.
 */
export default function EscenaRegistro({ inv }: { inv: Invitacion }) {
  const t = resolverTokens(inv.plantilla, inv.tema);
  const p = partesMadrid(inv.pareja.fecha);
  const dos = (n: number) => String(n).padStart(2, "0");
  const primera = inv.bloques.find((x) => x.t === "itinerario");
  const hora =
    (primera && primera.t === "itinerario" ? primera.paradas[0]?.hora : undefined) ??
    `${dos(p.hora)}:${dos(p.minuto)}`;
  const { a, b } = inv.pareja;

  return (
    <div
      className={`ap-registro ${registroFuente.variable}`}
      style={variablesCss(t) as React.CSSProperties}
    >
      <div className="ap-registro-hoja">
        <div className="flex justify-between border-b-2 border-current pb-3 text-[1.0625rem] font-medium">
          <span>Boda civil</span>
          <span className="tabular-nums">
            {dos(p.dia)}.{dos(p.mes)}.{String(p.anio).slice(2)}
          </span>
        </div>
        <p className="ap-registro-nombres">
          <span className="block">{a}</span>
          <span className="block">y {b}</span>
        </p>
        <span className="ap-registro-renglon" />
        <span className="ap-registro-renglon" />
        <span className="ap-registro-renglon w-2/3" />
      </div>

      <div className="ap-registro-impacto" aria-hidden />
      <SelloRegistro
        id="sello-apertura"
        a={a}
        b={b}
        fecha={`${dos(p.dia)}.${dos(p.mes)}.${p.anio}`}
        hora={hora}
        size={240}
        className="ap-registro-sello"
      />

      <style>{`
        .ap-registro {
          position: absolute; inset: 0; overflow: hidden;
          display: grid; place-items: center;
          background: var(--papel); color: var(--tinta);
          font-family: var(--texto);
        }
        .ap-registro-hoja {
          position: absolute; inset: max(1.5rem, env(safe-area-inset-top)) 1.5rem auto;
          max-width: 40rem; margin: 0 auto; text-align: left;
          animation: ap-reg-golpe 220ms 1000ms ease-out both;
        }
        .ap-registro-nombres {
          margin-top: 2.5rem; font-family: var(--display); font-weight: 650;
          font-size: clamp(3rem, 17vw, 7rem); line-height: .88; letter-spacing: -.045em;
        }
        .ap-registro-renglon {
          display: block; height: 1px; margin-top: 2.2rem;
          background: color-mix(in srgb, currentColor 30%, transparent);
        }
        .ap-registro-sello {
          position: relative; z-index: 1; margin-top: 18vh;
          color: var(--acento-texto);
          transform-origin: 50% 50%;
          animation: ap-reg-cae 820ms 250ms cubic-bezier(.4,0,.6,1) both,
                     ap-reg-asienta 520ms 1010ms cubic-bezier(.22,.61,.36,1) both;
        }
        .ap-registro-impacto {
          position: absolute; left: 50%; top: calc(50% + 9vh);
          width: 240px; height: 240px; margin: -120px 0 0 -120px; border-radius: 50%;
          border: 10px solid var(--acento);
          opacity: 0;
          animation: ap-reg-tinta 700ms 1000ms ease-out both;
        }
        @keyframes ap-reg-cae {
          from { transform: translateY(-46vh) scale(2.3) rotate(8deg); opacity: 0; filter: blur(6px); }
          60%  { opacity: 1; filter: blur(1px); }
          to   { transform: translateY(0) scale(.96) rotate(-11deg); opacity: 1; filter: none; }
        }
        @keyframes ap-reg-asienta {
          from { transform: scale(.96) rotate(-11deg); }
          to   { transform: scale(1) rotate(-12deg); }
        }
        @keyframes ap-reg-golpe {
          0%, 100% { transform: none; }
          35% { transform: translateY(3px); }
        }
        @keyframes ap-reg-tinta {
          from { opacity: .55; transform: scale(.82); }
          to   { opacity: 0; transform: scale(1.35); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ap-registro-sello, .ap-registro-hoja, .ap-registro-impacto { animation: none; }
          .ap-registro-sello { transform: rotate(-12deg); }
        }
      `}</style>
    </div>
  );
}

/** Lo que dura, para el temporizador del orquestador. */
export const DURACION_REGISTRO_MS = 2400;

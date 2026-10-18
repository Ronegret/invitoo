"use client";

import { useEffect, useRef, useState } from "react";
import Icono from "@/components/Iconos";
import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";

/**
 * El momento en que llega.
 *
 * Desde el primer día, el posicionamiento escrito en docs/02-estrategia.md
 * dice que Invitoo no vende invitaciones: vende **el momento en que ciento
 * veinte personas abren el teléfono y se emocionan a la vez**. Y hasta ahora
 * eso estaba dicho, pero no enseñado en ninguna parte.
 *
 * La Qualité sí lo enseña —una conversación de WhatsApp donde la pareja
 * manda el enlace y la invitada responde— y es lo mejor de su web: en cinco
 * segundos entiendes qué compras y dónde ocurre. Se lo tomamos prestado
 * porque describe nuestro producto mejor que tres párrafos.
 *
 * Dos decisiones propias:
 *
 *  · **La conversación se escribe sola al entrar en pantalla**, con sus
 *    pausas y sus puntos suspensivos. Una captura estática de un chat es un
 *    dibujo; escribiéndose, es el momento.
 *  · **No se usa la marca de WhatsApp.** Ni logotipo, ni nombre dentro del
 *    teléfono. Es una ilustración de cómo se comparte un enlace, y así se
 *    dice en el texto alternativo: no queremos que parezca que WhatsApp
 *    tiene algo que ver con nosotros.
 *
 * Si alguien pide menos movimiento, la conversación aparece entera y quieta.
 */

type Mensaje = {
  de: "novios" | "invitada";
  texto: string;
  /** Milisegundos que tarda en aparecer desde que empieza la escena. */
  en: number;
};

const CONVERSACION: Mensaje[] = [
  { de: "novios", texto: "¡Hola, Carmen! Tenemos algo que enseñarte 🤍", en: 300 },
  { de: "novios", texto: "invitoo.es/i/nora-y-sebas", en: 1100 },
  { de: "invitada", texto: "espera", en: 2000 },
  { de: "invitada", texto: "¿ESO ES UN VÍDEO? 😭😭", en: 2700 },
  { de: "invitada", texto: "lo he puesto tres veces. Allí estaremos", en: 3400 },
];

const CLAVES = [
  "Llega como un enlace, por WhatsApp. No hay nada que instalar.",
  "Se abre con vuestro vídeo, y suena vuestra canción si la quieren oír.",
  "Confirman ahí mismo, en un minuto, sin registrarse.",
  "Vosotros lo veis todo en vuestro panel, según va llegando.",
];

export default function MomentoWhatsApp() {
  const caja = useRef<HTMLDivElement>(null);
  const [visibles, setVisibles] = useState(0);
  const [escribiendo, setEscribiendo] = useState(false);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto) {
      setVisibles(CONVERSACION.length);
      return;
    }

    const relojes: number[] = [];
    let arrancada = false;

    const arrancar = () => {
      if (arrancada) return;
      arrancada = true;
      CONVERSACION.forEach((m, i) => {
        // Los puntos suspensivos aparecen medio segundo antes del mensaje.
        relojes.push(
          window.setTimeout(() => setEscribiendo(true), Math.max(0, m.en - 450)),
        );
        relojes.push(
          window.setTimeout(() => {
            setEscribiendo(false);
            setVisibles(i + 1);
          }, m.en),
        );
      });
    };

    /**
     * Se mira la POSICIÓN, no el aviso del observador.
     *
     * Con IntersectionObserver solo, la escena no arrancaba nunca si se
     * pasaba de largo deprisa: el aviso llega en diferido y, cuando llega,
     * el elemento ya no está en pantalla, así que `isIntersecting` viene en
     * falso y no dispara nada. Lo cazó `revisar.mjs`, que recorre la página
     * a saltos de 700 px: dos burbujas se quedaban en opacity:0 para
     * siempre. Es el mismo fallo que tuvimos con las fichas del catálogo.
     *
     * Preguntando por el rectángulo del elemento no hay diferido que valga:
     * o está a la vista, o ya se ha pasado de largo. En los dos casos, se
     * arranca.
     */
    let pedido = 0;
    const mirar = () => {
      if (pedido || arrancada) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        const r = nodo.getBoundingClientRect();
        const aLaVista = r.top < window.innerHeight + 300 && r.bottom > -300;
        // `r.bottom <= -300` significa que ya ha quedado por encima: alguien
        // pasó de largo y al volver tiene que estar la conversación puesta.
        if (aLaVista) arrancar();
        else if (r.bottom <= -300) {
          arrancada = true;
          setVisibles(CONVERSACION.length);
        }
        if (arrancada) window.removeEventListener("scroll", mirar);
      });
    };

    mirar();
    window.addEventListener("scroll", mirar, { passive: true });

    return () => {
      window.removeEventListener("scroll", mirar);
      if (pedido) cancelAnimationFrame(pedido);
      relojes.forEach(window.clearTimeout);
    };
  }, []);

  return (
    <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-32">
      <div className="mx-auto grid max-w-[68rem] items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
        <div>
          <Revelar>
            <div className="text-center lg:text-left">
              <p className="text-[0.75rem] uppercase tracking-[0.42em] opacity-50">
                Dónde ocurre
              </p>
              <h2 className="display mt-5 text-[clamp(2.2rem,6vw,3.4rem)] leading-[1.06]">
                La emoción empieza
                <br />
                <em className="not-italic opacity-100">antes de abrirla</em>
              </h2>
              <Rama
                forma="guirnalda"
                ancho={160}
                className="mx-auto mt-6 text-[var(--verde)] lg:mx-0"
              />
            </div>
          </Revelar>

          <Revelar retraso={120}>
            <p className="mx-auto mt-8 max-w-[34rem] text-center text-[1.02rem] leading-[1.85] opacity-72 lg:mx-0 lg:text-left">
              Una invitación de papel se abre a solas, en la cocina, un martes.
              Ésta se abre en el móvil, y se enseña. Ese momento —el de pasarle
              el teléfono a alguien— es el que diseñamos.
            </p>
          </Revelar>

          <ul className="mx-auto mt-9 flex max-w-[34rem] flex-col gap-3.5 lg:mx-0">
            {CLAVES.map((c, i) => (
              <Revelar as="li" key={c} retraso={200 + i * 80}>
                <span className="flex gap-3.5 text-[0.97rem] leading-[1.65] opacity-75">
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[var(--verde)]"
                  >
                    <Icono id="check" size={15} />
                  </span>
                  {c}
                </span>
              </Revelar>
            ))}
          </ul>
        </div>

        {/* ── El teléfono ───────────────────────────────────────────────── */}
        <Revelar retraso={160}>
          <div
            ref={caja}
            role="img"
            aria-label="Ilustración de una conversación: los novios mandan el enlace de su invitación y una invitada responde emocionada."
            className="mx-auto w-[19rem] max-w-full rounded-[2.4rem] border border-[var(--tinta)]/12 bg-[#101c17] p-2.5 shadow-[0_30px_70px_-30px_rgba(26,21,18,.55)]"
          >
            <div className="overflow-hidden rounded-[1.9rem] bg-[#ece5dd]">
              {/* Cabecera del chat. Sin marca de nadie: son los novios. */}
              <div className="flex items-center gap-3 bg-[#1d5c4b] px-4 py-3 text-white">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-[0.7rem] tracking-wider">
                  N&S
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.88rem]">
                    Nora &amp; Sebas
                  </span>
                  <span className="block text-[0.68rem] opacity-70">
                    en línea
                  </span>
                </span>
              </div>

              {/* `justify-end`: los mensajes se apoyan abajo, como en
                  cualquier conversación. Arriba quedaba un hueco muerto de
                  un palmo y el teléfono parecía vacío. */}
              <ol className="flex h-[24rem] flex-col justify-end gap-2 overflow-hidden p-3.5">
                {CONVERSACION.map((m, i) => {
                  const puesto = i < visibles;
                  const mio = m.de === "novios";
                  return (
                    <li
                      key={m.texto}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.82rem] leading-[1.45] ${
                        mio
                          ? "self-end rounded-br-sm bg-[#d6f2c4]"
                          : "self-start rounded-bl-sm bg-white"
                      }`}
                      style={{
                        color: "#12241c",
                        opacity: puesto ? 1 : 0,
                        transform: puesto ? "none" : "translateY(10px) scale(.96)",
                        transition:
                          "opacity 320ms ease, transform 420ms cubic-bezier(.22,.7,.28,1)",
                      }}
                    >
                      {m.texto}
                    </li>
                  );
                })}

                {/* Los puntos suspensivos, mientras el otro escribe. */}
                <li
                  aria-hidden
                  className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-3"
                  style={{
                    opacity: escribiendo && visibles < CONVERSACION.length ? 1 : 0,
                    transition: "opacity 260ms ease",
                  }}
                >
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="punto block h-1.5 w-1.5 rounded-full bg-[#12241c]/35"
                      style={{ animationDelay: `${n * 160}ms` }}
                    />
                  ))}
                </li>
              </ol>
            </div>
          </div>
        </Revelar>
      </div>

      <style>{`
        .punto { animation: late 1200ms ease-in-out infinite; }
        @keyframes late {
          0%, 60%, 100% { transform: translateY(0); opacity: .35; }
          30%           { transform: translateY(-3px); opacity: .9; }
        }
        @media (prefers-reduced-motion: reduce) { .punto { animation: none; } }
      `}</style>
    </section>
  );
}

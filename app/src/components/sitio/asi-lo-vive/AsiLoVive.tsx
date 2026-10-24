"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Iphone from "@/components/sitio/telefono/Iphone";
import PantallaViva from "@/components/sitio/telefono/PantallaViva";
import s from "./asi.module.css";

/**
 * «Así lo vive un invitado» (W2, docs/09 §4 «La home», punto 3).
 *
 * Un teléfono fijo y cuatro escenas que pasan al bajar: le llega por
 * WhatsApp → se abre (vídeo, destello y la invitación) → confirma y se
 * estampa el sello → el día de la boda sube sus fotos y deja su deseo.
 *
 * Qué escena toca lo decide un IntersectionObserver sobre los pasos (una
 * franja en el centro de la pantalla): nada de escuchar el scroll. Sin
 * JavaScript se leen los cuatro pasos y el teléfono enseña el chat.
 *
 * No se usa la marca de WhatsApp: es una ilustración de cómo se comparte
 * un enlace (lo mismo que decidió MomentoWhatsApp).
 */

const DEMO = { slug: "paula-y-marc", a: "Paula", b: "Marc", fecha: "10 de julio" };

const PASOS = [
  {
    titulo: "Le llega por WhatsApp",
    texto:
      "Un enlace con su nombre. No hay nada que instalar ni que registrarse: se toca y se abre, como una foto. La abuela también.",
  },
  {
    titulo: "Se abre como una carta",
    texto:
      "Primero la apertura, con vuestra música si la quiere oír. Después, vuestra historia, la cuenta atrás, el itinerario y cómo llegar, con letra grande y nada que se pise.",
  },
  {
    titulo: "Confirma en un minuto",
    texto:
      "Quién viene, qué menú quiere y qué no puede comer. Al decir que sí, se estampa el sello. Vosotros lo veis al momento en vuestro panel, sin perseguir a nadie.",
  },
  {
    titulo: "Y el día de la boda, lo comparte",
    texto:
      "Sube sus fotos desde la mesa y salen en la pantalla del salón. Os deja un buen deseo, y al día siguiente tenéis el Libro de deseos listo para imprimir.",
  },
];

const CHAT = [
  { de: "novios", texto: "¡Hola, Carmen! Tenemos algo que contarte 🤍" },
  { de: "novios", texto: "enlace" },
  { de: "invitada", texto: "espera" },
  { de: "invitada", texto: "¿¿ESO ES UN VÍDEO?? 😭" },
  { de: "invitada", texto: "Confirmado. Allí estaré" },
] as const;

export default function AsiLoVive({ descuento }: { descuento: number }) {
  const [escena, setEscena] = useState(0);
  const pasos = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const lista = pasos.current;
    if (!lista) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setEscena(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    lista.querySelectorAll("[data-i]").forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const activa = (i: number) => (escena === i ? "" : undefined);

  return (
    <section className={s.seccion} aria-labelledby="asi-titulo">
      <div className={s.cabeza}>
        <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
          <span aria-hidden className="h-px w-8 bg-current" />
          Así lo vive un invitado
        </p>
        <h2 id="asi-titulo" className="display mt-4 max-w-[44rem] text-[clamp(2.4rem,6.4vw,4.4rem)] leading-[1.02] [text-wrap:balance]">
          De un WhatsApp a «allí estaré», en un minuto.
        </h2>
      </div>

      <div className={s.escenario}>
        <div className={s.pegado}>
          <div className={s.movil}>
            <Iphone acabado="claro">
              {/* 1 · El chat */}
              <div className={s.capa} data-activa={escena === 0 || undefined}>
                <div className={s.chat} role="img" aria-label="Ilustración: los novios mandan el enlace de su invitación y una invitada responde emocionada.">
                  <div className={s.chatCabeza}>
                    <span className={s.chatAvatar}>P&amp;M</span>
                    <span>
                      {DEMO.a} &amp; {DEMO.b}
                      <br />
                      <small style={{ opacity: 0.7 }}>en línea</small>
                    </span>
                  </div>
                  <ol className={s.chatLista}>
                    {CHAT.map((m, i) => (
                      <li key={i} className={s.burbuja} data-de={m.de} style={{ "--n": i } as React.CSSProperties}>
                        {m.texto === "enlace" ? (
                          <>
                            invitoo.es/i/{DEMO.slug}
                            <span className={s.enlaceChat}>
                              {/* eslint-disable-next-line @next/next/no-img-element -- póster ya optimizado */}
                              <img src="/tematicas/orilla/poster-h.avif" alt="" width={1280} height={720} loading="lazy" decoding="async" />
                              <span>
                                {DEMO.a} &amp; {DEMO.b} · Nos casamos
                              </span>
                            </span>
                          </>
                        ) : (
                          m.texto
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 2 · La apertura y la invitación */}
              <div className={s.capa} data-activa={activa(1)}>
                <PantallaViva
                  tira={DEMO.slug}
                  poster="/tematicas/orilla/poster-v.avif"
                  video="/tematicas/orilla/hero-v.webm"
                  modo="auto"
                  duracion="16s"
                  hasta="-55%"
                  fondo="#f4ede1"
                  activo={escena === 1}
                  titulo={`La invitación de ${DEMO.a} y ${DEMO.b} abriéndose en el móvil`}
                />
              </div>

              {/* 3 · La confirmación */}
              <div className={s.capa} data-activa={activa(2)}>
                <div className={s.rsvp} role="img" aria-label="Ilustración: Carmen confirma que viene, elige pescado y se estampa el sello «Os esperamos, Carmen».">
                  <span className={s.rsvpNombres}>
                    {DEMO.a} &amp; {DEMO.b}
                  </span>
                  <p className={s.rsvpPregunta}>¿Vienes, Carmen?</p>
                  <div className={s.opciones}>
                    <span className={s.opcion} data-si>
                      Sí, allí estaré
                    </span>
                    <span className={s.opcion}>No podré ir</span>
                  </div>
                  <div className={s.chips}>
                    <span>Carne</span>
                    <span data-si>Pescado</span>
                    <span>Vegetariano</span>
                  </div>
                  <div className={s.chips}>
                    <span>Sin lactosa</span>
                  </div>
                  <div className={s.sello}>
                    <span className={s.selloDisco}>
                      Os esperamos,
                      <br />
                      Carmen
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 · En directo y el libro de deseos */}
              <div className={s.capa} data-activa={activa(3)}>
                <div className={s.directo} role="img" aria-label="Ilustración: la invitada sube sus fotos a la pantalla del salón y deja un mensaje en el libro de deseos.">
                  <span className={s.directoTitulo}>Las fotos de la boda</span>
                  <div className={s.mosaico}>
                    {["directo-brindis", "directo-amigas", "directo-pista", "directo-tarta"].map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura AVIF ya optimizada
                      <img key={f} src={`/generadas/${f}-480.avif`} alt="" width={480} height={480} loading="lazy" decoding="async" />
                    ))}
                  </div>
                  <span className={s.barra}>
                    <i />
                  </span>
                  <span className={s.aviso}>Tu foto ya está en la pantalla del salón</span>
                  <span className={s.deseo}>
                    «Que la vida os dé tantos bailes como esta noche.»
                    <small>Carmen · para el Libro de deseos</small>
                  </span>
                </div>
              </div>
            </Iphone>
          </div>
          <div className={s.puntos} aria-hidden>
            {PASOS.map((_, i) => (
              <span key={i} data-activo={escena === i || undefined} />
            ))}
          </div>
        </div>

        <ol ref={pasos} className={s.pasos}>
          {PASOS.map((p, i) => (
            <li key={p.titulo} className={s.paso} data-i={i} data-activo={escena === i || undefined}>
              <div className={s.tarjeta}>
                <span className={s.numero}>0{i + 1}</span>
                <h3 className={s.titulo}>{p.titulo}</h3>
                <p className={s.texto}>{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={s.cierre}>
        <p>
          ¿Y si la próxima que se casa es Carmen? Los invitados que se casan
          tienen {descuento} € de descuento en su invitación.
        </p>
        <Link href="/para-invitados">Lo que cuenta para los invitados</Link>
      </div>
    </section>
  );
}

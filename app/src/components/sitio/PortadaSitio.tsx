"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Rama from "@/components/Botanica";
import { enlaceReserva } from "@/lib/contacto";

/**
 * La portada de invitoo.es.
 *
 * ESTRUCTURA: **la película arriba, la letra impresa abajo.** Que es como
 * está hecha una invitación de papel con fotografía: la imagen ocupa su
 * mitad, entera y sin nada encima, y la fórmula va compuesta debajo sobre el
 * papel, con su filete separando las dos.
 *
 * Por qué así, y no como estaba:
 *
 *  · **El vídeo no se tapa.** La versión anterior lo llevaba a sangre con un
 *    degradado de papel encima para poder escribir sobre él. Servía para la
 *    letra, pero se comía casi la mitad de la película —justo la parte donde
 *    aparece el móvil con la invitación dentro, que es el plano que vende—.
 *    Un vídeo de marca compuesto no se recorta con un degradado: se enseña.
 *  · **La letra siempre se lee.** Sobre papel, no sobre imagen. En todos los
 *    fotogramas, no solo en los que salen claros. Sin velos, sin sombras
 *    bajo el texto, sin depender de qué esté pasando en el vídeo.
 *  · **Nada se pisa.** El vídeo dice «INVITOO» a pantalla completa en el
 *    segundo dos, con la misma didone que usamos en los titulares. Con la
 *    letra encima, las dos tipografías se superponían y no se leía ninguna
 *    (está en _research/capturas/portada/t2.png). Separadas en dos zonas, el
 *    logotipo del vídeo se luce y el titular también.
 *
 * El filete lleva su brote en el centro, como el sello que tapa la costura
 * de un sobre. Es lo único decorativo que hay aquí, y está para que el corte
 * entre imagen y papel no sea una línea seca.
 *
 * El vídeo va mudo y en bucle. Mudo no es estilo: es la única forma de que
 * un navegador lo deje arrancar solo, y es el mismo patrón que las aperturas
 * de las invitaciones.
 */

/** Las dos estampas de marca. Se turnan debajo del vídeo. */
const ESTAMPAS = ["/fotos/sitio/portada.avif", "/fotos/sitio/portada-2.avif"];

const PRUEBAS = ["36 diseños", "desde 89 €", "listo en 5 días", "pago único"];

export default function PortadaSitio() {
  const [entrado, setEntrado] = useState(false);
  const [video, setVideo] = useState<string | null>(null);
  const [rodando, setRodando] = useState(false);
  const [estampa, setEstampa] = useState(0);
  const turno = useRef<number | null>(null);

  useEffect(() => {
    // Un fotograma de margen para que la transición tenga de dónde salir.
    const t = window.setTimeout(() => setEntrado(true), 60);

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Con datos medidos o ahorro activado no se baja un megabyte de adorno.
    const red = (
      navigator as {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const malaRed =
      red?.saveData || /^(slow-)?2g$/.test(red?.effectiveType ?? "");
    if (!quieto && !malaRed) {
      const grande = window.matchMedia("(min-width: 768px)").matches;
      setVideo(
        grande ? "/fotos/sitio/portada-h.mp4" : "/fotos/sitio/portada-v.mp4",
      );
    }

    // Mientras el vídeo no arranque —o no vaya a arrancar nunca, que es el
    // caso de quien pide menos movimiento o lleva ahorro de datos— las dos
    // estampas se turnan. Así la portada sin vídeo tampoco es una foto fija.
    if (!quieto) {
      turno.current = window.setInterval(
        () => setEstampa((n) => (n + 1) % ESTAMPAS.length),
        9000,
      );
    }

    return () => {
      window.clearTimeout(t);
      if (turno.current) window.clearInterval(turno.current);
    };
  }, []);

  /** En cuanto el vídeo se ve, el relevo de estampas sobra: las tapa. */
  function arranca() {
    setRodando(true);
    if (turno.current) {
      window.clearInterval(turno.current);
      turno.current = null;
    }
  }

  const paso = (ms: number) => ({
    opacity: entrado ? 1 : 0,
    transform: entrado ? "none" : "translateY(14px)",
    transition: `opacity 900ms ease ${ms}ms, transform 900ms cubic-bezier(.22,.7,.28,1) ${ms}ms`,
  });

  return (
    <section className="flex min-h-[100svh] w-full flex-col bg-[var(--papel)]">
      {/* ─────────────── La película, entera y sin nada encima ─────────── */}
      <div className="relative h-[46svh] w-full shrink-0 overflow-hidden sm:h-[50svh]">
        {ESTAMPAS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado
          <img
            key={src}
            src={src}
            alt=""
            width={1600}
            height={900}
            // La primera es el LCP y se pide con prioridad; la segunda solo
            // hace falta nueve segundos después.
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: estampa === i ? 1 : 0,
              transform: entrado ? "scale(1)" : "scale(1.05)",
              transition:
                "opacity 2000ms ease, transform 2800ms cubic-bezier(.22,.7,.28,1)",
            }}
          />
        ))}

        {video && (
          <video
            // eslint-disable-next-line jsx-a11y/media-has-caption -- decorativo
            src={video}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onPlaying={arranca}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: rodando ? 1 : 0,
              transition: "opacity 900ms ease",
            }}
          />
        )}

        {/* Un toque de papel en los dos bordes: arriba para que la cabecera
            agarre, abajo para que la película se funda con el papel en vez
            de cortarse a cuchillo. En el centro, nada. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(251,248,243,.62) 0%, rgba(251,248,243,0) 17%, rgba(251,248,243,0) 88%, rgba(251,248,243,.9) 100%)",
          }}
        />
      </div>

      {/* ─────────────── El filete, con su brote en el centro ──────────── */}
      <div
        className="relative z-10 -mt-6 flex shrink-0 items-center justify-center px-6"
        style={paso(500)}
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--oro)]/40" />
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[var(--oro)]/30 bg-[var(--papel)] text-[var(--verde)]">
          <Rama forma="brote" ancho={22} retraso={700} />
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--oro)]/40" />
      </div>

      {/* ─────────────── La fórmula, impresa en el papel ───────────────── */}
      <div className="grano flex flex-1 items-center justify-center px-6 pb-10 pt-6 text-center text-[var(--tinta)]">
        <div className="mx-auto max-w-[44rem]">
          <p
            className="text-[0.72rem] uppercase tracking-[0.44em] opacity-50 sm:text-[0.76rem]"
            style={paso(700)}
          >
            Tenemos el gusto de invitaros
          </p>

          {/* El nombre ya lo dice el vídeo, y lo dice mejor. Aquí va lo que
              nos separa de una tarjeta con los datos puestos. */}
          <h1
            className="display asienta mt-4 text-[clamp(2.1rem,5.6vw,3.6rem)] leading-[1.06]"
            style={{ ...paso(900), animationDelay: "900ms" }}
          >
            Vuestra invitación
            <br />
            no se lee: se abre
          </h1>

          <p
            className="mx-auto mt-4 max-w-[34rem] text-[0.99rem] leading-[1.7] opacity-68 sm:text-[1.04rem]"
            style={paso(1100)}
          >
            Invitaciones de boda digitales, hechas a medida: con su vídeo de
            apertura y su canción.
          </p>

          <div
            className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3"
            style={paso(1300)}
          >
            <a
              href={enlaceReserva()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[var(--tinta)] px-8 text-[0.76rem] uppercase tracking-[0.18em] text-[var(--papel)] transition-transform duration-500 hover:scale-[1.03] sm:min-h-14 sm:w-auto"
            >
              Hablamos 20 minutos
            </a>
            {/* En táctil no hay ratón que revele un subrayado al pasar por
                encima, así que aquí va puesto de serie. */}
            <Link
              href="/plantillas"
              className="inline-flex min-h-12 items-center justify-center px-4 text-[0.76rem] uppercase tracking-[0.18em] underline decoration-[var(--tinta)]/35 underline-offset-[7px] transition-colors duration-500 sm:min-h-14 sm:w-auto sm:rounded-full sm:border sm:border-[var(--tinta)]/30 sm:px-8 sm:no-underline sm:hover:border-[var(--tinta)] sm:hover:bg-[var(--tinta)]/5"
            >
              Ver las doce aperturas
            </Link>
          </div>

          {/* La prueba dura, en una línea. chungdoi pone «gratis» en el
              primer pantallazo y agendalafecha pone las tres plantillas que
              tiene; una portada bonita que no dice ni cuántos diseños hay ni
              cuánto cuesta obliga a seguir bajando para enterarse. */}
          <ul
            className="mx-auto mt-6 flex max-w-[32rem] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[0.76rem] opacity-55"
            style={paso(1450)}
          >
            {PRUEBAS.map((x, i) => (
              <li key={x} className="flex items-center gap-4">
                {i > 0 && (
                  <span aria-hidden className="h-3 w-px bg-[var(--tinta)]/25" />
                )}
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Rama from "@/components/Botanica";
import type { Invitacion } from "@/lib/tipos";

/**
 * La puerta: lo que aparece JUSTO DESPUÉS del vídeo de apertura.
 *
 * Idea tomada de fixdate.io, que la tiene bien resuelta: en vez de pelearse
 * con el bloqueo de autoplay del navegador, **se convierte en una pregunta**.
 * El invitado elige entrar con música o sin ella, y ese toque es el gesto que
 * autoriza el audio. Deja de ser un problema técnico y pasa a ser el primer
 * momento de la invitación.
 *
 * Lo que Invitoo añade encima, y ellos no pueden: si la boda tiene canción de
 * Dedícalo, **aquí se dice**. No es «música de fondo», es una canción escrita
 * para esos dos. Eso es lo que hace que alguien pulse «con música» en vez de
 * quitarle el sonido por costumbre.
 *
 * Va después del vídeo a propósito. Antes iba antes y era peor: se le pedía
 * una decisión a alguien que todavía no sabía qué estaba mirando. Ahora
 * primero se emociona y luego elige.
 *
 * Se ve una vez por invitación: quien vuelve a mirar la hora entra directo.
 */
export default function Puerta({
  inv,
  onEntrar,
  saludo,
}: {
  inv: Invitacion;
  onEntrar: (conMusica: boolean) => void;
  saludo?: { nombre: string; acompanantes: number } | null;
}) {
  const [entrado, setEntrado] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setEntrado(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  function salir(conMusica: boolean) {
    setSaliendo(true);
    window.setTimeout(() => onEntrar(conMusica), 620);
  }

  const { a, b, fecha } = inv.pareja;
  const dia = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));

  const paso = (ms: number) => ({
    opacity: entrado ? 1 : 0,
    transform: entrado ? "none" : "translateY(14px)",
    transition: `opacity 900ms ease ${ms}ms, transform 900ms cubic-bezier(.22,.7,.28,1) ${ms}ms`,
  });

  const cancion = inv.musica?.deDedicalo;

  return (
    <div
      className="grano fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: "var(--papel)",
        color: "var(--tinta)",
        opacity: saliendo ? 0 : 1,
        transform: saliendo ? "scale(1.03)" : "none",
        transition: "opacity 600ms ease, transform 700ms cubic-bezier(.4,0,.2,1)",
      }}
    >
      {/* Guirnaldas arriba y abajo, como la papelería de una boda. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-6 text-[var(--acento)] opacity-55">
        <Rama forma="guirnalda" ancho={260} retraso={200} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-6 text-[var(--acento)] opacity-55">
        <Rama forma="guirnalda" ancho={260} retraso={400} espejo />
      </div>

      <div className="grid min-h-full place-items-center px-7 py-24 text-center">
        <div className="w-full max-w-[26rem]">
          <p
            className="text-[0.76rem] uppercase tracking-[0.36em] opacity-55"
            style={paso(200)}
          >
            {saludo ? `Hola, ${saludo.nombre}` : "Estáis invitados a la boda de"}
          </p>

          {/* Un <p>, no un <h1>: desde que la puerta va DESPUÉS del vídeo,
              la portada de la invitación ya está montada detrás con su
              propio h1, y dos h1 en una página es un fallo de verdad —un
              lector de pantalla anuncia dos títulos de documento. */}
          <p
            className="display mt-7 text-[clamp(2.8rem,14vw,4rem)] leading-[1.02]"
            style={paso(380)}
          >
            {a}
            <span className="mx-auto my-3 grid h-11 w-11 place-items-center rounded-full bg-[var(--acento)] text-[1.3rem] italic text-[var(--papel)]">
              &amp;
            </span>
            {b}
          </p>

          <span
            className="mx-auto mt-7 block h-px w-28 bg-[var(--acento)]/45"
            style={{
              transform: entrado ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 1100ms cubic-bezier(.22,.7,.28,1) 700ms",
            }}
          />

          <p
            className="display mt-6 text-[1.4rem] text-[var(--acento)]"
            style={paso(820)}
          >
            Nuestra boda
          </p>
          <p
            className="mt-2 text-[0.78rem] uppercase tracking-[0.3em] opacity-50"
            style={paso(900)}
          >
            {dia}
          </p>

          {saludo && saludo.acompanantes > 0 && (
            <p className="mt-7 text-[0.95rem] leading-relaxed opacity-70" style={paso(980)}>
              Tenéis reservadas {saludo.acompanantes + 1} plazas.
            </p>
          )}

          <div className="mt-12" style={paso(1100)}>
            <p className="mx-auto max-w-[22rem] text-[0.98rem] leading-[1.7] opacity-72">
              {cancion ? (
                <>
                  Hay una canción compuesta para {a} y {b}.
                  <br />
                  Merece la pena escucharla mientras la leéis.
                </>
              ) : (
                <>La música de fondo es parte de la experiencia.</>
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => salir(true)}
                className="min-h-14 rounded-full bg-[var(--acento)] px-8 text-[0.8rem] uppercase tracking-[0.2em] text-white transition-transform duration-500 hover:scale-[1.02]"
              >
                {cancion ? "Seguir con su canción" : "Seguir con música"}
              </button>
              <button
                type="button"
                onClick={() => salir(false)}
                className="min-h-14 rounded-full border border-current/25 px-8 text-[0.8rem] uppercase tracking-[0.2em] transition-colors duration-500 hover:border-current/60"
              >
                Seguir sin música
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

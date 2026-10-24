"use client";

import { useSyncExternalStore } from "react";

/**
 * Cuenta atrás.
 *
 * La invitación es una página estática: un número calculado en el servidor
 * estaría viejo al día siguiente. Así que el servidor (y quien no tenga
 * JavaScript) ve LA FECHA, que siempre es verdad, y el navegador la cambia
 * por la cuenta en cuanto llega. Nunca sale «0 días 0 horas».
 *
 * Momento firma 4: el número de días late una vez cuando cambia (al llegar
 * y a medianoche), no cada segundo. Cuando la boda ya pasó, no se queda en
 * cero: «Ya nos casamos. Gracias por estar».
 *
 * Sin fondos propios: hereda el color de la sección (Carta la pinta en
 * negativo, sobre verde).
 */
function suscribir(f: () => void) {
  const id = window.setInterval(f, 1000);
  return () => window.clearInterval(id);
}
const ahora = () => Math.floor(Date.now() / 1000);
const enServidor = () => null;

export default function CuentaAtras({ hasta }: { hasta: string }) {
  const segundo = useSyncExternalStore(suscribir, ahora, enServidor);
  const fin = new Date(hasta).getTime();

  const fecha = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(hasta));

  const marco = "flex min-h-[7.5rem] items-start justify-center";

  if (segundo === null || !Number.isFinite(fin)) {
    return (
      <section className="px-6 py-20 text-center">
        <p className="text-[1rem] uppercase tracking-[0.28em] opacity-80">Nos vemos el</p>
        <div className={`${marco} mt-7`}>
          <p className="display text-[clamp(1.9rem,8vw,2.8rem)] leading-tight first-letter:uppercase">
            {fecha}
          </p>
        </div>
      </section>
    );
  }

  const ms = Math.max(0, fin - segundo * 1000);
  if (ms === 0) {
    const dia = (t: number) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(t));
    const hoy = dia(segundo * 1000) === dia(fin);
    return (
      <section className="px-6 py-20 text-center">
        <div className={`${marco} flex-col items-center`}>
          <p className="display text-[clamp(2.2rem,10vw,3.4rem)] [text-wrap:balance]">
            {hoy ? "Hoy nos casamos" : "Ya nos casamos"}
          </p>
          <p className="mx-auto mt-5 max-w-[26rem] text-[1.0625rem] leading-relaxed opacity-85 [text-wrap:pretty]">
            {hoy ? "Gracias por estar aquí." : <>Fue el {fecha}. Gracias por estar.</>}
          </p>
        </div>
      </section>
    );
  }

  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor(ms / 3_600_000) % 24;
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;

  return (
    <section className="px-6 py-20 text-center">
      <p className="text-[1rem] uppercase tracking-[0.28em] opacity-80">Nos quedan</p>
      {/* Lo que se anuncia es una frase, no cuatro números cambiando cada segundo. */}
      <p className="sr-only">
        {d === 1 ? "Falta 1 día" : `Faltan ${d} días`} para el {fecha}.
      </p>
      <div className={`${marco} mt-7 gap-6 sm:gap-10`} aria-hidden>
        {(
          [
            ["días", d],
            ["horas", h],
            ["min", m],
            ["seg", s],
          ] as const
        ).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="min-w-[3.2rem]">
            {/* La cifra que cambia se funde con la siguiente: `key` la
                vuelve a montar y `cifra-funde` la hace entrar. Ancho fijo
                (tabular-nums), así que no se mueve nada alrededor. */}
            <p className="display text-[clamp(2.2rem,11vw,3.4rem)] tabular-nums">
              <span key={valor} className={`cifra-funde inline-block ${etiqueta === "días" ? "dia-late" : ""}`}>
                {valor}
              </span>
            </p>
            <p className="mt-1 text-[1rem] uppercase tracking-[0.2em] opacity-80">{etiqueta}</p>
          </div>
        ))}
      </div>
      <style>{CIFRA}</style>
    </section>
  );
}

/** Solo opacity y filter: la cifra nueva aparece como tinta que se seca. */
const CIFRA = `
.cifra-funde { animation: cifra-funde 700ms cubic-bezier(.25,.1,.12,1) both; }
@keyframes cifra-funde { from { opacity: .15; filter: blur(2px); } }
/* El día: un latido, como un corazón que se salta un compás. */
.dia-late { animation: cifra-funde 700ms cubic-bezier(.25,.1,.12,1) both, dia-late 900ms cubic-bezier(.45,0,.55,1) 250ms both; }
@keyframes dia-late {
  0%, 100% { transform: none; }
  22% { transform: scale(1.09); }
  40% { transform: scale(.995); }
  58% { transform: scale(1.035); }
}
@media (prefers-reduced-motion: reduce) { .cifra-funde, .dia-late { animation: none; } }
`;

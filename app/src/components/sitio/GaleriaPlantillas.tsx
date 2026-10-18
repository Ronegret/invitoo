"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Rama from "@/components/Botanica";
import Icono from "@/components/Iconos";
import { Volumen } from "@/components/Gestos";
import Revelar from "@/components/Revelar";
import { PLANTILLAS } from "@/data/plantillas";

/**
 * La galería.
 *
 * La ficha enseña la PORTADA REAL de su invitación, no un fotograma del
 * vídeo. Las previas se generan con `herramientas/previsualizar.mjs`, que
 * abre cada invitación con un navegador y la fotografía. Antes se veía un
 * banco con una planta y quien miraba el catálogo no veía el diseño.
 *
 * CAMBIO IMPORTANTE: antes cada ficha era un vídeo que había que pulsar para
 * que arrancase. Frágil —si el navegador no deja reproducir, si la red va
 * lenta, si el autoplay se bloquea, el visitante no ve nada y se va— y
 * además no enseñaba la invitación entera, solo los primeros segundos.
 *
 * Ahora **toda la ficha es un enlace** a una invitación de muestra completa,
 * publicada y con su propia URL. Se abre siempre, se recorre entera y se
 * puede enseñar a alguien pasándole el enlace. El vídeo sigue estando como
 * anticipo al pasar el ratón, pero ya no es la única forma de ver nada: si
 * falla, el enlace sigue ahí.
 */
export default function GaleriaPlantillas({ limite }: { limite?: number }) {
  const lista = limite ? PLANTILLAS.slice(0, limite) : PLANTILLAS;
  const [encima, setEncima] = useState<string | null>(null);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});

  function anticipo(id: string, entra: boolean) {
    setEncima(entra ? id : null);
    const v = videos.current[id];
    if (!v) return;
    if (entra) {
      // Con preload="none" el elemento no tiene ni un byte: hay que pedirle
      // que cargue antes de reproducir, o el play() falla en silencio.
      if (v.readyState === 0) v.load();
      v.currentTime = 0;
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map((p, i) => {
        const [a, b, fecha] = p.pareja;
        const viva = encima === p.id;
        return (
          <Revelar as="li" key={p.id} retraso={(i % 3) * 110}>
            <Link
              href={`/i/${p.demo}`}
              className="group block"
              onPointerEnter={() => anticipo(p.id, true)}
              onPointerLeave={() => anticipo(p.id, false)}
              onFocus={() => anticipo(p.id, true)}
              onBlur={() => anticipo(p.id, false)}
            >
              <div className="relative mx-auto w-full max-w-[17rem]">
                <Rama
                  forma={i % 2 ? "eucalipto" : "olivo"}
                  ancho={150}
                  espejo={i % 2 === 0}
                  retraso={200 + i * 90}
                  className="pointer-events-none absolute -top-8 z-0 text-[var(--verde)]"
                  style={{ [i % 2 ? "left" : "right"]: "-3.2rem" } as React.CSSProperties}
                />

                <Volumen className="relative z-10">
                  <div className="marco relative overflow-hidden rounded-[2rem] border-[7px] border-[var(--tinta)] bg-[var(--tinta)] shadow-[0_22px_50px_-20px_rgba(0,0,0,.45)]">
                    <div className="relative aspect-[9/16] bg-[var(--bruma)]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
                      <img
                        src={p.poster}
                        alt={`Invitación ${p.nombre}`}
                        width={720}
                        height={1280}
                        loading={i < 3 ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      {p.apertura && (
                        <video
                          ref={(el) => {
                            videos.current[p.id] = el;
                          }}
                          // eslint-disable-next-line jsx-a11y/media-has-caption -- decorativo
                          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                          style={{ opacity: viva ? 1 : 0 }}
                          src={p.apertura.vertical}
                          poster={p.poster}
                          muted
                          loop
                          playsInline
                          // `none`: con `metadata` el navegador pedía los
                          // DOCE vídeos nada más cargar la página —medido:
                          // doce peticiones, todas canceladas al pasar de
                          // largo— y eso en un móvil con datos es tirar el
                          // ancho de banda de alguien. El vídeo se carga
                          // cuando se pide, en `anticipo()`.
                          preload="none"
                        />
                      )}

                      {/* La insignia y la marca de música, arriba, como en
                          La Qualité. Suyo es el sitio; la diferencia es qué
                          se pone: ellos ponen «MÁS VENDIDA EN ESPAÑA» y
                          nosotros no tenemos datos de ventas que lo
                          respalden. Ponemos para qué boda es, que es cierto
                          y además es lo que ayuda a elegir. */}
                      <span className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
                        <span className="rounded-full bg-black/45 px-3 py-1 text-[0.64rem] uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                          {p.etiqueta}
                        </span>
                        {/* Todas llevan canción, y eso no lo tiene ninguna
                            otra plataforma en España: que se vea sin leer.

                            Aquí estuvo un momento el número de secciones.
                            Fuera: ocho de las doce dan doce, así que en la
                            ficha no distinguía nada —era ruido con pinta de
                            dato—. Dónde sí informa es en /plantillas, donde
                            se compara Tinta con seis contra Floración con
                            catorce, y ahí está contado. */}
                        <span
                          title="Con música"
                          className="grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                        >
                          <Icono id="nota" size={13} />
                          <span className="sr-only">Con música</span>
                        </span>
                      </span>

                      {/* Sin rótulo encima: la vista previa ES la portada
                          real de la invitación y ya trae los nombres, la
                          fecha y la guirnalda. Superponer otro los duplicaba. */}
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-1/3"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,.55), transparent)" }}
                      />

                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 pb-5">
                        {/* En táctil no hay «pasar el ratón», así que el
                            anticipo necesita su propio botón o no se ve
                            nunca. Va fuera del enlace para que no navegue. */}
                        {p.apertura && (
                          <button
                            type="button"
                            aria-label={`Ver la apertura de ${p.nombre}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              anticipo(p.id, !viva);
                            }}
                            className="grid h-11 w-11 place-items-center rounded-full border border-white/50 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/60 md:hidden"
                          >
                            <span
                              aria-hidden
                              style={{
                                width: 0, height: 0,
                                borderLeft: viva ? "none" : "8px solid currentColor",
                                borderTop: viva ? "none" : "5px solid transparent",
                                borderBottom: viva ? "none" : "5px solid transparent",
                                background: viva ? "currentColor" : undefined,
                                display: viva ? "block" : undefined,
                                ...(viva ? { width: 9, height: 10 } : {}),
                              }}
                            />
                          </button>
                        )}
                        <span className="chip-abrir pointer-events-none inline-flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-black/30 px-5 text-[0.78rem] uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                          Abrir invitación
                          <span aria-hidden className="flecha">→</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </Volumen>
              </div>

              <div className="mx-auto mt-7 max-w-[17rem]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="display text-[1.95rem]">{p.nombre}</h3>
                  {/* Los colores de la familia. Doce diseños en tres tonos
                      cada uno son treinta y seis opciones, y quien mira el
                      catálogo lo ve de un vistazo. */}
                  <span className="flex shrink-0 gap-1.5 pb-1" aria-hidden>
                    {p.variantes.map((v) => (
                      <span
                        key={v.id}
                        title={v.nombre}
                        className="block h-3 w-3 rounded-full ring-1 ring-[var(--tinta)]/15"
                        style={{ background: v.acento }}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-[0.95rem] leading-relaxed opacity-75">
                  {p.gesto}
                </p>
                <p className="mt-3 text-[0.82rem] leading-relaxed opacity-50">
                  {p.para}
                </p>
                <p className="mt-2.5 text-[0.78rem] opacity-40">
                  {p.variantes.map((v) => v.nombre).join(" · ")}
                </p>
              </div>
            </Link>

            <style>{`
              .chip-abrir { transition: background-color 320ms ease, border-color 320ms ease; }
              .chip-abrir .flecha { transition: transform 320ms cubic-bezier(.22,.7,.28,1); }
              .group:hover .chip-abrir { background: var(--acento); border-color: var(--acento); }
              .group:hover .chip-abrir .flecha { transform: translateX(4px); }
            `}</style>
          </Revelar>
        );
      })}
    </ul>
  );
}

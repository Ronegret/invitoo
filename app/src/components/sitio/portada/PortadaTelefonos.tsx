import Link from "next/link";
import EnlaceReserva from "@/components/sitio/EnlaceReserva";
import AbanicoTelefonos, { type TelefonoAbanico } from "@/components/sitio/telefono/AbanicoTelefonos";
import { PLANTILLAS } from "@/data/plantillas";
import { PLANES, enLetra } from "@/data/sitio";
import { enlaceReserva } from "@/lib/contacto";
import s from "./portadaTelefonos.module.css";

/**
 * La portada de invitoo.es, v3 (W2).
 *
 * En tres segundos tiene que quedar claro qué es, para quién, cuánto cuesta
 * y qué hacer: la frase, el precio y dos botones a la izquierda; y a la
 * derecha (debajo, en móvil) lo que se compra, enseñado y no contado: tres
 * invitaciones de verdad en tres teléfonos. La del centro se abre con su
 * vídeo y, al bajar por la web, los tres bajan por su invitación.
 *
 * Sustituye al sobre 3D (PortadaSobre + three.js): pesaba más de lo que
 * vendía, tardaba en enseñar el producto y en móvil empujaba la frase
 * debajo del pliegue. El sobre sigue en el código por si vuelve.
 *
 * Componente de servidor: frase, precio, botones y los tres pósteres salen
 * en el HTML. Solo el abanico (inclinación y vídeo) es cliente.
 */

const TITULAR = ["Vuestra", "boda", "empieza", "cuando", "abren", "la", "invitación."];

function telefono(id: string, pieza: Partial<TelefonoAbanico>): TelefonoAbanico {
  const p = PLANTILLAS.find((x) => (x.id as string) === id) ?? PLANTILLAS[0];
  return {
    slug: p.demo,
    nombre: p.nombre,
    poster: p.poster,
    fondo: p.tema.papel,
    hasta: "-38%",
    acabado: "oscuro",
    ...pieza,
  };
}

function Visto() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export default function PortadaTelefonos() {
  const desde = Math.min(...PLANES.map((p) => p.precio));
  const n = PLANTILLAS.length;

  return (
    <section className={s.portada} aria-labelledby="portada-titular">
      <div aria-hidden className={s.luz} />
      <div className={s.rejilla}>
        <div className={s.cabeza}>
          <p className={`${s.sobre} ${s.entra}`} style={{ "--d": "0ms" } as React.CSSProperties}>
            Invitaciones de boda digitales a medida
          </p>
          <h1 id="portada-titular" className={s.titular}>
            <span className="sr-only">{TITULAR.join(" ")}</span>
            <span aria-hidden>
              {TITULAR.map((p, i) => (
                <span key={i}>
                  <span className={s.mascara}>
                    <span className={s.palabra} style={{ "--i": i } as React.CSSProperties}>
                      {p === "invitación." ? <em>{p}</em> : p}
                    </span>
                  </span>{" "}
                </span>
              ))}
            </span>
          </h1>
        </div>

        <div className={s.cuerpo}>
          <p className={`${s.texto} ${s.entra}`} style={{ "--d": "520ms" } as React.CSSProperties}>
            La diseñamos para vosotros y la montamos entera. Se abre como una
            carta, suena vuestra canción y cada invitado confirma en un minuto,
            con su menú y sus alergias.
          </p>

          <p className={`${s.precio} ${s.entra}`} style={{ "--d": "640ms" } as React.CSSProperties}>
            <span className={s.cifra}>Desde {desde} €</span>
            <span className={s.precioBajo}>Pago único, IVA incluido</span>
          </p>

          <div className={`${s.ctas} ${s.entra}`} style={{ "--d": "760ms" } as React.CSSProperties}>
            <Link href="/plantillas" className={s.cta} data-cursor-petalos="">
              Elegid vuestra invitación
              <span className={s.circulo} aria-hidden>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
                </svg>
              </span>
            </Link>
            <EnlaceReserva href={enlaceReserva()} className={s.ctaSuave}>
              Hablemos por WhatsApp
              <span className="sr-only"> (abre WhatsApp en otra pestaña)</span>
            </EnlaceReserva>
          </div>

          <ul className={`${s.confianza} ${s.entra}`} style={{ "--d": "880ms" } as React.CSSProperties}>
            <li>
              <Visto />
              Diseño a medida: no es un editor
            </li>
            <li>
              <Visto />
              Lista en cinco días laborables
            </li>
            <li>
              <Visto />
              Cambios ilimitados hasta publicarla
            </li>
            <li>
              <Visto />
              {enLetra(n, true)} estilos, de la Regencia al reguetón
            </li>
          </ul>
        </div>

        <div className={s.escena}>
          <AbanicoTelefonos
            izq={telefono("carta", { acabado: "claro", hasta: "-30%" })}
            centro={telefono("regencia", {
              video: "/tematicas/regencia/hero-v.webm",
              hasta: "-40%",
            })}
            der={telefono("neon", { hasta: "-34%" })}
            aviso={{ quien: "Carmen", que: "Menú de pescado · sin lactosa" }}
          />
          <p className={s.entra} style={{ "--d": "1100ms", textAlign: "center", fontSize: "0.98rem", color: "color-mix(in srgb, var(--tinta) 70%, transparent)" } as React.CSSProperties}>
            Carta, Alta Sociedad y Neón de Medianoche: tres de las {n}.{" "}
            <Link href="/i/olivia-y-edmundo" className="underline decoration-[var(--tinta)]/30 underline-offset-4">
              Abrid una entera
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AperturaVideo from "./AperturaVideo";
import Puerta from "./Puerta";
import Sobre from "./Sobre";
import type { Invitacion } from "@/lib/tipos";

/**
 * Orquesta la entrada de una invitación, en dos actos y EN ESTE ORDEN:
 *
 *   1. **El vídeo.** Nueve segundos, mudo y en marcha desde el primer
 *      instante. Es el golpe, y tiene que ser lo primero que pase: nadie
 *      decide nada antes de haberse emocionado. Va mudo porque lo manda el
 *      navegador, no nosotros.
 *   2. **La puerta.** Con el último fotograma todavía detrás, se pregunta:
 *      ¿seguimos con su canción o sin ella? Ese toque es lo que autoriza al
 *      navegador a reproducir audio, así que el bloqueo de autoplay deja de
 *      ser un problema y pasa a ser parte del guion.
 *
 * Antes iba al revés —pregunta y luego vídeo— y era peor: se le pedía una
 * decisión a alguien que todavía no sabía qué estaba mirando.
 *
 * Reglas:
 *  · Todo esto se ve UNA vez. Quien vuelve a mirar la hora entra directo.
 *  · `prefers-reduced-motion` se salta el vídeo, pero NO la puerta: la
 *    puerta no es una animación, es una decisión sobre el sonido.
 *  · Si algo falla —el vídeo no carga, el audio se rechaza— la invitación
 *    se abre igual. Nada de esto puede impedir ver a qué hora es la misa.
 */
export default function Apertura({
  inv,
  saludo,
}: {
  inv: Invitacion;
  saludo?: { nombre: string; acompanantes: number } | null;
}) {
  const [acto, setActo] = useState<"esperando" | "video" | "puerta" | "fuera">(
    "esperando",
  );
  const [reducido, setReducido] = useState(false);
  const decidido = useRef(false);

  useEffect(() => {
    if (decidido.current) return;
    decidido.current = true;

    let visto = false;
    try {
      visto = sessionStorage.getItem(`invitoo:abierta:${inv.slug}`) === "1";
    } catch {
      /* modo privado: se ve, y no pasa nada */
    }
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducido(quieto);

    if (visto) setActo("fuera");
    else if (inv.apertura && !quieto) setActo("video");
    else setActo("puerta");
  }, [inv.slug, inv.apertura]);

  useEffect(() => {
    const dentro = acto === "video" || acto === "puerta";
    document.body.style.overflow = dentro ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [acto]);

  const terminar = useCallback(() => {
    try {
      sessionStorage.setItem(`invitoo:abierta:${inv.slug}`, "1");
    } catch {
      /* noop */
    }
    setActo("fuera");
  }, [inv.slug]);

  /** Al acabar el vídeo —o al saltarlo— toca preguntar por la música. */
  const trasVideo = useCallback(() => {
    if (inv.musica) setActo("puerta");
    else terminar();
  }, [inv.musica, terminar]);

  function entrar(conMusica: boolean) {
    if (conMusica && inv.musica) {
      // Este es el único instante en que el navegador deja arrancar audio:
      // dentro del gesto del invitado. Si se pierde, ya no vuelve.
      const a = new Audio(inv.musica.url);
      a.loop = true;
      a.volume = 0;
      void a.play().then(
        () => {
          // Entra subiendo, no de golpe: un corte de volumen asusta.
          const sube = window.setInterval(() => {
            if (a.volume >= 0.32) {
              a.volume = 0.32;
              window.clearInterval(sube);
            } else {
              a.volume = Math.min(0.32, a.volume + 0.02);
            }
          }, 90);
          window.dispatchEvent(
            new CustomEvent("invitoo:audio", { detail: { audio: a } }),
          );
        },
        () => {
          /* el navegador se ha negado igualmente: se sigue sin música */
        },
      );
    }
    terminar();
  }

  if (acto === "esperando" || acto === "fuera") return null;

  if (acto === "video") {
    if (inv.apertura) return <AperturaVideo inv={inv} onAbierta={trasVideo} />;
    // Sin máster rodado: la maqueta en CSS, que pesa 40 KB.
    const fecha = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(inv.pareja.fecha));
    return (
      <Sobre
        a={inv.pareja.a}
        b={inv.pareja.b}
        fecha={fecha}
        reducido={reducido}
        onAbierta={trasVideo}
      />
    );
  }

  return <Puerta inv={inv} onEntrar={entrar} saludo={saludo} />;
}

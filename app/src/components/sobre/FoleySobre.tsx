"use client";

import { useEffect } from "react";

/**
 * El sonido del sobre: el lacre que cruje y el papel que se desliza.
 *
 * Nada de archivos: ruido blanco filtrado con WebAudio, a −18 dB. Solo
 * suena después del gesto del invitado (el toque que abre el sobre) y solo
 * si la boda tiene música (quien ha elegido silencio, lo tiene) y no se pide
 * menos movimiento. El guion de la apertura avisa con
 * `invitoo:apertura` = "abriendo", dentro del mismo toque.
 */
const GANANCIA = Math.pow(10, -18 / 20); // −18 dB ≈ 0,126

export default function FoleySobre({ activo }: { activo: boolean }) {
  useEffect(() => {
    if (!activo) return;
    let quieto = false;
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    if (quieto) return;

    let ctx: AudioContext | null = null;
    const alAbrir = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== "abriendo") return;
      try {
        const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!C) return;
        ctx = new C();
        tocar(ctx);
      } catch {
        /* sin audio: se abre en silencio */
      }
    };
    window.addEventListener("invitoo:apertura", alAbrir);
    return () => {
      window.removeEventListener("invitoo:apertura", alAbrir);
      void ctx?.close().catch(() => undefined);
    };
  }, [activo]);
  return null;
}

function ruido(ctx: AudioContext, segundos: number) {
  const n = Math.ceil(ctx.sampleRate * segundos);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Un golpe de ruido filtrado: `t` inicio, `dur` caída, `f` frecuencia, `v` volumen relativo. */
function golpe(ctx: AudioContext, destino: AudioNode, t: number, dur: number, f: number, q: number, v: number, ataque = 0.002) {
  const src = ruido(ctx, dur + 0.05);
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = f;
  filtro.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filtro).connect(g).connect(destino);
  src.start(t);
  src.stop(t + dur + 0.05);
  return filtro;
}

function tocar(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = GANANCIA;
  master.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.01;

  // El lacre: un crujido seco y dos chasquidos menores.
  golpe(ctx, master, t0 + 0.12, 0.06, 2600, 1.1, 0.9);
  golpe(ctx, master, t0 + 0.16, 0.035, 3800, 2, 0.45);
  golpe(ctx, master, t0 + 0.21, 0.03, 3100, 2.4, 0.3);

  // La solapa: papel que roza, con un barrido de brillo.
  const roce = golpe(ctx, master, t0 + 0.48, 0.75, 900, 0.7, 0.32, 0.22);
  roce.frequency.setValueAtTime(900, t0 + 0.48);
  roce.frequency.exponentialRampToValueAtTime(2600, t0 + 1.2);

  // La cartulina que sale: más grave y más larga.
  const sale = golpe(ctx, master, t0 + 1.02, 0.85, 1400, 0.6, 0.22, 0.3);
  sale.frequency.setValueAtTime(1600, t0 + 1.02);
  sale.frequency.exponentialRampToValueAtTime(700, t0 + 1.85);
}

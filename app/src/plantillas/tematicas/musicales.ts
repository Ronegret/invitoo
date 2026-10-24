/**
 * K4 · lo común de las cinco temáticas de música (Pase VIP, Cara A, Neón,
 * Son de Fuego y Luna de Bachata). Solo se usa dentro de islas de cliente
 * y SIEMPRE tras un gesto del invitado (un toque, un «Sí, voy»).
 *
 * Sin archivos de audio: todo se sintetiza en el navegador (cero bytes de
 * descarga, sin música de terceros). Volumen ≤ 0,35 y ≤ 1 s, como pide
 * docs/16b §0.1. Si la página está en silencio (`data-silencio="1"` en
 * <html>, el botón de música), no suena nada.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (document.documentElement.dataset.silencio === "1") return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const menosMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Android vibra; iOS lo ignora. Nunca con «menos movimiento». */
export function vibrar(p: number | number[]) {
  if (menosMovimiento()) return;
  try {
    navigator.vibrate?.(p);
  } catch {
    /* sin permiso: nada */
  }
}

/** Una cuerda pulsada (Karplus-Strong), ≤ 1,2 s. */
export function pulsar(hz: number, vol = 0.28, cuando = 0) {
  const c = audio();
  if (!c) return;
  const n = Math.max(2, Math.round(c.sampleRate / hz));
  const largo = Math.round(c.sampleRate * 1.2);
  const buf = c.createBuffer(1, largo, c.sampleRate);
  const d = buf.getChannelData(0);
  const linea = new Float32Array(n);
  for (let i = 0; i < n; i++) linea[i] = Math.random() * 2 - 1;
  for (let i = 0; i < largo; i++) {
    const j = i % n;
    d[i] = linea[j];
    linea[j] = 0.996 * 0.5 * (linea[j] + linea[(j + 1) % n]);
  }
  const s = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = vol;
  s.buffer = buf;
  s.connect(g).connect(c.destination);
  s.start(c.currentTime + cuando);
}

/** Ruido filtrado: el papel que se rasga (paso alto) o el crepitar de la aguja. */
export function ruido(seg = 0.5, vol = 0.22, tipo: "papel" | "aguja" = "papel") {
  const c = audio();
  if (!c) return;
  const largo = Math.round(c.sampleRate * seg);
  const buf = c.createBuffer(1, largo, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < largo; i++) {
    const t = i / largo;
    if (tipo === "aguja") {
      // Chasquidos sueltos sobre un siseo muy bajo.
      d[i] = (Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.05) * (1 - t * 0.4);
    } else {
      // Fibras que ceden: ráfagas que se apagan.
      d[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(t * 60)) * (1 - t);
    }
  }
  const s = c.createBufferSource();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  f.type = tipo === "aguja" ? "bandpass" : "highpass";
  f.frequency.value = tipo === "aguja" ? 2400 : 1800;
  g.gain.value = vol;
  s.buffer = buf;
  s.connect(f).connect(g).connect(c.destination);
  s.start();
}

/** Un zumbido de tubo de neón (0,6 s, 100 Hz con su armónico). */
export function zumbido(vol = 0.08) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.value = 100;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 600;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.05);
  g.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
  o.connect(f).connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.62);
}

/** La-menor arpegiado: La2 Mi3 La3 Do4 (y Mi4 para la quinta cuerda). */
export const LA_MENOR = [110, 164.81, 220, 261.63, 329.63];

/**
 * Vigila el RSVP de siempre (sin tocarlo): cuando aparece su sello de «sí»
 * (`.rsvp-estampa` recién confirmado, `.rsvp-sello` si ya lo estaba), avisa
 * con el nombre del primer invitado apuntado. Devuelve la limpieza.
 */
export function observarConfirmacion(
  raiz: HTMLElement,
  slug: string,
  alConfirmar: (r: { recien: boolean; nombre: string }) => void,
  alNombre?: (nombre: string) => void,
) {
  const nombre = () => {
    try {
      const r = JSON.parse(window.localStorage.getItem(`invitoo:rsvp:${slug}`) ?? "null") as { personas?: { nombre?: string }[] } | null;
      return (r?.personas?.[0]?.nombre ?? "").trim().split(/\s+/)[0] ?? "";
    } catch {
      return "";
    }
  };
  let ultimo = "";
  const mira = () => {
    const recien = raiz.querySelector(".rsvp-estampa");
    const ya = raiz.querySelector(".rsvp-sello");
    const estado = recien ? "recien" : ya ? "ya" : "";
    if (estado === ultimo) return;
    ultimo = estado;
    if (!estado) return;
    alConfirmar({ recien: estado === "recien", nombre: nombre() });
    // El RSVP guarda la respuesta en este móvil un instante después de pintar
    // su sello: se vuelve a mirar el nombre para la frase.
    for (const ms of [250, 900]) relojes.push(window.setTimeout(() => alNombre?.(nombre()), ms));
  };
  const relojes: number[] = [];
  mira();
  const mo = new MutationObserver(mira);
  mo.observe(raiz, { childList: true, subtree: true });
  return () => {
    mo.disconnect();
    relojes.forEach((r) => window.clearTimeout(r));
  };
}

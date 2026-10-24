# Invitoo — Estilos temáticos II: música, baile, pasatiempos y estilo de vida

> Octubre de 2026. Encargo literal: `docs/16-encargo-estilos-tematicos.txt` (bloques «Música, baile y vida nocturna» y «Pasatiempos, deportes y estilo de vida»). Trabajo a tres voces: **UI/UX mobile-first**, **animación e interacción** y **estructura frontend**.
> Leído antes de escribir: `docs/11` (reglas innegociables), `docs/09` (dirección «Amor y elegancia»), `src/plantillas/{index.ts,tokens.ts,sobre.tsx,comun.tsx,Lienzo.tsx,vida.css,constelacion.tsx}`, `src/data/plantillas.ts`, `src/lib/movimiento.ts`, `src/components/flores/**`, `src/components/aperturas/**`, `src/components/bloques/CuentaAtras.tsx`, `src/lib/color/paletas.ts` y `src/plantillas/color.ts`.
> **Todas las ratios de contraste de este documento están calculadas** con `contraste()` y `acentoLegible()` de `src/plantillas/color.ts` (WCAG 2.x), no a ojo. El guion está en el anexo A.
> **Límite del método:** es diseño y arquitectura. No se ha escrito código en `app/` ni se han rodado ni generado vídeos. Las previsiones de demanda (§ final) son criterio de oficio, no datos de ventas.

## Índice
0. Fundamentos comunes a los nueve (léase primero)
1. Pase VIP · `festival` — Conciertos / Festival
2. Cara A · `vinilo` — Rock & Roll
3. Neón de Medianoche · `neon` — Reggaeton y fiesta
4. Son de Fuego · `fuego` — Salsa y fuego
5. Luna de Bachata · `bachata` — Bachata romántica
6. Reserva · `lupulo` — Cerveza / Artesanal
7. Noche de Estadio · `estadio` — Fútbol
8. Línea de Meta · `meta` — Runners y deporte
9. Riviera · `riviera` — Coches y compras de lujo
10. Tabla resumen y orden recomendado para España
Anexo A. Guion del cálculo AA · Anexo B. Lista de cambios por propietario

---

## 0. Fundamentos comunes

### 0.1 La regla del lujo: «de la pasión, el objeto noble»
Cada tema se traduce a **un objeto de colección**, nunca a su merchandising. Esa es la diferencia entre una invitación de Invitoo y un flyer:

| Tema | El flyer barato (no) | El objeto noble (sí) |
|---|---|---|
| Festival | flúor, confeti de clip-art, «¡¡FIESTA!!» | la acreditación laminada con foil holográfico y troquel |
| Rock | calaveras, llamas, fuente «grunge» | la funda de un LP de 180 g con estampación en seco |
| Reggaeton | flúor saturado, fuente graffiti | un rótulo de neón soplado a mano sobre cristal negro |
| Salsa | maracas, sombreros, rojo plano | el cartel de un club de 1957: terciopelo, latón y bombillas cálidas |
| Bachata | corazones, morado chillón | una guitarra de cedro a la luz de una vela |
| Cerveza | jarra de dibujos, espuma cómica | la etiqueta letterpress de una cerveza de abadía |
| Fútbol | escudo, balón de clip-art, verde césped plano | la entrada de abono grabada en relieve y el programa del partido de 1964 |
| Runners | gel, rayos, «¡¡A TOPE!!» | el dorsal de Tyvek, la medalla fundida y el cronómetro suizo |
| Coches y lujo | un deportivo reconocible, logos de moda | la guantera de piel cosida a mano y el cuadro de relojes cromado |

**Siete constantes que mantienen el ADN de Invitoo en los nueve:**
1. Los nombres son lo más grande de la portada y llevan la «y» como gesto tipográfico (`<Y />` de `comun.tsx`), en la fuente de acento.
2. Un solo acento por pantalla (≤ 5 % de la superficie, docs/09 §4). El neón, el foil y el metal son **brillos**, no fondos.
3. El cierre «Con cariño, A y B» manuscrito (`Despedida` → `FirmaManuscrita`), siempre.
4. El RSVP con recompensa (patrón 8 de docs/09): cada tema tiene su «sello».
5. Silencio por defecto. El sonido solo tras un gesto, ≤ 1 s, volumen 0,35 y con botón de silencio.
6. Cuerpo ≥ 17 px (aquí, 18 px), CTA de 56 px, áreas táctiles ≥ 48 px y todo legible sin JS.
7. Ni marcas ni nombres propios (§ 0.8).

### 0.2 Cómo encajan en la arquitectura (sin romper nada)
Cada estilo es **una plantilla más del catálogo**, con los mismos cinco rasgos distintivos de docs/06 §5: tipografía, fondo, portada, ornamento y apertura.

1. **Tipo** (`src/lib/tipos.ts`, F1): se añaden los nueve ids a `PlantillaId` y nueve ornamentos a `Ornamento`: `"perforado" | "surco" | "tubo" | "clave" | "cuerda" | "lupulo" | "cal" | "cuadros" | "pespunte"`.
2. **Catálogo** (`src/data/plantillas.ts`, F2): una entrada en `BASE` por estilo, con `variantes` (las tres de §7 de cada estilo), `orden`, `modo` y `apertura: video("<id>", rotuloEn)`. En `Plantilla.tipografia` se mantiene `{ display, texto }`; la tercera familia (acento) se carga en el `.tsx` y no entra en la comparación de `revisar.mjs`.
3. **Registro** (`src/plantillas/index.ts`): import, `PROPIAS` y `FUENTES`.
4. **Pilas genéricas** (`src/plantillas/tokens.ts` → `GENERICA`): una línea por familia nueva, para que el *fallback* no caiga en `serif`.
5. **Movimiento** (`src/lib/movimiento.ts` → `POR_PLANTILLA`): el carácter de cada uno, indicado en su §5.
6. **Paletas del probador** (`src/lib/color/paletas.ts`, G3): las tres variantes `original: true` y 4–5 curadas más.
7. **Tres archivos por estilo:** `src/plantillas/<id>.tsx` (portada, secciones y cierre), `src/plantillas/<id>.css` (lo propio, importado desde el `.tsx` como `carta.css`) y `src/plantillas/tematicas/<Tema>.tsx` con las islas de cliente (cuenta atrás y momento wow).

**Piezas compartidas nuevas**, en `src/plantillas/tematicas/` (F2), para no escribir nueve veces lo mismo:

| Pieza | Tipo | Qué hace |
|---|---|---|
| `HeroVideo.tsx` | servidor + isla `BotonPlay` | Vídeo 9:16 con póster SSR, velo, rótulo y «Play» |
| `useCuenta.ts` | hook de cliente | Días, horas, minutos y segundos; `null` en servidor (se pinta la fecha) |
| `FechaQuieta.tsx` | servidor | El *fallback* de toda cuenta atrás: la fecha larga, que siempre es verdad |
| `useTramo.ts` | hook de cliente | Progreso de scroll `--p` (0→1) donde no hay `animation-timeline` |
| `tramo.css` | CSS | `@property --p` + keyframes `tramo-p` ligados a `view()` |
| `gesto.ts` | utilidades | `vibrar()`, `sonar()` (Web Audio, tras gesto) y `menosMovimiento()` |

### 0.3 Color: tres en vivo, cinco en pantalla
El probador de G3 aplica en vivo **papel, tinta y acento** (y sus derivados: `--acento-texto`, `--sobre-acento`, `--velo`, `--hondo`…). Estos temas necesitan dos tonos más: **acento2** (segundo color del equipo, verde lúpulo…) y **brillo** (metálico o neón). Para que el probador siga funcionando sin tocarlo:

```css
/* src/plantillas/<id>.css — los dos tonos extra SE DERIVAN de los tres vivos */
.lienzo[data-plantilla="estadio"] {
  --acento2: var(--tema-acento2, color-mix(in oklch, var(--acento) 55%, var(--tinta)));
  --brillo: var(--tema-brillo, #b8954a);           /* oro trofeo: solo decorativo */
}
```

- `--tema-acento2` es **opcional**: un campo `acento2?: string` en `Tema` (F1), que `Lienzo` cuelga si existe. G3 añade un cuarto selector solo para las plantillas con `colores: 4` en el catálogo (Fútbol, Festival y Cerveza). Sin él, el tono se deriva y la pareja no nota nada.
- **acento2 y brillo nunca son texto ni la única frontera de un control.** En papel claro su ratio queda por debajo de 3:1 a propósito (foil, franjas, filetes); cada tabla lo marca como «decorativo». Si un brillo tiene que ser legible (neón sobre negro), se calcula y se indica.
- El resplandor del neón (`text-shadow`, `drop-shadow`) **no cuenta** para el contraste: la ratio se mide con el color del trazo pelado.

### 0.4 `HeroVideo`: el contrato común
**El vídeo de la apertura y el del hero son el mismo archivo.** La apertura (sistema actual de `components/aperturas/Apertura.tsx`: póster SSR, «Saltar», `localStorage` y View Transition) reproduce el máster temático, y al salir el hero de la portada **sigue con ese mismo mp4, ya en caché, en bucle y mudo** detrás de los nombres. Cero bytes extra. Si la pareja sube su propio clip, este sustituye al bucle del hero y la apertura conserva el máster.

| Parámetro | Valor común |
|---|---|
| Encuadre | 9:16, máster 1080×1920; se sirve en 720×1280 (`vertical.mp4`) y 1280×720 (`horizontal.mp4`) desde tablet |
| Duración | 6–8 s, en bucle sin costura (el último fotograma funde con el primero) |
| Peso | **≤ 1,2 MB** el vertical (H.264 High, CRF 28, 24 fps, sin pista de audio); el actual de Mar pesa 1,03 MB |
| Póster | AVIF ≤ 40 KB (el de Mar pesa 27 KB): es el LCP y va en el HTML del servidor |
| Zona segura | Caras y acción en el tercio central; el 22 % inferior es para el rótulo y el 12 % superior para el notch |
| Velo | `linear-gradient(to top, rgb(10 8 12 / .62) 0 34%, transparent 70%)`: **blanco sobre el peor fotograma (blanco puro) da 5,66:1** |
| Carga | `preload="none"`; arranca al salir la apertura; con `Save-Data`, red 2G o reduced-motion se queda el póster |
| Play | 56 px, `aria-label="Ver el vídeo con sonido"` y `aria-pressed`; pausa con un segundo toque (WCAG 2.2.2) |

```tsx
// src/plantillas/tematicas/HeroVideo.tsx (servidor)
export function HeroVideo({ src, poster, alt, children, play }: {
  src: string; poster: string; alt: string; children: React.ReactNode; play?: React.ReactNode;
}) {
  return (
    <header className="hero-video relative grid min-h-[100svh] place-items-end overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- póster AVIF = LCP */}
      <img src={poster} alt={alt} width={720} height={1280} fetchPriority="high"
           className="absolute inset-0 h-full w-full object-cover" />
      <video data-hero-video muted loop playsInline preload="none" poster={poster} aria-hidden
             className="absolute inset-0 h-full w-full object-cover">
        <source src={src} type="video/mp4" />
      </video>
      <span aria-hidden className="hero-velo absolute inset-0" />
      <div className="relative w-full px-5 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-white">
        {children}
      </div>
      {play /* <BotonPlay forma="vinilo" /> — isla de cliente, arriba a la derecha bajo el notch */}
    </header>
  );
}
```

```tsx
// src/plantillas/tematicas/BotonPlay.tsx
"use client";
export function BotonPlay({ forma, className }: { forma: string; className?: string }) {
  const [sonando, setSonando] = useState(false);
  return (
    <button type="button" aria-pressed={sonando} aria-label="Ver el vídeo con sonido"
      data-forma={forma}
      className={`boton-play absolute right-4 top-[max(1rem,env(safe-area-inset-top))] size-14 ${className ?? ""}`}
      onClick={(e) => {
        const v = e.currentTarget.closest("header")?.querySelector<HTMLVideoElement>("[data-hero-video]");
        if (!v) return;
        v.muted = sonando; if (!sonando) { v.currentTime = 0; void v.play(); }
        setSonando(!sonando);
      }} />
  );
}
```
El botón no tapa los nombres (arriba a la derecha y con margen para el notch), y `solapes.mjs` (docs/11 §2) lo comprueba en 360, 390 y 430 px. Si el vídeo no tiene audio propio, el «Play» enciende **la canción de la boda** (`inv.musica`) con el `BotonSonido` actual, con fundido de 1,2 s.

### 0.5 La cuenta atrás: un hook y nueve caras
Se extrae la lógica de `components/bloques/CuentaAtras.tsx` (F1) a un hook, sin cambiar su comportamiento: en servidor y sin JS se ve **la fecha**; nunca sale «0 días 0 horas»; tras la boda dice «Ya nos casamos»; el lector de pantalla oye una frase y no cuatro números cambiando.

```ts
// src/plantillas/tematicas/useCuenta.ts
"use client";
import { useSyncExternalStore } from "react";
const suscribir = (f: () => void) => { const id = setInterval(f, 1000); return () => clearInterval(id); };
const ahora = () => Math.floor(Date.now() / 1000);

export type Cuenta = { d: number; h: number; m: number; s: number; acabada: boolean };
export function useCuenta(hasta: string): Cuenta | null {
  const seg = useSyncExternalStore(suscribir, ahora, () => null);
  const fin = new Date(hasta).getTime();
  if (seg === null || !Number.isFinite(fin)) return null;   // → <FechaQuieta />
  const ms = Math.max(0, fin - seg * 1000);
  return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24,
           m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60, acabada: ms === 0 };
}
```

**Reglas de las nueve caras:** cifras tabulares (`tabular-nums`) y de ≥ 2,4 rem en móvil; etiquetas «días · horas · min · seg» escritas, no solo iconos; `aria-hidden` en el reloj y `sr-only` con «Faltan 128 días para el sábado 12 de junio de 2027»; solo `transform` y `opacity`; con reduced-motion, los números cambian sin animar. **Ningún destello por encima de 3 Hz** (WCAG 2.3.1): nada parpadea al compás de los segundos, como mucho se mueve.

### 0.6 El scroll: CSS primero, un hook de reserva
La técnica por defecto es la de `vida.css`: `animation-timeline: view()` dentro de `@supports` y `prefers-reduced-motion: no-preference`. Para que **una sola variable** sirva a la vez al CSS moderno y al *fallback*, se registra `--p`:

```css
/* src/plantillas/tematicas/tramo.css */
@property --p { syntax: "<number>"; inherits: true; initial-value: 1; }   /* 1 = estado final */
@keyframes tramo-p { from { --p: 0; } to { --p: 1; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .tramo { animation: tramo-p linear both; animation-timeline: view();
             animation-range: var(--rango, entry 0% cover 50%); }
  }
}
/* Las piezas leen --p y nada más: */
.tramo .sube { opacity: calc(.2 + .8 * var(--p)); transform: translateY(calc((1 - var(--p)) * 28px)); }
```

```ts
// src/plantillas/tematicas/useTramo.ts — SOLO donde no hay animation-timeline (Safari < 26, Firefox sin flag)
"use client";
export function useTramo(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || CSS.supports("animation-timeline: view()") ||
        matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // --p se queda en 1
    let raf = 0;
    const pinta = () => { raf = 0; const r = el.getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height) * 2;    // ≈ entry 0% → cover 50%
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(3)); };
    const alMover = () => { raf ||= requestAnimationFrame(pinta); };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { addEventListener("scroll", alMover, { passive: true }); pinta(); }
      else removeEventListener("scroll", alMover);
    });
    io.observe(el);
    return () => { io.disconnect(); removeEventListener("scroll", alMover); cancelAnimationFrame(raf); };
  }, [ref]);
}
```

- **El valor inicial de `--p` es 1:** sin JS, sin soporte o con reduced-motion todo está en su estado final y visible (la regla de oro de `Revelar.tsx`).
- **Sin scroll-jacking.** Las «escenas fijadas» son `position: sticky` dentro de una sección de **≤ 160 svh**: el dedo manda, la velocidad es nativa y nunca se intercepta `wheel` ni `touchmove`.
- **GSAP no hace falta en ninguno de los nueve.** Todo es CSS ligado al scroll, `@keyframes` cortos, SVG y Web Audio. Solo se justificaría para una línea de tiempo de más de seis pistas sincronizadas con audio, y ninguna de estas la tiene. Se ahorran ~25 KB gzip por invitación.

**Legibilidad para una persona de 70 años, en todos los tramos:** el texto aparece en ≤ 600 ms de recorrido y nunca depende de la animación para leerse; nada de texto sobre vídeo sin velo; no se oculta información detrás de un gesto (cada wow tiene su botón y su versión quieta); fechas y horas en cifras grandes; botones con texto, no solo icono.

### 0.7 Gestos, sonido y vibración (`gesto.ts`)
```ts
export const menosMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const vibrar = (p: number | number[]) => { if ("vibrate" in navigator) navigator.vibrate(p); }; // Android; iOS lo ignora
let ctx: AudioContext | null = null;
/** Solo dentro de un manejador de gesto. ≤ 1 s y volumen 0,35. */
export async function sonar(url: string, vol = 0.35) {
  if (document.documentElement.dataset.silencio === "1") return;
  ctx ??= new AudioContext();
  const buf = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const src = ctx.createBufferSource(), g = ctx.createGain();
  g.gain.value = vol; src.buffer = buf; src.connect(g).connect(ctx.destination); src.start();
}
```
Los sonidos son **foley propio** (grabado o sintetizado por Invitoo), OGG/MP3 de ≤ 25 KB y que se descargan en el primer toque, no al cargar la página. Ninguno contiene música de terceros.

### 0.8 Marcas, derechos y buen gusto (para los nueve)
- **Nunca:** escudos, logos, nombres de clubes, estadios, ligas, festivales, bandas, discográficas, cerveceras, marcas de coche o de moda; siluetas reconocibles (rejillas de radiador, perfiles icónicos de un modelo); monogramas que imiten a una casa de moda; colores registrados como marca en combinación con su forma (p. ej. una caja de un azul turquesa concreto con lazo blanco, o una caja naranja con cinta marrón); tipografías corporativas de ligas o equipos; letras de canciones o fragmentos de música ajena.
- **Sí:** objetos genéricos (balón, red, entrada, vinilo, guitarra, jarra, dorsal, cuadro de relojes), **los colores del equipo de la pareja elegidos con el probador** (un color no es un escudo), las iniciales de la pareja como «escudo propio» y textos propios de Invitoo.
- **Prompts de vídeo con IA:** todos terminan con «no logos, no text, no brand markings, no recognizable vehicles or venues». Hay que revisar el resultado fotograma a fotograma antes de publicarlo.
- Se valida en `herramientas/revisar.mjs` con una lista negra de términos para los textos de demo.

---

# MÚSICA, BAILE Y VIDA NOCTURNA

---

## 1. Pase VIP · `festival` — Conciertos / Festival

### 1.1 Concepto y dirección de arte
- **Nombre comercial:** **Pase VIP**.
- **Gesto (ficha):** «Una acreditación holográfica cuelga de su cordón. Para confirmar, se arranca el talón.»
- **Para:** parejas que se conocieron en un festival, o una boda de verano al aire libre con DJ.
- **Modo:** claro. **Radio:** 14px. **Grano:** 0,04. **Ornamento:** `perforado` (la línea de troquel de una entrada).

**Paleta «Atardecer» (variante de catálogo)**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f4efe4` | cartulina de entrada, marfil | — |
| Tinta | `#1c1a2b` | todo el texto | **14,86:1** sobre papel |
| Acento | `#c8324f` | coral magenta: botón, cabeza de cartel | **4,55:1** como texto (pasa sin corregir) · blanco encima **5,22:1** |
| Acento2 | `#e9a23b` | sol de tarde, degradado del troquel | 1,89:1 → **decorativo** |
| Brillo (holográfico) | `#b9a6ff → #8fe3d6 → #ffc9a3` | foil iridiscente (`conic-gradient`) | 1,84:1 → **decorativo**; nunca lleva texto encima sin chapa de tinta |
| Hondo (derivado) | `#8c2a42` | banda del line-up en negativo | papel encima **7,25:1** |

**Tipografía (Google Fonts)**
- **Display:** Big Shoulders Display, en 800 y 900. Condensada, de cartel de line-up, y se lee en grande.
- **Texto:** Space Grotesk, en 400 y 500, a 18 px.
- **Acento:** Instrument Serif 400 *italic*, para la «y», los nombres del talón y las dedicatorias.

**Mood**
> La hora dorada del último día de festival, cuando suena *vuestra* canción.
> Cartulina de entrada, foil que cambia de color al moverla y letra de cartel.
> Euforia contenida: el lujo de la zona backstage, no la cola de la barra.

**Texturas y materiales**
- Cartulina de 600 g con grano.
- Foil holográfico: un `conic-gradient` con `mix-blend-mode: color-dodge` que se mueve con `--p` y con el dedo.
- Troquel y perforación: una máscara con `radial-gradient` repetido.
- Cordón de tela tejida: un patrón SVG de 1 KB.
- **Código de barras generado con la fecha de la boda:** cada dígito da el ancho de una barra. Es `aria-hidden` y debajo lleva «12·06·2027» en claro.

**Qué pedir a la pareja**
- Un clip vertical de 6–8 s en un festival (de espaldas al escenario, manos arriba, a contraluz) o en el campo al atardecer.
- Tres fotos de festivales que hayan vivido juntos.
- **«El line-up de vuestra historia»:** de 5 a 8 momentos con título propio («El primer beso», «La mudanza a Lavapiés»). Hitos, nunca nombres de artistas.

### 1.2 Hero con vídeo
- **Encuadre:** 9:16, con la pareja abrazada en el tercio central y el público desenfocado delante. El cielo naranja queda arriba para el notch.
- **Velo:** el común (§0.4), más un tinte `color-mix(in oklch, var(--acento) 18%, transparent)` en el tercio superior, que da el atardecer de marca.
- **Rótulo:** «LINE-UP DE UNA VIDA», en Space Grotesk 500 a 1,0625 rem con 0,24 em de tracking. Debajo, los nombres en Big Shoulders 900, en mayúsculas, a `clamp(3.6rem, 17vw, 6rem)`, con la «y» en Instrument Serif italic. Cierra «Sábado 12 · junio · 2027 — Finca El Olivar».
- **Play:** una pulsera de tela vista de frente: un aro de 56 px con trama y el triángulo ▶ dentro. El aro de foil gira despacio (8 s por vuelta), y con reduced-motion se queda quieto.
- **Póster:** AVIF de 720×1280 y ≤ 40 KB. **Peso del vídeo:** ≤ 1,2 MB.
- **Prompt IA (2 líneas):**
  > Vertical 9:16, golden-hour open-air festival seen from inside the crowd, raised hands in silhouette, warm haze and slow drifting paper confetti, a couple embracing in soft focus at centre frame, 35 mm grain, slow dolly-in, seamless 7 s loop.
  > Warm magenta and amber palette, no stage branding, no logos, no text, no recognizable artists or venues.

### 1.3 Cuenta atrás: «Cabeza de cartel»
**La cuenta atrás es un cartel de festival:** la jerarquía tipográfica del line-up ordena las unidades.
- **DÍAS** es el cabeza de cartel, en 900 a `clamp(4.5rem, 24vw, 8rem)`.
- **HORAS** va en la segunda línea, **MINUTOS** en la tercera y **SEGUNDOS** en la letra pequeña.
- Debajo: «Escenario principal · 12.06.27 · Puertas 18:00».
- Va en una sección `hondo`. Solo se mueve la cifra que cambia: sube 0,3 em en 240 ms y no parpadea.

```tsx
// src/plantillas/tematicas/Festival.tsx
"use client";
export function CuentaAtrasCartel({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const filas = [[c.d, "días"], [c.h, "horas"], [c.m, "minutos"], [c.s, "segundos"]] as const;
  return (
    <section className="cartel px-5 py-24 text-center">
      <p className="sr-only">Faltan {c.d} días para la boda.</p>
      <ol aria-hidden className="display uppercase tabular-nums">
        {filas.map(([n, et], i) => (
          <li key={et} data-fila={i}>
            {/* key={n}: solo se vuelve a montar —y a animar— la cifra que cambia */}
            <span key={n} className="cartel-n">{String(n).padStart(i ? 2 : 1, "0")}</span> {et}
          </li>
        ))}
      </ol>
    </section>
  );
}
```
```css
.cartel li[data-fila="0"] { font: 900 clamp(4.5rem, 24vw, 8rem)/.9 var(--display); }
.cartel li[data-fila="1"] { font: 800 clamp(2.6rem, 13vw, 4.4rem)/1 var(--display); }
.cartel li[data-fila="2"] { font: 800 clamp(2rem, 10vw, 3.2rem)/1.05 var(--display); }
.cartel li[data-fila="3"] { font: 800 clamp(1.6rem, 8vw, 2.4rem)/1.1 var(--display); color: var(--acento-texto); }
@media (prefers-reduced-motion: no-preference) {
  .cartel-n { display: inline-block; animation: cifra-sube 240ms var(--ease-carta) both; }
}
@keyframes cifra-sube { from { opacity: 0; transform: translateY(.3em); } }
```

### 1.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | El vídeo se queda; los nombres se fijan y **la acreditación baja colgada de su cordón** sobre el vídeo, con la fecha y el código de barras | `position: sticky` en una sección de 140 svh; `translateY` y `rotate(±2°)` ligados a `--p` | 0 → 120 svh | La acreditación ya está colgada bajo los nombres |
| Historia | «El line-up de nuestra historia»: cada momento es una línea del cartel y se estira al entrar (`scaleX .9→1`). La pedida es el cabeza de cartel | `view()` por línea | entry 0 % → cover 30 % | Cartel quieto y completo |
| Cuándo y dónde | Una entrada con troquel (fecha, puertas, recinto). **El foil barre la entrada** mientras se desplaza | `background-position` del foil ligado a `--p` | entry 0 % → exit 0 % | Foil quieto a media luz |
| Programa | «Horarios por escenario», en lista vertical con horas grandes. Un punto «ahora suena» recorre la línea | `view-timeline` de la lista; el punto con `translateY` | cover 10 % → cover 90 % | Sin punto; lista quieta |
| Dress code | «Código de pulsera»: tres muestras como pulseras de tela que se cierran al entrar | `scaleX(0→1)` desde la izquierda | cover 10 % → cover 40 % | Pulseras cerradas |
| Alojamiento | Fichas de hotel como pases de zona («Zona descanso»). Hasta 3 en vertical; desde 4, carril con *scroll-snap* | `vida-carril` (ya existe) | entry → cover 40 % | Lista vertical |
| Regalos | «Ver datos» da la vuelta a la acreditación (el reverso del pase), con Copiar y Bizum | `rotateY(180°)` al **tocar**, 600 ms | — | Fundido cruzado |
| RSVP | **Momento wow:** el talón se arranca (§1.6) | — | — | El talón aparece ya separado y con el sello «Acceso confirmado» |
| Cierre | «Bis»: el cielo pasa del atardecer a la noche y **aparecen luces de móvil** una a una, que se mecen; después la firma | degradado de fondo ligado a `--p`; 24 puntos con `opacity` escalonada | cover 0 % → cover 70 % | Noche y luces quietas |

### 1.5 Estructura de código
**Archivos:**
- `src/plantillas/festival.tsx`
- `src/plantillas/festival.css`
- `src/plantillas/tematicas/Festival.tsx` (con `CuentaAtrasCartel`, `Talon` y `FoilDedo`)
- `public/aperturas/festival/{vertical,horizontal}.mp4` y `poster.avif`
- `public/sonidos/festival-talon.ogg` (≤ 20 KB)

**Orden** (`data/plantillas.ts`): `["capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento", "regalos", "rsvp", "playlist", "galeria", "album", "hashtag", "notas", "muro"]`.

**Movimiento** (`POR_PLANTILLA`): `festival: { estilo: "sereno", velocidad: 1.1, intensidad: 0.6, entrada: "ascenso", particulas: "destellos", flores: "ninguna", colorVivo: true }`.

```tsx
// src/plantillas/festival.tsx
import { Big_Shoulders_Display, Instrument_Serif, Space_Grotesk } from "next/font/google";
import { HeroVideo } from "./tematicas/HeroVideo";
import { BotonPlay } from "./tematicas/BotonPlay";
import { CuentaAtrasCartel, FoilDedo, Talon } from "./tematicas/Festival";
import "./tematicas/tramo.css";
import "./festival.css";

const display = Big_Shoulders_Display({ subsets: ["latin"], weight: ["800", "900"], variable: "--p-display", display: "swap", preload: false });
const texto = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500"], variable: "--p-texto", display: "swap", preload: false });
const acento = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--p-acento", display: "swap", preload: false });
export const fuentes = `${display.variable} ${texto.variable} ${acento.variable}`;

export default function Festival(props: Props) {
  const d = datosPortada(props);
  const ap = obtenerPlantilla("festival").apertura!;
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <div className="tramo festival-portada" style={{ "--rango": "contain 0% contain 100%" } as React.CSSProperties}>
        <HeroVideo src={ap.vertical} poster={ap.poster} alt={`${d.a} y ${d.b}`} play={<BotonPlay forma="pulsera" />}>
          <p className="rotulo-pequeno">Line-up de una vida</p>
          <h1 className="display vt-nombres uppercase">{d.a} <Y /> {d.b}</h1>
          <p className="mt-4 text-[1.125rem]">{d.fechaLarga} — {d.lugar}</p>
        </HeroVideo>
        <FoilDedo><Acreditacion d={d} /></FoilDedo>   {/* baja colgada con --p */}
      </div>
      <Secciones {...props} opciones={{
        tonos: { cuentaAtras: "hondo", dressCode: "velo" },
        piezas: {
          cuentaAtras: props.b("cuentaAtras") && <CuentaAtrasCartel hasta={props.inv.pareja.fecha} />,
          rsvp: props.b("rsvp") && <Talon><Rsvp slug={props.inv.slug} {...props.b("rsvp")!} /></Talon>,
        },
      }} />
      <Despedida inv={props.inv} ornamento="perforado" />
    </Lienzo>
  );
}
```
`Talon` envuelve al `Rsvp` de siempre (F1) sin tocarlo: escucha el evento `invitoo:rsvp` que ya emite al confirmar (si no existe, F1 lo añade: `window.dispatchEvent(new CustomEvent("invitoo:rsvp", { detail: { asiste, nombre } }))`).

### 1.6 Momento wow e interacción táctil
- **Wow: «Arrancar el talón».** Al confirmar el «Sí», el talón se arranca por la perforación:
  - se inclina 8°, cae 40 px y se desvanece en 700 ms con la curva `--ease-velo`;
  - queda el pase con un sello en foil, «Acceso confirmado · Carmen»;
  - suena el papel rasgándose (0,6 s) y vibra `[12, 40, 12]`.
  - El pase se puede **arrastrar hacia abajo por la perforación**; pasado el 60 % se arranca solo. Para quien no arrastre, el botón «Sí, voy» hace lo mismo.
- **Interacción táctil propia: «Inclinar el pase».** En la portada, al pasar el dedo por la acreditación, el foil cambia de color siguiendo el dedo (`pointermove` → `--fx` y `--fy`). No usa sensores ni pide permisos de orientación. Sin puntero ni dedo, el foil sigue al scroll.

```tsx
export function FoilDedo({ children }: { children: React.ReactNode }) {
  return (
    <div className="foil" onPointerMove={(e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--fx", `${((e.clientX - r.left) / r.width) * 100}%`);
      e.currentTarget.style.setProperty("--fy", `${((e.clientY - r.top) / r.height) * 100}%`);
    }}>{children}</div>
  );
}
```

### 1.7 Variantes de color (compatibles con el probador)
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento texto/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `atardecer` | Atardecer | `#f4efe4` | `#1c1a2b` | `#c8324f` | 14,86 | 4,55 | blanco 5,22 |
| `brisa` | Brisa de costa | `#f2efe8` | `#16202b` | `#1f6f8b` | 14,34 | 4,94 | blanco 5,67 |
| `buganvilla` | Buganvilla | `#f6ede4` | `#2a1820` | `#9e3d8f` | 14,52 | 5,16 | blanco 5,97 |

El acento2 de «Brisa» es `#f08a4b` y el de «Buganvilla», `#f2b33d`. Los dos son decorativos y se derivan si la pareja no los toca.

---

## 2. Cara A · `vinilo` — Rock & Roll

### 2.1 Concepto y dirección de arte
- **Nombre comercial:** **Cara A**.
- **Gesto:** «Un LP sale de su funda y gira bajo vuestros nombres. Tocadlo y suena.»
- **Para:** parejas rockeras, o una boda en sala o masía con banda en directo.
- **Modo:** oscuro. **Radio:** 0px. **Grano:** 0,06. **Ornamento:** `surco` (tres arcos concéntricos de vinilo).

**Paleta «Rojo directo»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#111011` | negro vinilo | — |
| Tinta | `#eee8df` | marfil de funda | **15,59:1** |
| Acento | `#c42f27` | rojo de luz de escenario: la galleta del disco y los botones | como superficie, blanco encima **5,55:1** |
| Acento texto (calculado) | `#ce5b53` | el rojo aclarado para leerse sobre negro | **4,74:1** (el puro daría 3,42: por eso se corrige) |
| Acento2 | `#8c7b6b` | cuero tabaco envejecido | **4,67:1**: vale para texto secundario |
| Brillo | `#c7cbd1` | cromo de micro antiguo: filetes y cifras | **11,66:1** |
| Hondo (derivado) | `#381716` | la contraportada | tinta encima **13,24:1** |

**Tipografía**
- **Display:** DM Serif Display 400, normal e *italic*. Alto contraste, de portada de disco de los 70.
- **Texto:** Karla, en 400 y 600.
- **Acento:** UnifrakturCook 700, **solo** para el monograma de iniciales en la galleta del disco y una capitular. Nunca para frases, porque una persona mayor no lee gótica.

**Mood**
> Una sala que huele a madera y a amplis de válvulas, el segundo de silencio antes del primer acorde.
> Cuero negro, rojo de luz de escenario y cromo de micro antiguo.
> Actitud, pero con traje.

**Texturas y materiales**
- Cuero granulado (`feTurbulence`, ≤ 2 KB, a 0,06 de opacidad).
- Surcos de vinilo (`repeating-radial-gradient`).
- **Estampación en seco** en los titulares: `text-shadow: 0 1px 0 rgb(255 255 255 / .06), 0 -1px 0 rgb(0 0 0 / .6)`.
- El cerco de desgaste de una funda de cartón (*ring wear*: un anillo al 5 %).
- Una púa de celuloide como viñeta.

**Qué pedir a la pareja**
- Un clip en blanco y negro o a contraluz roja: chupa de cuero, en una sala o un local de ensayo.
- Fotos de conciertos que hayan vivido juntos.
- **El tracklist de su historia**, con 6–8 títulos propios.
- La canción de la entrada, si tienen derechos sobre ella. Si no, la canción original de Invitoo.

### 2.2 Hero con vídeo
- **Encuadre:** 9:16; la pareja bailando en un escenario vacío, cortada a la altura de la cadera, con la luz roja detrás.
- **Velo:** el común, más un viñeteado `radial-gradient(transparent 55%, rgb(0 0 0 / .5))`.
- **Rótulo:** «CARA A», en Karla 600 con 0,3 em de tracking. Los nombres en DM Serif *italic* a `clamp(3.4rem, 15vw, 5.6rem)`. Debajo, «En directo · sábado 12 de junio de 2027 · Sala La Nave».
- **Play:** una galleta de vinilo roja de 56 px con el agujero central. Mientras suena gira a 33⅓ rpm (1,8 s por vuelta); en pausa se para. Con reduced-motion no gira y cambia de ▶ a ❚❚.
- **Póster** ≤ 40 KB, en blanco y negro con el rojo conservado (AVIF). **Vídeo** ≤ 1,2 MB (el blanco y negro comprime mejor: ≈ 0,8 MB).
- **Prompt IA:**
  > Vertical 9:16, black-and-white 35 mm footage of a couple in leather jackets slow-dancing on an empty stage, a single red backlight cutting through haze, a vinyl record spinning in macro, out of focus in the foreground, seamless 7 s loop.
  > High contrast, deep blacks, film grain, no instrument or amplifier brand logos, no text, no recognizable musicians or venues.

### 2.3 Cuenta atrás: «La contraportada»
La cuenta atrás es **el tracklist de la cara B**, con puntos guía y cifras tabulares:

```
01  Días ............................ 128
02  Horas ............................ 14
03  Minutos .......................... 07
04  Segundos ......................... 33
```
Al lado, un brazo de tocadiscos en SVG cuya aguja avanza por el disco con los segundos (`rotate`, 1 vuelta por minuto). Es movimiento continuo, no un destello.

```tsx
export function CuentaAtrasVinilo({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const pistas = [["Días", c.d], ["Horas", c.h], ["Minutos", c.m], ["Segundos", c.s]] as const;
  return (
    <section className="contraportada mx-auto max-w-[34rem] px-6 py-24">
      <p className="sr-only">Faltan {c.d} días.</p>
      <ol aria-hidden className="tabular-nums">
        {pistas.map(([t, n], i) => (
          <li key={t} className="pista">
            <span className="opacity-70">0{i + 1}</span><span className="guia">{t}</span>
            <span className="display text-[2.4rem]">{String(n).padStart(2, "0")}</span>
          </li>
        ))}
      </ol>
      <Disco giro={c.s * 6} />   {/* style={{ rotate: `${giro}deg` }}, transition 1s linear */}
    </section>
  );
}
```

### 2.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | Tras el vídeo, **el LP sale de su funda** hacia la derecha y la galleta muestra las iniciales en gótica | sticky (140 svh); `translateX(calc((1 - var(--p)) * -60%))` en el disco | 0 → 120 svh | Disco medio fuera, quieto |
| Historia | «Tracklist de nuestra historia»: la pista que está en el centro muestra un ecualizador de 3 barras; el resto baja al 70 % (nunca menos, para que se lea) | `view()` por pista, con barras `scaleY` a 1,2 Hz | cover 30 % → cover 70 % | Sin barras; todo al 100 % |
| Cuándo y dónde | Una entrada de concierto de los 70 y **un matasellos rojo que se estampa** (`scale 1.15→1`) | `view()` | entry 20 % → cover 45 % | Sello ya estampado |
| Programa | «Setlist»: una tira de papel con cinta americana en las esquinas; cada hora se subraya a mano | `stroke-dashoffset` con `--p` | cover 10 % → cover 60 % | Subrayados hechos |
| Dress code | «Rock elegante»: tres púas (negro, cuero y rojo) que giran de 25° a 0° | `view()` | entry → cover 35 % | Púas quietas |
| Alojamiento | «Después del bolo»: fichas como pases de backstage, en vertical | `Entra` (ya existe) | — | Igual, sin movimiento |
| Regalos | «Ver datos» da la vuelta al disco: la cara B lleva el IBAN | `rotateY` al tocar | — | Fundido |
| RSVP | Wow (§2.6). Al confirmar, se estampa en rojo «Lleno absoluto: te esperamos, Carmen» | `--ease-sello` | — | Sello quieto |
| Cierre | Se apagan las luces: la página baja a negro con **un solo foco** sobre la firma, y el foco acompaña al scroll | `radial-gradient` con su centro ligado a `--p` | cover 0 % → 60 % | Foco fijo |

### 2.5 Estructura de código
**Archivos:**
- `src/plantillas/vinilo.tsx` y `vinilo.css`
- `src/plantillas/tematicas/Vinilo.tsx` (con `CuentaAtrasVinilo`, `Disco` y `DiscoTocable`)
- `public/sonidos/vinilo-acorde.ogg` (1 s: el crepitar de la aguja y un acorde propio, ≤ 25 KB)

**Orden:** `["capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento", "regalos", "rsvp", "playlist", "galeria", "album", "hashtag", "notas", "muro"]`. En esta plantilla la playlist pesa: se puede subir detrás de la historia.

**Movimiento:** `vinilo: { estilo: "cinematografico", velocidad: 1, intensidad: 0.55, entrada: "fundido-desenfoque", particulas: "ninguna", flores: "ninguna", colorVivo: false }`.

```tsx
export default function Vinilo(props: Props) {
  const d = datosPortada(props);
  const ap = obtenerPlantilla("vinilo").apertura!;
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <div className="tramo vinilo-portada">
        <HeroVideo src={ap.vertical} poster={ap.poster} alt={`${d.a} y ${d.b}`} play={<BotonPlay forma="galleta" />}>
          <p className="rotulo-pequeno">Cara A</p>
          <h1 className="display vt-nombres italic">{d.a} <Y /> {d.b}</h1>
        </HeroVideo>
        <DiscoTocable iniciales={d.iniciales} />
      </div>
      <Secciones {...props} opciones={{ itinerario: "lista", tonos: { cuentaAtras: "hondo" },
        piezas: { cuentaAtras: props.b("cuentaAtras") && <CuentaAtrasVinilo hasta={props.inv.pareja.fecha} /> } }} />
      <Despedida inv={props.inv} ornamento="surco" />
    </Lienzo>
  );
}
```

### 2.6 Momento wow e interacción táctil
- **Wow: «Tocad el vinilo».** Un toque en el disco de la portada hace que acelere hasta 33⅓ rpm en 600 ms y que suene **un segundo**: el crepitar de la aguja y un acorde de guitarra propio. Vibra 8 ms. Un segundo toque lo frena.
- **Interacción táctil: «Scratch».** Al arrastrar en círculo, el disco sigue al dedo (`atan2` del puntero) y el sonido acompaña con `playbackRate`, de 0,6 a 1,4. Es un juguete, opcional y silencioso hasta que se toca.
- **Accesible:** el disco es un `<button aria-label="Hacer girar el disco y escuchar un acorde">`, y funciona con Enter y Espacio.

```tsx
export function DiscoTocable({ iniciales }: { iniciales: string }) {
  const [gira, setGira] = useState(false);
  return (
    <button type="button" aria-pressed={gira} aria-label="Hacer girar el disco y escuchar un acorde"
      className="disco size-[min(78vw,22rem)]" data-gira={gira ? "1" : "0"}
      onClick={() => { setGira(!gira); if (!gira) { void sonar("/sonidos/vinilo-acorde.ogg"); vibrar(8); } }}>
      <span className="galleta">{iniciales}</span>
    </button>
  );
}
/* .disco[data-gira="1"] { animation: gira 1.8s linear infinite; }  —  apagado con reduced-motion */
```

### 2.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento texto/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `rojo` | Rojo directo | `#111011` | `#eee8df` | `#c42f27` | 15,59 | 4,74 (corregido a `#ce5b53`) | blanco 5,55 |
| `plata` | Plata y humo | `#0f1012` | `#ece9e4` | `#b9a37a` | 15,72 | 7,78 | negro 7,72 |
| `whisky` | Whisky | `#141110` | `#efe7dc` | `#b07d45` | 15,33 | 5,25 | negro 5,27 |

---

## 3. Neón de Medianoche · `neon` — Reggaeton y fiesta

### 3.1 Concepto y dirección de arte
- **Nombre comercial:** **Neón de Medianoche**.
- **Gesto:** «Vuestros nombres se encienden en neón, tubo a tubo, sobre negro profundo.»
- **Para:** boda urbana, de azotea o hasta el amanecer, para parejas que viven la noche.
- **Modo:** oscuro. **Radio:** 18px. **Grano:** 0,03. **Ornamento:** `tubo` (un trazo de neón con sus dos electrodos).
- **La regla del neón elegante:** como mucho **dos piezas encendidas por pantalla**; el resplandor no pasa de 18 px de radio ni de 0,55 de opacidad; nada de arcoíris; el rosa está desaturado (no el `#ff00aa` fluorescente); y nada de flúor sobre flúor.

**Paleta «Rosa neón»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#0a0910` | negro tinta, con un punto de azul | — |
| Tinta | `#f1edf6` | texto | **17,16:1** |
| Acento | `#ff5fa8` | el tubo principal: nombres y CTA | **7,04:1** como texto · negro encima **6,70:1** |
| Acento2 | `#9b7bff` | el segundo tubo, violeta | **6,30:1**: legible |
| Brillo | `#d9dbe3` | cromo y cristal: filetes y bordes | **14,34:1** |
| Hondo (derivado) | `#401c31` | la pista | tinta encima **12,73:1** |

**Tipografía**
- **Display:** Unbounded, en 500 y 700. Geométrica y ancha, urbana pero limpia.
- **Texto:** Plus Jakarta Sans, en 400 y 600.
- **Acento:** Sacramento 400, una caligrafía de trazo único que **es un tubo de neón**. Solo para los nombres, a ≥ 3,2 rem.

**Mood**
> Las dos de la mañana en una azotea: el asfalto mojado refleja un rótulo rosa.
> Cristal negro, cromo y el zumbido eléctrico suave de un tubo.
> Sensual y moderno, con la elegancia de un club privado, no de una discoteca de polígono.

**Texturas y materiales**
- Cristal ahumado: tarjetas con `backdrop-filter: blur(12px)` y un filete blanco al 12 %.
- **Reflejo en el asfalto mojado:** los nombres duplicados en un nodo `aria-hidden` con `scaleY(-1)`, `mask-image` en degradado y `blur(2px)`.
- Tubos de neón: un SVG con dos trazos, el núcleo casi blanco y el color con `drop-shadow`.
- Cromo cepillado: `repeating-linear-gradient`.

**Qué pedir a la pareja**
- Un clip nocturno vertical bailando bajo luces de ciudad, o en una discoteca vacía.
- Una foto con flash directo, de estética editorial nocturna.
- La canción de la boda.

### 3.2 Hero con vídeo
- **Encuadre:** 9:16; siluetas bailando con el reflejo en el suelo, que ocupa el tercio inferior.
- **Velo:** más denso que el común, **0,7 en el tercio inferior**. El neón necesita negro de verdad para no parecer flúor.
- **Rótulo:** los nombres en Sacramento rosa a `clamp(3.6rem, 17vw, 6rem)`, con la «y» en el violeta. Debajo, «12 · 06 · 2027 — DESDE LAS 21:00», en Unbounded 500 a 1 rem con 0,2 em de tracking. Por último, el lugar.
- **Play:** un aro de neón de 56 px, apagado (filete cromo) en reposo, que se enciende con dos parpadeos al pulsarlo.
- **Póster** ≤ 35 KB: los negros comprimen bien. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, night city rooftop after rain, a couple dancing close in silhouette, soft pink and violet neon glow reflecting on the wet ground, slow orbiting camera, light haze, seamless 7 s loop.
  > Elegant and cinematic, deep blacks, no readable signs, no logos, no text, no recognizable buildings.

### 3.3 Cuenta atrás: «La pista»
- Cuatro **baldosas de pista de baile** de cristal (2×2 en móvil y 4×1 desde tablet), cada una con su cifra en Unbounded 700 a 2,8 rem.
- La baldosa que cambia se ilumina en 400 ms, con fundido y nunca de golpe. La de los segundos **respira** entre el 85 % y el 100 % de brillo una vez por segundo: 1 Hz, muy por debajo de los 3 Hz de WCAG 2.3.1.
- Una etiqueta discreta: «92 BPM», el tempo del dembow.

```tsx
export function CuentaAtrasPista({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  return (
    <section className="pista-cuenta px-5 py-24">
      <p className="sr-only">Faltan {c.d} días.</p>
      <div aria-hidden className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["días", c.d], ["horas", c.h], ["min", c.m], ["seg", c.s]] as const).map(([et, n]) => (
          <div key={et} className="baldosa" data-et={et}>
            <span key={n} className="display baldosa-n tabular-nums">{String(n).padStart(2, "0")}</span>
            <span className="text-[1rem] uppercase tracking-[0.2em]">{et}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### 3.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | Al salir la apertura, **los nombres se encienden letra a letra** (1,2 s). Al bajar, el vídeo se acerca (`scale 1→1.08`), se oscurece y el reflejo se estira | `@keyframes` por letra (`--i`); el vídeo ligado a `--p` | 0 → 100 svh | Nombres encendidos y quietos |
| Historia | Fotos en tarjetas de cristal; **su filete de neón da una vuelta** al entrar (`conic-gradient` con `@property --giro`) | `view()` | entry 0 % → cover 35 % | Filete quieto |
| Cuándo y dónde | «Lista de invitados» en la puerta: una tarjeta de cristal y **un cordón de terciopelo que se descuelga** | `rotate` del gancho, ligado a `--p` | cover 20 % → cover 45 % | Cordón ya abierto |
| Programa | «El set de la noche»: una línea de neón vertical se dibuja y cada hora se enciende cuando la línea llega | `scaleY(var(--p))` y `opacity` por parada | cover 5 % → cover 85 % | Línea completa |
| Dress code | «Negro y brillo»: muestras de cristal; la del brillo lleva un reflejo que cruza una vez | `view()` | entry → cover 40 % | Sin reflejo |
| Alojamiento | «After»: tarjetas de cristal en vertical | `Entra` | — | — |
| Regalos | «Ver datos» con filete de neón; al copiar, aparece un aviso en neón | al tocar | — | Aviso sin brillo |
| RSVP | Wow (§3.6): el rótulo «Nos vemos en la pista, Carmen» se enciende | — | — | Rótulo encendido |
| Cierre | «La última»: los nombres se apagan tubo a tubo, el cielo clarea hacia un amanecer violeta y queda la firma | degradado ligado a `--p` | cover 0 % → 70 % | Amanecer quieto |

### 3.5 Estructura de código
**Archivos:**
- `src/plantillas/neon.tsx` y `neon.css`
- `src/plantillas/tematicas/Neon.tsx` (con `NombresNeon`, `CuentaAtrasPista` y `PistaTactil`)
- `public/sonidos/neon-zumbido.ogg` (0,6 s)

**Orden:** `["itinerario", "cuentaAtras", "galeria", "capitulos", "historia", "dressCode", "playlist", "alojamiento", "regalos", "rsvp", "hashtag", "album", "notas", "muro"]`. Como en Constelación, empieza por la fiesta.

**Movimiento:** `neon: { estilo: "cinematografico", velocidad: 1, intensidad: 0.6, entrada: "fundido-desenfoque", particulas: "destellos", flores: "ninguna", colorVivo: false }`.

```tsx
// Los nombres: cada letra es un tubo. El texto real va en el h1 (lectores y SEO).
export function NombresNeon({ texto }: { texto: string }) {
  return (
    <h1 className="neon-nombres vt-nombres" aria-label={texto}>
      {[...texto].map((l, i) => (
        <span key={i} aria-hidden style={{ "--i": i } as React.CSSProperties}>{l}</span>
      ))}
    </h1>
  );
}
```
```css
.neon-nombres { font: 400 clamp(3.6rem, 17vw, 6rem)/1 var(--p-acento); color: var(--acento); }
.neon-nombres span { text-shadow: 0 0 6px color-mix(in oklch, var(--acento) 55%, transparent),
                                  0 0 18px color-mix(in oklch, var(--acento) 35%, transparent); }
@media (prefers-reduced-motion: no-preference) {
  .neon-nombres span { animation: tubo 900ms steps(1) both; animation-delay: calc(var(--i) * 70ms); }
}
/* Dos parpadeos y fijo: < 3 destellos por segundo (WCAG 2.3.1) */
@keyframes tubo { 0% { opacity: .15 } 30% { opacity: 1 } 45% { opacity: .3 } 70%, 100% { opacity: 1 } }
```

### 3.6 Momento wow e interacción táctil
- **Wow: «Encended vuestro rótulo».** Al confirmar el «Sí», aparece un rótulo de neón «¡Nos vemos en la pista, Carmen!» que se enciende tubo a tubo, con dos parpadeos y un zumbido de 0,6 s, y vibra `[8, 60, 8]`. Un toque en los nombres de la portada **cambia el color de los tubos** entre el rosa y el violeta (acento ↔ acento2).
- **Interacción táctil: «La pista de baile».** Antes de la firma, una rejilla de 6×4 baldosas de cristal. Al tocarla, la baldosa se enciende y una onda de luz se abre a las vecinas (`transition-delay` según la distancia). Es pura alegría y no tapa nada: va en su propio tramo y tiene 72 svh de alto como mucho. Con reduced-motion, la baldosa se enciende sin onda.

### 3.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `rosa` | Rosa neón | `#0a0910` | `#f1edf6` | `#ff5fa8` | 17,16 | 7,04 | negro 6,70 |
| `hielo` | Hielo | `#07090f` | `#eaf2f7` | `#4fd1e8` | 17,58 | 11,01 | negro 10,45 |
| `ambar` | Ámbar de madrugada | `#0c080b` | `#f6ece9` | `#ff7a59` | 17,15 | 7,75 | negro 7,36 |

Acento2: «Hielo» lleva `#7a6bff` (5,09:1) y «Ámbar», `#e9b95a` (10,95:1). Los dos son legibles.

---

## 4. Son de Fuego · `fuego` — Salsa y fuego

### 4.1 Concepto y dirección de arte
- **Nombre comercial:** **Son de Fuego**.
- **Gesto:** «Una pareja de bailarines gira en vuestra portada y la falda se abre como un abanico de terciopelo.»
- **Para:** parejas salseras o con raíces caribeñas, en una boda con orquesta y mucho baile.
- **Modo:** claro. **Radio:** 6px. **Grano:** 0,05. **Ornamento:** `clave` (los cinco puntos del 3-2 sobre un filete de latón).

**Paleta «Rojo son»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f8eee3` | crema cálido de cartel | — |
| Tinta | `#2a1411` | texto | **15,19:1** |
| Acento | `#b3261e` | rojo terciopelo | **5,71:1** como texto · blanco encima **6,54:1** |
| Acento2 | `#e07a2c` | naranja brasa: llama y degradados | 2,62:1 → **decorativo** |
| Brillo | `#b8913f` | latón pulido: filetes y bombillas | 2,56:1 → **decorativo** |
| Hondo (derivado) | `#98221b` | la sección de terciopelo | papel encima **7,11:1** |

**Tipografía**
- **Display:** Yeseva One 400. Una didona con mucho cuerpo, de cartel de club de los 50.
- **Texto:** Work Sans, en 400 y 500.
- **Acento:** Mr Dafoe 400, un pincel con movimiento para la «y» y las dedicatorias cortas, a ≥ 2,4 rem.

**Mood**
> Un club de La Habana en 1957: terciopelo rojo, latón pulido y bombillas cálidas.
> Las caderas antes que los pies; el calor de la orquesta en la nuca.
> Pasión, pero de gala.

**Texturas y materiales**
- Terciopelo: `radial-gradient` con brillo de pelo y grano.
- Latón: un degradado de tres paradas, con brillo a 35°.
- Bombillas de cartel: puntos con un halo cálido.
- Serigrafía con el **registro desplazado** en los titulares (`text-shadow: 1px 1px 0` acento2 al 30 %).
- Un abanico de pliegues.

**Qué pedir a la pareja**
- Un clip vertical bailando (un giro, la falda que vuela, las manos entrelazadas) con luz cálida.
- Una foto de sus pies bailando.
- La salsa de su vida.

### 4.2 Hero con vídeo
- **Encuadre:** 9:16; un primer plano de la falda girando y las manos, sin caras centradas (así no hay que dejar zona libre para ellas).
- **Velo:** el común, con un tinte cálido arriba (`color-mix(in oklch, var(--acento2) 16%, transparent)`).
- **Rótulo:** «Esta noche se baila», en Work Sans 500 con tracking. Los nombres en Yeseva a `clamp(3.2rem, 15vw, 5.4rem)`, con la «y» en Mr Dafoe a 1,1 em. Después, la fecha y el lugar.
- **Play:** un botón redondo de latón de 56 px con un sol de 12 rayos grabado, que gira 30° al pulsarlo.
- **Póster** ≤ 40 KB. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, slow-motion close-up of a couple dancing salsa, a red dress skirt spinning open like a fan, warm tungsten bulbs and candlelight bokeh, polished brass and red velvet behind, seamless 7 s loop.
  > Rich warm tones, elegant 1950s Havana nightclub mood, no text, no logos, no recognizable venue.

### 4.3 Cuenta atrás: «La clave»
- Las cuatro cifras en Yeseva, cada una en un marco de cartel con bombillas de latón.
- Debajo, **la clave de son 3-2** que enseña el ritmo: cinco puntos de latón sobre una línea de 16 pasos, que se iluminan a su compás en compases de 2 s, con fundidos de 120 ms. Lleva la leyenda «Así suena la clave 3-2».
- Son puntos de < 1 % de la pantalla: no cuentan como destello (WCAG 2.3.1, área pequeña) y, aun así, ninguno se enciende más de una vez por compás.

```tsx
const GOLPES = [0, 3, 6, 10, 12];   // clave de son 3-2 en semicorcheas
export function CuentaAtrasClave({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  return (
    <section className="clave-cuenta px-5 py-24 text-center">
      <p className="sr-only">Faltan {c.d} días.</p>
      <Marcos valores={[c.d, c.h, c.m, c.s]} etiquetas={["días", "horas", "min", "seg"]} />
      <div aria-hidden className="clave-linea">
        {GOLPES.map((g) => <i key={g} style={{ "--paso": g } as React.CSSProperties} />)}
      </div>
      <p className="mt-4 text-[1.0625rem] opacity-85">Así suena la clave 3-2</p>
    </section>
  );
}
/* .clave-linea i { left: calc(var(--paso) / 16 * 100%); animation: golpe 2s infinite;
   animation-delay: calc(var(--paso) * 125ms); }  — reduced-motion: puntos quietos y encendidos */
```

### 4.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | Dos siluetas de bailarines en SVG; **al bajar, la falda se abre como un abanico** de nueve pliegues | sticky (130 svh); cada pliegue con `rotate(calc(var(--i) * var(--p) * 12deg))` | 0 → 110 svh | Abanico abierto |
| Historia | «Nuestros pasos»: cada capítulo lleva su conteo («1, 2, 3… 5, 6, 7») y entra alternando izquierda y derecha, como un *cross-body* | `view()`, `translateX(±24px)` | entry 0 % → cover 30 % | Quieto |
| Cuándo y dónde | Un cartel de club, «Esta noche: A y B», cuyas **bombillas del marco se encienden una a una** | `opacity` de cada bombilla `clamp(0, var(--p) * 20 - var(--i), 1)` | cover 10 % → cover 50 % | Todas encendidas |
| Programa | «El repertorio de la noche»: lista vertical y un filete de latón que se traza | `scaleX(var(--p))` | cover 10 % → 50 % | Trazado |
| Dress code | «Vestid para bailar»: muestras de terciopelo y seda que se balancean ±2° una vez. Lleva la nota «Zapato cómodo: aquí se baila» | `view()` | entry → cover 35 % | Quietas |
| Alojamiento | Fichas con el filete de latón | `Entra` | — | — |
| Regalos | «Ver datos», con Copiar y Bizum | al tocar | — | — |
| RSVP | Wow (§4.6). Al confirmar: «¡A bailar, Carmen!» y el abanico se abre | — | — | Abanico abierto |
| Cierre | El abanico se cierra y las bombillas se apagan **salvo dos**, la pareja; luego la firma | `--p` invertido | cover 0 % → 60 % | Dos bombillas |

### 4.5 Estructura de código
**Archivos:**
- `src/plantillas/fuego.tsx` y `fuego.css`
- **`src/plantillas/tematicas/baile/`**: un motor compartido con Bachata, con `Pareja.tsx` (las siluetas SVG y el giro), `audio.ts` y `ritmo.ts`
- `src/plantillas/tematicas/Fuego.tsx` (con `CuentaAtrasClave` y `Abanico`)
- `public/sonidos/fuego-claves.ogg` (dos golpes de clave de madera, 0,5 s)

**Orden:** `["capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "playlist", "alojamiento", "regalos", "rsvp", "galeria", "album", "hashtag", "notas", "muro"]`.

**Movimiento:** `fuego: { estilo: "romantico", velocidad: 1.05, intensidad: 0.6, entrada: "ascenso", particulas: "destellos", flores: "ninguna", colorVivo: true }`.

```tsx
export default function Fuego(props: Props) {
  const d = datosPortada(props);
  const ap = obtenerPlantilla("fuego").apertura!;
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <HeroVideo src={ap.vertical} poster={ap.poster} alt={`${d.a} y ${d.b}`} play={<BotonPlay forma="sol" />}>
        <p className="rotulo-pequeno">Esta noche se baila</p>
        <h1 className="display vt-nombres">{d.a} <Y /> {d.b}</h1>
      </HeroVideo>
      <section className="tramo fuego-pareja" style={{ "--rango": "contain 0% contain 100%" } as React.CSSProperties}>
        <Pareja giro="salsa" />   {/* isla de cliente: el toque y el deslizamiento */}
      </section>
      <Secciones {...props} opciones={{ tonos: { cuentaAtras: "hondo", dressCode: "velo" },
        piezas: { cuentaAtras: props.b("cuentaAtras") && <CuentaAtrasClave hasta={props.inv.pareja.fecha} /> } }} />
      <Despedida inv={props.inv} ornamento="clave" />
    </Lienzo>
  );
}
```

### 4.6 Momento wow e interacción táctil
- **Wow: «Una vuelta».** Al tocar a la pareja, ella **gira bajo el brazo de él**: una rotación de 900 ms con `transform-origin` en la mano que los une. La falda pasa de cerrada a abierta y vuelve a 0,6. Saltan chispas de latón (12 partículas de `motor.ts` de F1), suenan dos golpes de clave y vibra `[10, 30, 10]`.
- **Interacción táctil: «Dile hacia dónde girar».** Al deslizar a la izquierda o a la derecha, el giro va en ese sentido. Es un gesto horizontal en una zona con `touch-action: pan-y`, así que el scroll vertical nunca se bloquea.
- **Accesible:** un botón «Hacer girar a la pareja». Con reduced-motion, la pareja pasa de una pose a otra con un fundido.

### 4.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `rojo` | Rojo son | `#f8eee3` | `#2a1411` | `#b3261e` | 15,19 | 5,71 | blanco 6,54 |
| `burdeos` | Burdeos de terciopelo | `#f6ece4` | `#2b1218` | `#8f1f3d` | 15,00 | 7,42 | blanco 8,64 |
| `caribe` | Rosa caribe | `#f6f0e6` | `#22181a` | `#a8326e` | 15,26 | 5,54 | blanco 6,28 |

---

## 5. Luna de Bachata · `bachata` — Bachata romántica

### 5.1 Concepto y dirección de arte
- **Nombre comercial:** **Luna de Bachata**.
- **Gesto:** «Cuatro cuerdas de guitarra vibran con cada segundo que falta. Rasgueadlas y suenan.»
- **Para:** parejas bachateras, o una boda íntima de noche, a la luz de las velas.
- **Modo:** oscuro. **Radio:** 24px. **Grano:** 0,05. **Ornamento:** `cuerda` (cuatro hilos finos con un traste).

**Paleta «Luna violeta»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#1b1324` | berenjena profunda | — |
| Tinta | `#f2eaf3` | texto | **15,31:1** |
| Acento | `#c99ad8` | lila de luna | **7,81:1** como texto · negro encima **8,18:1** |
| Acento2 | `#e6b0a1` | rosa de vela | **9,52:1**: legible |
| Brillo | `#d9a28c` | oro rosa: las cuerdas y los filetes | **8,15:1** |
| Hondo (derivado) | `#41314c` | terciopelo | tinta encima **10,09:1** |

**Tipografía**
- **Display:** Gilda Display 400, una romana fina e íntima.
- **Texto:** Mulish, en 400 y 600.
- **Acento:** Allura 400, una cursiva caligráfica para los nombres y la «y», a ≥ 3 rem.

**Mood**
> Una terraza de madrugada, una sola guitarra de cedro y una vela.
> Los cuerpos cerca, el morado de la luna y la piel cálida.
> Íntimo, lento y profundamente romántico.

**Texturas y materiales**
- La veta de cedro en la boca de la guitarra (SVG, muy sutil).
- Cuerdas de bronce: líneas de 1–2 px con degradado oro rosa.
- Terciopelo violeta.
- **Luz de vela**, que oscila un 6 % de luminancia en ciclos de 4 s (no es un destello).
- Papel de seda.

**Qué pedir a la pareja**
- Un clip vertical bailando bachata muy juntos, con la luz del atardecer o violeta.
- Una foto de sus manos.
- Su bachata.

### 5.2 Hero con vídeo
- **Encuadre:** 9:16, plano medio de la pareja, con la guitarra desenfocada en primer término y el cielo violeta arriba.
- **Velo:** el común, teñido de berenjena (`rgb(27 19 36 / .62)`).
- **Rótulo:** «Bailemos despacio», en Gilda, y los nombres en Allura a `clamp(3.6rem, 17vw, 6.2rem)`. La fecha en Mulish 600.
- **Play:** **la boca de una guitarra**: un aro de 56 px con roseta. Al pulsarlo, las cuerdas que la cruzan vibran.
- **Póster** ≤ 35 KB. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, a couple dancing bachata very close on a terrace at blue hour, warm candlelight and a soft violet sky, an acoustic guitar resting out of focus in the foreground, slow handheld push-in, seamless 7 s loop.
  > Intimate and romantic, film grain, deep purples and warm skin tones, no text, no logos, no recognizable places.

### 5.3 Cuenta atrás: «Las cuatro cuerdas»
- Cuatro cuerdas horizontales de lado a lado de la pantalla. Cada una tiene su cifra posada sobre un traste: días, horas, min y seg, en Gilda a 2,6 rem y con la etiqueta escrita.
- **Cuando una cifra cambia, su cuerda vibra:** una onda SVG que se amortigua en 600 ms. La de los segundos vibra suave cada segundo.

```tsx
export function CuentaAtrasCuerdas({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const filas = [["días", c.d], ["horas", c.h], ["min", c.m], ["seg", c.s]] as const;
  return (
    <section className="cuerdas px-5 py-24">
      <p className="sr-only">Faltan {c.d} días.</p>
      <ul aria-hidden>
        {filas.map(([et, n], i) => (
          <li key={et} className="cuerda" data-grosor={i}>
            {/* key={n}: la onda se vuelve a disparar solo cuando cambia su cifra */}
            <svg key={n} viewBox="0 0 400 20" preserveAspectRatio="none" className="onda"><path d="M0 10 Q100 2 200 10 T400 10" /></svg>
            <span className="display tabular-nums">{n}</span> <span>{et}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
/* .onda { animation: vibra 600ms var(--ease-carta) both }  @keyframes vibra { 0%{transform:scaleY(1.8)} 100%{transform:scaleY(0)} } */
```

### 5.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | **La luna sube** detrás de los nombres y el vídeo se tiñe de berenjena | sticky (130 svh); la luna con `translateY` y el velo ligados a `--p` | 0 → 110 svh | Luna arriba |
| Historia | «Nuestra canción»: los capítulos son estrofas (I, II, *estribillo*) que se enfocan al entrar (`vida-enfoca`, que ya existe), y una cuerda crece a la izquierda | `view()` | cover 10 % → cover 40 % | Quietas |
| Cuándo y dónde | **Una vela se enciende** (la llama pasa de `scale(0)` a 1) al llegar la tarjeta de fecha y lugar | `view()` | cover 15 % → 35 % | Vela encendida |
| Programa | «El ritmo de la noche»: el básico de la bachata (1-2-3-*tap*) marca cada hora, unidas por un filete oro rosa | `scaleY(var(--p))` | cover 5 % → 80 % | Filete completo |
| Dress code | «Morados, empolvados y piel»: cintas de seda que se despliegan (`clip-path`) | `view()` | entry → cover 40 % | Desplegadas |
| Alojamiento | Fichas de terciopelo | `Entra` | — | — |
| Regalos | «Ver datos» | al tocar | — | — |
| RSVP | Wow (§5.6). Al confirmar, suena un acorde y aparece «Guardamos vuestro baile, Carmen» | — | — | Texto sin sonido |
| Cierre | La luna baja y **queda la vela**; después la firma | `--p` | cover 0 % → 60 % | Vela quieta |

### 5.5 Estructura de código
**Archivos:**
- `src/plantillas/bachata.tsx` y `bachata.css`
- `src/plantillas/tematicas/Bachata.tsx` (con `CuentaAtrasCuerdas` y `Guitarra`)
- Reutiliza `tematicas/baile/` (`Pareja`, `audio.ts`).
- **Ningún archivo de audio:** las notas se sintetizan.

**Orden:** `["capitulos", "historia", "itinerario", "cuentaAtras", "galeria", "dressCode", "alojamiento", "regalos", "rsvp", "playlist", "album", "hashtag", "notas", "muro"]`.

**Movimiento:** `bachata: { estilo: "romantico", velocidad: 0.85, intensidad: 0.5, entrada: "fundido-desenfoque", particulas: "polvo-de-oro", flores: "sutiles", colorVivo: true }`.

```ts
// src/plantillas/tematicas/baile/audio.ts — una cuerda pulsada (Karplus-Strong), ≤ 1 s y sin archivo
export function pulsar(ctx: AudioContext, hz: number, vol = 0.3) {
  const n = Math.round(ctx.sampleRate / hz);
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0);
  const linea = Float32Array.from({ length: n }, () => Math.random() * 2 - 1);
  for (let i = 0; i < d.length; i++) {
    const j = i % n; d[i] = linea[j];
    linea[j] = 0.996 * 0.5 * (linea[j] + linea[(j + 1) % n]);
  }
  const s = ctx.createBufferSource(), g = ctx.createGain();
  g.gain.value = vol; s.buffer = buf; s.connect(g).connect(ctx.destination); s.start();
}
export const LA_MENOR = [110, 164.81, 220, 261.63];   // La2 Mi3 La3 Do4
```

### 5.6 Momento wow e interacción táctil
- **Wow: «Rasguead la guitarra».** Al pasar el dedo por las cuatro cuerdas (de la cuenta atrás o de la boca de la guitarra del RSVP), **cada cuerda que cruza el dedo suena** y vibra: un acorde de La menor arpegiado, sintetizado en el navegador y sin descargar nada. Vibra 5 ms por cuerda en Android.
- **Interacción táctil:** un toque en una sola cuerda da una sola nota. El área de cada cuerda mide 48 px de alto aunque el hilo sea de 2 px. La zona usa `touch-action: pan-y`, así que deslizar en vertical sigue haciendo scroll.
- **Accesible:** un botón «Tocar un acorde», y las cuerdas son `role="button"` con `aria-label="Cuerda de La"`. Con reduced-motion, suena pero no vibra la imagen.

### 5.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `luna` | Luna violeta | `#1b1324` | `#f2eaf3` | `#c99ad8` | 15,31 | 7,81 | negro 8,18 |
| `madrugada` | Azul madrugada | `#141626` | `#ecebf5` | `#9fb0e8` | 15,15 | 8,40 | negro 8,86 |
| `vela` | Rosa vela | `#1f1218` | `#f4e8ec` | `#e09bb0` | 15,20 | 8,19 | negro 8,53 |

---

# PASATIEMPOS, DEPORTES Y ESTILO DE VIDA

---

## 6. Lúpulo y Cobre · `lupulo` — Cerveza / Artesanal

### 6.1 Concepto y dirección de arte
- **Nombre comercial:** **Lúpulo y Cobre**.
- **Gesto:** «Una etiqueta de cerveza de abadía con vuestro nombre. Al confirmar, chocan las jarras.»
- **Para:** parejas cerveceras, o una boda en una fábrica, una nave industrial o una masía con barra de grifos.
- **Modo:** claro. **Radio:** 4px. **Grano:** 0,06. **Ornamento:** `lupulo` (una piña de lúpulo grabada entre dos filetes).

**Paleta «Ámbar»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f2e8d5` | kraft claro de etiqueta | — |
| Tinta | `#241a10` | texto | **14,05:1** |
| Acento | `#a9640f` | ámbar: botones y cartelas | blanco encima **4,65:1** |
| Acento texto (calculado) | `#94580f` | el ámbar tostado para leerse | **4,72:1** (el puro daría 3,83) |
| Acento2 | `#556b2f` | verde lúpulo | **4,89:1**: legible |
| Brillo | `#b5703a` | cobre de la caldera | **3,23:1**: vale para iconos y filetes (≥ 3, WCAG 1.4.11), no para texto |
| Pizarra (tono propio) | `#26302b` | la sección de la cuenta atrás | papel encima **10,99:1** · ámbar de tiza `#e0a645` encima **6,30:1** |

La pizarra es fija en las tres variantes (`--pizarra: #26302b`). Si el probador pone un papel con el que no llega a 7:1, se oscurece hacia la tinta con la misma lógica que `tonosDerivados()`, y `revisar.mjs` lo comprueba.

**Tipografía**
- **Display:** Young Serif 400, una serif de etiqueta, cálida y robusta.
- **Texto:** Libre Franklin, en 400 y 600.
- **Acento:** IM Fell English SC 400, versalitas de imprenta antigua para «Cosecha 2027» o «Lote n.º 1». Solo rótulos cortos.

**Mood**
> Una fábrica de ladrillo al atardecer, tanques de cobre y una etiqueta impresa en letterpress.
> Lúpulo fresco, espuma fina y una pizarra de tiza.
> Rústico industrial, con alma de taller artesano.

**Texturas y materiales**
- Papel verjurado: las líneas de la forma, con un `repeating-linear-gradient` al 4 %.
- **Letterpress**, con la impresión hundida (sombra interior en los titulares).
- Una pizarra con borrones de tiza (`feTurbulence`).
- Cobre martillado.
- Una piña de lúpulo grabada al buril (SVG de líneas).
- Burbujas que suben (CSS).

**Qué pedir a la pareja**
- Un clip vertical sirviendo dos cañas a cámara lenta, o brindando entre tanques.
- La foto de su brindis.
- **«Notas de cata» de su historia:** aroma (cómo se conocieron), cuerpo (los años juntos) y final (la pedida).
- Que en el clip **no se vea ninguna etiqueta ni ningún grifo de marca**.

### 6.2 Hero con vídeo
- **Encuadre:** 9:16; la caña llenándose en macro y, en la segunda mitad del bucle, el brindis.
- **Velo:** el común, con un tinte ámbar al 12 %.
- **Rótulo:** **una cartela ovalada de etiqueta**, de papel sobre el vídeo y con su propio fondo (así el contraste no depende del vídeo): «Cervecería A y B · Lote único · 12·06·2027». Los nombres en Young Serif a `clamp(2.8rem, 13vw, 4.6rem)`.
- **Play:** una chapa de botella genérica de 56 px con el borde dentado, que gira 20° al pulsarla.
- **Póster** ≤ 40 KB. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, macro slow-motion of amber craft beer pouring into a glass with fine foam rising, then two glasses clinking in warm backlight inside a brick brewery with copper tanks, seamless 7 s loop.
  > Warm amber and copper tones, shallow depth of field, no labels, no logos, no text, no recognizable brands.

### 6.3 Cuenta atrás: «La pizarra del bar»
- Va en una sección `pizarra`. Las cifras parecen **escritas con tiza**: Young Serif con una `mask-image` de ruido. Las etiquetas son del oficio: «días de maduración», «horas de fermentado», «minutos» y «segundos».
- Cuando una cifra cambia, **se reescribe** (`clip-path` de izquierda a derecha en 300 ms).
- Al lado, una caña que se va llenando: el nivel es el progreso desde la publicación de la invitación hasta la boda, con un mínimo de 90 días de escala. Las burbujas suben despacio.

```tsx
export function CuentaAtrasPizarra({ hasta, desde }: { hasta: string; desde?: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const total = Math.max(90 * 864e5, new Date(hasta).getTime() - new Date(desde ?? Date.now()).getTime());
  const nivel = 1 - Math.min(1, (c.d * 864e5) / total);
  return (
    <section className="pizarra px-5 py-24">
      <p className="sr-only">Faltan {c.d} días.</p>
      <dl aria-hidden className="grid grid-cols-2 gap-x-6 gap-y-8">
        {([["días de maduración", c.d], ["horas de fermentado", c.h], ["minutos", c.m], ["segundos", c.s]] as const).map(([et, n]) => (
          <div key={et}><dd key={n} className="tiza display tabular-nums">{n}</dd><dt>{et}</dt></div>
        ))}
      </dl>
      <Cana nivel={nivel} />   {/* style={{ "--nivel": nivel }} → scaleY del líquido */}
    </section>
  );
}
```

### 6.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | **La etiqueta se imprime:** la cartela se aprieta (`scale 1.03→1`) y la sombra de letterpress se hunde. Desde abajo suben burbujas | sticky (120 svh) y `--p` | 0 → 100 svh | Etiqueta impresa |
| Historia | «Notas de cata»: aroma, cuerpo y final, cada nota con una piña de lúpulo que **se graba** (trazo) | `stroke-dashoffset` con `view()` | entry 0 % → cover 35 % | Grabadas |
| Cuándo y dónde | «Dónde se sirve»: una tarjeta con marco de cobre y **un brillo que cruza el metal** | `background-position` ligado a `--p` | entry → exit | Sin brillo |
| Programa | «Carta de grifos»: cada parada es un tirador con su hora y, al entrar, **sirve una línea** de ámbar | `scaleY` por parada | cover 10 % → 40 % | Llenas |
| Dress code | «Maridaje»: la paleta como tonos de malta, de la rubia a la tostada | `view()` | entry → cover 35 % | Quietas |
| Alojamiento | «Para la siesta»: fichas de kraft | `Entra` | — | — |
| Regalos | «El barril de los deseos»: «Ver datos», con Copiar y Bizum | al tocar | — | — |
| RSVP | Wow (§6.6): ¡salud! | — | — | Jarras juntas, sin espuma |
| Cierre | La pizarra con «¡Salud!» en tiza, burbujas lentas y la firma | — | cover 0 % → 50 % | Quieta |

### 6.5 Estructura de código
**Archivos:**
- `src/plantillas/lupulo.tsx` y `lupulo.css`
- `src/plantillas/tematicas/Lupulo.tsx` (con `CuentaAtrasPizarra`, `Cana` y `Jarras`)
- `public/sonidos/lupulo-brindis.ogg` (el choque de dos jarras, 0,5 s)

**Orden:** `["capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento", "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro"]`.

**Movimiento:** `lupulo: { estilo: "sereno", velocidad: 1, intensidad: 0.5, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", colorVivo: true }`.

**Tono nuevo:** `Tono` (`comun.tsx`) admite `"pizarra"` además de `"velo"` y `"hondo"`, y su CSS va en `lupulo.css` (no en `vida.css`).

```tsx
export function Jarras({ nombre }: { nombre?: string }) {
  const [salud, setSalud] = useState(false);
  const brindar = () => {
    if (salud) return; setSalud(true); vibrar(15);
    void sonar("/sonidos/lupulo-brindis.ogg");
  };
  return (
    <div className="jarras" data-salud={salud ? "1" : "0"}
      onPointerUp={(e) => { if (e.currentTarget.dataset.arrastre === "cerca") brindar(); }}>
      <Jarra lado="izq" /><Jarra lado="der" arrastrable />
      <button type="button" className="min-h-14 px-8" onClick={brindar}>
        {salud ? `¡Salud${nombre ? `, ${nombre}` : ""}!` : "Chocar las jarras"}
      </button>
    </div>
  );
}
```

### 6.6 Momento wow e interacción táctil
- **Wow: «Chocad las jarras».** Al confirmar, dos jarras de cristal grabado (genéricas, sin etiqueta) entran desde los lados. Al arrastrar una hacia la otra, o con el botón «Chocar las jarras», **chocan**:
  - giran −12° y 12°;
  - saltan diez gotas de espuma (partículas del `motor.ts` de F1);
  - suena el cristal (0,5 s) y vibra 15 ms;
  - aparece «¡Salud, Carmen!».
- **Interacción táctil:** en la cuenta atrás, un toque en la caña **sube un chorro de burbujas** desde el punto tocado.
- Con reduced-motion, las jarras aparecen juntas y el texto cambia sin animación.

### 6.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento texto/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `ambar` | Ámbar | `#f2e8d5` | `#241a10` | `#a9640f` | 14,05 | 4,72 (corregido a `#94580f`) | blanco 4,65 |
| `lupulo` | Lúpulo verde | `#ece6d8` | `#1e2119` | `#4f6b2e` | 13,12 | 4,86 | blanco 6,04 |
| `tostada` | Tostada | `#efe5d3` | `#211812` | `#7a3e1d` | 13,97 | 6,64 | blanco 8,29 |

---

## 7. Noche de Estadio · `estadio` — Fútbol

### 7.1 Concepto y dirección de arte
- **Nombre comercial:** **Noche de Estadio**.
- **Gesto:** «Una entrada de estadio grabada en relieve, vuestra alineación, y al confirmar… ¡gol!»
- **Para:** parejas futboleras de cualquier equipo. **Los colores los elegís vosotros con el probador**: ni escudos ni nombres.
- **Modo:** claro. **Radio:** 8px. **Grano:** 0,04. **Ornamento:** `cal` (la línea de medio campo con su círculo central).
- **Colores:** 4 en el probador (acento = color 1 del equipo, acento2 = color 2).

**Paleta «Césped»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f3f1e7` | cartulina de abono | — |
| Tinta | `#111d17` | texto | **15,30:1** |
| Acento | `#1d6a3a` | color 1 del equipo (aquí, verde césped) | **5,84:1** como texto · blanco encima **6,61:1** |
| Acento2 | `#0f3d24` | color 2: las franjas del césped | **10,83:1** |
| Brillo | `#b8954a` | oro de trofeo | 2,49:1 sobre papel → **decorativo** |
| Oro de marcador | `#d9bf7a` | las cifras del marcador sobre el hondo `#1b5b33` | **4,51:1** (texto grande: holgado) |
| Hondo (derivado) | `#1b5b33` | el marcador y la grada | papel encima **7,16:1** |

**Paletas curadas para el probador (G3)**, con nombre de color y nunca de club: «Blanco y oro», «Rojo y blanco», «Azul y grana», «Verde y blanco», «Blanquiazul», «Amarillo y azul», «Rojo y negro» y «Celeste y blanco». Cada una pasa por `resolverPaleta`. Si el color 1 del equipo es claro (amarillo, celeste), **pasa a ser acento2** (las franjas) y el texto toma el color 2. Lo decide una regla: `contraste(acento, papel) < 3 → intercambiar`.

**Tipografía**
- **Display:** Barlow Condensed, en 600 y 800. Es la letra de marcador y de programa de partido, y se lee de maravilla en grande.
- **Texto:** Barlow, en 400 y 500.
- **Acento:** Libre Caslon Text 400 *italic*, para los nombres y la «y»: el toque de gala.

**Mood**
> La noche de una final: focos encendidos, el césped recién cortado a franjas y el rumor de la grada.
> Papel de abono en relieve y oro de trofeo.
> La emoción del gol, vestida de etiqueta.

**Texturas y materiales**
- **Relieve (*emboss*) en la entrada:** dos sombras, una clara arriba a la izquierda y una oscura abajo a la derecha. Su dirección se mueve con el scroll, como si se inclinara la entrada bajo un foco.
- Césped a franjas (`repeating-linear-gradient` de acento y acento2 al 8 %, solo en las secciones `hondo`).
- La red de la portería (patrón SVG hexagonal).
- La cal de las líneas del campo.
- Focos (`radial-gradient`).
- **Un «escudo propio»:** las iniciales de la pareja en un sello circular con la fecha. Es su emblema, no el de un club.

**Qué pedir a la pareja**
- Un clip vertical en un campo (vale uno de barrio) dando toques, o en una grada. **Con camisetas lisas, sin escudo ni patrocinador** (hay que pedirlo así).
- Los dos colores de su equipo.
- **Su «once»:** los nombres de testigos, padrinos, damas o amigos, con su «posición» si quieren («El portero: Juan, que nunca falla»).

### 7.2 Hero con vídeo
- **Encuadre:** 9:16; focos en lo alto, césped en macro y un balón que rueda despacio hasta la red. La red ocupa el tercio inferior, tras el velo.
- **Velo:** el común.
- **Rótulo:** «LA FINAL», en Barlow Condensed 600 con 0,3 em de tracking. Los nombres en Barlow Condensed 800, en mayúsculas, a `clamp(3.6rem, 18vw, 6.4rem)`, con la «y» en Caslon italic. Debajo, «12.06.2027 · Saque inicial 19:00 · Finca La Dehesa».
- **Play:** el **círculo central** del campo, en cal blanca, de 56 px, con el punto central como ▶.
- **Póster** ≤ 40 KB. **Vídeo** ≤ 1,2 MB (el césped en macro es exigente: CRF 29).
- **Prompt IA:**
  > Vertical 9:16, a night football pitch under floodlights, freshly mowed striped grass in macro, a ball rolling slowly into the net which ripples, warm haze and distant crowd bokeh, seamless 7 s loop.
  > Cinematic and elegant, no crests, no sponsor logos, no text, no recognizable stadium or kits.

### 7.3 Cuenta atrás: «El marcador»
- Un marcador de estadio sobre `hondo`, con el rótulo «A Y B · LA FINAL» arriba.
- Las cifras van en **paletas abatibles** (*split-flap*): solo la que cambia gira su mitad superior (`rotateX`, 240 ms). Son DÍAS : HORAS : MIN : SEG en Barlow Condensed 800 a `clamp(2.6rem, 13vw, 4rem)`, en el oro de marcador (4,51:1).
- En 360 px, dos filas (días arriba y luego hh:mm:ss) para que nada se salga.

```tsx
export function Marcador({ hasta, a, b }: { hasta: string; a: string; b: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const dos = (n: number) => String(n).padStart(2, "0");
  return (
    <section className="marcador px-5 py-20 text-center">
      <p className="text-[1rem] uppercase tracking-[0.3em]">{a} y {b} · La final</p>
      <p className="sr-only">Faltan {c.d} días para el saque inicial.</p>
      <div aria-hidden className="mt-6 grid gap-3">
        <Paleta valor={String(c.d)} etiqueta="días" grande />
        <div className="flex justify-center gap-2">
          <Paleta valor={dos(c.h)} etiqueta="horas" /><Paleta valor={dos(c.m)} etiqueta="min" /><Paleta valor={dos(c.s)} etiqueta="seg" />
        </div>
      </div>
    </section>
  );
}
function Paleta({ valor, etiqueta, grande }: { valor: string; etiqueta: string; grande?: boolean }) {
  return (
    <div className={`paleta ${grande ? "paleta-grande" : ""}`}>
      {[...valor].map((n, i) => <span key={`${i}-${n}`} className="paleta-cifra display tabular-nums">{n}</span>)}
      <span className="paleta-et">{etiqueta}</span>
    </div>
  );
}
/* .paleta-cifra::before = la mitad superior que cae: animation: abate 240ms var(--ease-velo) — reduced-motion: none */
```

### 7.4 La alineación «Los novios»
- Es un **bloque nuevo y opcional**, `alineacion`: `{ t: "alineacion"; titulo?: string; jugadores: { nombre: string; rol?: string }[] }`, con 11 jugadores como mucho. Va en `lib/tipos.ts` (F1) y su editor en el panel (F4). Sin el bloque, se pinta solo la pareja en el círculo central con la leyenda «Y en la grada: vosotros».
- **Dibujo:** un campo vertical en SVG con la formación 1-4-3-3. La pareja va de delanteros centro, juntos, y cada jugador es un disco con sus iniciales y el nombre debajo, en Barlow 500 a 1,0625 rem.
- **Accesible:** debajo del SVG (y para el lector de pantalla), la misma alineación como `<ol>` por líneas: «Portería · Defensa · Medio campo · Delantera».

### 7.5 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | Tras el vídeo, **la entrada en relieve sube** desde abajo. Al seguir bajando, **la luz del relieve cambia de lado**, como si la inclinaras bajo un foco | sticky (140 svh); la dirección de los `text-shadow` y del degradado ligada a `--p` | 0 → 120 svh | Entrada quieta, luz de arriba a la izquierda |
| Historia | «Historial de partidos»: cada capítulo es una ficha de partido («Primer partido · 2018 · El bar de la plaza»), unidas por una línea de cal | `view()`; la línea con `scaleY` | entry 0 % → cover 35 % | Quieto |
| Cuándo y dónde | «Puerta 7»: hora, lugar y «Cómo llegar». **Los cuatro focos se encienden** uno tras otro | `opacity` de cada foco por tramos de `--p` | cover 5 % → cover 45 % | Focos encendidos |
| Programa | **La alineación entra por líneas** (portería → defensa → medio → delantera) y después el horario como un partido: «Calentamiento 18:30 · Saque inicial (ceremonia) 19:00 · Descanso (cóctel) · Segunda parte (cena) · Prórroga (fiesta)» | `view()` por línea | cover 10 % → cover 50 % | Formación completa |
| Dress code | «Equipación»: camisetas lisas genéricas en SVG con los colores de la pareja y la nota que escriban | `view()` | entry → cover 35 % | Quietas |
| Alojamiento | «Concentración del equipo»: fichas de hotel | `Entra` | — | — |
| Regalos | «Fichajes»: «Ver datos», con Copiar y Bizum | al tocar | — | — |
| RSVP | **¡Gol!** (§7.7) | — | — | Marcador «1 – 0» y el texto, sin animación |
| Cierre | **La ola:** al llegar al final, una ola recorre la grada (filas de puntos en los colores del equipo) al ritmo del dedo; después la firma | `translateY(calc(sin((var(--p) * 6 - var(--i) / 8) * 1rad) * -10px))` (`sin()` de CSS, con *fallback* lineal) | cover 0 % → cover 80 % | Grada quieta |

### 7.6 Estructura de código
**Archivos:**
- `src/plantillas/estadio.tsx` y `estadio.css`
- `src/plantillas/tematicas/Estadio.tsx` (con `Marcador`, `Alineacion`, `Gol` y `Grada`)
- `public/sonidos/estadio-gol.ogg` (el rugido de la grada, 1 s, foley propio)

**Orden:** `["cuentaAtras", "capitulos", "historia", "itinerario", "alineacion", "dressCode", "alojamiento", "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro"]`. El marcador va justo después de la portada: en el fútbol lo primero que se mira es el marcador.

**Movimiento:** `estadio: { estilo: "sereno", velocidad: 1.1, intensidad: 0.6, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", colorVivo: false }`.

```tsx
export default function Estadio(props: Props) {
  const d = datosPortada(props);
  const ap = obtenerPlantilla("estadio").apertura!;
  const al = props.b("alineacion");
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <div className="tramo estadio-portada" style={{ "--rango": "contain 0% contain 100%" } as React.CSSProperties}>
        <HeroVideo src={ap.vertical} poster={ap.poster} alt={`${d.a} y ${d.b}`} play={<BotonPlay forma="circulo-central" />}>
          <p className="rotulo-pequeno">La final</p>
          <h1 className="display vt-nombres uppercase">{d.a} <Y /> {d.b}</h1>
        </HeroVideo>
        <EntradaRelieve d={d} />
      </div>
      <Secciones {...props} opciones={{
        itinerario: "ficha",
        tonos: { cuentaAtras: "hondo", alineacion: "velo" },
        piezas: {
          cuentaAtras: props.b("cuentaAtras") && <Marcador hasta={props.inv.pareja.fecha} a={d.a} b={d.b} />,
          alineacion: <Alineacion pareja={[d.a, d.b]} jugadores={al?.jugadores ?? []} />,
          rsvp: props.b("rsvp") && <Gol><Rsvp slug={props.inv.slug} {...props.b("rsvp")!} /></Gol>,
        },
      }} />
      <Grada />
      <Despedida inv={props.inv} ornamento="cal" />
    </Lienzo>
  );
}
```

### 7.7 Momento wow e interacción táctil
- **Wow: «¡Gol!».** Al confirmar el «Sí»:
  1. el balón (SVG) traza una curva hasta la escuadra (`offset-path`, 700 ms);
  2. **la red se hincha** (`scale` del patrón, 400 ms);
  3. los focos destellan **una sola vez**;
  4. cae confeti en los colores del equipo (acento, acento2 y papel; 40 piezas en 1,4 s, con el `motor.ts` de F1);
  5. el marcador pasa a **«1 – 0»** y aparece «¡Golazo, Carmen! Te esperamos en la grada»;
  6. suena el rugido de la grada (1 s, bajito) y vibra `[30, 50, 30, 50, 80]`.
- **Interacción táctil: «Haced la ola».** Al tocar la grada del cierre, sale una ola desde el dedo, hacia los dos lados.
- Con reduced-motion no hay balón ni confeti: el marcador cambia a «1 – 0» y aparece el texto.

### 7.8 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Acento2 | Tinta/papel | Acento/papel | Sobre acento |
|---|---|---|---|---|---|---|---|---|
| `cesped` | Césped | `#f3f1e7` | `#111d17` | `#1d6a3a` | `#0f3d24` | 15,30 | 5,84 | blanco 6,61 |
| `rojo` | Rojo pasión | `#f5f1ea` | `#1f1514` | `#b3202a` | `#ffffff` | 15,87 | 5,91 | blanco 6,65 |
| `azulgrana` | Azul y grana | `#f1f2f4` | `#121a2b` | `#1e3f8f` | `#8c1c3a` | 15,51 | 8,67 | blanco 9,71 |

---

## 8. Línea de Meta · `meta` — Runners y deporte

### 8.1 Concepto y dirección de arte
- **Nombre comercial:** **Línea de Meta**.
- **Gesto:** «Un dorsal con vuestro nombre y una cinta de meta que se rompe al confirmar.»
- **Para:** parejas que corren juntas: maratón, trail o triatlón.
- **Modo:** claro. **Radio:** 10px. **Grano:** 0,03. **Ornamento:** `cinta` (una cinta de meta tensada).

**Paleta «Naranja meta»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f5f5f1` | Tyvek blanco roto | — |
| Tinta | `#14161a` | texto | **16,57:1** |
| Acento | `#e3492b` | naranja de energía: dorsal y CTA | como superficie, **negro** encima **4,72:1** |
| Acento texto (calculado) | `#c24128` | el naranja tostado para leerse | **4,71:1** (el puro daría 3,66) |
| Acento2 | `#2550c0` | azul de calle | **6,43:1**: legible |
| Brillo | `#c99a2e` | oro de medalla | 2,36:1 → **decorativo** |

**Tipografía**
- **Display:** Archivo, con el eje `wdth` a 125 y peso 800 (Archivo Expanded): la letra del dorsal.
- **Texto:** Albert Sans, en 400 y 500.
- **Acento:** Chivo Mono 500, para el cronómetro, los tiempos y los kilómetros. Los nombres van en la display.

**Mood**
> El kilómetro 42 al amanecer: la ciudad aún dormida, el aliento y la cinta de meta al fondo.
> Tyvek, imperdibles, oro de medalla y precisión suiza.
> Energía pura, con la serenidad de haber llegado juntos.

**Texturas y materiales**
- Tyvek: fibras con `feTurbulence` fino al 4 %.
- Cuatro imperdibles en SVG en las esquinas del dorsal.
- Una cinta de meta de raso.
- Una medalla fundida con su cinta.
- Las calles de una pista de atletismo.
- El bisel de un cronómetro.

**Qué pedir a la pareja**
- Un clip vertical corriendo juntos al amanecer (de frente, con la cámara fija, cruzando el plano) o cruzando una meta.
- Una foto con sus medallas. **Pedir que no se vean marcas** de ropa ni de zapatillas.
- Su carrera fetiche, en texto libre y sin el nombre oficial de la prueba.

### 8.2 Hero con vídeo
- **Encuadre:** 9:16; la pareja corre hacia cámara desde el fondo y cruza el tercio central.
- **Velo:** el común.
- **Rótulo: el dorsal.** Una pieza de Tyvek, con su propio fondo de papel (así el contraste no depende del vídeo), que lleva el **número 1206 (la fecha)** en Archivo Expanded 800 a `clamp(4rem, 20vw, 7rem)`, los nombres y «Salida: 12 de junio de 2027, 18:00».
- **Play:** un cronómetro de 56 px con la corona arriba y ▶ en la esfera.
- **Póster** ≤ 40 KB. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, a couple running side by side at sunrise along an empty coastal promenade, slow motion, golden backlight and long shadows, they break a thin finish ribbon together, seamless 7 s loop.
  > Clean athletic editorial look, no logos on clothing or shoes, no text, no race branding, no recognizable landmarks.

### 8.3 Cuenta atrás: «El reloj de meta»
- Un pórtico de meta con el reloj: «128 días» grande y debajo `14:07:33` en Chivo Mono a `clamp(2.4rem, 12vw, 3.6rem)`.
- **«Faltan 3,2 km»:** el tiempo que falta convertido en la distancia de un maratón. Se calcula como `días ÷ 365 × 42,195`, con un tope de 42,195. Un punto recorre una pista en forma de óvalo.
- Los segundos cambian con un paso seco hacia arriba de 160 ms.

```tsx
export function RelojMeta({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const km = Math.min(42.195, ((c.d + c.h / 24) / 365) * 42.195);
  const dos = (n: number) => String(n).padStart(2, "0");
  return (
    <section className="reloj-meta px-5 py-24 text-center">
      <p className="sr-only">Faltan {c.d} días: unos {km.toFixed(1)} kilómetros de maratón.</p>
      <div aria-hidden>
        <p className="display text-[clamp(3.4rem,18vw,6rem)] leading-none">{c.d} <span className="text-[0.4em]">días</span></p>
        <p className="crono tabular-nums">{dos(c.h)}:{dos(c.m)}:<span key={c.s} className="crono-s">{dos(c.s)}</span></p>
        <Ovalo progreso={1 - km / 42.195} />
        <p className="mt-4 text-[1.125rem]">Faltan <strong>{km.toLocaleString("es-ES", { maximumFractionDigits: 1 })} km</strong></p>
      </div>
    </section>
  );
}
```

### 8.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | El dorsal se tensa (se asienta con un giro de 3° a 0°) y **las calles de la pista corren** debajo, a la velocidad del dedo | sticky (130 svh); `background-position-y` ligado a `--p` | 0 → 110 svh | Dorsal recto y calles quietas |
| Historia | «Nuestros parciales»: «km 0 · nos conocimos · 2017», «km 21 · la mudanza», «km 42 · la boda». **Una barra de progreso** a la izquierda se llena | `scaleY(var(--p))` | cover 0 % → cover 90 % | Llena |
| Cuándo y dónde | «Salida»: un **arco de salida** que se dibuja, la hora y el lugar | `stroke-dashoffset` | cover 10 % → 40 % | Dibujado |
| Programa | «Avituallamientos»: km 0 Ceremonia, 18:00 · km 10 Cóctel · km 21 Cena · km 42 Fiesta. Cada mojón aparece con un pequeño salto | `view()` por mojón | entry → cover 30 % | Quietos |
| Dress code | «Equipación de gala», con la nota «Sí, podéis traer zapatillas para la fiesta» | `view()` | — | — |
| Alojamiento | «Zona de recuperación» | `Entra` | — | — |
| Regalos | «Nuestro avituallamiento de luna de miel»: «Ver datos» | al tocar | — | — |
| RSVP | **La cinta** (§8.6) | — | — | Cinta ya cortada y medalla quieta |
| Cierre | La medalla con las iniciales y la fecha **se balancea** tres veces y para; después la firma | `@keyframes` de péndulo amortiguado, disparado por `view()` | cover 20 % | Quieta |

### 8.5 Estructura de código
**Archivos:**
- `src/plantillas/meta.tsx` y `meta.css`
- `src/plantillas/tematicas/Meta.tsx` (con `Dorsal`, `RelojMeta`, `Ovalo`, `CintaMeta` y `Medalla`)
- `public/sonidos/meta-cinta.ogg` (0,4 s)

**Orden:** `["capitulos", "historia", "itinerario", "cuentaAtras", "dressCode", "alojamiento", "regalos", "rsvp", "galeria", "playlist", "album", "hashtag", "notas", "muro"]`.

**Movimiento:** `meta: { estilo: "minimo", velocidad: 1.2, intensidad: 0.55, entrada: "ascenso", particulas: "ninguna", flores: "ninguna", colorVivo: false }`.

**Dorsal personal:** con `?n=<token>` (el saludo de `SaludoApertura`), el dorsal del RSVP dice **«Dorsal: Carmen»**. Es el patrón 1 de docs/09 (el nombre del invitado) en clave runner.

```tsx
export default function Meta(props: Props) {
  const d = datosPortada(props);
  const ap = obtenerPlantilla("meta").apertura!;
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <div className="tramo meta-portada">
        <HeroVideo src={ap.vertical} poster={ap.poster} alt={`${d.a} y ${d.b}`} play={<BotonPlay forma="crono" />}>
          <Dorsal numero={d.fechaCorta.replace(/\D/g, "").slice(0, 4)} a={d.a} b={d.b} salida={`${d.fechaLarga}, ${d.hora}`} />
        </HeroVideo>
      </div>
      <Secciones {...props} opciones={{ itinerario: "lista", tonos: { cuentaAtras: "velo" },
        piezas: {
          cuentaAtras: props.b("cuentaAtras") && <RelojMeta hasta={props.inv.pareja.fecha} />,
          rsvp: props.b("rsvp") && <CintaMeta><Rsvp slug={props.inv.slug} {...props.b("rsvp")!} /></CintaMeta>,
        } }} />
      <Despedida inv={props.inv} ornamento="cinta" />
    </Lienzo>
  );
}
```
`datosPortada` no trae `fechaCorta`: o se añade (`"1206"`), o se calcula aquí a partir de `inv.pareja.fecha`.

### 8.6 Momento wow e interacción táctil
- **Wow: «Cruzad la meta».** Al confirmar el «Sí»:
  - la cinta de meta se tensa y **se rompe**: las dos mitades salen despedidas girando, en 700 ms;
  - el reloj se congela y muestra «Tu tiempo hasta la boda: 128 d 14 h»;
  - cae **una medalla** con las iniciales, que se balancea;
  - vibra `[20, 40, 60]`.
- **Interacción táctil: «Dad la vuelta a la medalla».** Un toque la gira y enseña el reverso grabado: «A y B · 12.06.2027 · Finisher», con un brillo que cruza el oro. Es un `<button>`.
- **También:** al deslizar el dedo de izquierda a derecha sobre la cinta, se rompe (el mismo efecto que el botón).

### 8.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento texto/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `naranja` | Naranja meta | `#f5f5f1` | `#14161a` | `#e3492b` | 16,57 | 4,71 (corregido a `#c24128`) | negro 4,72 |
| `pista` | Verde pista | `#f3f5f2` | `#12191a` | `#0d7a5e` | 16,24 | 4,83 | blanco 5,30 |
| `sprint` | Violeta sprint | `#f4f3f7` | `#17142a` | `#5b3fd6` | 16,25 | 6,08 | blanco 6,72 |

Ajuste aplicado: el primer verde probado (`#0f8a6a`) daba **4,37:1** con negro encima, por debajo de AA. Se oscureció a `#0d7a5e`, que da 5,30:1 con blanco.

---

## 9. Riviera · `riviera` — Coches y compras de lujo

### 9.1 Concepto y dirección de arte
- **Nombre comercial:** **Riviera**.
- **Gesto:** «Un cuadro de relojes cromado cuenta las horas. Girad la llave y las agujas barren hasta el final.»
- **Para:** parejas de coches clásicos y de alta costura, o una boda de etiqueta en un hotel de costa, con llegada en descapotable.
- **Modo:** claro. **Radio:** 2px. **Grano:** 0,03. **Ornamento:** `pespunte` (un filete cosido a mano con dos puntadas cruzadas).

**Paleta «Azul Riviera»**

| Rol | Hex | Uso | Ratio AA calculada |
|---|---|---|---|
| Papel | `#f3ece1` | piel marfil | — |
| Tinta | `#1b1815` | texto | **15,06:1** |
| Acento | `#1f3b5c` | azul Riviera | **9,73:1** como texto · blanco encima **11,42:1** |
| Acento2 | `#a8723c` | cuero caramelo: pespuntes e iconos | **3,48:1**: vale para gráficos (≥ 3), no para texto |
| Brillo | `#cbb487` y cromo `#f5f6f7 → #9aa0a8 → #e9ebee` | champán y cromo pulido | 1,72:1 → **decorativo** |

**Tipografía**
- **Display:** Bodoni Moda, en 400 y 600 y en *italic*, con `opsz` alto. Es la letra de una casa de costura, y nunca va por debajo de 28 px (docs/09 §4).
- **Texto:** Hanken Grotesk, en 400 y 500.
- **Acento:** Tenor Sans 400, para los rótulos en versalitas con 0,18 em de tracking («ATELIER», «RSVP»).

**Mood**
> La carretera de la costa a la hora dorada, un descapotable de los sesenta y un pañuelo de seda al viento.
> Piel cosida a mano, cromo y bolsas de boutique con papel de seda.
> Lujo silencioso: ni un solo logo.

**Texturas y materiales**
- **Piel con pespunte:** un borde de 1,5 px, discontinuo y en caramelo, separado 6 px.
- Cromo pulido (degradados).
- **Papel de seda:** capas translúcidas con pliegues suaves.
- Una caja de boutique con cinta de *grosgrain*.
- **Una esfera guilloché** (`repeating-conic-gradient`).

**Qué pedir a la pareja**
- Un clip vertical de su llegada en un coche clásico (alquilado; **que no se vean el emblema ni la matrícula**) o paseando de espaldas al atardecer por una calle de tiendas.
- Fotos de detalle: gemelos, zapatos, el pañuelo.
- Su carretera favorita, para el mapa ilustrado de la historia.

### 9.2 Hero con vídeo
- **Encuadre:** 9:16; la carretera en curva sobre el mar y el coche, pequeño y de espaldas, en el tercio central. Nunca de frente: así el modelo no se reconoce.
- **Velo:** el común, con un 8 % de champán.
- **Rótulo:** «RIVIERA · ATELIER», en Tenor Sans. Los nombres en Bodoni Moda *italic* a `clamp(3.4rem, 15vw, 5.6rem)`. Debajo, «Sábado, 12 de junio de 2027 · Hotel del Cabo».
- **Play:** un **aro cromado** de 56 px con un bisel guilloché y ▶ en champán.
- **Póster** ≤ 40 KB. **Vídeo** ≤ 1,2 MB.
- **Prompt IA:**
  > Vertical 9:16, a golden-hour coastal road high above the sea, an elegant generic 1960s convertible seen from behind at a distance, a silk scarf fluttering, soft lens flare, slow drone follow, seamless 7 s loop.
  > Quiet-luxury editorial film look, no badges, no license plates, no logos, no text, no recognizable car model.

### 9.3 Cuenta atrás: «El cuadro de relojes»
- Cuatro **relojes analógicos** con bisel cromado (2×2 en móvil):
  - días, en una escala de 0 a 365;
  - horas, de 0 a 24;
  - minutos, de 0 a 60;
  - segundos, con **barrido suave**, como un reloj mecánico.
- Debajo de cada esfera, la cifra en Bodoni a 2,2 rem y su etiqueta. **La aguja adorna, el número informa.**

```tsx
function Reloj({ valor, max, etiqueta }: { valor: number; max: number; etiqueta: string }) {
  return (
    <figure className="reloj" style={{ "--v": valor, "--max": max } as React.CSSProperties}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" className="bisel" />
        <circle cx="50" cy="50" r="40" className="guilloche" />
        <line x1="50" y1="50" x2="50" y2="16" className="aguja" />
      </svg>
      <figcaption><span className="display tabular-nums">{valor}</span> {etiqueta}</figcaption>
    </figure>
  );
}
/* .aguja { transform-origin: 50px 50px; rotate: calc(var(--v) / var(--max) * 240deg - 120deg);
            transition: rotate 600ms var(--ease-carta); }  — reduced-motion: transition none */
```

### 9.4 Guion de scroll
| Tramo | Qué ocurre | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|
| Portada | Tras el vídeo, **dos hojas de papel de seda se apartan** y descubren los nombres sobre la tapa de una caja | sticky (130 svh); `translateX(±)` de las hojas con `--p` | 0 → 110 svh | Hojas apartadas |
| Historia | «Nuestra ruta»: **una carretera ilustrada se dibuja** con el scroll y los capítulos son señales en la cuneta | `stroke-dashoffset` del trazado ligado a `--p` | cover 0 % → cover 85 % | Ruta dibujada |
| Cuándo y dónde | La invitación del atelier, atada con cinta de *grosgrain* que **se desata** (los lazos se abren y caen) | `view()` | cover 20 % → 45 % | Desatada |
| Programa | «Itinerario de gala»: las horas en Bodoni y un filete cromado | `Entra` y `scaleX` | cover 10 % → 40 % | — |
| Dress code | **«Lookbook»:** un carril con *scroll-snap* de 3–5 looks (funda de traje con su muestra de tela), con puntos y flechas. Debajo, **el mismo dress code en texto llano** («Etiqueta: traje oscuro y vestido largo»), para quien no deslice | `vida-carril` (ya existe) | entry → 100 % (eje x) | Carril quieto |
| Alojamiento | «Conserjería»: fichas de hotel con un llavero de habitación | `Entra` | — | — |
| Regalos | **«La caja»:** un toque levanta la tapa (`rotateX`, 600 ms) y dentro, sobre papel de seda, están el IBAN, Copiar y Bizum | al tocar | — | Tapa abierta, con fundido |
| RSVP | «Reservado a su nombre»: al confirmar, se estampa en seco «Reservado · Carmen» | `--ease-sello` | — | Estampado |
| Cierre | **La llave** (§9.6), los relojes en reposo y la firma | — | — | — |

### 9.5 Estructura de código
**Archivos:**
- `src/plantillas/riviera.tsx` y `riviera.css`
- `src/plantillas/tematicas/Riviera.tsx` (con `CuadroRelojes`, `Llave`, `PapelSeda` y `Caja`)
- `public/sonidos/riviera-motor.ogg` (el ronroneo de un motor de seis cilindros, sintetizado o grabado sin marca, 1 s)

**Orden:** `["capitulos", "historia", "itinerario", "dressCode", "cuentaAtras", "alojamiento", "regalos", "rsvp", "galeria", "notas", "muro"]`. Como en Velo, no lleva hashtag, álbum ni playlist destacados; si la pareja los rellena, van a «Y además».

**Movimiento:** `riviera: { estilo: "cinematografico", velocidad: 0.9, intensidad: 0.5, entrada: "velo", particulas: "ninguna", flores: "ninguna", colorVivo: true }`.

```tsx
export function CuadroRelojes({ hasta }: { hasta: string }) {
  const c = useCuenta(hasta);
  const [barrido, setBarrido] = useState(false);
  if (!c || c.acabada) return <FechaQuieta hasta={hasta} acabada={c?.acabada} />;
  const v = (n: number, max: number) => (barrido ? max : n);  // al arrancar, todo a tope y vuelta
  return (
    <section className="cuadro px-5 py-24" data-barrido={barrido ? "1" : "0"}>
      <p className="sr-only">Faltan {c.d} días.</p>
      <div aria-hidden className="grid grid-cols-2 gap-6">
        <Reloj valor={v(c.d, 365)} max={365} etiqueta="días" /><Reloj valor={v(c.h, 24)} max={24} etiqueta="horas" />
        <Reloj valor={v(c.m, 60)} max={60} etiqueta="min" /><Reloj valor={v(c.s, 60)} max={60} etiqueta="seg" />
      </div>
      <Llave onArranque={() => { setBarrido(true); setTimeout(() => setBarrido(false), 700); }} />
    </section>
  );
}
```
Durante el barrido, la etiqueta numérica **no cambia**: solo se mueven las agujas. Así nadie lee un «365 días» falso.

### 9.6 Momento wow e interacción táctil
- **Wow: «Girad la llave».** Una llave cromada genérica, junto al cuadro de relojes. Se arrastra en arco 60° (o se pulsa «Arrancar»), y **las cuatro agujas barren hasta el máximo y vuelven** a su valor real, como el autodiagnóstico de un coche al arrancar (1,2 s). Suena 1 s de motor suave y vibra `[0, 15, 20, 15]`.
- **Interacción táctil: «El papel de seda».** En la portada, las hojas de papel de seda se pueden **apartar con el dedo** (`pointermove` → `translateX`). Al soltarlas, se quedan en su sitio. Si no se tocan, se apartan con el scroll.
- **Accesible:** la llave es un `<button aria-label="Arrancar: las agujas recorren los relojes">`. Con reduced-motion, la llave gira y las agujas no barren.

### 9.7 Variantes de color
| id | Nombre | Papel | Tinta | Acento | Tinta/papel | Acento/papel | Sobre acento |
|---|---|---|---|---|---|---|---|
| `azul` | Azul Riviera | `#f3ece1` | `#1b1815` | `#1f3b5c` | 15,06 | 9,73 | blanco 11,42 |
| `ingles` | Verde inglés | `#f1eee6` | `#161b17` | `#1f4a3a` | 15,05 | 8,63 | blanco 10,01 |
| `burdeos` | Burdeos de piel | `#f5ede8` | `#221517` | `#7a2233` | 15,29 | 8,63 | blanco 9,98 |

---

## 10. Tabla resumen y orden recomendado

| # | Estilo | id | Fuentes (display · texto · acento) | Paleta base (papel · tinta · acento) | Momento wow | Esfuerzo |
|---|---|---|---|---|---|---|
| 1 | Pase VIP (Festival) | `festival` | Big Shoulders Display · Space Grotesk · Instrument Serif | `#f4efe4` · `#1c1a2b` · `#c8324f` + foil holográfico | Arrancar el talón; foil que sigue al dedo | **M** |
| 2 | Cara A (Rock & Roll) | `vinilo` | DM Serif Display · Karla · UnifrakturCook | `#111011` · `#eee8df` · `#c42f27` + cromo | Tocar el vinilo: gira y suena 1 s; *scratch* | **M** |
| 3 | Neón de Medianoche (Reggaeton) | `neon` | Unbounded · Plus Jakarta Sans · Sacramento | `#0a0910` · `#f1edf6` · `#ff5fa8` + violeta `#9b7bff` | Nombres que se encienden tubo a tubo; pista táctil | **S** |
| 4 | Son de Fuego (Salsa) | `fuego` | Yeseva One · Work Sans · Mr Dafoe | `#f8eee3` · `#2a1411` · `#b3261e` + latón | La pareja da una vuelta y el abanico se abre | **M** |
| 5 | Luna de Bachata | `bachata` | Gilda Display · Mulish · Allura | `#1b1324` · `#f2eaf3` · `#c99ad8` + oro rosa | Rasguear 4 cuerdas que suenan (Karplus-Strong) | **M** (S si va detrás de Fuego) |
| 6 | Lúpulo y Cobre (Cerveza) | `lupulo` | Young Serif · Libre Franklin · IM Fell English SC | `#f2e8d5` · `#241a10` · `#a9640f` + cobre y pizarra | Chocar las jarras: «¡Salud, Carmen!» | **M** |
| 7 | Noche de Estadio (Fútbol) | `estadio` | Barlow Condensed · Barlow · Libre Caslon Text | `#f3f1e7` · `#111d17` · `#1d6a3a` + oro trofeo | ¡Gol! red, focos, confeti del equipo, «1 – 0»; la ola | **L** (bloque `alineacion` y 4.º color) |
| 8 | Línea de Meta (Runners) | `meta` | Archivo Expanded · Albert Sans · Chivo Mono | `#f5f5f1` · `#14161a` · `#e3492b` + oro medalla | La cinta se rompe y cae la medalla | **M** |
| 9 | Riviera (Coches y lujo) | `riviera` | Bodoni Moda · Hanken Grotesk · Tenor Sans | `#f3ece1` · `#1b1815` · `#1f3b5c` + cromo y champán | Girar la llave: las agujas barren | **M** |

**Base común (antes del primero): S–M.** Incluye `HeroVideo`, `BotonPlay`, `useCuenta`, `FechaQuieta`, `tramo.css`, `useTramo` y `gesto.ts`, los 9 ornamentos, las entradas del catálogo y la derivación de `--acento2` y `--brillo`.

### Orden recomendado por demanda en España
Es criterio de oficio, no hay datos de ventas (igual que en `data/plantillas.ts`: «no hay datos»). Se valida antes de construir (ver abajo).

1. **Noche de Estadio (fútbol).** Es la afición transversal del país, en todas las edades y regiones, y la que más se comparte en grupos de WhatsApp: el «¡gol!» al confirmar es un vídeo que se reenvía solo. Esfuerzo L, pero es la apuesta más segura.
2. **Pase VIP (festival).** Habla al núcleo de edad de quien se casa (28–38 años), con una cultura de festivales de verano muy viva. Además vale para cualquier «boda-fiesta» de verano sin ser de nicho.
3. **Luna de Bachata.** España tiene una de las escenas de bachata más grandes del mundo: escuelas en cada ciudad, congresos y la comunidad latinoamericana. Es un hueco que conviene comprobar con `docs/12-competencia-espana-y-bodas.md`.
4. **Neón de Medianoche (reggaeton).** Las parejas más jóvenes y la comunidad latina. Es el **más barato de construir (S)**: una victoria rápida para la galería.
5. **Riviera (lujo).** Poco volumen y ticket alto. Es el escaparate de marca para el plan superior y para alianzas con alquiladores de clásicos y hoteles de costa.
6. **Son de Fuego (salsa).** Comparte motor con Bachata (`tematicas/baile/`): hacerla justo después cuesta la mitad.
7. **Lúpulo y Cobre (cerveza).** El nicho artesano crece, con bodas en fábricas y naves.
8. **Línea de Meta (runners).** El auge del running popular, pero es un nicho.
9. **Cara A (rock).** Un nicho fiel, de más edad. Sale bien y se diferencia mucho, pero la demanda es la menor.

**Plan de entrega en tres oleadas:**
1. Base común, **Estadio**, **Neón** y **Festival**.
2. **Bachata**, **Fuego** y **Riviera**.
3. **Lúpulo**, **Meta** y **Vinilo**.

**Antes de construir la oleada 2,** conviene poner en `/plantillas` (F3) un chip «Próximamente» con «Me interesa» en las seis restantes y medir los toques durante 4–6 semanas. Si los números lo piden, se cambia el orden.

---

## Anexo A. Cómo se calcularon las ratios
Las funciones son las de `src/plantillas/color.ts`: `contraste()` (luminancia relativa de WCAG 2.x), `acentoLegible()` (mezcla el acento con la tinta en pasos del 4 % hasta llegar a 4,5:1) y `sobreAcento()` (negro `#111` o blanco). El hondo se calcula con la misma lógica que `tonosDerivados()` de `tokens.ts`: se busca un 7:1. El guion de comprobación se ejecutó con `node --experimental-strip-types` contra una copia de `color.ts`.

**Hallazgos del cálculo, ya corregidos en las tablas:**
- **Acentos que no llegan a 4,5:1 como texto:** el rojo de Vinilo (3,42), el ámbar de Lúpulo (3,83) y el naranja de Meta (3,66). Se mantienen como superficie y el sistema los corrige como texto: `#ce5b53`, `#94580f` y `#c24128`, con 4,74, 4,72 y 4,71.
- **Textos sobre el botón que no llegaban a AA**, sustituidos:
  - Meta «Verde pista» `#0f8a6a`: 4,37 → `#0d7a5e`, 5,30.
  - Vinilo «Whisky» `#a3713c`: 4,48 → `#b07d45`, 5,27.
  - Fuego «Mango» `#c4561d`: 4,47 → descartado; ahora es «Rosa caribe» `#a8326e`, 6,28.
- **Variantes oscuras dentro de plantillas claras:** se descartaron dos (Fuego «Brasa nocturna» y Lúpulo «Pizarra»), porque `compatible()` de `tokens.ts` exige el mismo modo que la plantilla y el probador las rechazaría.
- **Velo del vídeo:** con 0,55 de opacidad, el blanco sobre un fotograma blanco da 4,27 (no pasa). Con 0,62 da **5,66**: ese es el valor común.

## Anexo B. Cambios por propietario (para el brief de implementación)
| Propietario (docs/11) | Cambio |
|---|---|
| **F1** | `PlantillaId` con 9 ids nuevos; `Ornamento` con 9 nuevos; `Tema.acento2?` y `Tema.brillo?`; el bloque `alineacion` en `Bloque`; extraer `useCuenta` de `CuentaAtras.tsx` sin cambiar su salida; el evento `invitoo:rsvp` en `Rsvp.tsx`; `POR_PLANTILLA` en `movimiento.ts`; y el motor de partículas expuesto para el confeti, la espuma y las chispas |
| **F2** | Las 9 plantillas (`<id>.tsx` y `<id>.css`), `src/plantillas/tematicas/**`, las entradas de `data/plantillas.ts`, `index.ts`, `GENERICA` en `tokens.ts`, `Tono` con `"pizarra"`, los 9 ornamentos en `ornamentos.tsx` y la lista negra de marcas en `herramientas/revisar.mjs` |
| **G3** | Las paletas curadas de las 9 en `lib/color/paletas.ts`; el cuarto selector (acento2) para las plantillas con `colores: 4`; y la regla de intercambio cuando el color del equipo es claro |
| **F3** | Los chips «Música y noche» y «Pasiones» en `/plantillas`, y el «Próximamente · Me interesa» |
| **F4** | El editor de «Vuestro once» (alineación) en Diseño, solo para Estadio |
| **Producción** | 9 másteres de vídeo (IA o rodaje), 9 pósteres AVIF y 7 sonidos de foley propios; los revisa una persona fotograma a fotograma para descartar logos |

**Comprobaciones antes de dar por buena cada plantilla** (las de docs/11):
- `qa/v3/<agente>/solapes.mjs` en 360×740, 390×844 y 430×932: ni el «Play», ni las islas táctiles, ni el botón de música se solapan con texto.
- Una captura con reduced-motion: todo visible y en su estado final.
- Una captura sin JS: la fecha en lugar de la cuenta atrás, y todo el contenido.
- Un contraste por variante con `revisar.mjs`.
- Lighthouse en móvil: LCP ≤ 2,5 s con el póster, CLS 0 y ningún vídeo descargado antes de salir la apertura.

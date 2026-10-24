# Invitoo — Diez estilos temáticos: época, elegancia y naturaleza

> Encargo: `docs/16-encargo-estilos-tematicos.txt` (bloques «Época, Elegancia y Románticos» y «Viajes, Naturaleza y Entornos»). Octubre de 2026.
> Escrito por la dirección de arte, con tres agentes trabajando a la vez: **UI/UX móvil**, **animación e interacción** y **estructura frontend**.
> Reglas que se cumplen en todo el documento: las «Reglas innegociables» de `docs/11` (primero el móvil, nada se solapa, AA, reduced-motion, sin scroll-jacking) y la dirección «Amor y elegancia» de `docs/09`.
> Las ratios de contraste salen de un cálculo real con la fórmula WCAG 2.x (luminancia relativa sRGB): es el mismo cálculo que hace `src/plantillas/color.ts`. Las comprobaciones de «velo» suponen el peor caso: un píxel blanco puro del vídeo bajo el texto.

---

## 0. Lo común a los diez estilos

Lo que se explica aquí no se repite después. Cada estilo solo añade lo suyo.

### 0.1 Seis reglas de dirección (el filtro para cualquier efecto)

1. **El primer segundo es el póster, no el vídeo.** El LCP es una imagen AVIF de 720×1280 que llega en el HTML. El vídeo entra después con un fundido de 900 ms, sin que nada salte.
2. **El texto no se mueve mientras se lee.** Todo revelado ligado al scroll termina antes de `cover 40%`, es decir, antes de que el bloque llegue al centro de la pantalla. Ningún texto se desvanece al salir por arriba.
3. **Una sola escena fijada por invitación** (`position: sticky` dentro de un contenedor de 150–170 svh). Es la del momento wow. La velocidad del scroll es siempre la nativa.
4. **El tema está en los materiales, no en los cliparts.** Un reloj de bolsillo bien dibujado vale más que diez iconos de sombreros de copa.
5. **Legible para alguien de 70 años:**
   - cuerpo de 18 px (`1.125rem`) con interlineado 1,7;
   - cifras de 36 px como mínimo;
   - etiquetas de 17 px, nunca en versalitas de menos de 16 px;
   - la tinta sobre el papel siempre por encima de 10:1 (AAA sobrado).
6. **Las variantes de color se derivan de tres tokens** (papel, tinta y acento): `acento2` se calcula con `color-mix()` y el metal es un material fijo de la plantilla. Así el probador de colores en vivo (G3) mueve toda la paleta sin colar un texto sin AA.

### 0.2 Cambios de datos y tipos (una vez para los diez)

**`app/src/lib/tipos.ts`** (F2 + F1)
```ts
export type PlantillaId =
  | "carta" | "sobre" | "floracion" | "mar" | "velo" | "constelacion" | "tinta" | "registro" | "azulejo"
  // 16a · época y naturaleza
  | "regencia" | "aire" | "cuento" | "blason" | "memorias"
  | "pasaporte" | "orilla" | "pinar" | "orbita" | "brazada";

export type Ornamento =
  | "lacre" | "rama" | "ola" | "filete" | "estrella" | "punto" | "regla" | "cenefa"
  | "camafeo" | "destello" | "escudo" | "encaje" | "matasellos" | "orbita" | "corchera";

// La portada admite el vídeo propio de la pareja (va en el jsonb: sin migración).
| { t: "portada"; frase: string; foto?: string; variante?: "centro" | "bajo" | "partida";
    video?: { vertical: string; poster: string; horizontal?: string } }

// Movimiento: qué pasa al tocar (también en el jsonb del tema). `petalosAlTocar`
// sigue valiendo: equivale a toque: "petalos".
export type Toque = "ninguno" | "petalos" | "hada" | "ondas" | "estrella" | "burbujas" | "hojas" | "sello";
// Movimiento["particulas"] suma "burbujas" | "hojas".
```

**`app/src/data/plantillas.ts`.** Cada estilo nuevo entra en `BASE` con dos campos nuevos y opcionales:
```ts
export type Plantilla = {
  // …lo de siempre…
  /** El vídeo temático de la casa: se usa si la pareja no sube el suyo. */
  hero?: { vertical: string; horizontal?: string; poster: string; posicion: string };
  /** Material fijo de la plantilla (oro, plata, cobre…). Solo filetes y adornos: nunca texto sobre el papel. */
  metal?: string;
};
// Y el valor nuevo de `aperturaComponente`: "hero" → sin capa de apertura; el HeroVideo ES la apertura.
aperturaComponente: "registro" | "azulejo" | "hero" | null;
```
Con `aperturaComponente: "hero"`, `Apertura.tsx` devuelve `null`. No se encadenan dos vídeos. El saludo al invitado («Para Carmen», leído de `?n=`) pasa al rótulo del hero, con el mismo `SaludoApertura`.

**`app/src/plantillas/tokens.ts`.** Hay que sumar las familias nuevas a `GENERICA`, para que el fallback tenga sentido:
```ts
"Bodoni Moda": "Didot, Georgia, serif", Spectral: "Georgia, serif", Newsreader: "Georgia, serif",
"Hanken Grotesk": "ui-sans-serif, system-ui, sans-serif", "IM Fell English": "Georgia, serif",
Alegreya: "Georgia, serif", "Cinzel Decorative": "Trajan Pro, Georgia, serif", "Crimson Pro": "Georgia, serif",
"Libre Caslon Display": "Georgia, serif", "Courier Prime": "Courier New, monospace",
"DM Serif Display": "Georgia, serif", "IBM Plex Sans": "ui-sans-serif, system-ui, sans-serif",
Bellefair: "Georgia, serif", "Nunito Sans": "ui-sans-serif, system-ui, sans-serif",
"Young Serif": "Georgia, serif", Karla: "ui-sans-serif, system-ui, sans-serif",
"Josefin Sans": "Futura, ui-sans-serif, sans-serif", Sora: "ui-sans-serif, system-ui, sans-serif",
Archivo: "Arial Narrow, ui-sans-serif, sans-serif", Lexend: "ui-sans-serif, system-ui, sans-serif",
```

**`app/src/plantillas/comun.tsx`.** Una sección pseudo nueva, `"cuandoDonde"`, como ya lo es `"respiro"`. Así el guion separa «cuándo y dónde» (la primera parada, `ComoLlegar` y `Calendario`) de «programa» (todas las paradas), y la cuenta atrás cabe entre las dos:
```ts
export type Seccion = Exclude<Bloque["t"], "portada"> | "respiro" | "cuandoDonde";
// OpcionesSecciones.itinerario admite "solo-programa": el Itinerario sin ComoLlegar ni Calendario
// (los pinta ya «cuandoDonde»).
```
El orden tipo de los diez estilos (cada uno lo ajusta):
```ts
orden: ["capitulos", "historia", "respiro", "cuandoDonde", "cuentaAtras", "itinerario",
        "dressCode", "alojamiento", "regalos", "rsvp", "galeria", "playlist", "notas",
        "album", "hashtag", "muro"],
```

**`app/src/lib/movimiento.ts`.** Una entrada por estilo en `POR_PLANTILLA`, en `ALIAS` si hiciera falta, y `toque` en `BASE` (`"ninguno"`) y en `limpiarMovimiento`. Las partículas nuevas `burbujas` y `hojas` van en `PARTICULAS` y `NOMBRES`.

### 0.3 Archivos por estilo (el patrón de Carta)

```
app/src/plantillas/<id>.tsx            maqueta: fuentes, Portada, piezas propias, Despedida
app/src/plantillas/fuentes/<id>.ts     next/font sin precarga (display, texto, manuscrita → --f-manuscrita)
app/src/plantillas/temas/<id>.css      materiales, escena wow, scroll del tema (@supports + reduced-motion)
app/src/plantillas/temas/<Id>Cuenta.tsx  la cuenta atrás del tema ("use client")
public/temas/<id>/hero-v.mp4 · hero-v.av1.mp4 · hero-h.mp4 · poster.avif · texturas *.avif|*.svg
```
Después se registra en `plantillas/index.ts` (en `PROPIAS` y en `FUENTES`) y se añade un ornamento en `ornamentos.tsx`.

### 0.4 `HeroVideo`: el componente compartido

Es un componente de servidor. Solo hidrata el reproductor, que es una isla de unos 1,2 KB.

```tsx
// app/src/components/hero/HeroVideo.tsx
import ReproductorHero from "./ReproductorHero";

export type FuenteHero = { vertical: string; horizontal?: string; poster: string; posicion?: string };

export default function HeroVideo({
  fuente, titulo, clase = "", marco, children,
}: {
  fuente: FuenteHero;
  /** «Laura y Rubén»: la etiqueta accesible de los botones. */
  titulo: string;
  clase?: string;
  /** Máscara del tema (camafeo, ventanilla, arco…) alrededor del vídeo. */
  marco?: string;
  children: React.ReactNode;
}) {
  const pos = fuente.posicion ?? "50% 38%";
  return (
    <header data-hero className={`hero-video relative isolate overflow-hidden ${clase}`}>
      <div className={`hero-medio absolute inset-0 -z-10 ${marco ?? ""}`}>
        {/* El póster es el LCP: en el HTML, con prioridad y sin esperar a React. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
        <img src={fuente.poster} alt="" fetchPriority="high" decoding="async" width={720} height={1280}
             className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: pos }} />
        <video data-hero-clip muted playsInline loop preload="none" aria-hidden tabIndex={-1}
               poster={fuente.poster} className="hero-clip absolute inset-0 h-full w-full object-cover"
               style={{ objectPosition: pos }}>
          {fuente.horizontal && <source src={fuente.horizontal} media="(min-aspect-ratio: 1/1)" type="video/mp4" />}
          <source src={fuente.vertical.replace(/\.mp4$/, ".av1.mp4")} type='video/mp4; codecs="av01.0.05M.08"' />
          <source src={fuente.vertical} type="video/mp4" />
        </video>
        <div className="hero-velo absolute inset-0" aria-hidden />
      </div>
      <div className="hero-rotulo relative flex min-h-[100svh] flex-col justify-end px-6
                      pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        {children}
      </div>
      <ReproductorHero titulo={titulo} />
    </header>
  );
}
```

```tsx
// app/src/components/hero/ReproductorHero.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Estado = "espera" | "vivo" | "pausado" | "parado";

/**
 * Reproduce el clip solo si se puede y se debe: sin «menos movimiento», sin ahorro
 * de datos, en pantalla y después del LCP. Si el navegador bloquea el autoplay
 * (iOS en modo ahorro), queda el póster y el botón «Play» del tema. Siempre hay
 * pausa: WCAG 2.2.2 (algo que se mueve durante más de 5 s).
 */
export default function ReproductorHero({ titulo }: { titulo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>("espera");
  const quiso = useRef(false); // el invitado pulsó pausa: no reanudar solo

  useEffect(() => {
    const v = ref.current?.closest("[data-hero]")?.querySelector<HTMLVideoElement>("[data-hero-clip]");
    if (!v) return;
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (quieto || ahorro) { setEstado("parado"); return; }
    const vivo = () => { v.dataset.vivo = "1"; setEstado("vivo"); };
    v.addEventListener("playing", vivo);
    const arrancar = () => { v.preload = "auto"; v.play().catch(() => setEstado("parado")); };
    const id = "requestIdleCallback" in window
      ? requestIdleCallback(arrancar, { timeout: 1500 }) : window.setTimeout(arrancar, 800);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) v.pause();
      else if (v.dataset.vivo && !quiso.current) v.play().catch(() => {});
    }, { threshold: 0.15 });
    io.observe(v);
    return () => { io.disconnect(); v.removeEventListener("playing", vivo); cancelIdleCallback?.(id as number); };
  }, []);

  const alternar = () => {
    const v = ref.current?.closest("[data-hero]")?.querySelector<HTMLVideoElement>("[data-hero-clip]");
    if (!v) return;
    if (v.paused) { quiso.current = false; v.preload = "auto"; v.play().then(() => setEstado("vivo")).catch(() => {}); }
    else { quiso.current = true; v.pause(); setEstado("pausado"); }
  };

  const sonando = estado === "vivo";
  return (
    <div ref={ref} className="hero-mando absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-10">
      <button type="button" onClick={alternar} data-estado={estado}
              aria-label={sonando ? `Pausar el vídeo de ${titulo}` : `Reproducir el vídeo de ${titulo}`}
              className="boton-play grid size-14 place-items-center">
        <span aria-hidden className="boton-play-icono" />
      </button>
    </div>
  );
}
```

```css
/* app/src/components/hero/hero.css (lo comparten los diez; cada tema pinta .boton-play) */
.hero-clip { opacity: 0; transition: opacity 900ms var(--ease-carta); }
.hero-clip[data-vivo] { opacity: 1; }
/* Velo: el 70 % de la tinta en el 40 % inferior, que es donde va el rótulo.
   Calculado sobre un píxel blanco del vídeo: ≥ 5,2:1 con texto #fff en los diez temas. */
.hero-velo {
  background: linear-gradient(to top,
    color-mix(in srgb, var(--velo-hero, var(--tinta)) 70%, transparent) 0 40%,
    color-mix(in srgb, var(--velo-hero, var(--tinta)) 22%, transparent) 72%, transparent);
}
.hero-rotulo { color: #fff; text-shadow: 0 1px 18px rgb(0 0 0 / .25); }
.boton-play[data-estado="vivo"] .boton-play-icono { /* dos barras: pausa */ }
@media (prefers-reduced-motion: reduce) { .hero-clip { transition: none; } }
```

**El vídeo, en cifras (vale para los diez):**

| | Temático (de la casa) | De la pareja (lo transcodificamos nosotros) |
|---|---|---|
| Formato | 720×1280, 9:16; H.264 High, CRF 27, 24 fps, sin pista de audio; y en paralelo AV1 (`.av1.mp4`) | igual |
| Duración | bucle perfecto de 8 s | 6–12 s (lo recortamos) |
| Peso máximo | **1,8 MB** en H.264 y **1,1 MB** en AV1 (en la línea de los másters actuales, de 1,0–1,8 MB) | **2,5 MB** en H.264 |
| Póster | AVIF de 720×1280, **≤ 70 KB**: el primer fotograma, para que el fundido no salte | igual |
| Horizontal (opcional) | 1600×900, ≤ 2,4 MB, solo desde `min-aspect-ratio: 1/1` | si existe |
| Cuándo no carga | `prefers-reduced-motion`, `saveData`, autoplay bloqueado o sin JS → póster y botón «Play» | igual |

**Encuadre en móvil 9:16:**
- las caras, en el tercio superior (`posicion: "50% 30%"`);
- el rótulo, en el 40 % inferior, encima del velo;
- el botón «Play/Pausa», abajo a la derecha, con 56 px de área y fuera de la caja del rótulo (el rótulo deja 5,5 rem libres abajo).

**La música:**
- es otro botón, el de siempre (`BotonSonido`), y no comparte esquina con el de vídeo: va arriba a la derecha;
- el vídeo nunca tiene sonido.

### 0.5 La cuenta atrás: el hook y la base compartida

`CuentaAtras.tsx` ya hace bien lo difícil:
- el servidor pinta la fecha (nunca «0 días»);
- el lector de pantalla oye una frase y no cuatro números;
- el día late una vez.

Esa lógica se saca a un hook y cada tema solo dibuja su reloj.

```ts
// app/src/lib/cuenta-atras.ts
"use client";
import { useSyncExternalStore } from "react";

// UN solo intervalo para toda la página, aunque haya dos relojes (el del hero y el de la sección).
const subs = new Set<() => void>();
let id = 0;
function suscribir(f: () => void) {
  subs.add(f);
  if (!id) id = window.setInterval(() => subs.forEach((g) => g()), 1000);
  return () => { subs.delete(f); if (!subs.size) { window.clearInterval(id); id = 0; } };
}

export type Cuenta = { ms: number; total: number; d: number; h: number; m: number; s: number; fin: boolean };

/** `paso = 60` con «menos movimiento»: se actualiza cada minuto y no hay segundero. */
export function useCuentaAtras(hasta: string, paso: 1 | 60 = 1): Cuenta | null {
  const seg = useSyncExternalStore(
    suscribir,
    () => { const s = Math.floor(Date.now() / 1000); return paso === 60 ? s - (s % 60) : s; },
    () => null,
  );
  const fin = new Date(hasta).getTime();
  if (seg === null || !Number.isFinite(fin)) return null;
  const ms = Math.max(0, fin - seg * 1000);
  const total = Math.floor(ms / 1000); // acumulado: las agujas nunca dan media vuelta hacia atrás
  return { ms, total, d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24,
           m: Math.floor(ms / 6e4) % 60, s: total % 60, fin: ms === 0 };
}

const RM = "(prefers-reduced-motion: reduce)";
export function useMenosMovimiento() {
  return useSyncExternalStore(
    (f) => { const q = matchMedia(RM); q.addEventListener("change", f); return () => q.removeEventListener("change", f); },
    () => matchMedia(RM).matches,
    () => true, // en el servidor, quieto
  );
}
```

`components/bloques/cuenta/base.tsx` (sacado de `CuentaAtras.tsx` tal cual) contiene:
- `<FechaQuieta hasta fin? />`: el SSR, el «Hoy nos casamos» y el «Ya nos casamos»;
- `<FraseCuenta d hasta />`: el `sr-only` «Faltan 120 días para el sábado…».

Cada `<Tema>Cuenta.tsx` empieza igual:
```tsx
const quieto = useMenosMovimiento();
const c = useCuentaAtras(hasta, quieto ? 60 : 1);
if (!c || c.fin) return <FechaQuieta hasta={hasta} fin={c?.fin} />;
```
El dibujo lleva `aria-hidden`. La frase se anuncia una vez y las cifras cambian con la clase `cifra-funde`, que ya existe. Con «menos movimiento» desaparecen el segundero y los giros, y lo que queda se actualiza cada minuto.

### 0.6 El scroll: CSS primero, un solo hook de reserva

El estándar de la casa es lo que ya hace `vida.css`: `animation-timeline: view()` dentro de `@supports`, y un estado final visible si no hay soporte. Para que una escena funcione también en Firefox (sin scroll-driven animations estables), todos los temas usan **una variable, `--avance`, que va de 0 a 1**. La mueve el CSS donde hay soporte y un `IntersectionObserver` donde no lo hay. Sin JS vale 1: la escena se ve terminada.

```css
/* app/src/components/hero/hero.css, bloque «avance» */
@property --avance { syntax: "<number>"; inherits: true; initial-value: 1; }
@keyframes avance { from { --avance: 0; } to { --avance: 1; } }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-escena] { animation: avance linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
  }
}
@media (prefers-reduced-motion: reduce) { [data-escena] { --avance: 1 !important; } }
```

```ts
// app/src/lib/use-avance-vista.ts — SOLO donde no hay view(): cero coste en Chrome y Safari 26
"use client";
import { useEffect, type RefObject } from "react";
const UMBRALES = Array.from({ length: 21 }, (_, i) => i / 20);

export function useAvanceVista(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || CSS.supports("animation-timeline: view()")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let max = 0; // monotónico: lo que ya se reveló no se vuelve a esconder
    const io = new IntersectionObserver(([e]) => {
      max = Math.max(max, Math.min(1, e.intersectionRatio / 0.6));
      el.style.setProperty("--avance", max.toFixed(2));
    }, { threshold: UMBRALES });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
```
Para usarlo en escenas sin componente de cliente, basta con una isla mínima, `<Avance />`, que pinta un `<span hidden>` y llama al hook con su `parentElement`.

Tres límites:
- el hook sirve para escenas de una pantalla de alto como mucho (para las más altas, se observa un centinela de 1 px);
- se anima una propiedad registrada (`--avance`), que corre en el hilo principal, así que se limita a una o dos escenas por pantalla;
- el resto de efectos son `transform`, `opacity` y `clip-path` en keyframes propios.

**Pausar el movimiento (WCAG 2.2.2).** Los bucles infinitos (luciérnagas, planetas, cáusticas) se paran con `[data-mov-pausa] .bucle { animation-play-state: paused }`. El atributo lo pone el mismo botón de pausa del hero: si pausas el vídeo, se para todo lo decorativo.

**GSAP:** ninguno de los diez lo necesita. Todo cabe en CSS, que suma 0 KB al bundle. Si algún día una escena pide un *morph* de trazados SVG, se carga solo en esa plantilla con `import()`.

### 0.7 Qué pasa al tocar (`toque`)

Se amplía `CapaInteraccion` (`flores/capa.ts`): el `pointerdown` que hoy suelta pétalos se convierte en un repartidor por tema. Hay una regla para todos: **nunca encima de un control** y nunca más de un efecto cada 350 ms.
```ts
// dentro de montar(op) en flores/capa.ts
const CONTROLES = "a,button,input,textarea,select,label,summary,[role=button],[data-sin-toque]";
let ultimo = 0;
on(document, "pointerdown", (e: PointerEvent) => {
  if (quieto || op.toque === "ninguno") return;
  if ((e.target as Element | null)?.closest(CONTROLES)) return;
  if (e.timeStamp - ultimo < 350) return;
  ultimo = e.timeStamp;
  efectoDeToque(op.toque, e.clientX, e.clientY); // pétalos/hojas/burbujas → motor.ts; ondas/estrella/sello → DOM efímero
});
```
`ondas`, `estrella` y `sello` son un `<span>` fijo con `pointer-events: none` que se borra en `animationend`. Duran como mucho 900 ms y no tapan nunca un control, porque no nacen sobre ellos. Con «menos movimiento» no hay ningún efecto de toque.

---

# ÉPOCA, ELEGANCIA Y ROMÁNTICOS

## 1. Alta Sociedad (Bridgerton, Regencia) · id `regencia`

### 1.1 Concepto y dirección de arte

**Nombre de catálogo:** **Alta Sociedad**. Etiqueta: «Romántica de época». Para: boda en palacio, jardín histórico o finca con escalinata; parejas que quieren romanticismo floral sin caer en lo cursi. *Cubre el hueco «Romántica floral» de `docs/12 §4` con el `Florecer` de F1.*

| Token | Hex | Uso | Contraste con el papel |
|---|---|---|---|
| papel | `#F7F1EC` | marfil rosado | — |
| tinta | `#2B2340` | tinta violeta de pluma | **13,23:1** (AAA) |
| acento | `#8A4566` | malva glicinia: botones y un acento por pantalla | **6,00:1** (AA); botón con texto #fff: **6,72:1** |
| acento2 | `#9CB4CC` | azul Wedgwood: cintas, camafeos y fondos de banda | 1,91:1 → **solo decorativo** |
| metal | `#B8975A` | oro: filetes de 1 px y el bisel del reloj | 2,46:1 sobre el papel → decorativo; 5,37:1 sobre la tinta, así que vale como texto en las secciones `hondo` |
| velo del hero | tinta al 70 % | — | texto #fff sobre el peor píxel: **5,58:1** |

Derivado en CSS: `--acento2: color-mix(in oklch, var(--acento) 30%, #9cb4cc)`. Así se mueve con el probador.

**Tipografía (Google Fonts):**
- display: **Bodoni Moda** 400, 500 y 500 cursiva, con el eje `opsz` alto; nombres en cursiva a `clamp(3.2rem, 14vw, 5.6rem)`;
- texto: **Spectral** 400, 400 cursiva y 500 a 18 px, con interlineado 1,7;
- manuscrita: **Pinyon Script** 400 (es la de `FirmaManuscrita`, ya cargada: no suma ni un byte), solo a partir de 28 px.

**Mood:**
> Una tarde de temporada en Londres: carta perfumada, guantes y una orquesta de cuerda a lo lejos.
> Pastel empolvado, nunca chicle; el oro es una línea, no una superficie.
> Flores de verdad (glicinia, peonía, rosa inglesa) que se abren al pasar.

**Texturas y materiales:**
- papel de algodón con barbas (borde *deckle* con una máscara SVG);
- lacre malva con relieve (degradado radial y una sombra interior);
- cinta de raso Wedgwood;
- camafeo con las iniciales en perfil blanco;
- guirnaldas de grabado calcográfico (líneas de 0,75 px);
- abanico plisado.

**Qué pedir a la pareja:**
- **Foto:** retrato vertical en una escalinata, un jardín formal o un salón con molduras, a media tarde y con luz lateral, en plano americano.
- **Vídeo:** de 8 a 10 s, caminando del brazo hacia cámara o bajando una escalera, con la cámara fija o un travelling muy lento. Nada de cámara al hombro.

### 1.2 Hero con vídeo

- **Integración:** el vídeo arranca **dentro de un camafeo ovalado**, con `clip-path: ellipse()` y un marco de oro de 1 px y bisel. Debajo del óvalo, el rótulo:
  - «Querida sociedad:», en Pinyon a 30 px;
  - los nombres en Bodoni cursiva;
  - la fecha en Spectral versalita a 17 px.
- **Al hacer scroll,** el camafeo se abre hasta la pantalla completa: es el momento wow, en 1.6.
- **Encuadre:** `posicion: "50% 28%"`. Las caras quedan dentro del óvalo, en el 30–55 % de la altura.
- **Velo:** el normal (tinta al 70 % abajo). Dentro del óvalo, solo un 10 %, para que el vídeo respire.
- **Botón «Play»:** un **lacre malva** de 56 px con una «▶» en bajorrelieve (sombra interior). En pausa son dos barras grabadas. Va abajo a la derecha, fuera del óvalo.
- **Fallback:** el póster AVIF dentro del mismo camafeo. Sin JS, el camafeo se ve quieto y completo.
- **Peso:** 1,8 MB en H.264 y 1,1 MB en AV1; el póster, 60 KB.
- **Prompt del vídeo temático** (Veo, Kling o Higgsfield):
  > *Slow dolly through a Regency English garden at golden hour: wisteria arches, marble fountain, soft pastel haze and a few drifting petals; painterly film look, shallow depth of field.*
  > *9:16 vertical, seamless 8-second loop, gentle forward camera drift, no people, no text, no logos.*

### 1.3 Cuenta atrás: «El reloj de bolsillo»

Un reloj de bolsillo de esfera esmaltada (SVG, unos 2 KB) con números romanos y una ventanilla de fecha que muestra **los días que faltan**. Las tres agujas marcan las horas, los minutos y los segundos **que quedan**. Debajo, un «carnet de baile» con las cuatro cifras en Bodoni.

El segundero **gira hacia atrás**, porque es tiempo que se acaba, y avanza con un tic de 420 ms con la curva `--ease-sello`, que tiene un 3 % de rebote: el pulso de una maquinaria. A medianoche la ventanilla del día late (`dia-late`, que ya existe).

```tsx
// app/src/plantillas/temas/RegenciaCuenta.tsx
"use client";
import { useCuentaAtras, useMenosMovimiento } from "@/lib/cuenta-atras";
import { FechaQuieta, FraseCuenta } from "@/components/bloques/cuenta/base";

const ROMANOS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export default function RegenciaCuenta({ hasta }: { hasta: string }) {
  const quieto = useMenosMovimiento();
  const c = useCuentaAtras(hasta, quieto ? 60 : 1);
  if (!c || c.fin) return <FechaQuieta hasta={hasta} fin={c?.fin} />;
  const min = Math.floor(c.total / 60);
  return (
    <section className="px-6 py-20 text-center">
      <p className="text-[1.0625rem] italic">Para el gran baile quedan</p>
      <FraseCuenta d={c.d} hasta={hasta} />
      <svg viewBox="0 0 200 232" aria-hidden className="reloj mx-auto mt-8 w-[min(76vw,19rem)]">
        <circle cx="100" cy="16" r="9" className="reloj-anilla" />
        <circle cx="100" cy="128" r="98" className="reloj-caja" />
        <circle cx="100" cy="128" r="88" className="reloj-esfera" />
        {ROMANOS.map((n, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          return <text key={n} x={100 + 71 * Math.cos(a)} y={133 + 71 * Math.sin(a)} className="reloj-num">{n}</text>;
        })}
        <rect x="82" y="152" width="36" height="20" rx="2" className="reloj-ventana" />
        <text key={c.d} x="100" y="167" className="reloj-dia dia-late">{c.d}</text>
        <path d="M100 128 L100 86" className="aguja aguja-h" style={{ rotate: `${(min / 60) * 30}deg` }} />
        <path d="M100 128 L100 62" className="aguja aguja-m" style={{ rotate: `${min * 6}deg` }} />
        {!quieto && <path d="M100 140 L100 54" className="aguja aguja-s" style={{ rotate: `${c.total * 6}deg` }} />}
        <circle cx="100" cy="128" r="3.5" className="reloj-eje" />
      </svg>
      <dl aria-hidden className="carnet mx-auto mt-8 grid max-w-[22rem] grid-cols-4 gap-2">
        {([["días", c.d], ["horas", c.h], ["min", c.m], ["seg", quieto ? "—" : c.s]] as const).map(([k, v]) => (
          <div key={k}>
            <dd className="display text-[2.25rem] tabular-nums"><span key={v} className="cifra-funde inline-block">{v}</span></dd>
            <dt className="text-[1.0625rem]">{k}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
```
```css
/* temas/regencia.css */
.reloj .aguja { transform-box: view-box; transform-origin: 100px 128px; stroke: var(--tinta); stroke-linecap: round; }
.reloj .aguja-h { stroke-width: 4; } .reloj .aguja-m { stroke-width: 2.5; }
.reloj .aguja-s { stroke: var(--acento); stroke-width: 1; transition: rotate 420ms var(--ease-sello); }
.reloj-caja { fill: none; stroke: var(--metal); stroke-width: 3; }
.reloj-esfera { fill: color-mix(in srgb, var(--papel) 92%, #fff); stroke: var(--metal); stroke-width: .75; }
.reloj-num { font: 500 13px var(--display); text-anchor: middle; fill: var(--tinta); }
.reloj-dia { font: 600 13px var(--texto); text-anchor: middle; fill: var(--acento-texto); }
@media (prefers-reduced-motion: reduce) { .reloj .aguja-s { transition: none; } }
```

### 1.4 Guion de scroll

| # | Tramo | Qué pasa en pantalla | Técnica | Rango o duración | Con reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | Una sola vez, al cargar, el rótulo se escribe: «Querida sociedad:» se traza en 1,2 s y los nombres se enfocan letra a letra. Al bajar, **el camafeo se abre** hasta la pantalla completa y dos ramas de glicinia (`Florecer variante="rosa"` en malva) crecen desde las esquinas de abajo | `Enfoca al="carga"`, `FirmaManuscrita`; escena fijada de 160 svh con `view-timeline: --hero`; `clip-path: ellipse()` | carga 0–2,2 s; scroll `contain 0%` → `contain 100%` (60 svh) | Camafeo abierto al 60 %, ramas abiertas, sin trazo |
| 2 | Historia | **«La Gaceta de Sociedad»:** la historia contada como una columna de cotilleo de 1813, con capitular, filetes dobles y «Se rumorea que…». Cada capítulo entra como un recorte de periódico que se posa, con una leve rotación de −1,5° a 0 | `[data-escena]` + `--avance`: `rotate`, `translateY` y `opacity` | `entry 0%` → `cover 35%` por capítulo | Recortes rectos y visibles |
| 3 | Respiro | Una foto a sangre dentro de un marco dorado ovalado, con parallax lento | `.respiro-foto` (vida.css) | `cover 0–100%` | Quieta |
| 4 | Cuándo y dónde | Una **tarjeta de baile** con cordón: la fecha en Bodoni grande y el lugar. Al llegar, el cordón de raso se anuda (trazo SVG de 0,9 s) | `stroke-dashoffset` con `view()` | `entry 10%` → `cover 30%` | Cordón anudado |
| 5 | Cuenta atrás | El reloj de bolsillo baja colgado de su cadena (`translateY` −40 px → 0) y se balancea una vez (de 3° a 0°) | `[data-escena]`; el balanceo, con keyframes ligados al `--avance` | `entry 0%` → `cover 30%` | Reloj quieto; se actualiza cada minuto |
| 6 | Programa | Las paradas como **orden de baile:** «I. Ceremonia · 18:00», «II. Cóctel…». Cada línea se dibuja con un filete de oro que crece de izquierda a derecha | `scaleX` del filete con `view()`, `transform-origin: left` | escalonado de 6 % de `cover` por línea | Filetes completos |
| 7 | Dress code | **El abanico:** un abanico plegado que se despliega con el scroll; cada varilla es un color sugerido de `dressCode.paleta` | 7 varillas con `rotate` en función de `--avance` (de 0 a ±62°) | `entry 20%` → `cover 40%` | Abanico abierto |
| 8 | Alojamiento | Tarjetas de visita con esquinas redondeadas en un carrusel horizontal con scroll-snap; la tarjeta centrada se eleva | `view(inline)` (vida.css `.carril`) | por tarjeta, al entrar en el carril | Tarjetas planas |
| 9 | Regalos | Un sobre lacrado con «Ver datos». Al tocarlo, el lacre se parte (el `--ease-sello` que ya existe) y salen el IBAN, «Copiar» y «Bizum» | `<details>` nativo + CSS en `[open]` | 600 ms al tocar | Se abre sin animación |
| 10 | RSVP | Una sección `hondo` (tinta violeta) con el formulario en papel. Al confirmar: un **sello malva estampado**, vibración de 12 ms y «Os esperamos, Carmen», con unos pocos pétalos de glicinia | `Rsvp.tsx` (F1), el sello de `docs/09` | 900 ms | Sello sin rebote, sin pétalos |
| 11 | Cierre | «Con cariño, Laura y Rubén» se escribe a mano en Pinyon, y una peonía se abre debajo | `FirmaManuscrita`, `Florecer variante="peonia"` | al entrar | Firma y flor quietas |

### 1.5 Estructura de código

```tsx
// app/src/plantillas/regencia.tsx
import HeroVideo from "@/components/hero/HeroVideo";
import { Florecer } from "@/components/flores";
import { obtenerPlantilla } from "@/data/plantillas";
import { Despedida, Secciones, Y, type Props } from "./comun";
import { datosPortada } from "./datos-portada";
import { regenciaDisplay, regenciaTexto } from "./fuentes/regencia";
import Lienzo from "./Lienzo";
import RegenciaCuenta from "./temas/RegenciaCuenta";
import { Abanico, Gaceta, TarjetaBaile } from "./temas/regencia-piezas";
import "./temas/regencia.css";

export const fuentes = `${regenciaDisplay.variable} ${regenciaTexto.variable}`;

function Portada(props: Props) {
  const d = datosPortada(props);
  const p = obtenerPlantilla("regencia");
  const fuente = props.b("portada")?.video ?? p.hero!;
  return (
    <div className="regencia-escena" data-escena-hero>
      <div className="sticky top-0">
        <HeroVideo fuente={fuente} titulo={`${d.a} y ${d.b}`} marco="regencia-camafeo">
          <p className="manuscrita text-[1.875rem]">Querida sociedad:</p>
          <h1 className="display vt-nombres mt-2 italic leading-[1.02]" style={{ fontSize: d.tamNombres(3.2, 14, 0.55, 5.6) }}>
            {d.a} <Y /> {d.b}
          </h1>
          <p className="mt-4 text-[1.0625rem] tracking-[0.12em] first-letter:uppercase">{d.fechaLarga} · {d.lugar}</p>
        </HeroVideo>
      </div>
      <Florecer variante="rosa" lado="izquierda" tono="var(--acento)" alCargar className="regencia-glicinia" />
    </div>
  );
}

export default function Regencia(props: Props) {
  const x = props.b;
  return (
    <Lienzo inv={props.inv} variante={props.variante} fuentes={fuentes}>
      <Portada {...props} />
      <Secciones
        {...props}
        opciones={{
          itinerario: "solo-programa",
          tonos: { cuentaAtras: "velo", rsvp: "hondo" },
          piezas: {
            capitulos: x("capitulos") && <Gaceta {...x("capitulos")!} />,
            cuandoDonde: <TarjetaBaile inv={props.inv} parada={x("itinerario")?.paradas[0]} />,
            cuentaAtras: x("cuentaAtras") && <RegenciaCuenta hasta={props.inv.pareja.fecha} />,
            dressCode: x("dressCode") && <Abanico {...x("dressCode")!} />,
          },
        }}
      />
      <Despedida inv={props.inv} ornamento="camafeo" flor={<Florecer variante="peonia" tamano={120} />} />
    </Lienzo>
  );
}
```
```css
/* temas/regencia.css · el camafeo que se abre (escena fijada de 160 svh, scroll nativo) */
.regencia-escena { height: 160svh; view-timeline: --hero block; }
.regencia-camafeo { clip-path: ellipse(calc(36% + var(--avance, 0) * 44%) calc(26% + var(--avance, 0) * 54%) at 50% 40%); }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .regencia-camafeo { animation: avance linear both; animation-timeline: --hero; animation-range: contain 0% contain 100%; }
  }
}
@media (prefers-reduced-motion: reduce) { .regencia-escena { height: auto; } .regencia-camafeo { --avance: .6; } }
/* El abanico: cada varilla gira según el avance. --i va de -3 a 3. */
.abanico-varilla { transform-origin: 50% 100%; rotate: calc(var(--i) * 18deg * var(--avance, 1)); }
```
*Aquí `--avance` empieza en 0 a propósito (el camafeo cerrado es el estado de diseño). Sin JS ni soporte, el `@property` da 1 y el camafeo se ve abierto, que también es un estado completo.*

### 1.6 Momento wow e interacción táctil

- **El wow, «El camafeo se abre»:** el vídeo de los novios, enmarcado en un óvalo de oro como un retrato de 1813, se expande con el pulgar hasta llenar la pantalla. Es el primer gesto del invitado, y el resultado es el vídeo a sangre.
- **Al tocar, el abanico:** en el dress code, al tocar una varilla, el abanico se cierra y vuelve a abrirse con ese color al frente, y aparece su nombre («Malva empolvado») en un rótulo de 17 px.
- **En el resto de la página** (`toque: "petalos"`), cada toque suelta 5 pétalos de glicinia del motor de siempre.

### 1.7 Variantes de color (todas claras: `modo: "claro"`)

| Variante | Tinta / papel / acento | Tinta-papel | Acento-papel | Botón |
|---|---|---|---|---|
| **Glicinia** | `#2B2340` / `#F7F1EC` / `#8A4566` | 13,23 | 6,00 | 6,72 (#fff) |
| **Wedgwood** | `#1E2A3A` / `#F2F4F6` / `#3E5F82` | 13,16 | 6,02 | 6,64 |
| **Melocotón** | `#3A2320` / `#FBF1EA` / `#A04A3A` | 13,09 | 5,34 | 5,94 |

Metal fijo: oro `#B8975A`. Las paletas libres del probador mantienen la misma deriva de `acento2`.

---

## 2. Aire (Elegancia pura, minimalista) · id `aire`

### 2.1 Concepto y dirección de arte

**Nombre de catálogo:** **Aire**. Etiqueta: «Elegante mínima».
- **Para:** boda de etiqueta sobria, urbana o de bodega de diseño; parejas a las que les sobra todo.
- **Diferencia con Tinta y con Velo:**
  - Tinta es blanco y negro, gota de tinta y seis secciones. `docs/12` avisa de que «el minimalismo en B/N casi no se vende».
  - Aire es **marfil y oro**, el catálogo entero y el hilo de oro como hilo conductor.
  - **Propuesta:** Aire puede *absorber* Tinta como alias si se decide retirarla (`ALIAS_PLANTILLAS.tinta = "aire"`, `VARIANTE_DE_ALIAS.tinta = "plata"`).

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#FAF9F6` | marfil casi blanco | — |
| tinta | `#1A1A1A` | — | **16,53:1** |
| acento | `#5C5850` | piedra cálida | **6,72:1**; botón #fff **7,08:1** |
| acento2 | `#D9D4CA` | lino: hilos y paspartú | 1,40:1 → decorativo |
| metal | `#A68A4E` | oro viejo mate | 3,13:1 → vale para texto grande (≥ 24 px, AA-large) y para filetes; nunca para el cuerpo |
| velo del hero | tinta al 70 % | — | **6,39:1** (aquí el rótulo va *debajo* del vídeo, sobre el papel: 16,53:1) |

**Tipografía:**
- display: **Newsreader** 200, 300 y 300 cursiva, con `opsz` 72 (una serif finísima de verdad, que en móvil no se rompe a partir de 28 px);
- texto: **Hanken Grotesk** 400 y 500 a 18 px;
- manuscrita: **Ballet** 400, solo para la «y» y la firma.

**Mood:**
> Una galería un domingo por la mañana: luz blanca, eco y una sola obra.
> El lujo es el espacio; cada vacío lleva un objeto (una línea, una cifra), nunca un hueco.
> Un hilo de oro conduce de arriba abajo, como una costura.

**Texturas:** papel de algodón liso (grano de 0,02), paspartú biselado (un borde interior de 1 px), lino y la línea de oro con `vector-effect: non-scaling-stroke`. Ninguna ilustración.

**Qué pedir:**
- **Foto:** en blanco y negro o en color desaturado, mucho fondo (una pared, el mar, una fachada), la pareja pequeña en el encuadre.
- **Vídeo:** un plano fijo de 8 s: una mano que coge otra, un velo con el viento. Un solo gesto.

### 2.2 Hero con vídeo

- **Integración:** el vídeo va **enmarcado en un paspartú** marfil de 16 px, como una lámina de galería. Ocupa el 72 svh. El rótulo va **debajo del vídeo, sobre el papel**, con la máxima legibilidad y sin depender del velo.
- **Filtro:** `saturate(.75)` para unificar cualquier vídeo de la pareja con la paleta.
- **Encuadre:** `posicion: "50% 40%"`.
- **Velo:** solo un 12 % dentro del marco, para templar los blancos quemados.
- **Rótulo:**
  - los nombres en Newsreader 200 a 15 vw;
  - una línea de oro de 64 px;
  - la fecha en Hanken a 17 px con tracking 0,2 em.
- **Botón «Play»:** un círculo de 56 px con un filete de oro de 1 px y un triángulo de trazo; en pausa, dos líneas. Va en la esquina inferior derecha *dentro* del paspartú.
- **Fallback:** el póster dentro del marco.
- **Peso:** 1,5 MB en H.264 y 0,9 MB en AV1; el póster, 50 KB.
- **Prompt:**
  > *Macro slow-motion of sheer ivory silk drifting in soft morning daylight against a warm white plaster wall, a faint gold light leak; airy, minimal, gallery-like.*
  > *9:16 vertical, seamless 8-second loop, locked-off camera, no people, no text.*

### 2.3 Cuenta atrás: «La línea»

Cuatro cifras en Newsreader 200 a `clamp(2.6rem, 13vw, 4rem)`, separadas por hilos verticales de 1 px. Debajo, **una sola línea de oro que se llena en 60 s** (`scaleX`) y se vacía de golpe al cambiar el minuto (`key` por minuto, para que se monte de nuevo sin transición). Nada más.
```tsx
// temas/AireCuenta.tsx (el cuerpo, tras el arranque común de 0.5)
<div aria-hidden className="mx-auto mt-8 flex max-w-[22rem] justify-between divide-x divide-[var(--acento2)]">
  {([["días", c.d], ["horas", c.h], ["min", c.m], ["seg", quieto ? "—" : c.s]] as const).map(([k, v]) => (
    <div key={k} className="flex-1 px-1">
      <p className="display text-[clamp(2.6rem,13vw,4rem)] font-extralight tabular-nums">
        <span key={v} className="cifra-funde inline-block">{v}</span>
      </p>
      <p className="mt-1 text-[1.0625rem] tracking-[0.2em]">{k}</p>
    </div>
  ))}
</div>
{!quieto && <span key={Math.floor(c.total / 60)} aria-hidden className="aire-linea"
                 style={{ "--llenado": (60 - c.s) / 60 } as React.CSSProperties} />}
```
```css
.aire-linea { display: block; height: 1px; margin: 2rem auto 0; max-width: 22rem; background: var(--metal);
  transform-origin: left; transform: scaleX(var(--llenado)); transition: transform 1s linear; }
```

### 2.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | El paspartú se abre desde una línea horizontal hasta su tamaño (`clip-path: inset`) en 1,1 s; luego los nombres se enfocan. Al bajar, el vídeo se aleja hacia el fondo (`scale` de 1 a 0,94) y el papel lo cubre | carga + `view()` de salida | carga 0–1,8 s; `exit 0%` → `exit 60%` | Marco abierto y quieto |
| 2 | Historia | Párrafos cortos con mucho aire; una cita grande en Newsreader cursiva, con la comilla que crece (`.cita-comilla`, vida.css) | vida.css | `entry 0%` → `cover 35%` | Visible |
| 3 | Respiro | Foto a sangre con el corte de ventana de vida.css (`.respiro-corte`) | `clip-path` | `entry 0%` → `cover 45%` | Foto entera |
| 4 | Cuándo y dónde | Una sola cifra gigante, el día («18»), y debajo el mes y el lugar. La cifra pasa de `font-weight: 200` a 300 al llegar (eje variable): **la tinta se asienta** | `font-variation-settings` animado con `view()` | `entry 10%` → `cover 30%` | Peso 300 |
| 5 | Cuenta atrás | La línea de oro de 2.3 | — | 60 s en bucle | Sin línea |
| 6 | Programa | Una lista con horas en Newsreader y títulos en Hanken; cada fila aparece al cruzarla el hilo de oro | `[data-escena]` | `entry 0%` → `cover 25%` | Visible |
| 7 | Dress code | Tres muestras de color como lienzos pequeños con paspartú, que se posan escalonadas | `translateY` 12 px → 0 | escalonado de 60 ms | Quietas |
| 8 | Alojamiento | Una lista con enlaces sin adorno | revelado del lienzo (`Revelar`) | — | — |
| 9 | Regalos | «Si queréis tener un detalle» y «Ver datos» → `<details>` | — | — | — |
| 10 | RSVP | En la sección `velo` (lino). Al confirmar, el hilo de oro **se anuda** en un lazo bajo el botón (trazo de 1,2 s) | `stroke-dashoffset` | 1,2 s | Lazo dibujado |
| 11 | Cierre | Firma en Ballet y el hilo, que termina en un punto de oro | `FirmaManuscrita` | al entrar | Quieto |

### 2.5 Estructura de código

`aire.tsx` sigue el esqueleto de `regencia.tsx` con `HeroVideo marco="aire-pasepartout"` y `opciones.tonos = { rsvp: "velo" }`, y sin flores. Su pieza propia es el **hilo de oro**, un SVG absoluto en el margen izquierdo del lienzo (x = 10 px: dentro de los 24 px de margen, de modo que no toca nunca el texto):
```tsx
// en aire.tsx, primer hijo del Lienzo
<svg aria-hidden className="aire-hilo pointer-events-none absolute inset-y-0 left-[10px] -z-10 h-full w-3"
     viewBox="0 0 12 1000" preserveAspectRatio="none">
  <path d="M6 0 C 2 180, 10 320, 6 500 S 2 820, 6 1000" pathLength={1} />
</svg>
```
```css
.aire-hilo path { fill: none; stroke: var(--metal); stroke-width: 1; vector-effect: non-scaling-stroke;
  stroke-dasharray: 1; stroke-dashoffset: 0; }
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .aire-hilo path { animation: aire-hilo linear both; animation-timeline: scroll(root block); }
  }
}
@keyframes aire-hilo { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.aire-pasepartout { inset: 16px; outline: 1px solid var(--acento2); outline-offset: 6px; }
```
Por debajo de 380 px de ancho, el hilo baja al 60 % de opacidad, para que no compita con el borde de la pantalla.

### 2.6 Momento wow e interacción táctil

- **El wow, «El hilo de oro»:** una costura de oro de 1 px que se cose sola de la portada al RSVP, al ritmo exacto del pulgar, y que acaba anudándose en un lazo cuando el invitado confirma. Es mínimo y solo se ve si se busca. Es el lujo.
- **Al tocar** (`toque: "sello"`, en oro, muy pequeño): un punto de oro de 6 px que se expande en un anillo de 1 px y desaparece en 600 ms. Lo justo para confirmar el tacto.

### 2.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Oro** | `#1A1A1A` / `#FAF9F6` / `#5C5850` | 16,53 | 6,72 | 7,08 |
| **Plata** | `#18191B` / `#F6F7F7` / `#5A6068` (metal plata `#9EA3A8`) | 16,39 | 5,92 | 6,35 |
| **Champán** | `#1F1B16` / `#F7F3EA` / `#6B5A3A` | 15,46 | 6,02 | 6,67 |

---

## 3. Érase una vez (Cuentos de hadas) · id `cuento`

### 3.1 Concepto y dirección de arte

**Nombre de catálogo:** **Érase una vez**. Etiqueta: «De cuento». Para: parejas que se dicen «mi príncipe» sin ironía, bodas en castillo-hotel o jardín de noche, y bodas con muchos niños.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#F6F1E7` | página de libro antiguo | — |
| tinta | `#2A1B3D` | púrpura noche | **14,10:1** |
| acento | `#5B2A86` | púrpura real | **8,80:1**; botón #fff **9,90:1** |
| acento2 | `#C9B6E4` | lila de polvo de hada | 1,65:1 → decorativo |
| metal | `#C5A253` | oro de canto de libro | 2,15:1 sobre el papel → decorativo; **6,55:1 sobre la tinta**, así que vale como texto en las secciones `hondo` (el capítulo nocturno) |
| velo del hero | tinta al 70 % | — | **5,97:1** |

**Tipografía:**
- display: **IM Fell English** 400 y 400 cursiva (los tipos de Fell, de imprenta del XVII, con su temblor);
- capitulares: **IM Fell English SC**;
- texto: **Alegreya** 400, 400 cursiva y 500 a 18 px (diseñada para leer literatura largo rato);
- manuscrita: **Tangerine** 700, a partir de 36 px.

**Mood:**
> Un libro de tela púrpura con cantos dorados que se abre solo sobre la mesa.
> Polvo de hada, nunca purpurina: puntos de luz lentos y escasos.
> Todo empieza con «Érase una vez» y acaba con «…y fueron felices».

**Texturas:**
- tapa de tela gofrada (patrón SVG de rombos al 4 %) con un hierro dorado;
- papel con *foxing* (manchas de óxido muy suaves, con `radial-gradient`);
- capitulares iluminadas con zarcillos;
- marcapáginas de cinta;
- estrellas de cuatro puntas;
- polvo de hada: `polvo-de-oro` con un tinte lila.

**Qué pedir:**
- **Foto:** un retrato de noche con luces cálidas (guirnaldas, velas) o en un bosque al atardecer.
- **Vídeo:** 8 s, girando juntos despacio, o soplando una vela o una bengala.

### 3.2 Hero con vídeo

- **Integración:** el vídeo se ve **a través de una ventana de torre en arco de medio punto** (`border-radius: 50% 50% 0 0 / 28% 28% 0 0` en `.hero-medio`), centrada y al 82 % del ancho. Alrededor, el papel del libro con la capitular y unos zarcillos.
- **Rótulo** (sobre el papel, debajo del arco):
  - «Érase una vez», en Tangerine a 44 px;
  - los nombres en IM Fell;
  - «…que se casaron el 12 de mayo».
- **Encuadre:** `posicion: "50% 32%"`.
- **Velo:** dentro del arco, un degradado púrpura del 35 % solo abajo.
- **Botón «Play»:** una estrella de cuatro puntas dorada de 56 px de área, con un destello lento (cada 4 s, 600 ms, solo `opacity`).
- **Fallback:** el póster en el arco.
- **Peso:** 1,8 MB y 1,1 MB; el póster, 65 KB.
- **Prompt:**
  > *Enchanted twilight garden of a fairytale castle: floating golden fairy dust and fireflies around an old open storybook glowing softly; purple and gold palette, dreamy cinematic light.*
  > *9:16 vertical, seamless 8-second loop, very slow push-in, no people, no text.*

### 3.3 Cuenta atrás: «El reloj de arena encantado»

Un reloj de arena en SVG. La arena del bulbo de arriba **baja con los segundos** (`scaleY(s/60)`) y la de abajo sube. Un hilo de partículas doradas cae por el cuello: tres círculos con keyframes de 1,2 s. Cada minuto, el reloj **se da la vuelta**: el giro es acumulado, `rotate(minutos × 180°)`, en 700 ms.

Al lado, en un pergamino, la frase completa en Alegreya: «Faltan **120 días, 4 horas y 12 minutos** para que se cumpla el cuento». Las cifras van en IM Fell a 36 px.
```tsx
// temas/CuentoCuenta.tsx (cuerpo)
const vueltas = Math.floor(c.total / 60);
<svg viewBox="0 0 80 120" aria-hidden className="arena mx-auto w-24" style={{ rotate: `${vueltas * 180}deg` }}>
  <path d="M10 6h60M10 114h60M16 6c0 30 22 40 22 54S16 84 16 114M64 6c0 30-22 40-22 54s22 24 22 54" className="arena-vidrio" />
  {/* Al girar 180°, el bulbo «de arriba» es el otro: el índice alterna con la paridad. */}
  <rect x="18" y="10" width="44" height="44" className="arena-sup" style={{ "--q": (vueltas % 2 ? 60 - c.s : c.s) / 60 } as React.CSSProperties} />
  <rect x="18" y="66" width="44" height="44" className="arena-inf" style={{ "--q": (vueltas % 2 ? c.s : 60 - c.s) / 60 } as React.CSSProperties} />
  {!quieto && <g className="arena-hilo bucle"><circle cx="40" cy="58" r=".9" /><circle cx="40" cy="62" r=".9" /><circle cx="40" cy="66" r=".9" /></g>}
</svg>
```
```css
.arena { transition: rotate 700ms var(--ease-velo); transform-origin: 50% 50%; }
.arena-vidrio { fill: none; stroke: var(--metal); stroke-width: 1.2; }
.arena-sup, .arena-inf { fill: var(--metal); transform-box: fill-box; transform: scaleY(var(--q)); transition: transform 1s linear; }
.arena-sup { transform-origin: 50% 100%; clip-path: path("M0 0h44c0 20-16 30-22 44C16 30 0 20 0 0Z"); }
.arena-inf { transform-origin: 50% 100%; clip-path: path("M22 0c6 14 22 24 22 44H0C0 24 16 14 22 0Z"); }
.arena-hilo circle { fill: var(--metal); animation: cae-arena 1.2s linear infinite; }
.arena-hilo circle:nth-child(2) { animation-delay: .4s; } .arena-hilo circle:nth-child(3) { animation-delay: .8s; }
@keyframes cae-arena { from { transform: translateY(-4px); opacity: 0; } 50% { opacity: 1; } to { transform: translateY(6px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .arena { transition: none; } .arena-hilo { display: none; } }
```

### 3.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | La capitular «É» se ilumina: el oro barre la letra en 900 ms, con un `background-clip: text` y un degradado que se desplaza. Arriba, el polvo de hada (`particulas: "polvo-de-oro"` con tinte lila), muy escaso, en los márgenes. Al bajar, el arco se cierra un poco (de `scale` 1 a 0,9) y el papel sube | carga + `view()` de salida | carga 0–1,4 s; `exit 0–60%` | Capitular dorada y quieta |
| 2 | Historia | **«El libro se abre»:** los capítulos son **páginas en un carrusel horizontal** con scroll-snap; cada página que entra **gira sobre su lomo** (`rotateY` −38° → 0). Lleva botones «Página anterior/siguiente» de 48 px y puntos de posición | `view(inline)` + `perspective` | por página, `entry 0–100%` del carril | Páginas planas, mismo carrusel |
| 3 | Respiro | Foto en un marco de espejo oval con un destello que cruza | vida.css + un reflejo de 600 ms | `cover 20–40%` | Sin destello |
| 4 | Cuándo y dónde | Sección `hondo` (noche púrpura): «Y llegó el día…», con la fecha en oro (6,55:1) y unas estrellas que se encienden una a una | `opacity` escalonada con `view()` | `entry 0%` → `cover 35%` | Estrellas encendidas |
| 5 | Cuenta atrás | El reloj de arena baja colgado de una cinta | `[data-escena]` | `entry 0–30%` | Quieto; se actualiza por minutos |
| 6 | Programa | «Capítulo I · La ceremonia», con capitulares en IM Fell SC que entran con tinta (de desenfoque 4 px a 0) | vida.css `vida-titulo` | `entry 5%` → `cover 28%` | Visible |
| 7 | Dress code | «Para el baile, vestid de…» y las muestras como **frascos de poción** con el color dentro, que se llenan de abajo arriba | `clip-path: inset(calc((1 - var(--avance)) * 100%) 0 0)` | `entry 20%` → `cover 40%` | Llenos |
| 8 | Alojamiento | «Posadas del reino» en tarjetas con forma de etiqueta antigua | revelado normal | — | — |
| 9 | Regalos | Un cofre: «Ver datos» → `<details>`. Al abrirse, la tapa gira 12° y sale un destello | `[open]` + `rotate` | 500 ms | Sin giro |
| 10 | RSVP | «¿Vendréis al baile?»: al confirmar, una nube de **polvo de hada** sube desde el botón y queda escrito «Os esperamos, Carmen» con Tangerine | `Rsvp.tsx` + motor | 1,1 s | Solo el texto |
| 11 | Cierre | «…y fueron felices», que se escribe; el libro se cierra (dos tapas que se juntan, `scaleX`) y queda la tapa con el hierro dorado y las iniciales | `[data-escena]` | `entry 10%` → `cover 40%` | Tapa cerrada |

### 3.5 Estructura de código

```tsx
// app/src/plantillas/temas/cuento-piezas.tsx · el libro (servidor; los botones, una isla de cliente)
export function Libro({ capitulos, titulo }: Extract<Bloque, { t: "capitulos" }>) {
  return (
    <section className="py-20" aria-roledescription="libro" aria-label={titulo ?? "Nuestra historia"}>
      <h2 className="display px-6 text-center text-[clamp(2.1rem,9vw,3.1rem)]">{titulo ?? "Nuestra historia"}</h2>
      <ol className="cuento-paginas carril mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[7vw] pb-6">
        {capitulos.map((c, i) => (
          <li key={c.titulo} className="cuento-pagina w-[86%] max-w-[26rem] shrink-0 snap-center"
              aria-label={`Página ${i + 1} de ${capitulos.length}`}>
            <article className="pagina-papel h-full px-6 py-8">
              <p className="capitular display" aria-hidden>{c.titulo.charAt(0)}</p>
              <h3 className="display text-[1.75rem]">{c.titulo}</h3>
              {c.cuando && <p className="mt-1 text-[1.0625rem] italic">{c.cuando}</p>}
              <p className="mt-4 text-[1.125rem] leading-[1.7]">{c.texto}</p>
            </article>
          </li>
        ))}
      </ol>
      <BotonesPagina /> {/* isla: scrollBy({ left: ±ancho, behavior: "smooth" }) — sigue siendo scroll nativo */}
    </section>
  );
}
```
```css
.cuento-paginas { perspective: 1200px; scrollbar-width: none; }
.cuento-pagina { transform-origin: left center; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cuento-pagina > article { animation: pasa-pagina linear both; animation-timeline: view(inline); animation-range: entry 0% entry 100%; }
  }
}
@keyframes pasa-pagina { from { transform: rotateY(-38deg); opacity: .45; } to { transform: none; opacity: 1; } }
.pagina-papel { background: radial-gradient(120% 90% at 0 50%, rgb(0 0 0 / .06), transparent 30%), var(--papel);
  box-shadow: var(--sombra-2, 0 10px 30px -18px rgb(42 27 61 / .45)); border-radius: 2px 10px 10px 2px; }
```
En `cuento.tsx`:
- `Portada` usa `HeroVideo marco="cuento-arco"`;
- `piezas.capitulos = <Libro …/>` y `piezas.cuentaAtras = <CuentoCuenta …/>`;
- `tonos = { cuandoDonde: "hondo", rsvp: "velo" }`;
- movimiento: `{ estilo: "romantico", particulas: "polvo-de-oro", toque: "hada", flores: "ninguna" }`.

### 3.6 Momento wow e interacción táctil

- **El wow, «El libro se abre»:** la historia de la pareja como un libro de verdad. Cada página gira sobre su lomo al deslizar con el pulgar, con las capitulares iluminadas. Una sola fila de páginas, nada que aprender.
- **Al tocar** (`toque: "hada"`): de cada toque fuera de los controles sale una pizca de **polvo de hada**, 6 puntos dorados y lilas que suben en espiral y se apagan en 900 ms (motor de partículas con gravedad negativa).

### 3.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Amatista** | `#2A1B3D` / `#F6F1E7` / `#5B2A86` | 14,10 | 8,80 | 9,90 |
| **Rosa de hada** | `#36182A` / `#FAF0F3` / `#8E2F5E` | 14,25 | 6,92 | 7,73 |
| **Verde encantado** | `#16261F` / `#F2F5EE` / `#2F6650` | 14,33 | 6,08 | 6,69 |

---

## 4. Blasón (Castillos y nobleza) · id `blason`

### 4.1 Concepto y dirección de arte

**Nombre de catálogo:** **Blasón**. Etiqueta: «De castillo».
- **Para:** boda en castillo, parador, monasterio o cortijo señorial.
- **El gancho comercial:** recoge el «Acuarela del lugar», que `docs/12 §4` marca como el gran gancho de IMB y Felizia que a Invitoo **le falta**. Aquí la lámina del castillo se colorea con el scroll.
- **Diferencia con Velo:** Velo es Cinzel, piedra neutra y un tejido. Blasón es Cinzel *Decorative* (otro archivo y otras capitales), pergamino, heráldica y borgoña.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#F2E8D5` | pergamino | — |
| tinta | `#2A1712` | tinta ferrogálica | **14,05:1** |
| acento | `#6B1E2A` | borgoña | **9,37:1**; botón #fff **11,39:1** |
| acento2 | `#2E4A3A` | sinople (verde heráldico) | **8,01:1**: vale también como texto |
| metal | `#A8823A` | oro viejo | 2,92:1 → filetes, coronas y bordes; **4,81:1 sobre la tinta** (AA) en las secciones `hondo` |
| velo del hero | tinta al 70 % | — | **6,32:1** |

**Tipografía:**
- display: **Cinzel Decorative** 400 y 700, solo para los nombres y los H2 de 28 px en adelante (es caja alta: los nombres van a `clamp(2.4rem, 11vw, 4.2rem)` con tracking de 0,04 em);
- texto: **Crimson Pro** 400, 400 cursiva y 500 a 19 px (tiene el ojo pequeño, así que sube un punto);
- acento manuscrito: **UnifrakturCook** 700, *solo* para la letra capitular de cada sección y el «Anno Domini» de la fecha, siempre con `aria-hidden` y con el texto real al lado.

**Mood:**
> Un pergamino sellado que baja por la escalinata de un castillo al amanecer.
> Heráldica de verdad (partido, cuartelado, esmaltes), pero con aire, sin pesadez gótica.
> El oro está gastado; el borgoña, profundo; la piedra, fría.

**Texturas:**
- pergamino (grano 0,06 y un viñeteado cálido en los bordes);
- un **escudo de armas de la pareja**: partido, con un mueble para cada uno (elegido en el panel entre 12: león, flor de lis, torre, estrella, espiga, ancla, llave, roble, ola, corazón, corona, pluma) y las iniciales en el jefe;
- lacre borgoña y estandartes;
- cordón con borla;
- la **lámina del lugar**: dibujo a línea y una capa de acuarela.

**Qué pedir:**
- **Foto:** la pareja frente a una muralla, un arco o un portón de madera; o un retrato formal en un salón con chimenea.
- **Vídeo:** **el lugar**, mejor que la pareja: un dron hacia el castillo o el parador (muchos recintos lo tienen), o la pareja cruzando un patio de armas.
- **La lámina:** una foto frontal del edificio, para ilustrarla. Es un servicio de Estudio (encargo IA + retoque) y un añadido de pago.

### 4.2 Hero con vídeo

- **Integración:** vídeo a sangre del castillo. Encima, colgado del borde de arriba, un **estandarte borgoña** (un `clip-path` en forma de banderola, de 72 % de ancho) con el escudo de la pareja bordado en oro y, debajo, los nombres.
- **El rastrillo:** al hacer scroll, un **rastrillo** de hierro (SVG de barras, sobre el vídeo y a los lados del estandarte) **sube** y se esconde: «se abren las puertas».
- **Encuadre:** `posicion: "50% 55%"`. El edificio queda en el centro-bajo y el cielo deja sitio al estandarte.
- **Velo:** el normal, más una franja superior del 35 % de tinta para el estandarte.
- **Botón «Play»:** un escudo dorado de 56 px con «▶».
- **Fallback:** el póster.
- **Peso:** 1,8 MB y 1,1 MB; el póster, 70 KB.
- **Prompt:**
  > *Aerial drone glide toward a medieval stone castle on a hill at dawn, mist filling the valley, burgundy banners moving gently in the wind, warm low golden light.*
  > *9:16 vertical, seamless 8-second loop, slow steady forward motion, majestic and calm, no people, no text.*

### 4.3 Cuenta atrás: «La proclama»

Un **edicto en pergamino** con lacre: «Por la presente se proclama que faltan…». Debajo, **cuatro escudos** (SVG de 76 px) con la cifra en Cinzel Decorative y la unidad en Crimson debajo.

Los cambios:
- cuando cambia una cifra, su escudo **voltea** (`rotateY` de 90° a 0° en 380 ms, con `key` por valor; solo el de los segundos lo hace cada segundo);
- a medianoche, el de los días voltea y suena «el pregón», un `dia-late`.

```tsx
// temas/BlasonCuenta.tsx (cuerpo)
const ESCUDO = "M4 4h68v34c0 20-16 32-34 38C20 70 4 58 4 38Z";
<div aria-hidden className="mx-auto mt-8 grid max-w-[22rem] grid-cols-4 gap-2">
  {([["días", c.d], ["horas", c.h], ["minutos", c.m], ["segundos", quieto ? "—" : c.s]] as const).map(([k, v]) => (
    <div key={k} className="text-center">
      <svg key={v} viewBox="0 0 76 80" className={`escudo-cifra mx-auto w-full ${k === "días" ? "dia-late" : ""}`}>
        <path d={ESCUDO} className="escudo-campo" />
        <text x="38" y="46" className="escudo-num">{v}</text>
      </svg>
      <p className="mt-2 text-[1.0625rem]">{k}</p>
    </div>
  ))}
</div>
```
```css
.escudo-campo { fill: var(--acento); stroke: var(--metal); stroke-width: 2; }
.escudo-num { font: 700 26px var(--display); fill: #fff; text-anchor: middle; dominant-baseline: middle; } /* #fff sobre borgoña: 11,39:1 */
.escudo-cifra { animation: voltea 380ms var(--ease-velo) both; transform-origin: 50% 50%; }
@keyframes voltea { from { transform: perspective(300px) rotateY(90deg); } }
@media (prefers-reduced-motion: reduce) { .escudo-cifra { animation: none; } }
```

### 4.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | El estandarte **se despliega** de arriba abajo (`clip-path: inset(0 0 100% 0)` → 0) en 900 ms y el escudo se borda: el contorno se traza y los esmaltes se llenan. Al bajar, **el rastrillo sube** | carga + `view-timeline: --hero` | carga 0–1,6 s; `exit 0%` → `exit 55%` | Estandarte desplegado; rastrillo arriba (fuera) |
| 2 | Historia | Un «Cantar»: los capítulos como **estrofas en un códice**, con la capitular en UnifrakturCook dentro de un recuadro de oro, que se iluminan (de `saturate(0)` a 1) al entrar | `[data-escena]` + `filter` | `entry 0%` → `cover 35%` | Iluminadas |
| 3 | Respiro / la lámina | **«El castillo se pinta»:** la lámina del lugar, primero en tinta de línea; al hacer scroll, la acuarela se extiende desde la puerta con un borde orgánico | escena fijada de 150 svh, `clip-path: circle()` y `mask-image` de borde acuarelado | `contain 0%` → `contain 100%` | Lámina coloreada |
| 4 | Cuándo y dónde | Sección `hondo` borgoña: «Anno Domini MMXXVII», en UnifrakturCook decorativo, y la fecha legible en Crimson a 22 px; el lugar, con un mapa de pergamino (imagen estática con un pin de lacre) | vida.css `vida-enfoca` | `cover 18–46%` | Visible |
| 5 | Cuenta atrás | La proclama baja enrollada (`scaleY` de 0,2 a 1, con `transform-origin: top`) y se desenrolla | `[data-escena]` | `entry 0–30%` | Desenrollada |
| 6 | Programa | «Orden de la jornada», con iconos heráldicos (copa, campana, laúd) a un lado y las horas en Cinzel Decorative | revelado | `entry 0–25%` | Visible |
| 7 | Dress code | «Etiqueta de la corte»: los colores como **esmaltes de escudo** (pequeños escudos rellenos) que se pintan uno a uno | `clip-path` vertical | escalonado del 6 % | Pintados |
| 8 | Alojamiento | «Aposentos»: tarjetas con una torre dibujada en la esquina | revelado | — | — |
| 9 | Regalos | Un cofre con cerradura: «Ver datos» → `<details>`; la llave gira 90° | `[open]` | 400 ms | Sin giro |
| 10 | RSVP | «Responded a la corte»: al confirmar, **el lacre borgoña con el escudo** cae sobre el formulario (sello de `docs/09`) y suena una vibración de 12 ms | `Rsvp.tsx` | 900 ms | Sin rebote |
| 11 | Cierre | La firma y, debajo, el escudo completo con la corona; el cordón con borla se mece una vez | `Florecer`-like / `rotate` | al entrar | Quieto |

### 4.5 Estructura de código

```tsx
// temas/blason-piezas.tsx · la lámina que se pinta (servidor)
export function LaminaLugar({ linea, color, lugar }: { linea: string; color: string; lugar: string }) {
  return (
    <section className="blason-lamina" aria-label={`Ilustración de ${lugar}`}>
      <div className="sticky top-0 grid h-[100svh] place-items-center px-4">
        <figure className="relative w-full max-w-[30rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={linea} alt={`${lugar}, dibujado a tinta`} width={900} height={1100} loading="lazy" className="w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={color} alt="" width={900} height={1100} loading="lazy" className="blason-acuarela absolute inset-0 w-full" />
          <figcaption className="mt-4 text-center text-[1.0625rem] italic">{lugar}</figcaption>
        </figure>
      </div>
    </section>
  );
}
```
```css
.blason-lamina { height: 150svh; view-timeline: --lamina block; }
.blason-acuarela {
  -webkit-mask: url(/temas/blason/borde-acuarela.svg) center / cover; mask: url(/temas/blason/borde-acuarela.svg) center / cover;
  clip-path: circle(calc(var(--avance, 1) * 110%) at 50% 78%);
}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .blason-acuarela { animation: avance linear both; animation-timeline: --lamina; animation-range: contain 0% contain 90%; }
  }
}
@media (prefers-reduced-motion: reduce) { .blason-lamina { height: auto; } .blason-lamina > div { position: static; height: auto; } }
/* El rastrillo de la portada */
.blason-rastrillo { animation: rastrillo-sube linear both; animation-timeline: --hero; animation-range: exit 0% exit 55%; }
@keyframes rastrillo-sube { to { transform: translateY(-105%); } }
```
Lo demás:
- **El escudo:** `<Escudo izquierda="leon" derecha="espiga" iniciales="LR" />` es un SVG de servidor que combina 12 muebles predibujados (unos 0,6 KB cada uno), y la pareja lo elige en el panel. Se guarda en `tema.escudo` (jsonb).
- **Si no hay lámina:** se usa la foto del lugar con `filter: grayscale(1) contrast(1.2)` como «línea», la foto normal como «color», y la misma máscara.
- **Movimiento:** `{ estilo: "cinematografico", entrada: "fundido-desenfoque", flores: "ninguna", toque: "sello" }`.

### 4.6 Momento wow e interacción táctil

- **El wow, «El castillo se pinta»:** la lámina del recinto donde se casan, primero a tinta, se colorea en acuarela desde la puerta mientras el invitado baja. Es *su* castillo: el gancho que vende IMB, aquí vivo.
- **Al tocar el escudo:** gira (`rotateY` 180°) y muestra el **reverso con el lema** de la pareja («Divisa: Siempre juntos, nunca quietos»). Fuera del escudo (`toque: "sello"`), cada toque deja un sello de lacre borgoña de 28 px que se desvanece en 900 ms.

### 4.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Borgoña** | `#2A1712` / `#F2E8D5` / `#6B1E2A` | 14,05 | 9,37 | 11,39 |
| **Azur** | `#14182A` / `#EFE9DB` / `#23386B` | 14,53 | 9,38 | 11,35 |
| **Sinople** | `#17221A` / `#F0EAD9` / `#2E4A3A` | 13,65 | 8,10 | 9,74 |

---

## 5. Memorias (Historia romántica, vintage) · id `memorias`

### 5.1 Concepto y dirección de arte

**Nombre de catálogo:** **Memorias**. Etiqueta: «Vintage».
- **Para:** parejas de muchos años (y muchas cartas), bodas en masía, casa de campo o casino antiguo, y segundas bodas.
- **El id:** se llama `memorias` y no `cartas`, para que no se confunda con «Carta», la insignia.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#EFE4CF` | papel envejecido | — |
| tinta | `#3B2A1E` | sepia de cinta de máquina | **10,85:1** |
| acento | `#8B3F31` | rojo óxido de sello | **5,84:1**; botón #fff **7,36:1** |
| acento2 | `#C8B79A` | encaje crudo | 1,56:1 → decorativo |
| metal | `#9C7A4B` | bronce gastado | 3,15:1 → solo grande (≥ 24 px) o adorno; 3,45:1 sobre la tinta → solo adorno |
| velo del hero | tinta al 70 % | — | **5,24:1** |

**Tipografía:**
- display: **Libre Caslon Display** 400 (los nombres, a `clamp(3rem, 13vw, 5rem)`);
- texto: **Courier Prime** 400 y 700 a **18 px**, interlineado 1,75, medida máxima 34 ch. Es la de máquina de escribir diseñada para leer en pantalla, y es la que da el carácter; con este tamaño y este interlineado se lee bien a los 70;
- manuscrita: **Homemade Apple** 400, solo en frases cortas («con amor», notas al margen) a partir de 24 px, y **nunca con información**: la hora o la dirección van siempre en Courier.

**Mood:**
> Una caja de lata con cartas atadas con cordel, encontrada en el desván de los abuelos.
> Sepia, encaje, fotos instantáneas con esquineros y una máquina de escribir que todavía funciona.
> Lo que se dijeron, contado como lo habrían escrito entonces.

**Texturas:**
- papel envejecido: grano 0,07, un viñeteado irregular y dos manchas de café (`radial-gradient` al 5 %);
- **encaje** en los bordes de sección (una máscara SVG de blonda repetida en x);
- fotos instantáneas con esquineros y washi tape;
- cordel de cáñamo, sobre de correo aéreo, sello postal desgastado;
- tecleado con la tinta irregular (`text-shadow` de 0,3 px y opacidad variable por carácter, solo en titulares).

**Qué pedir:**
- **Fotos:** antiguas de verdad (de pequeños, la primera foto juntos o la de los abuelos) y un par de fotos de hoy con película o con filtro cálido.
- **Vídeo:** clips de móvil viejos de la pareja (los convertimos al aspecto Super 8) o 8 s nuevos con luz de tarde.

### 5.2 Hero con vídeo

- **Integración:** el vídeo se ve **como una proyección de Super 8**:
  - tiene las esquinas redondeadas del fotograma;
  - lleva perforaciones decorativas en el lateral izquierdo (un SVG `aria-hidden` en el margen de 16 px);
  - el filtro es `sepia(.35) contrast(1.05) saturate(.85)`;
  - encima va un grano animado en *steps* (un AVIF de 256 px que se desplaza por `translate` en 6 pasos cada 0,5 s).
- **Sin parpadeo de luz,** para no arriesgar con la fotosensibilidad: el grano no cambia el brillo.
- **Rótulo:** «Querida familia, queridos amigos:» se **teclea** en Courier (de 28 ms a 40 ms por carácter, una sola vez y con la frase completa en el `sr-only`). Después llegan los nombres en Caslon.
- **Encuadre:** `posicion: "50% 35%"`.
- **Velo:** el normal, más el viñeteado.
- **Botón «Play»:** «▶ Proyectar» en Courier, en una etiqueta de papel con washi tape, de 56 px de alto; en pausa, «❚❚ Pausar».
- **Fallback:** el póster con el mismo filtro aplicado a la imagen.
- **Peso:** 1,6 MB y 1,0 MB; el póster, 60 KB.
- **Prompt:**
  > *Vintage Super 8 home-movie feel: an old typewriter, love letters tied with twine and dried roses on a wooden desk, warm sepia afternoon sun through lace curtains, soft film grain.*
  > *9:16 vertical, seamless 8-second loop, gentle handheld drift, no people, no readable text, no flicker.*

### 5.3 Cuenta atrás: «La máquina de escribir»

Una hoja metida en el rodillo de una máquina (un SVG de la parte de arriba de la máquina y la hoja en HTML) con un formulario a máquina:

> Faltan **120** días, **04** horas, **12** minutos y **33** segundos.

Cada cifra que cambia **se teclea**: entra de arriba con un golpe de tipo (`translateY` −3 px → 1 px → 0) y la tinta se oscurece (de opacidad 0,4 a 1). El carro de la máquina se desplaza 2 px a cada cambio de segundo, que es el único movimiento continuo.
```tsx
// temas/MemoriasCuenta.tsx (cuerpo)
const dos = (n: number) => String(n).padStart(2, "0");
const Tecla = ({ v }: { v: string | number }) => <b key={String(v)} className="tecla inline-block tabular-nums">{v}</b>;
<div className="hoja mx-auto mt-6 max-w-[24rem] px-6 py-8 text-left" aria-hidden>
  <p className="text-[1.25rem] leading-[1.9]">
    Faltan <Tecla v={c.d} /> días, <Tecla v={dos(c.h)} /> horas, <Tecla v={dos(c.m)} /> minutos
    {!quieto && <> y <Tecla v={dos(c.s)} /> segundos</>}.
  </p>
</div>
```
```css
.hoja { background: var(--papel); box-shadow: 0 18px 30px -24px rgb(59 42 30 / .6); border-top: 6px solid color-mix(in srgb, var(--tinta) 80%, transparent); }
.tecla { font-weight: 700; font-size: 1.5rem; color: var(--acento-texto); animation: tecla 260ms steps(3, end) both; }
@keyframes tecla { 0% { transform: translateY(-3px); opacity: .4; } 66% { transform: translateY(1px); opacity: .85; } }
@media (prefers-reduced-motion: reduce) { .tecla { animation: none; } }
```

### 5.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | El saludo se teclea, una vez y en 1,8 s como mucho; la foto instantánea de la pareja cae girada −4° y se posa. Al bajar, la proyección se oscurece un 30 % (se apagan las luces) y la hoja sube | carga + `view()` de salida, solo `opacity` | carga 0–2,2 s; `exit 0–60%` | Todo escrito y quieto |
| 2 | Historia | **«La carta que se escribe»:** cada párrafo se revela **línea a línea, de arriba abajo, como tinta que baja** (máscara con un degradado vertical que avanza con el scroll). El texto completo está en el DOM desde el principio | `mask-image` + `@property --tinta-hasta` + `view()` | `entry 10%` → `cover 38%` por párrafo | Texto entero |
| 3 | Respiro | **Álbum de fotos:** 3 o 4 instantáneas en un carrusel horizontal, cada una con un ángulo y su esquinero; la centrada se endereza | `view(inline)` → `rotate` a 0 | por tarjeta | Rectas |
| 4 | Cuándo y dónde | Un **sobre de correo aéreo** con matasellos: la fecha en el matasellos (Courier, en círculo) y el lugar como dirección del sobre, a máquina. El matasellos se estampa al llegar | `scale` 1,2 → 1 y `opacity` | `entry 15%` → `cover 30%` | Estampado |
| 5 | Cuenta atrás | La máquina de 5.3 | — | — | Por minutos |
| 6 | Programa | Una **ficha de cartulina** pautada, con las horas tecleadas y unas marcas de lápiz rojo junto a lo importante | revelado escalonado | `entry 0–25%` | Visible |
| 7 | Dress code | Muestras de tela recortadas con tijeras de zigzag (`clip-path` dentado), sujetas con un alfiler | `[data-escena]`: `rotate` −6° → 0 | `entry 20–40%` | Rectas |
| 8 | Alojamiento | Etiquetas de llavero de hotel antiguo, con el nombre y el teléfono | revelado | — | — |
| 9 | Regalos | Un sobre cerrado con cordel: «Ver datos» → `<details>`; el cordel se desata (trazo de 600 ms) | `[open]` | 600 ms | Sin trazo |
| 10 | RSVP | «Contestad a vuelta de correo»: al confirmar, el **sello postal** con las iniciales se pega en la esquina del formulario (cae girando 8° y se posa) y queda «Os esperamos, Carmen» en Homemade Apple, con el mismo texto en Courier debajo | `Rsvp.tsx` | 900 ms | Sin giro |
| 11 | Cierre | «Con todo nuestro cariño»: la firma, y debajo un lazo de encaje | `FirmaManuscrita` con `--f-manuscrita` = Homemade Apple | al entrar | Quieto |

### 5.5 Estructura de código

```css
/* temas/memorias.css · la tinta baja línea a línea (el texto siempre está, solo se enmascara) */
@property --tinta-hasta { syntax: "<percentage>"; inherits: false; initial-value: 100%; }
.memorias-carta p {
  -webkit-mask-image: linear-gradient(to bottom, #000 var(--tinta-hasta), transparent calc(var(--tinta-hasta) + 1.75em));
  mask-image: linear-gradient(to bottom, #000 var(--tinta-hasta), transparent calc(var(--tinta-hasta) + 1.75em));
}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .memorias-carta p { animation: tinta-baja linear both; animation-timeline: view(); animation-range: entry 10% cover 38%; }
  }
}
@keyframes tinta-baja { from { --tinta-hasta: -10%; } to { --tinta-hasta: 100%; } }
/* Sin soporte: --tinta-hasta = 100 % → párrafo entero. En Firefox, el párrafo entra con el revelado del lienzo. */
.memorias-super8 video, .memorias-super8 img { filter: sepia(.35) contrast(1.05) saturate(.85); }
.memorias-grano { background: url(/temas/memorias/grano.avif) 0 0 / 256px; animation: grano 3s steps(6) infinite; opacity: .18; }
@keyframes grano { to { transform: translate(-48px, 32px); } }
@media (prefers-reduced-motion: reduce) { .memorias-grano { animation: none; } }
```
`memorias.tsx`:
- `HeroVideo marco="memorias-super8"` con `<span className="memorias-grano bucle absolute inset-0" />` dentro del marco;
- `piezas: { historia: <CartaQueSeEscribe …/>, cuandoDonde: <SobreAereo …/>, cuentaAtras: <MemoriasCuenta …/> }`;
- `tonos = { cuentaAtras: "velo", rsvp: "velo" }` (aquí no hay `hondo`, que rompería el papel);
- movimiento: `{ estilo: "sereno", entrada: "fundido", particulas: "ninguna", flores: "sutiles", toque: "sello" }`.

### 5.6 Momento wow e interacción táctil

- **El wow, «La carta que se escribe»:** la historia aparece como si alguien la estuviera escribiendo mientras la lees: la tinta baja línea a línea al ritmo del pulgar. Al terminar, el texto queda quieto y entero, para leerlo con calma.
- **Al tocar una instantánea:** se da **la vuelta** (FlipCard, `rotateY` 180° en 500 ms) y en el dorso aparece, a mano, la fecha y una nota de la pareja («Benicàssim, 2009. La primera»). El dorso lleva el mismo texto también en Courier, para que se pueda leer. Las fotos tienen `role="button"`, `aria-pressed` y un área de 48 px como mínimo.

### 5.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Sepia** | `#3B2A1E` / `#EFE4CF` / `#8B3F31` | 10,85 | 5,84 | 7,36 |
| **Rosa seca** | `#3A2427` / `#F3E6E1` / `#8C4556` | 11,78 | 5,55 | 6,77 |
| **Tinta azul** | `#1F2633` / `#EEE8DA` / `#34507A` | 12,43 | 6,68 | 8,16 |

---

# VIAJES, NATURALEZA Y ENTORNOS

## 6. Pasaporte (Viajeros enamorados) · id `pasaporte`

### 6.1 Concepto y dirección de arte

**Nombre de catálogo:** **Pasaporte**. Etiqueta: «Viajera». Para:
- parejas que se conocieron viajando o que viven en ciudades distintas;
- bodas de destino;
- bodas con invitados internacionales, porque se apoya en la variante de idioma.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#F3EADB` | kraft claro, como las páginas del pasaporte | — |
| tinta | `#2B2620` | — | **12,57:1** |
| acento | `#9A4A22` | terracota de tinta de sello | **5,21:1**; botón #fff **6,22:1** |
| acento2 | `#2F5D62` | azul petróleo de mapa | **6,15:1**: vale como texto (enlaces de «Cómo llegar») |
| metal | `#B08D57` | latón de hebilla de maleta | 2,59:1 → decorativo; 4,85:1 sobre la tinta |
| velo del hero | tinta al 70 % | — | **5,61:1** |

**Tipografía:**
- display: **DM Serif Display** 400 y 400 cursiva;
- texto: **IBM Plex Sans** 400 y 500 a 18 px;
- datos de documento: **IBM Plex Mono** 500, para la línea MRZ y los sellos (decorativa, con `aria-hidden`; el dato real va en Plex Sans);
- manuscrita: **Caveat** 500 y 600 (notas en el mapa, «¡aquí nos conocimos!»), a partir de 24 px.

**Mood:**
> La mesa de un aeropuerto antes de embarcar: dos pasaportes, dos billetes, un mapa doblado.
> Tonos tierra y tinta de sello; cada sección es una frontera que se cruza.
> Ilusión de viaje, no de agencia: nada de iconos de avioncitos de stock.

**Texturas:**
- tapa de pasaporte de tela gofrada en el acento, con el escudo dorado sustituido por las iniciales;
- páginas con **guilloché** (un patrón SVG de rosetas de líneas a 0,5 px, al 7 %);
- sellos de entrada con la tinta irregular (SVG con `feTurbulence` + `feDisplacementMap`, **rasterizado una vez a AVIF**: un filtro vivo es caro en el móvil);
- mapa antiguo, etiquetas de equipaje con ojal;
- tarjeta de embarque troquelada (`mask` con un semicírculo a cada lado).

**Qué pedir:**
- **Fotos de sus viajes**, 4–8, en vertical si puede ser.
- **Las ciudades de origen de cada uno** y la ciudad donde se conocieron, para la ruta del mapa.
- **Vídeo:** un clip de viaje (una ventanilla, una playa, una calle) de 8 s.

### 6.2 Hero con vídeo

- **Integración:** el vídeo se ve **a través de una ventanilla de avión**: un rectángulo de esquinas muy redondeadas (`border-radius: 42% / 30%`) con un marco blanco grueso y una persiana que *sube* al cargar (`translateY` −100 %, en 900 ms).
- **El billete:** debajo de la ventanilla, el rótulo es una **tarjeta de embarque**:
  - «PASAJEROS: LAURA & RUBÉN»;
  - «DESTINO: SANTA CRUZ»;
  - «FECHA: 04 JUN 2027»;
  - «PUERTA: SÍ, QUIERO».

  Los datos van en Plex Sans y el adorno, en Plex Mono.
- **Encuadre:** `posicion: "50% 45%"`.
- **Velo:** dentro de la ventanilla, solo un 15 %; el billete va sobre el papel.
- **Botón «Play»:** un botón circular de 56 px con el icono del avión de cabina (el pictograma de «abróchense los cinturones», reinterpretado como ▶).
- **Fallback:** el póster con la persiana subida.
- **Peso:** 1,8 MB y 1,1 MB; el póster, 60 KB.
- **Prompt:**
  > *View from an airplane window above golden clouds at sunrise, the wing tip tilting very slightly, warm earthy tones, soft haze, cinematic travel-film color.*
  > *9:16 vertical, seamless 8-second loop, slow drift, no people, no text, no airline logos.*

### 6.3 Cuenta atrás: «El panel de salidas y el sello del día»

Arriba, un **panel de salidas de paletas** (split-flap):

> `SALIDA · BODA · EMBARQUE EN 120 D 04 H 12 M 33 S`

Cada dígito es una paleta de dos mitades, y la de arriba cae al cambiar (`rotateX`, 300 ms).

Debajo, el **sello del día:** un sello de entrada circular con «FALTAN 120 DÍAS». **Se estampa una vez al día** (al llegar a la página y a medianoche), con el `key` puesto en los días, una caída de `scale` de 1,4 a 1 y la curva `--ease-sello`. Es el «late una vez al día» de `docs/09`.
```tsx
// temas/PasaporteCuenta.tsx (cuerpo)
const Paleta = ({ v }: { v: string }) => (
  <span className="paleta" aria-hidden>
    <span key={`${v}a`} className="paleta-sup">{v}</span>
    <span className="paleta-inf">{v}</span>
  </span>
);
const dig = (n: number, w = 2) => String(n).padStart(w, "0").split("");
<div className="panel-salidas mx-auto mt-6 flex max-w-[24rem] flex-wrap justify-center gap-x-3 gap-y-2" aria-hidden>
  {([[dig(c.d, 3), "D"], [dig(c.h), "H"], [dig(c.m), "M"], ...(quieto ? [] : [[dig(c.s), "S"]])] as [string[], string][]).map(([ds, u]) => (
    <span key={u} className="flex items-end gap-[2px]">{ds.map((x, i) => <Paleta key={i} v={x} />)}<span className="ml-1 text-[1.0625rem]">{u}</span></span>
  ))}
</div>
<svg key={c.d} viewBox="0 0 120 120" aria-hidden className="sello-dia mx-auto mt-8 w-32">
  <circle cx="60" cy="60" r="54" /><circle cx="60" cy="60" r="44" />
  <text x="60" y="56">FALTAN</text><text x="60" y="78" className="sello-num">{c.d} DÍAS</text>
</svg>
```
```css
.paleta { position: relative; display: inline-grid; width: 1.6rem; height: 2.4rem; font: 500 1.75rem/2.4rem var(--f-mono, monospace);
  color: #fff; text-align: center; perspective: 200px; }
.paleta > span { grid-area: 1 / 1; background: var(--tinta); border-radius: 3px; }   /* #fff sobre tinta: 14,99:1 */
.paleta-sup { clip-path: inset(0 0 50% 0); transform-origin: 50% 50%; animation: paleta-cae 300ms var(--ease-velo) both; z-index: 1; }
.paleta-inf { clip-path: inset(50% 0 0 0); }
@keyframes paleta-cae { from { transform: rotateX(90deg); } }
.sello-dia { fill: none; stroke: var(--acento); stroke-width: 2.5; rotate: -8deg; animation: sello-cae 600ms var(--ease-sello) both; }
.sello-dia text { fill: var(--acento-texto); stroke: none; font: 600 12px var(--f-mono, monospace); text-anchor: middle; }
.sello-dia .sello-num { font-size: 15px; }
@keyframes sello-cae { from { transform: scale(1.4); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .paleta-sup, .sello-dia { animation: none; } }
```

### 6.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | La persiana de la ventanilla sube y el billete se imprime: el troquel se dibuja y aparecen los datos. Al bajar, **atravesamos la ventanilla** (el marco crece de `scale` 1 a 1,6 y se desvanece, y el vídeo queda a sangre un instante) | carga + `view-timeline: --hero` | carga 0–1,4 s; `exit 0–60%` | Persiana arriba, ventanilla quieta |
| 2 | Historia | **«La ruta»:** un mapa (SVG de línea de la península o del mundo, según los orígenes) donde **la línea discontinua del vuelo se traza** de la ciudad de ella a la de él, y un avión la recorre. Las notas de Caveat aparecen en cada ciudad: «Laura, Sevilla», «Rubén, Bilbao», «Lisboa, 2019: aquí empezó todo» | escena fijada de 150 svh; `stroke-dashoffset` + `offset-path` con `view-timeline` | `contain 0–100%` | La ruta trazada, el avión en destino |
| 3 | Respiro | **Las páginas del pasaporte:** las fotos de viaje como sellos, en un carrusel con scroll-snap; cada foto entra con su sello estampado encima, en una esquina | `view(inline)` | por tarjeta | Sellos puestos |
| 4 | Cuándo y dónde | «Destino final»: la **etiqueta de equipaje** con la ciudad, la fecha y el lugar, colgada de una cinta de latón, que se balancea una vez (de 4° a 0°) | `[data-escena]` | `entry 10–30%` | Quieta |
| 5 | Cuenta atrás | El panel de salidas y el sello (6.3) | — | — | Por minutos |
| 6 | Programa | «Itinerario de vuelo»: cada parada como una escala, con la hora, una línea vertical discontinua que se dibuja hacia abajo y puntos de escala que se encienden | `scaleY` + `opacity` escalonados | `entry 0–35%` | Línea completa |
| 7 | Dress code | «Equipaje recomendado»: una maleta abierta con las muestras de color como pañuelos doblados | `[data-escena]` (la tapa, de `rotateX` 70° a 0°) | `entry 20–40%` | Abierta |
| 8 | Alojamiento | **Postales** de hotel en un carrusel; cada una lleva su sello y su matasellos con la distancia en km al lugar («a 4 km») | `.carril` | — | — |
| 9 | Regalos | «Fondo para la luna de miel»: una hucha-globo terráqueo; «Ver datos» → `<details>` | `[open]` | 400 ms | — |
| 10 | RSVP | **La tarjeta de embarque:** el formulario es el billete. Al confirmar, el billete **se troquela** (la mitad derecha se separa 8 px y gira 3°) y aparece «EMBARQUE CONFIRMADO · Carmen + 1», con el sello de entrada | `Rsvp.tsx` + CSS | 800 ms | Sin separación |
| 11 | Cierre | «Nos vemos en destino»: la firma, y la tapa del pasaporte que se cierra con las iniciales doradas | `[data-escena]` | `entry 10–40%` | Cerrado |

### 6.5 Estructura de código

```tsx
// temas/pasaporte-piezas.tsx · la ruta (servidor). El sistema de coordenadas es fijo (320×260)
// porque `offset-path: path()` usa px del elemento: la caja mide 20rem y cabe en 360 px con 20 px de margen.
export function Ruta({ desde, hasta, nota }: { desde: string; hasta: string; nota?: string }) {
  const D = "M28 214 C 90 40, 230 30, 292 150";
  return (
    <section className="pasaporte-ruta" aria-label={`De ${desde} a ${hasta}`}>
      <div className="sticky top-0 grid h-[100svh] place-items-center">
        <div className="relative h-[260px] w-[320px]">
          <svg viewBox="0 0 320 260" className="absolute inset-0" aria-hidden>
            <image href="/temas/pasaporte/mapa-linea.svg" width="320" height="260" />
            <path d={D} pathLength={1} className="ruta-trazo" />
            <circle cx="28" cy="214" r="5" /><circle cx="292" cy="150" r="5" />
          </svg>
          <span className="ruta-avion" aria-hidden style={{ offsetPath: `path("${D}")` }}>✈</span>
          <p className="manuscrita absolute left-0 top-[222px] text-[1.5rem]">{desde}</p>
          <p className="manuscrita absolute right-0 top-[160px] text-[1.5rem]">{hasta}</p>
        </div>
        {nota && <p className="mt-6 max-w-[20rem] text-center text-[1.125rem]">{nota}</p>}
      </div>
    </section>
  );
}
```
```css
.pasaporte-ruta { height: 150svh; view-timeline: --ruta block; }
.ruta-trazo { fill: none; stroke: var(--acento2); stroke-width: 2; stroke-dasharray: .012 .012; }
.ruta-avion { position: absolute; left: 0; top: 0; font-size: 22px; color: var(--acento-texto);
  offset-rotate: auto 45deg; offset-distance: calc(var(--avance, 1) * 100%); }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .pasaporte-ruta .ruta-avion, .pasaporte-ruta .ruta-trazo { animation: avance linear both; animation-timeline: --ruta; animation-range: contain 0% contain 85%; }
    .ruta-trazo { mask: linear-gradient(90deg, #000 calc(var(--avance) * 100%), transparent 0); }
  }
}
@media (prefers-reduced-motion: reduce) { .pasaporte-ruta { height: auto; } .pasaporte-ruta > div { position: static; height: auto; padding-block: 5rem; } }
```
*La línea discontinua no se puede trazar con `dashoffset` sin perder el discontinuo, así que se revela con una máscara lineal que avanza con `--avance`. Es una aproximación honesta: en rutas que vuelven sobre sí mismas, se usaría una máscara a lo largo del trazado.*

Datos nuevos (en el jsonb, sin migración):
```ts
{ t: "capitulos", …, ruta?: { desde: string; hasta: string; nota?: string } }
```
Los rellena el panel con tres campos de texto; la posición en el mapa sale de una tabla de unas 60 ciudades (España, Europa y capitales de América Latina).

`pasaporte.tsx`:
- `HeroVideo marco="pasaporte-ventanilla"`, con el `<Billete>` como hijo;
- `piezas: { capitulos: <Ruta …/> + <Capitulos …/>, cuandoDonde: <Etiqueta …/>, cuentaAtras: <PasaporteCuenta …/>, rsvp: <Embarque>{Rsvp}</Embarque> }`;
- `tonos: { programa: "velo" }`;
- movimiento: `{ estilo: "sereno", flores: "ninguna", toque: "sello" }`;
- `--f-mono` sale de `fuentes/pasaporte.ts` (IBM Plex Mono, sin precarga).

### 6.6 Momento wow e interacción táctil

- **El wow, «La ruta de los dos»:** el mapa con el vuelo de una ciudad a otra, trazándose con el pulgar mientras el avión lo recorre y las notas manuscritas aparecen en cada ciudad. Es su historia en geografía, y es lo que hace que un tío del pueblo diga «¡anda, si se conocieron en Lisboa!».
- **Al tocar, «Sellad vuestro pasaporte»:** cada sección tiene una página de pasaporte en blanco en una esquina (de 56 px). Al tocarla, **se estampa su sello** (vibración de 10 ms) y el progreso se guarda en `sessionStorage`. Con todo el recorrido sellado, el billete del RSVP muestra «Pasaporte completo». Es opcional: nunca bloquea nada ni esconde información.

### 6.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Tierra** | `#2B2620` / `#F3EADB` / `#9A4A22` | 12,57 | 5,21 | 6,22 |
| **Océano** | `#1C2629` / `#EEF0EA` / `#2F5D62` | 13,46 | 6,39 | 7,34 |
| **Sabana** | `#2C2716` / `#F4EDD8` / `#7A5F1E` | 12,74 | 5,15 | 6,03 |

---

## 7. Orilla (Playa y mar) · id `orilla`

### 7.1 Concepto y dirección de arte

**Nombre de catálogo:** **Orilla**. Etiqueta: «De playa».
- **Para:** boda en la playa, un chiringuito elegante, una cala o una terraza frente al mar, de día.
- **Diferencia con Mar**, que `docs/12` dice que debe quedarse como «De destino»:

| | Mar | Orilla |
|---|---|---|
| Tipografía | Italiana y Jost | Bellefair, Nunito Sans y Allura |
| Fondo | bruma | arena con acuarela |
| Portada | horizonte | vídeo cenital de olas con borde de ola acuarelada |
| Ornamento | ola de línea | ola acuarelada y conchas |
| Apertura | nubes | el propio vídeo |
| Tono | logística de viaje | sensación de pies en la arena |

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#F7F4EE` | arena blanca | — |
| tinta | `#0F2F3A` | azul de profundidad | **12,86:1** |
| acento | `#0E6973` | turquesa hondo | **5,82:1**; botón #fff **6,39:1** |
| acento2 | `#7FCFCB` | turquesa de agua somera (las acuarelas) | 1,64:1 → decorativo |
| metal | `#B9C4C9` | nácar | 1,62:1 → solo brillo y adorno; 7,93:1 sobre la tinta |
| velo del hero | tinta al 70 % | — | **5,46:1** |

**Tipografía:**
- display: **Bellefair** 400 (una romana fluida y alta, muy legible en grande);
- texto: **Nunito Sans** 400 y 600 a 18 px (redondeada y suave: «fluida» sin perder legibilidad);
- manuscrita: **Allura** 400, a partir de 32 px.

**Mood:**
> Pies descalzos en la orilla a las once de la mañana; la espuma dibuja encaje en la arena.
> Acuarela, sal y lino blanco; el turquesa solo donde hay agua.
> Todo se mueve como el agua: despacio, de lado y volviendo.

**Texturas:**
- acuarela de olas (AVIF pintado con transparencia, menos de 40 KB por banda);
- arena (grano cálido 0,05);
- espuma (una máscara SVG festoneada);
- conchas y estrellas de mar a línea fina de 1 px;
- papel de algodón y cuerda de pita.

**Qué pedir:**
- **Foto:** la pareja de espaldas caminando por la orilla, o un plano cenital tumbados en la arena.
- **Vídeo:** un dron cenital sobre la orilla, o 8 s con los pies y el agua.

### 7.2 Hero con vídeo

- **Integración:** vídeo cenital de olas a sangre, de 88 svh. **El borde inferior del vídeo es una ola acuarelada**: `mask-image` con un SVG festoneado y difuminado, de modo que el vídeo se funde en la arena del papel. El rótulo cabalga ese borde: la parte alta sobre el velo y la fecha ya sobre la arena.
- **Encuadre:** `posicion: "50% 50%"`. Con el plano cenital no hay caras que cortar; si es el vídeo de la pareja, `"50% 35%"`.
- **Velo:** tinta al 70 % abajo, que llega hasta la ola.
- **Botón «Play»:** una caracola (un círculo de 56 px con la espiral a línea) que gira 20° al pulsarla.
- **Fallback:** el póster, con la misma máscara.
- **Peso:** 1,8 MB y 1,1 MB (el agua comprime mal: CRF 28); el póster, 70 KB.
- **Prompt:**
  > *Top-down drone shot of clear turquoise waves gently washing over fine white sand, lacy sea-foam patterns forming and fading, bright soft morning sun, watercolor-like grade.*
  > *9:16 vertical, seamless 8-second loop, locked overhead camera, no people, no text.*

### 7.3 Cuenta atrás: «La marea»

Las cifras están **escritas en la arena**: Bellefair a 40 px, con un `text-shadow` interior sutil de hundido. Por detrás corre **una lámina de agua acuarelada** cuya altura sube con los días: la marea sube a medida que se acerca la boda (`--marea = 1 − días/365`, acotado entre 0,1 y 1). La lámina hace un vaivén horizontal lento, de 8 s, solo con `translateX`.

Cuando cambia el minuto, una ola pequeña cruza bajo las cifras (500 ms).
```tsx
// temas/OrillaCuenta.tsx (cuerpo)
const marea = Math.min(1, Math.max(0.1, 1 - c.d / 365));
<div className="orilla-cuenta relative mx-auto mt-8 max-w-[24rem] overflow-hidden rounded-[28px] px-4 py-10"
     style={{ "--marea": marea } as React.CSSProperties} aria-hidden>
  <span className="orilla-agua bucle" />
  {!quieto && <span key={Math.floor(c.total / 60)} className="orilla-olita" />}
  <div className="relative grid grid-cols-4">
    {([["días", c.d], ["horas", c.h], ["min", c.m], ["seg", quieto ? "—" : c.s]] as const).map(([k, v]) => (
      <div key={k}><p className="display text-[2.5rem] tabular-nums"><span key={v} className="cifra-funde inline-block">{v}</span></p>
        <p className="text-[1.0625rem]">{k}</p></div>
    ))}
  </div>
</div>
```
```css
.orilla-cuenta { background: color-mix(in srgb, var(--papel) 85%, #e9dcc3); }
.orilla-agua { position: absolute; inset: auto -20% 0; height: calc(var(--marea) * 55%);
  background: url(/temas/orilla/agua-acuarela.avif) 0 0 / 50% 100% repeat-x; opacity: .55; animation: vaiven 8s ease-in-out infinite alternate; }
@keyframes vaiven { to { transform: translateX(8%); } }
.orilla-olita { position: absolute; left: -40%; bottom: 30%; width: 40%; height: 10px; border-radius: 50%;
  border-top: 2px solid #fff; animation: olita 500ms var(--ease-carta) forwards; }
@keyframes olita { to { transform: translateX(350%); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .orilla-agua { animation: none; } .orilla-olita { display: none; } }
```
Las cifras van en la tinta sobre arena, a 12,9:1. Donde el agua las cruza (al 55 % de opacidad del turquesa claro), la mezcla (`#B4DED8`) da 9,66:1 con la tinta.

### 7.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | Las olas del vídeo; los nombres se enfocan en Bellefair; dos conchas a línea se dibujan junto a la fecha. Al bajar, la ola de acuarela del borde **se retira hacia arriba**, como la resaca, y descubre la arena | carga + `view()` de salida: la `mask-position` del borde | carga 0–1,8 s; `exit 0–50%` | Quieto |
| 2 | Historia | Los capítulos como **mensajes en una botella**: cada uno entra flotando con un vaivén vertical leve de ±4 px que se detiene al posarse | `[data-escena]` + `translateY` en función de `--avance` | `entry 0–35%` | Quietos |
| 3 | Transición | **«La ola que pasa página»:** una banda de acuarela turquesa de 30 svh cruza la pantalla de derecha a izquierda (`translateX` 60 % → −10 %) y, al pasar, el fondo de la siguiente sección ya es `velo` | `view()` en la banda | `cover 0–100%` | Banda quieta |
| 4 | Cuándo y dónde | El lugar dibujado en la arena: la fecha grande y las coordenadas de la playa en pequeño. Unas huellas de pies descalzos (6 SVG) se marcan una a una hacia el texto | `opacity` escalonada con `view()` | `entry 10%` → `cover 35%` | Huellas puestas |
| 5 | Cuenta atrás | La marea (7.3) | — | — | Por minutos, sin vaivén |
| 6 | Programa | Las paradas como **boyas** en una línea de costa vertical; cada boya «flota» al entrar y se queda quieta | `translateY` 12 px → 0 | escalonado del 6 % | Quietas |
| 7 | Dress code | «Descalzos, de lino»: las muestras como **guijarros pintados** (círculos irregulares) que ruedan 6 px y se paran | `rotate` + `translate` | `entry 20–40%` | Quietos |
| 8 | Alojamiento | Carrusel con scroll-snap de hoteles frente al mar, con fotos y la distancia a pie | `.carril` | — | — |
| 9 | Regalos | Una caja de conchas: «Ver datos» → `<details>` | `[open]` | 400 ms | — |
| 10 | RSVP | Sección `hondo` (azul profundo): al confirmar, **una explosión de espuma**: 12 burbujas blancas que suben y revientan, y «Os esperamos, Carmen» en Allura | motor de partículas (`burbujas`) | 1,1 s | Solo el texto |
| 11 | Cierre | La firma escrita en la arena; una ola final la **moja sin borrarla** (cambia el color a tinta mojada, más oscura) | `color` en `view()` | `cover 30–50%` | Firma quieta |

### 7.5 Estructura de código

```css
/* temas/orilla.css · el borde de ola del hero y la ola que pasa página */
.orilla-borde { -webkit-mask: url(/temas/orilla/borde-ola.svg) bottom / 100% auto no-repeat, linear-gradient(#000, #000) top / 100% calc(100% - 64px) no-repeat;
  mask: url(/temas/orilla/borde-ola.svg) bottom / 100% auto no-repeat, linear-gradient(#000, #000) top / 100% calc(100% - 64px) no-repeat; }
.orilla-pasa { height: 30svh; overflow: hidden; position: relative; }
.orilla-pasa > span { position: absolute; inset: 0 -40%; background: url(/temas/orilla/ola-acuarela.avif) center / contain no-repeat; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .orilla-pasa > span { animation: ola-pasa linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }
  }
}
@keyframes ola-pasa { from { transform: translateX(60%); } to { transform: translateX(-10%); } }
```
`orilla.tsx`:
- `HeroVideo marco="orilla-borde"`;
- la banda de transición, `<div className="orilla-pasa" aria-hidden><span /></div>`, como `piezas.respiro`;
- `tonos: { cuandoDonde: "velo", rsvp: "hondo" }`;
- movimiento: `{ estilo: "sereno", velocidad: .9, particulas: "ninguna", toque: "ondas", flores: "ninguna" }`.

### 7.6 Momento wow e interacción táctil

- **El wow, «La resaca»:** el vídeo de las olas termina en una ola de acuarela que se retira con el pulgar y deja la invitación en la arena. A continuación, la ola que pasa página. El mar está en el gesto del invitado, no en un icono.
- **Al tocar** (`toque: "ondas"`): cada toque fuera de un control dibuja **ondas concéntricas de agua**, dos anillos turquesa de 1,5 px que se abren a 9× y desaparecen en 900 ms.

```css
.toque-onda { position: fixed; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; pointer-events: none;
  border: 1.5px solid color-mix(in srgb, var(--acento) 60%, #fff); animation: onda 900ms var(--ease-carta) forwards; z-index: 40; }
.toque-onda + .toque-onda { animation-delay: 140ms; }
@keyframes onda { from { transform: scale(1); opacity: .9; } to { transform: scale(9); opacity: 0; } }
```

### 7.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Turquesa** | `#0F2F3A` / `#F7F4EE` / `#0E6973` | 12,86 | 5,82 | 6,39 |
| **Coral** | `#3A1F1A` / `#FBF3EE` / `#A6452E` | 13,77 | 5,45 | 5,98 |
| **Atardecer** | `#2E2140` / `#F8F1EE` / `#7A4A8A` | 13,36 | 5,93 | 6,62 |

---

## 8. Bosque Encantado · id `pinar`

### 8.1 Concepto y dirección de arte

**Nombre de catálogo:** **Bosque Encantado**. Etiqueta: «De bosque».
- **Para:** boda en finca entre pinos o robles, en el Pirineo, en Asturias o en una masía con bosque; parejas boho-rústicas.
- **Por qué va el primero:** es el pariente más cercano del estilo más vendido en España («Finca y olivo», `docs/12`), con una lectura más mágica.
- **El id:** es `pinar`, para no chocar con la variante `bosque` de Carta.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#ECE4D3` | kraft claro | — |
| tinta | `#1F2A22` | verde casi negro | **11,76:1** |
| acento | `#2F5D3A` | verde pino | **6,04:1**; botón #fff **7,64:1** |
| acento2 | `#8AA39D` | eucalipto | 2,13:1 → decorativo (las hojas de `Florecer variante="eucalipto"`) |
| metal | `#A07D4A` | cobre | 3,00:1 → adorno y texto grande; 3,91:1 sobre la tinta → solo adorno |
| velo del hero | tinta al 70 % | — | **5,58:1** |

**Tipografía:**
- display: **Young Serif** 400 (una serif cálida, con remates gordos, de cartel de madera tallada);
- texto: **Karla** 400 y 500 a 18 px;
- manuscrita: **Sacramento** 400, a partir de 32 px.

**Mood:**
> Media tarde en un pinar: rayos de sol entre los troncos, olor a resina y luciérnagas cuando oscurece.
> Kraft, madera, yute y eucalipto; verdes profundos con un brillo de cobre.
> Rústico de verdad, no de catálogo: nada de tablas de palé ni de tarros de cristal.

**Texturas:**
- papel kraft (grano 0,07 y fibras con `repeating-linear-gradient` al 3 %);
- **rodaja de tronco** con anillos (SVG de círculos concéntricos irregulares);
- cordel de yute;
- ramas de pino, eucalipto y helecho (`Florecer` + 2 dibujos nuevos en `dibujos.ts`: `pino` y `helecho`);
- niebla (un degradado blanco al 8 % que se desplaza);
- luciérnagas (puntos de luz cálida `#F4E3A1`, solo en las secciones oscuras).

**Qué pedir:**
- **Foto:** la pareja pequeña entre árboles altos, en vertical y a contraluz.
- **Vídeo:** caminando por un sendero de espaldas, o con la luz entre las hojas. 8–10 s.

### 8.2 Hero con vídeo

- **Integración:** vídeo a sangre del bosque. En primer plano, **dos siluetas de helecho** (SVG en `--tinta` al 85 %), una en cada esquina inferior. Ocupan como máximo el 22 % del ancho y nunca entran en la caja del rótulo, que está centrada y con un margen de 24 px.
- **Rótulo:** los nombres en Young Serif y, debajo, «nos casamos en el bosque» en Sacramento.
- **Encuadre:** `posicion: "50% 40%"`.
- **Velo:** tinta verde al 70 % abajo, más una niebla blanca al 6 % que sube despacio (`bucle`).
- **Botón «Play»:** una **rodaja de tronco** de 56 px con anillos de 1 px y «▶» grabado.
- **Fallback:** el póster con los helechos.
- **Peso:** 1,8 MB y 1,1 MB; el póster, 70 KB.
- **Prompt:**
  > *Slow dolly forward through a misty pine and eucalyptus forest at golden hour, sunbeams slicing through the canopy, floating dust and a few fireflies, deep greens with copper light.*
  > *9:16 vertical, seamless 8-second loop, steady gentle motion, enchanted but natural, no people, no text.*

### 8.3 Cuenta atrás: «Los anillos del tronco»

Una rodaja de tronco en SVG (6 anillos irregulares y una grieta), con las cuatro cifras **grabadas a fuego**: Young Serif con un `text-shadow` interior de cobre. Alrededor del borde de la corteza **orbita una luciérnaga**, que da una vuelta por minuto (`rotate(total × 6°)`, acumulado). Cada día nuevo se dibuja un anillo más fino en el centro (`stroke-dashoffset`, 1,2 s): «el árbol crece un anillo cada día que falta menos».
```tsx
// temas/PinarCuenta.tsx (cuerpo)
<div className="relative mx-auto mt-8 aspect-square w-[min(80vw,20rem)]" aria-hidden>
  <svg viewBox="0 0 200 200" className="absolute inset-0">
    {[92, 80, 67, 55, 42, 30].map((r, i) => <circle key={r} cx="100" cy="100" r={r} className="anillo" style={{ "--i": i } as React.CSSProperties} />)}
    <circle key={c.d} cx="100" cy="100" r="18" pathLength={1} className="anillo-nuevo" />
  </svg>
  {!quieto && (
    <span className="absolute inset-0" style={{ rotate: `${c.total * 6}deg`, transition: "rotate 1s linear" }}>
      <span className="luciernaga bucle absolute left-1/2 top-[1%] size-2 -translate-x-1/2 rounded-full" />
    </span>
  )}
  <div className="absolute inset-[22%] grid grid-cols-2 place-items-center gap-1 text-center">
    {([["días", c.d], ["horas", c.h], ["min", c.m], ["seg", quieto ? "—" : c.s]] as const).map(([k, v]) => (
      <div key={k}><p className="pinar-grabado display text-[2.25rem] leading-none tabular-nums"><span key={v} className="cifra-funde inline-block">{v}</span></p>
        <p className="text-[1rem]">{k}</p></div>
    ))}
  </div>
</div>
```
```css
.anillo { fill: none; stroke: color-mix(in srgb, var(--metal) 55%, var(--papel)); stroke-width: calc(1px + var(--i) * .2px); }
.anillo-nuevo { fill: none; stroke: var(--metal); stroke-dasharray: 1; animation: anillo 1.2s var(--ease-carta) both; }
@keyframes anillo { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.pinar-grabado { color: var(--tinta); text-shadow: 0 1px 0 rgb(255 255 255 / .35), 0 -1px 0 color-mix(in srgb, var(--metal) 60%, transparent); }
.luciernaga { background: #f4e3a1; box-shadow: 0 0 10px 3px #f4e3a1aa; animation: brilla 2.4s ease-in-out infinite; }
@keyframes brilla { 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { .anillo-nuevo, .luciernaga { animation: none; } }
```
En la rejilla 2×2 del centro, las etiquetas van a 16 px por espacio. Es la única excepción a la regla de 17 px de este documento, y está compensada porque la frase completa en `sr-only` y las cifras en 36 px se leen sin las etiquetas. Si se prefiere no tener excepciones, las etiquetas se sacan debajo del tronco a 17 px.

### 8.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | Los rayos de luz del vídeo; los nombres se enfocan. Al bajar, **el bosque se abre**: los helechos se apartan hacia los lados (`translateX` ±60 % y `rotate` ±8°) y la cámara «entra» (el vídeo, de `scale` 1 a 1,08) | `view-timeline: --hero`, `exit` | `exit 0–70%` | Helechos quietos en su sitio |
| 2 | Historia | Los capítulos están **colgados de una rama** con cordel de yute: cada tarjeta kraft baja 24 px y se balancea una vez (±2°) | `[data-escena]` | `entry 0–35%` | Colgadas y quietas |
| 3 | Respiro | Una foto a sangre con **parallax de tres capas**: la foto, una rama de pino delante (más rápida) y la niebla (más lenta) | `translateY` con velocidades distintas en `view()` | `cover 0–100%` | Capas quietas |
| 4 | Cuándo y dónde | Sección `hondo` (verde noche): «Al caer la tarde…», con la fecha y el lugar. **Se encienden las luciérnagas**: 14 puntos de luz cálida que derivan despacio por los márgenes, nunca sobre el texto (`inset-inline` de 0 a 12 %) | CSS `bucle` + `opacity` con `view()` | encendido `entry 10–40%`; deriva de 6–9 s | Puntos fijos y tenues |
| 5 | Cuenta atrás | La rodaja de tronco (8.3) | — | — | Por minutos |
| 6 | Programa | Un **sendero:** una línea de puntos que serpentea y baja; en cada parada, un **cartel de madera** con la hora tallada | trazo `stroke-dashoffset` + revelado | `entry 0–40%` | Sendero dibujado |
| 7 | Dress code | «Tonos de bosque»: las muestras de color como **hojas** (eucalipto, pino, helecho, roble) que caen girando y se posan sobre el kraft | `rotate` y `translate` en función de `--avance` | `entry 20–45%` | Posadas |
| 8 | Alojamiento | Cabañas y casas rurales en un carrusel; cada tarjeta, con una ramita de eucalipto (`Florecer`) que florece | `.carril` + `Florecer` | — | Flor abierta |
| 9 | Regalos | Una caja de madera con el cierre de cordel: «Ver datos» → `<details>` | `[open]` | 400 ms | — |
| 10 | RSVP | Sobre el kraft: al confirmar, caen **unas hojas** (partículas `hojas`, 10) y el sello de cera verde con una rama | `Rsvp.tsx` + motor | 1,2 s | Solo el sello |
| 11 | Cierre | La firma en Sacramento; una guirnalda de eucalipto (`Guirnalda`) se dibuja alrededor | `Florecer` | al entrar | Quieta |

### 8.5 Estructura de código

```css
/* temas/pinar.css · el bosque se abre (helechos de primer plano, solo transform) */
[data-plantilla="pinar"] .hero-video { view-timeline: --hero block; }
.pinar-helecho { position: absolute; bottom: 0; width: min(22vw, 7rem); pointer-events: none; z-index: 1; }
.pinar-helecho[data-lado="izq"] { left: -2%; } .pinar-helecho[data-lado="der"] { right: -2%; scale: -1 1; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .pinar-helecho { animation: aparta linear both; animation-timeline: --hero; animation-range: exit 0% exit 70%; }
    [data-plantilla="pinar"] .hero-clip { animation: entra-bosque linear both; animation-timeline: --hero; animation-range: exit 0% exit 70%; }
  }
}
@keyframes aparta { to { translate: -60% 0; rotate: -8deg; } }    /* el derecho va en espejo (scale -1 1) */
@keyframes entra-bosque { to { transform: scale(1.08); } }
/* Las luciérnagas: 14 spans, cada uno con su --x, --y y --t de servidor (deterministas, sin Math.random) */
.luciernagas > i { position: absolute; left: var(--x); top: var(--y); width: 4px; height: 4px; border-radius: 50%;
  background: #f4e3a1; box-shadow: 0 0 8px 2px #f4e3a199; animation: deriva var(--t) ease-in-out infinite alternate; }
@keyframes deriva { to { transform: translate(14px, -18px); opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .luciernagas > i { animation: none; opacity: .6; } }
```
`pinar.tsx`:
- `HeroVideo` con los dos `<svg className="pinar-helecho" data-lado=…>` como hermanos del rótulo;
- `piezas.cuandoDonde` envuelve `<Luciernagas />` (un servidor que reparte posiciones con una semilla del slug);
- `tonos: { cuandoDonde: "hondo", alojamiento: "velo" }`;
- movimiento: `{ estilo: "romantico", particulas: "hojas", flores: "jardin", toque: "hojas" }`.

La partícula nueva, en `movimiento/Particulas.tsx`: `hojas` reutiliza el dibujo de los pétalos con otra silueta (una elipse apuntada y un nervio de 0,5 px), en el verde del acento2 y con una caída más lenta (`v × 0,7`).

### 8.6 Momento wow e interacción táctil

- **El wow, «El bosque se abre… y anochece»:** con el primer gesto, los helechos se apartan como si el invitado entrara en el bosque. Más abajo, al llegar a la fecha, cae la noche y se encienden las luciérnagas. Son dos actos con un solo gesto natural.
- **Al tocar** (`toque: "hojas"`): cada toque suelta 4–5 hojas de eucalipto que caen girando desde el dedo. En las secciones oscuras, el toque **enciende una luciérnaga** donde cae el dedo, que se apaga en 2 s.

### 8.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Pino** | `#1F2A22` / `#ECE4D3` / `#2F5D3A` | 11,76 | 6,04 | 7,64 |
| **Eucalipto** | `#1D2725` / `#EEF0EA` / `#3F6B63` | 13,36 | 5,23 | 6,01 |
| **Roble** | `#2A2118` / `#F0E6D6` / `#6B4A2B` | 12,79 | 6,44 | 7,96 |

---

## 9. Órbita (El espacio y los planetas) · id `orbita`

### 9.1 Concepto y dirección de arte

**Nombre de catálogo:** **Órbita**. Etiqueta: «Cósmica».
- **Para:** parejas de ciencia, de ciencia ficción o astrónomas aficionadas; bodas de noche en un observatorio, un planetario o en Canarias (Teide, La Palma: cielo Starlight).
- **Diferencia con Constelación**, que es el más cercano:

| | Constelación | Órbita |
|---|---|---|
| Color | azul y oro | violeta y plata |
| Cielo | estrellas fijas | planetas que se mueven |
| Tipografía | Marcellus y Outfit | Josefin Sans, Sora y Parisienne |
| Ornamento | alianzas de puntos | órbitas elípticas |
| Gesto | la historia de madrugada | dos órbitas que se encuentran |

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#0B0F24` | noche profunda (`modo: "oscuro"`) | — |
| tinta | `#ECEAF6` | luz de estrella | **15,94:1** |
| acento | `#B9A6F2` | violeta claro | **8,84:1**; botón con texto `#111`: **8,81:1** |
| acento2 | `#5B3FA8` | violeta hondo de nebulosa | 2,46:1 → solo fondos y nebulosas |
| metal | `#C7CCD6` | plata | **11,77:1** → también como texto |
| velo del hero | el papel (noche) al 70 % | — | texto en la tinta sobre el peor píxel: **6,03:1** |

**Tipografía:**
- display: **Josefin Sans** 200 y 300 en caja alta, con tracking de 0,18 em (la geometría de la era espacial, fina y elegante; los nombres a 12 vw sin tracking);
- texto: **Sora** 400 y 500 a 18 px (geométrica, de ojo grande y muy legible en oscuro, con interlineado 1,75);
- manuscrita: **Parisienne** 400, a partir de 32 px; sobre oscuro, los trazos finos no bajan de ese tamaño.

**Mood:**
> Dos planetas que llevan años girando cerca y por fin se alinean.
> Violeta, plata y negro azulado; la luz de las estrellas, nunca neón.
> Silencio de observatorio: todo se mueve, pero muy despacio.

**Texturas:**
- nebulosa (3 `radial-gradient` violeta y azul, más el grano);
- polvo estelar (los gradientes repetidos de Constelación, reutilizados);
- anillos planetarios (elipses SVG de 0,75 px);
- cartas celestes (una retícula de coordenadas al 6 %);
- un brillo holográfico en la plata (`conic-gradient`, solo en el lacre del RSVP).

**Qué pedir:**
- **Foto:** de noche, bajo las estrellas (larga exposición, frontal o silueta), o en un mirador.
- **Vídeo:** un timelapse del cielo, o siluetas de la pareja con la Vía Láctea detrás.
- **Si se quiere:** la fecha y el lugar en que se conocieron, para un guiño de «el cielo de aquella noche» (`docs/09`, insignia 3: queda para una fase posterior).

### 9.2 Hero con vídeo

- **Integración:** vídeo a sangre de la nebulosa. Encima, **dos planetas pequeños** (SVG de 28 y 22 px con su anillo) orbitan **por separado** en dos elipses que se cruzan, alrededor de las iniciales.
- **Rótulo:**
  - «DOS ÓRBITAS, UN MISMO CIELO», en Josefin 300 a 17 px;
  - los nombres;
  - la fecha en Sora.
- **Encuadre:** `posicion: "50% 45%"`.
- **Velo:** el papel al 70 % (`--velo-hero: var(--papel)`), y el texto en la tinta.
- **Botón «Play»:** un planeta con anillo (56 px); el anillo gira 30° al pulsarlo.
- **Fallback:** el póster y los planetas quietos en su posición final.
- **Peso:** 1,4 MB y 0,9 MB (el oscuro comprime bien); el póster, 45 KB.
- **Prompt:**
  > *Slow drift through a violet and deep-blue nebula with sparkling star fields, a ringed planet turning very slowly in the distance, silver rim light, elegant and calm.*
  > *9:16 vertical, seamless 8-second loop, gentle forward motion, no text, no spacecraft, no people.*

### 9.3 Cuenta atrás: «T menos»

El formato de lanzamiento, **«T − 120 : 04 : 12 : 33»**, en Sora 300 tabular a `clamp(2.25rem, 10vw, 3.25rem)`, con las unidades debajo («días · horas · min · seg»).

Detrás, un **mini sistema solar** de 3 órbitas:
- el planeta interior da una vuelta por minuto (`rotate(total × 6°)`);
- el de en medio, una por hora (`rotate(total ÷ 10 °)`);
- el exterior marca los días: su ángulo es `días/365 × 360°`.

Cada medianoche, el exterior avanza un paso con `--ease-sello`.
```tsx
// temas/OrbitaCuenta.tsx (cuerpo)
const dos = (n: number) => String(n).padStart(2, "0");
<div className="relative mx-auto mt-6 aspect-square w-[min(84vw,21rem)]" aria-hidden>
  {[["44%", c.total * 6, "orb-1"], ["66%", c.total / 10, "orb-2"], ["90%", -(c.d / 365) * 360, "orb-3"]].map(([d, a, k]) => (
    <span key={k as string} className={`orb ${k}`} style={{ width: d as string, rotate: `${a}deg` } as React.CSSProperties}><i /></span>
  ))}
  <p className="absolute inset-0 grid place-items-center">
    <span className="display text-[clamp(2.25rem,10vw,3.25rem)] font-light tabular-nums">
      T − {c.d}:{dos(c.h)}:{dos(c.m)}{!quieto && <>:<span key={c.s} className="cifra-funde inline-block">{dos(c.s)}</span></>}
    </span>
  </p>
</div>
<p aria-hidden className="mt-2 text-[1.0625rem] tracking-[0.18em]">DÍAS · HORAS · MIN{!quieto && " · SEG"}</p>
```
```css
.orb { position: absolute; left: 50%; top: 50%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%;
  border: .75px solid color-mix(in srgb, var(--metal) 35%, transparent); transition: rotate 1s linear; }
.orb > i { position: absolute; top: -5px; left: calc(50% - 5px); width: 10px; height: 10px; border-radius: 50%; background: var(--metal); }
.orb-1 > i { background: var(--acento); } .orb-3 { transition: rotate 900ms var(--ease-sello); }
@media (prefers-reduced-motion: reduce) { .orb { transition: none; } }
```
Con números de 4–5 cifras de ancho y `tabular-nums`, «T − 120:04:12:33» mide unos 300 px a 36 px, así que en 360 px cabe con 24 px de margen. Si la cuenta pasa de 999 días, se quita la «T −».

### 9.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | La nebulosa del vídeo; los dos planetas orbitan cada uno en su elipse (40 s y 55 s por vuelta, un `bucle` CSS); los nombres se enfocan | CSS infinito + `Enfoca` | carga 0–1,6 s | Planetas quietos |
| 2 | Historia | **«Dos órbitas que se encuentran»** (escena fijada de 160 svh): las dos elipses, cada una con su nombre, se acercan con el scroll hasta **fundirse en una sola órbita compartida**, y en el centro aparecen los dos anillos entrelazados. Los capítulos se leen debajo, ya fuera de la escena fijada | `view-timeline: --cielo`, `translate` y `scale` de cada elipse | `contain 0–100%` | Órbita única ya formada |
| 3 | Respiro | Una foto en un círculo, «la luna», con un halo plateado y parallax lento | vida.css | `cover 0–100%` | Quieta |
| 4 | Cuándo y dónde | «Coordenadas»: la fecha, el lugar y la latitud y longitud reales del recinto (de `ComoLlegar`) en Sora, con una retícula de carta celeste que se dibuja | `stroke-dashoffset` | `entry 10–35%` | Dibujada |
| 5 | Cuenta atrás | «T menos» (9.3) | — | — | Por minutos |
| 6 | Programa | Las paradas como **fases de la misión** («Ignición · 18:00 Ceremonia»), con una trayectoria curva y un punto que avanza de una a otra | `offset-path` + `--avance` (como en Pasaporte) | `entry 0–40%` | Punto al final |
| 7 | Dress code | Las muestras como **planetas** de tamaños distintos, que entran en su órbita (`translate` desde fuera y luego reposo) | `[data-escena]` | `entry 20–45%` | En su sitio |
| 8 | Alojamiento | «Estaciones de descanso»: un carrusel | `.carril` | — | — |
| 9 | Regalos | «Combustible para la luna de miel», en una cápsula; «Ver datos» → `<details>` | `[open]` | 400 ms | — |
| 10 | RSVP | Al confirmar, una **lluvia de estrellas fugaces** (3 trazos en diagonal, 900 ms) y el lacre plateado holográfico con las iniciales | `Rsvp.tsx` + CSS | 900 ms | Solo el lacre |
| 11 | Cierre | La firma en Parisienne y, debajo, un sistema binario: dos puntos de luz que giran juntos, muy despacio | CSS `bucle` (60 s) | — | Quietos |

### 9.5 Estructura de código

```css
/* temas/orbita.css · dos órbitas que se funden */
.orbita-escena { height: 160svh; view-timeline: --cielo block; }
.orbita-escena .elipse { position: absolute; left: 50%; top: 50%; width: 62vw; max-width: 22rem; aspect-ratio: 1.6;
  border: 1px solid color-mix(in srgb, var(--metal) 45%, transparent); border-radius: 50%; }
.elipse-a { translate: calc(-50% - (1 - var(--avance, 1)) * 26%) -50%; rotate: calc((1 - var(--avance, 1)) * -18deg); }
.elipse-b { translate: calc(-50% + (1 - var(--avance, 1)) * 26%) -50%; rotate: calc((1 - var(--avance, 1)) * 18deg); }
.orbita-anillos { opacity: clamp(0, (var(--avance, 1) - .75) * 4, 1); }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .orbita-escena .escenario { animation: avance linear both; animation-timeline: --cielo; animation-range: contain 0% contain 90%; }
  }
}
@media (prefers-reduced-motion: reduce) { .orbita-escena { height: auto; } .orbita-escena .escenario { position: static; height: 70svh; } }
/* Lo que gira para siempre se puede pausar (0.6) */
.planeta-gira { animation: gira var(--vuelta, 40s) linear infinite; }
[data-mov-pausa] .bucle, [data-mov-pausa] .planeta-gira { animation-play-state: paused; }
```
`orbita.tsx`:
- `modo: "oscuro"` en el catálogo;
- `--velo-hero: var(--papel)` en el lienzo;
- `piezas.capitulos = <><DosOrbitas a b /><Capitulos …/></>`;
- `tonos: { cuandoDonde: "velo", rsvp: "hondo" }` (en oscuro, `tonosDerivados` ya aclara el acento sobre la noche);
- movimiento: `{ estilo: "cinematografico", particulas: "destellos", flores: "ninguna", toque: "estrella" }`.

### 9.6 Momento wow e interacción táctil

- **El wow, «Dos órbitas que se encuentran»:** la historia de la pareja contada como física. Dos órbitas, cada una con su nombre, se acercan con el pulgar hasta que comparten una sola, y en el centro brillan los dos anillos. Es el «nos encontramos» sin una palabra.
- **Al tocar** (`toque: "estrella"`): cada toque en el cielo lanza **una estrella fugaz** desde el dedo: un trazo de 60 px en diagonal que se desvanece en 700 ms, con un máximo de una cada 600 ms.

### 9.7 Variantes (todas oscuras: `modo: "oscuro"`)

| Variante | Tinta / papel / acento | T-P | A-P | Botón (texto #111) |
|---|---|---|---|---|
| **Nebulosa** | `#ECEAF6` / `#0B0F24` / `#B9A6F2` | 15,94 | 8,84 | 8,81 |
| **Aurora** | `#E6F3F0` / `#071A1F` / `#7FD8C2` | 15,68 | 10,63 | 11,24 |
| **Marte** | `#F4E9E4` / `#1A0E10` / `#E3A08A` | 15,82 | 8,67 | 8,69 |

---

## 10. Brazada (Natación y agua) · id `brazada`

### 10.1 Concepto y dirección de arte

**Nombre de catálogo:** **Brazada**. Etiqueta: «Deportiva acuática».
- **Para:** parejas nadadoras, triatletas, de waterpolo o de surf; bodas junto a una piscina de hotel o en un club náutico.
- **Diferencia con Orilla:** Brazada es **dinámica**: cian eléctrico, líneas de calle, un cronómetro, burbujas. Orilla es contemplativa: arena y acuarela.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | `#F2FAFB` | blanco de azulejo de piscina | — |
| tinta | `#06303A` | azul de fondo de piscina | **13,30:1** |
| acento | `#00707F` | cian profundo | **5,48:1**; botón #fff **5,79:1** |
| acento2 | `#6FD3E0` | cian de agua iluminada (cáusticas y burbujas) | 1,64:1 → decorativo |
| metal | `#A9C1C8` | cromo de escalerilla | 1,78:1 → decorativo; 7,47:1 sobre la tinta |
| velo del hero | tinta al 70 % | — | **5,47:1** |

**Tipografía:**
- display: **Archivo** variable, con anchura de 112 a 125 y peso de 700 en cursiva (expandida e inclinada, con velocidad de salida de bloque); los nombres a `clamp(2.6rem, 12vw, 4.6rem)`;
- texto: **Lexend** 400 y 500 a 18 px (diseñada para reducir el esfuerzo de lectura: la más legible del documento para alguien de 70 años);
- manuscrita: **Yellowtail** 400, a partir de 32 px (un pincel con brío).

**Mood:**
> El primer largo de la mañana: agua quieta, luz que baila en el fondo y el reloj de ritmo marcando la salida.
> Cian, blanco y cromo; líneas de calle que ordenan la página.
> Energía limpia, nunca de gimnasio: el agua lo suaviza todo.

**Texturas:**
- **cáusticas** (la luz refractada que baila en el fondo): 2 capas AVIF de 512 px, sin costuras, que se desplazan en sentidos opuestos (solo `transform`; nada de filtros SVG animados, que funden la batería);
- azulejo de piscina (una retícula de 1 px al 6 %);
- **corcheras** (las líneas de calle) como separadores de sección: cápsulas alternas en el acento y en blanco;
- burbujas, gotas y la escalerilla cromada.

**Qué pedir:**
- **Vídeo:** **bajo el agua** si se atreven (una sesión de preboda en piscina, que está muy de moda), o 8 s de un salto o un chapuzón juntos.
- **Foto:** en el borde de la piscina o en el mar abierto, con luz de mediodía.

### 10.2 Hero con vídeo

- **Integración:** vídeo subacuático a sangre. **El borde superior del hero es la superficie del agua:** una línea ondulada blanca (SVG) con un vaivén lento. Arriba de esa línea queda una franja de 12 svh de papel con «SALIDA · 04.06.27» en Archivo; el vídeo está «bajo el agua».
- **Rótulo:** abajo, sobre el velo: los nombres en Archivo expandida e inclinada y la fecha en Lexend.
- **Encuadre:** `posicion: "50% 40%"`.
- **Velo:** tinta al 70 % abajo; además, las cáusticas al 14 % encima del vídeo (`mix-blend-mode: screen`, una sola capa).
- **Botón «Play»:** una **burbuja** de 56 px (círculo con un brillo en la esquina) que, al pulsarla, sube 4 px y vuelve.
- **Fallback:** el póster, con las cáusticas quietas.
- **Peso:** 1,8 MB y 1,1 MB; el póster, 65 KB; las cáusticas, 2 × 22 KB.
- **Prompt:**
  > *Underwater view in a sunlit swimming pool: shimmering light caustics dancing on pale blue tiles, streams of small bubbles rising, a lane rope floating at the surface above.*
  > *9:16 vertical, seamless 8-second loop, slow upward drift, fresh and dynamic, no people, no text.*

### 10.3 Cuenta atrás: «El reloj de ritmo»

El **reloj de ritmo** (*pace clock*), el gran reloj analógico de 60 s de todas las piscinas:
- esfera blanca, 60 marcas, números de 5 en 5;
- una aguja cian que **barre los segundos** (`rotate(total × 6°)` con una transición lineal de 1 s: va hacia atrás porque descuenta);
- debajo, el tiempo que falta, en pantalla de marcador: **«120 d · 04:12:33»**, en Archivo condensada a 36 px y `tabular-nums`.

Cada minuto, la aguja pasa por el 60 y la marca se ilumina, como una salida.
```tsx
// temas/BrazadaCuenta.tsx (cuerpo)
const dos = (n: number) => String(n).padStart(2, "0");
<svg viewBox="0 0 200 200" aria-hidden className="ritmo mx-auto mt-8 w-[min(74vw,18rem)]">
  <circle cx="100" cy="100" r="96" className="ritmo-caja" />
  {Array.from({ length: 60 }, (_, i) => (
    <line key={i} x1="100" y1="10" x2="100" y2={i % 5 ? 16 : 22} className={i % 5 ? "marca" : "marca marca-5"}
          style={{ rotate: `${i * 6}deg` }} />
  ))}
  {Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return <text key={i} x={100 + 66 * Math.cos(a)} y={105 + 66 * Math.sin(a)} className="ritmo-num">{i === 0 ? 60 : i * 5}</text>;
  })}
  {!quieto && <line x1="100" y1="112" x2="100" y2="18" className="ritmo-aguja" style={{ rotate: `${c.total * 6}deg` }} />}
  <circle cx="100" cy="100" r="5" className="ritmo-eje" />
</svg>
<p aria-hidden className="display mt-6 text-[2.25rem] tabular-nums [font-stretch:75%]">
  {c.d} d · {dos(c.h)}:{dos(c.m)}{!quieto && <>:<span key={c.s} className="cifra-funde inline-block">{dos(c.s)}</span></>}
</p>
```
```css
.ritmo-caja { fill: #fff; stroke: var(--tinta); stroke-width: 4; }
.ritmo .marca { stroke: var(--tinta); stroke-width: 1; transform-box: view-box; transform-origin: 100px 100px; }
.ritmo .marca-5 { stroke-width: 2.5; }
.ritmo-num { font: 700 13px var(--display); fill: var(--tinta); text-anchor: middle; }   /* tinta sobre #fff: 14,08:1 */
.ritmo-aguja { stroke: var(--acento); stroke-width: 2.5; stroke-linecap: round; transform-box: view-box; transform-origin: 100px 100px;
  transition: rotate 1s linear; }
@media (prefers-reduced-motion: reduce) { .ritmo-aguja { transition: none; } }
```

### 10.4 Guion de scroll

| # | Tramo | En pantalla | Técnica | Rango | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Portada | Las cáusticas bailan sobre el vídeo y la superficie ondula; los nombres entran **de izquierda a derecha como una brazada** (`translateX` −24 px → 0 con `skewX` de −6° a 0°, en 700 ms). Al bajar, **la zambullida**: la línea de superficie sube y sale de la pantalla, y el vídeo se agranda (`scale` 1,06) y se tiñe hacia el cian profundo | carga + `view-timeline: --hero`, `exit` | carga 0–1,2 s; `exit 0–70%` | Quieto; cáusticas paradas |
| 2 | Historia | **«Bajo el agua»**: las secciones de historia van en `hondo` (azul piscina), con las cáusticas al 8 % en el fondo y burbujas (las partículas `burbujas`, 18) que suben por los márgenes. Cada capítulo entra «nadando» desde un lado, alternando izquierda y derecha | `[data-escena]`: `translateX` ±32 px → 0 | `entry 0–35%` | Quietos; sin burbujas |
| 3 | Respiro | **Emergemos:** una corchera (separador) cruza la pantalla y el fondo vuelve al blanco de azulejo con un degradado de 30 svh («la luz de la superficie») | `tono-velo` → papel; la corchera, con `translateX` en `view()` | `cover 0–100%` | Corte limpio |
| 4 | Cuándo y dónde | «Salida»: la fecha en Archivo enorme sobre una **línea de calle** pintada en el fondo (la cruz negra de fondo de piscina, en el acento al 10 %) | vida.css `vida-enfoca` | `cover 18–46%` | Visible |
| 5 | Cuenta atrás | El reloj de ritmo (10.3) | — | — | Por minutos, sin aguja |
| 6 | Programa | **Calles de piscina:** cada parada es una calle (franja con el número de calle a la izquierda y la hora); una corchera de puntos se «tensa» al entrar (`scaleX` de 0,6 a 1) | `view()` por fila | escalonado del 6 % | Tensas |
| 7 | Dress code | Las muestras como **gorros de natación** (semicírculos) que caen al agua y salpican una gota (`scale` de 0,9 a 1 y un círculo que se abre) | `[data-escena]` | `entry 20–40%` | Quietos |
| 8 | Alojamiento | Carrusel de hoteles, con la distancia a la piscina o al mar | `.carril` | — | — |
| 9 | Regalos | «Para el próximo viaje», con «Ver datos» → `<details>`; una gota cae y abre los datos | `[open]` | 400 ms | — |
| 10 | RSVP | **«Tocar pared»:** el botón «Confirmo» es la placa de llegada. Al confirmar, la placa se ilumina, el marcador muestra «LLEGADA · CARMEN + 1» y sube una nube de burbujas | `Rsvp.tsx` + partículas | 1,1 s | Placa iluminada sin burbujas |
| 11 | Cierre | La firma en Yellowtail sobre una ola que rompe una sola vez (máscara de 900 ms) | `mask-position` | al entrar | Quieta |

### 10.5 Estructura de código

```css
/* temas/brazada.css · cáusticas y zambullida */
.causticas { position: absolute; inset: -10%; pointer-events: none; mix-blend-mode: screen; opacity: .14; overflow: hidden; }
.causticas::before, .causticas::after { content: ""; position: absolute; inset: 0;
  background: url(/temas/brazada/causticas.avif) 0 0 / 512px; animation: causticas 14s linear infinite; }
.causticas::after { animation-duration: 19s; animation-direction: reverse; opacity: .7; }
@keyframes causticas { to { transform: translate(-256px, -128px); } }
[data-plantilla="brazada"] .hero-video { view-timeline: --hero block; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .brazada-superficie { animation: superficie-sube linear both; animation-timeline: --hero; animation-range: exit 0% exit 50%; }
    [data-plantilla="brazada"] .hero-medio { animation: zambullida linear both; animation-timeline: --hero; animation-range: exit 0% exit 70%; }
  }
}
@keyframes superficie-sube { to { transform: translateY(-14svh); opacity: 0; } }
@keyframes zambullida { to { transform: scale(1.06); filter: brightness(.82) saturate(1.15); } }
@media (prefers-reduced-motion: reduce) { .causticas::before, .causticas::after { animation: none; } }
[data-mov-pausa] .causticas::before, [data-mov-pausa] .causticas::after { animation-play-state: paused; }
/* La corchera: separador puro CSS */
.corchera { height: 10px; background: repeating-linear-gradient(90deg, var(--acento) 0 18px, #fff 18px 36px); border-radius: 5px; }
```
*Del `filter` de la zambullida: se anima solo durante el 70 % de la salida y sobre una capa, `.hero-medio`, que ya está en su propia capa de composición. En los móviles de gama baja se mide con `perf-profiler`; si pasa de 4 ms por fotograma, se queda solo el `transform`.*

`brazada.tsx`:
- `HeroVideo` con `<div className="causticas bucle" aria-hidden />` dentro del marco y `<svg className="brazada-superficie">` arriba;
- `piezas: { capitulos: <BajoElAgua …/>, cuentaAtras: <BrazadaCuenta …/>, itinerario: <Calles …/> }`;
- `tonos: { capitulos: "hondo", historia: "hondo", rsvp: "velo" }`. Aquí se rompe la regla de «nunca dos `hondo` seguidos» a propósito: es *un* tramo bajo el agua y `Secciones` los pinta contiguos, así que se fusionan en una sola banda;
- movimiento: `{ estilo: "sereno", velocidad: 1.1, particulas: "burbujas", flores: "ninguna", toque: "burbujas" }`.

La partícula nueva, en `movimiento/Particulas.tsx`, rama `burbujas` (con los campos de `P`: `x`, `y`, `v`, `a`, `t`, `s`):
```ts
if (tipo === "burbujas") {
  ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,${0.45 * p.a})`; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${0.5 * p.a})`; ctx.fill();          // el brillo
  p.y -= p.v; p.x += Math.sin((p.t += 0.03)) * 0.35;                     // sube y serpentea
  if (p.y < -p.s) { p.y = alto + p.s; p.x = margenAleatorio(); }         // vuelve a salir por abajo, en los márgenes
}
```

### 10.6 Momento wow e interacción táctil

- **El wow, «La zambullida»:** con el primer gesto, la superficie del agua sube y sale de la pantalla y el invitado queda *bajo el agua*. La historia se lee con la luz bailando en el fondo y burbujas subiendo por los lados, y al llegar a la fecha se emerge. Es un descenso y un ascenso, sin secuestrar el scroll.
- **Al tocar** (`toque: "burbujas"`): cada toque suelta 5–7 burbujas que suben desde el dedo y revientan. Sobre el reloj de ritmo, al tocarlo, se pone a cero la aguja de «salida» y vuelve, como el gesto de un entrenador.

### 10.7 Variantes (claras)

| Variante | Tinta / papel / acento | T-P | A-P | Botón |
|---|---|---|---|---|
| **Cian** | `#06303A` / `#F2FAFB` / `#00707F` | 13,30 | 5,48 | 5,79 |
| **Lago** | `#0F2A26` / `#F1F7F3` / `#2A6B5A` | 14,02 | 5,77 | 6,27 |
| **Mar abierto** | `#0A2240` / `#F1F6FB` / `#1D5FA8` | 14,68 | 5,93 | 6,45 |

---

## 11. Resumen

| Estilo (catálogo) | id | Fuentes (display · texto · manuscrita) | Paleta (papel / tinta / acento / acento2 / metal) | Momento wow | Esfuerzo |
|---|---|---|---|---|---|
| Alta Sociedad | `regencia` | Bodoni Moda · Spectral · Pinyon Script | `#F7F1EC` `#2B2340` `#8A4566` `#9CB4CC` `#B8975A` | El camafeo se abre hasta la pantalla completa | **M** |
| Aire | `aire` | Newsreader · Hanken Grotesk · Ballet | `#FAF9F6` `#1A1A1A` `#5C5850` `#D9D4CA` `#A68A4E` | El hilo de oro que se cose con el scroll y se anuda al confirmar | **S** |
| Érase una vez | `cuento` | IM Fell English · Alegreya · Tangerine | `#F6F1E7` `#2A1B3D` `#5B2A86` `#C9B6E4` `#C5A253` | El libro: páginas que giran sobre el lomo | **L** |
| Blasón | `blason` | Cinzel Decorative · Crimson Pro · UnifrakturCook | `#F2E8D5` `#2A1712` `#6B1E2A` `#2E4A3A` `#A8823A` | El castillo se pinta en acuarela (y el rastrillo sube) | **M** (L con la lámina por encargo) |
| Memorias | `memorias` | Libre Caslon Display · Courier Prime · Homemade Apple | `#EFE4CF` `#3B2A1E` `#8B3F31` `#C8B79A` `#9C7A4B` | La carta que se escribe: la tinta baja línea a línea | **M** |
| Pasaporte | `pasaporte` | DM Serif Display · IBM Plex Sans (+ Plex Mono) · Caveat | `#F3EADB` `#2B2620` `#9A4A22` `#2F5D62` `#B08D57` | La ruta de los dos en el mapa, con el panel de salidas | **L** |
| Orilla | `orilla` | Bellefair · Nunito Sans · Allura | `#F7F4EE` `#0F2F3A` `#0E6973` `#7FCFCB` `#B9C4C9` | La resaca: el vídeo termina en una ola que se retira | **M** |
| Bosque Encantado | `pinar` | Young Serif · Karla · Sacramento | `#ECE4D3` `#1F2A22` `#2F5D3A` `#8AA39D` `#A07D4A` | El bosque se abre… y anochece con luciérnagas | **M** |
| Órbita | `orbita` | Josefin Sans · Sora · Parisienne | `#0B0F24` `#ECEAF6` `#B9A6F2` `#5B3FA8` `#C7CCD6` | Dos órbitas que se funden en una | **M** |
| Brazada | `brazada` | Archivo · Lexend · Yellowtail | `#F2FAFB` `#06303A` `#00707F` `#6FD3E0` `#A9C1C8` | La zambullida: bajo el agua y de vuelta a la superficie | **M** |

**Qué significa el esfuerzo** (una persona de F2, con F1 de apoyo en las partículas y el toque):
- **S:** de 2 a 3 días.
- **M:** de 4 a 6 días.
- **L:** de 7 a 10 días.

Las tres piezas comunes (§0) suman **5 días** y van **antes** que cualquier estilo: `HeroVideo` con su reproductor, `useCuentaAtras` con la base extraída, y `--avance` con `useAvanceVista`, más `toque`, las dos partículas y la sección `cuandoDonde`.

La producción de los diez vídeos temáticos, con dos o tres tomas por prompt, más la edición del bucle y la compresión, es de unos **3 días** de Estudio en paralelo.

### Orden de implementación recomendado (por demanda en España)

Criterio: lo que `docs/12 §4` lee como vendido o pedido en la competencia española (IMB, Felizia, TSD, Serenela) y los huecos que señala («Romántica floral» y «Acuarela del lugar»), cruzado con el esfuerzo. **Son estimaciones razonadas, no datos de ventas**: Invitoo todavía no tiene volumen para medirlo.

1. **Bosque Encantado** (`pinar`, M). Es el pariente del estilo más vendido (finca y bosque, boho-rústico) y reutiliza `Florecer` (eucalipto y olivo). Es el que más bodas abre desde el primer día.
2. **Alta Sociedad** (`regencia`, M). Cubre el hueco «Romántica floral» que pide Rodrigo («animaciones de flores») y aprovecha la ola Bridgerton, que en 2026 sigue viva en las búsquedas de bodas.
3. **Orilla** (`orilla`, M). La boda de playa es estructural en España (Mediterráneo, Baleares y Canarias). Con ella, Mar puede quedarse en «De destino», como pide `docs/12`.
4. **Memorias** (`memorias`, M). Vintage y romántica: muy demandada por parejas de más de 35 años y por las segundas bodas, y no compite con nada del catálogo.
5. **Blasón** (`blason`, M/L). Castillos, paradores y cortijos son un recinto frecuente, y trae el gancho «Acuarela del lugar», que vende la competencia. La lámina por encargo es además un añadido de pago.
6. **Aire** (`aire`, S). Es una victoria rápida por esfuerzo, pero el minimalismo puro se vende poco en España. Se recomienda lanzarla **como sustituta de Tinta** (alias `tinta → aire`), no como una plantilla más: así no crece el catálogo con algo que no se vende.
7. **Pasaporte** (`pasaporte`, L). Tiene mucho encanto y un nicho claro (destino, parejas internacionales y de dos ciudades), pero es el más caro de construir por el mapa y la tabla de ciudades.
8. **Érase una vez** (`cuento`, L). Es un nicho emocional fuerte, pero minoritario y caro, por el libro y los dibujos de capitulares.
9. **Órbita** (`orbita`, M). Es un nicho; reutiliza el oscuro de Constelación. Conviene probarla primero como «edición especial» en `/plantillas`.
10. **Brazada** (`brazada`, M). Es el nicho más estrecho. Solo merece la pena si llega una pareja que la pida: entonces se hace a medida en el Estudio y se publica después.

**Antes de dar cualquier estilo por terminado** (las reglas de `docs/11`):
- capturas a 360×740, 390×844 y 430×932;
- `qa/v3/<agente>/solapes.mjs` en verde, con el botón «Play», `BotonSonido`, la barra de la demo y el rótulo sin intersecciones;
- prueba con `prefers-reduced-motion`, sin JS y en Firefox (la ruta de `useAvanceVista`);
- auditoría de rendimiento con LCP ≤ 2,5 s en 4G simulada, siendo el LCP el póster.

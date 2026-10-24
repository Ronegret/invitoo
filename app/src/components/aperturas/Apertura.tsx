import BotonSonido from "@/components/BotonSonido";
import { usaSobre } from "@/components/sobre/config";
import { aperturaSinVideo } from "@/plantillas/aperturas";
import { medidasMovimiento, resolverMovimiento } from "@/lib/movimiento";
import type { Invitacion } from "@/lib/tipos";
import ArranqueApertura from "./ArranqueApertura";
import SaludoApertura from "./SaludoApertura";
import SobreEscena from "./Sobre";
import { CLASE_TITULAR_PORTADA, programaApertura, type ConfigApertura } from "./programa";
import { DESTELLO_MS, VELO_MS, luzDestello, resolverTransicion } from "./transicion";

export { CLASE_TITULAR_PORTADA };

/**
 * La entrada de una invitación. Un solo acto: el vídeo (o el Sobre, si la
 * plantilla aún no tiene máster rodado), y dentro de la invitación.
 *
 * Antes había dos barreras seguidas —nueve segundos de vídeo y luego una
 * «puerta» que preguntaba por la música— y todo se montaba al hidratar:
 * en el servidor no salía nada, y por 3G el vídeo aparecía dos o cuatro
 * segundos DESPUÉS, tapando la portada que el invitado ya estaba leyendo.
 *
 * Ahora:
 *  · El póster, el rótulo y «Saltar» van en el HTML del servidor.
 *  · Un script en línea, al final de la capa, decide antes del primer
 *    pintado si se ve: quien ya la vio (`localStorage`, que sobrevive a las
 *    sesiones nuevas del navegador de WhatsApp) o pide menos movimiento
 *    entra directo, sin parpadeo.
 *  · Sin JavaScript la capa no aparece y la invitación se lee tal cual.
 *  · La música ya no es un paso: es un botón sobre el propio vídeo, y solo
 *    existe si la boda tiene canción.
 *  · Al salir, View Transitions funde la apertura en la portada y los
 *    nombres viajan hasta el titular. Sin soporte, un fundido.
 *
 * Es un Server Component: lo único que hidrata es el saludo al invitado y
 * el botón de sonido.
 */

function fechaRotulo(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(iso));
}

/** JSON seguro dentro de un <script>: nada de `</script>` ni de U+2028. */
function json(valor: unknown) {
  return JSON.stringify(valor)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\u2028", "g"), "\\u2028")
    .replace(new RegExp("\u2029", "g"), "\\u2029");
}

export default function Apertura(props: {
  inv: Invitacion;
  /** Obsoleto: el saludo se lee ahora en el cliente desde `?n=<token>`. */
  saludo?: { nombre: string; acompanantes: number } | null;
}) {
  const { inv } = props;
  // El sobre de papel manda sobre el vídeo: Sobre y Carta lo traen, y
  // cualquier boda puede pedirlo (`tema.sobre.activo`).
  const conSobre = usaSobre(inv);
  const ap = conSobre ? undefined : inv.apertura;
  const { a, b } = inv.pareja;
  const fecha = fechaRotulo(inv.pareja.fecha);
  const claro = ap ? ap.rotuloClaro : false;
  // Registro y Azulejo: apertura propia sin vídeo (CSS/SVG), que se cierra sola.
  const sinVideo = ap || conSobre ? null : aperturaSinVideo(inv);
  const sobre = !ap && !sinVideo;

  const transicion = resolverTransicion(inv.plantilla, inv.tema?.apertura?.transicion);
  const luz = luzDestello(inv.plantilla);

  const cfg: ConfigApertura = {
    clave: `invitoo:abierta:${inv.slug}`,
    vertical: ap?.vertical ?? "",
    horizontal: ap?.horizontal ?? "",
    rotuloEn: ap?.rotuloEn ?? 0,
    espera: ap ? 12_000 : sinVideo ? sinVideo.duracionMs : 0,
    // El sobre: lacre, solapa y cartulina (la cartulina ya arriba al 97 %)
    // en 1,55 s, y el fundido a la portada (0,7 s + 0,14 s de retraso del
    // nuevo): todo termina a los 2,39 s del toque (≤ 2,4 s).
    abrirMs: 1550,
    quietoMuestra: sobre,
    // Los nombres de la portada se escriben al llegar, salvo con vídeo: ahí
    // viajan desde el rótulo (View Transitions) y no se tocan.
    trazo: !ap,
    salirMs: sobre ? 700 : medidasMovimiento(resolverMovimiento(inv.plantilla, inv.tema?.movimiento)).salida,
    // U1: la salida es un destello (o el velo que se retira). El sobre
    // tarda 1,55 s en abrirse + 0,68 s de destello: 2,23 s hasta la portada.
    transicion,
    transicionMs: transicion === "destello" ? DESTELLO_MS : VELO_MS,
  };

  const script = `(${programaApertura.toString()})(document.currentScript&&document.currentScript.parentNode,${json(cfg)});`;

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`apertura fixed inset-0 z-50 overflow-hidden ${ap ? "bg-black" : "grano"}`}
        data-apertura=""
        data-estado="espera"
        data-claro={claro ? "1" : "0"}
        data-transicion={transicion}
        data-luz={luz}
        role="dialog"
        aria-label={`Invitación de boda de ${a} y ${b}`}
        // El script de abajo cambia estos atributos antes de hidratar.
        suppressHydrationWarning
        style={{ display: "none", background: ap ? undefined : "var(--papel)" }}
      >
        {ap ? (
          <>
            {/* El póster es lo primero que se pinta: la pantalla nunca está
                negra y es el LCP. El vídeo no tiene `src` hasta que el
                script elige montaje: se descarga UNO solo. */}
            <video
              className="absolute inset-0 h-full w-full object-cover"
              poster={ap.poster}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
              suppressHydrationWarning
            />
            {/* Velo: el rótulo tiene que aguantar el peor fotograma posible. */}
            <div aria-hidden className="apertura-velo pointer-events-none absolute inset-0" />
          </>
        ) : sinVideo ? (
          <sinVideo.Escena inv={inv} />
        ) : (
          <SobreEscena inv={inv} />
        )}

        {ap && (
          <div className="apertura-rotulo pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
            <div className="max-w-full">
              <SaludoApertura slug={inv.slug} />
              <p className="text-[1rem] uppercase tracking-[0.3em] opacity-85">{fecha}</p>
              <p className="apertura-nombres display mt-5 text-[clamp(2.4rem,12vw,6rem)] [overflow-wrap:anywhere] [text-wrap:balance]">
                {a}
                <span className="apertura-amp italic"> &amp; </span>
                {b}
              </p>
            </div>
          </div>
        )}

        {/* «Saltar» desde el primer fotograma. Funciona antes de hidratar:
            el script le pone el oyente. */}
        <button
          type="button"
          data-saltar=""
          className="apertura-saltar absolute right-4 z-10 inline-flex min-h-12 items-center rounded-full px-5 text-[1rem] uppercase tracking-[0.2em] backdrop-blur-sm"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
        >
          Saltar
        </button>

        {/* El sonido, sobre el propio vídeo. Comparte la pista con el botón
            fijo de la invitación: lo que se encienda aquí sigue sonando
            después. Si la boda no tiene música, no existe. */}
        {inv.musica && (
          <div
            className="apertura-sonido absolute inset-x-0 z-10 flex justify-center"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}
          >
            <BotonSonido
              url={inv.musica.url}
              titulo={inv.musica.titulo}
              dedicalo={inv.musica.deDedicalo}
              sobre={ap ? (claro ? "video" : "video-claro") : "papel"}
            />
          </div>
        )}

        {transicion === "velo-scroll" && (
          <p aria-hidden className="apertura-pista pointer-events-none absolute inset-x-0 z-10 text-center text-[1rem] uppercase tracking-[0.24em]">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Desliza para abrir
          </p>
        )}

        {/* La luz del destello: encima de todo, sin capturar toques. */}
        <div aria-hidden className="apertura-destello pointer-events-none absolute inset-0 z-20">
          <span className="apertura-destello-rayos" />
          <span className="apertura-destello-nucleo" />
        </div>

        <ArranqueApertura cfg={cfg} />
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </div>
    </>
  );
}

/*
 * Todo lo que depende del estado vive en CSS, para que el script solo tenga
 * que cambiar un atributo y React no tenga que enterarse de nada.
 */
const CSS = `
.apertura[data-estado="espera"], .apertura[data-estado="fuera"] { display: none !important; }
.apertura { overscroll-behavior: contain; touch-action: manipulation; }
/* La salida: un fundido largo con un desenfoque leve, como cuando se
   aparta un velo. Dura lo que diga el movimiento de la boda (--mov-salida). */
.apertura[data-estado="saliendo"] {
  opacity: 0;
  filter: blur(6px);
  transform: scale(1.015);
  transition:
    opacity var(--mov-salida, 1100ms) cubic-bezier(.25,.1,.12,1),
    filter var(--mov-salida, 1100ms) cubic-bezier(.25,.1,.12,1),
    transform var(--mov-salida, 1100ms) cubic-bezier(.25,.1,.12,1);
  pointer-events: none;
}

.apertura-velo {
  opacity: 0;
  transition: opacity 700ms ease-out;
  background: radial-gradient(115% 85% at 50% 52%, rgba(0,0,0,.62) 0%, rgba(0,0,0,.34) 58%, rgba(0,0,0,.5) 100%);
}
.apertura[data-claro="0"] .apertura-velo {
  background: radial-gradient(115% 85% at 50% 52%, color-mix(in srgb, var(--papel) 82%, transparent) 0%, color-mix(in srgb, var(--papel) 55%, transparent) 70%);
}
.apertura-rotulo {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(4px);
  transition:
    opacity 1400ms cubic-bezier(.25,.1,.12,1),
    transform 1600ms cubic-bezier(.25,.1,.12,1),
    filter 1400ms cubic-bezier(.25,.1,.12,1);
  color: #fff;
  text-shadow: 0 1px 26px rgba(0,0,0,.55);
}
.apertura[data-claro="0"] .apertura-rotulo { color: var(--tinta); text-shadow: none; }
.apertura-amp { color: rgba(255,255,255,.78); }
.apertura[data-claro="0"] .apertura-amp { color: var(--acento-texto, var(--acento)); }
.apertura[data-rotulo="1"] .apertura-velo,
.apertura[data-rotulo="1"] .apertura-rotulo { opacity: 1; transform: none; filter: none; }
/* El final del clip (V1) sube a papel: el rótulo se retira antes. */
.apertura[data-rotulo-sale="1"] .apertura-rotulo, .apertura[data-rotulo-sale="1"] .apertura-velo { opacity: 0; transition-duration: 450ms; }
/* La «&» llega un instante después que los nombres: es el gesto. */
.apertura-amp { display: inline-block; margin-inline: .22em; opacity: 0; transition: opacity 1200ms cubic-bezier(.25,.1,.12,1) 500ms; }
.apertura[data-rotulo="1"] .apertura-amp { opacity: 1; }

.apertura-saltar {
  color: #fff;
  background: rgba(0,0,0,.32);
  border: 1px solid rgba(255,255,255,.4);
  transition: background-color 150ms ease, scale 120ms ease-out;
}
.apertura-saltar:active { scale: .97; }
.apertura-saltar:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.apertura:not(.bg-black) .apertura-saltar {
  color: var(--tinta);
  background: color-mix(in srgb, var(--papel) 70%, transparent);
  border-color: color-mix(in srgb, var(--tinta) 30%, transparent);
}
.apertura:not(.bg-black) .apertura-saltar:focus-visible { outline-color: var(--tinta); }

/* View Transitions: el rótulo se convierte en el titular de la portada. */
.apertura[data-rotulo="1"][data-estado="dentro"] .apertura-nombres { view-transition-name: invitoo-nombres; }
main[data-ap="fuera"] .${CLASE_TITULAR_PORTADA} { view-transition-name: invitoo-nombres; }
::view-transition-group(invitoo-nombres) { animation-duration: calc(var(--mov-salida, 1100ms) + 300ms); animation-timing-function: cubic-bezier(.65,.05,.36,1); }
/* El rótulo (una línea) y el titular (tres) no tienen la misma forma: si
   las dos fotos viajan opacas, en mitad del viaje se ven unos nombres
   estirados encima de la fecha. El viejo se apaga al arrancar y el nuevo
   se enciende al llegar: lo que viaja apenas se ve. */
::view-transition-old(invitoo-nombres) { animation: invitoo-nombres-sale calc((var(--mov-salida, 1100ms) + 300ms) * .35) ease-out both; }
::view-transition-new(invitoo-nombres) { animation: invitoo-nombres-entra calc((var(--mov-salida, 1100ms) + 300ms) * .45) ease-out calc((var(--mov-salida, 1100ms) + 300ms) * .55) both; }
@keyframes invitoo-nombres-sale { to { opacity: 0; filter: blur(3px); } }
@keyframes invitoo-nombres-entra { from { opacity: 0; filter: blur(3px); } }
/* El fundido de la apertura a la portada: la apertura se va desenfocándose
   y la portada aparece debajo, sin corte. */
::view-transition-old(root) { animation: invitoo-sale var(--mov-salida, 1100ms) cubic-bezier(.25,.1,.12,1) both; }
::view-transition-new(root) { animation: invitoo-entra var(--mov-salida, 1100ms) cubic-bezier(.25,.1,.12,1) calc(var(--mov-salida, 1100ms) * .2) both; }
@keyframes invitoo-sale { to { opacity: 0; filter: blur(4px); } }
@keyframes invitoo-entra { from { opacity: 0; } }
h1[tabindex="-1"]:focus { outline: none; }

/* Momento firma 2: los nombres de la portada se escriben al llegar, con un
   velo de izquierda a derecha (con fuentes web, el trazo de verdad no se
   puede: no hay contornos). Sin viaje de View Transitions: entran con la
   portada y se escriben dentro de ella. */
main[data-trazo="1"][data-ap="fuera"] .${CLASE_TITULAR_PORTADA} {
  view-transition-name: none;
  animation: invitoo-trazo 1200ms var(--ease-velo, cubic-bezier(.65,0,.35,1)) 240ms both;
}
@keyframes invitoo-trazo {
  from { clip-path: inset(-20% 100% -20% -6%); filter: blur(1.5px); }
  60%  { filter: blur(0); }
  to   { clip-path: inset(-20% -6% -20% -6%); filter: none; }
}

/* —— U1 · DESTELLO ————————————————————————————————————————————————
   Al cerrar, la luz florece desde el centro (0–38 %), tapa el último
   fotograma y se disuelve (38–100 %) dejando la portada debajo. A partir
   del pico, la capa ya no pinta nada propio: ni fondo, ni vídeo, ni
   botones. Solo opacity y transform. */
.apertura { --dst-centro: #fffcf4; --dst-halo: rgba(230, 196, 128, .44); --dst-lavado: #fff9ee; }
.apertura[data-luz="plata"] { --dst-centro: #ffffff; --dst-halo: rgba(206, 214, 230, .44); --dst-lavado: #f8f9fc; }
.apertura[data-luz="rosa"]  { --dst-centro: #fffafb; --dst-halo: rgba(238, 192, 210, .42); --dst-lavado: #fff6f8; }
.apertura[data-luz="perla"] { --dst-centro: #ffffff; --dst-halo: rgba(222, 230, 234, .5); --dst-lavado: #fcfdfd; }
.apertura-destello { opacity: 0; overflow: hidden; }
.apertura-destello > span { position: absolute; inset: -30%; display: block; }
.apertura-destello-nucleo {
  background:
    radial-gradient(circle at 50% 46%, var(--dst-centro) 0%, var(--dst-centro) 14%, var(--dst-halo) 34%, transparent 64%),
    var(--dst-lavado);
  opacity: 0;
}
.apertura-destello-rayos {
  background: repeating-conic-gradient(from 8deg at 50% 46%, transparent 0deg 9deg, var(--dst-halo) 11deg 12deg, transparent 14deg 22deg);
  -webkit-mask: radial-gradient(circle at 50% 46%, #000 0%, transparent 58%);
          mask: radial-gradient(circle at 50% 46%, #000 0%, transparent 58%);
  opacity: 0;
}
.apertura[data-estado="destello"] { pointer-events: none; animation: apertura-sin-fondo var(--dst-dur, 680ms) linear both; }
.apertura[data-estado="destello"] > :not(.apertura-destello) { animation: apertura-apaga var(--dst-dur, 680ms) linear both; }
.apertura[data-estado="destello"] .apertura-destello { opacity: 1; }
.apertura[data-estado="destello"] .apertura-destello-nucleo { animation: apertura-florece var(--dst-dur, 680ms) var(--ease-carta, cubic-bezier(.22,.61,.36,1)) both; }
.apertura[data-estado="destello"] .apertura-destello-rayos { animation: apertura-rayos var(--dst-dur, 680ms) var(--ease-carta, cubic-bezier(.22,.61,.36,1)) both; }
@keyframes apertura-florece {
  0%   { opacity: 0; transform: scale(.35); }
  38%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.35); }
}
@keyframes apertura-rayos {
  0%   { opacity: 0; transform: scale(.5) rotate(-6deg); }
  34%  { opacity: .9; }
  100% { opacity: 0; transform: scale(1.6) rotate(10deg); }
}
@keyframes apertura-apaga { 0%, 34% { opacity: 1; } 40%, 100% { opacity: 0; } }
@keyframes apertura-sin-fondo { 0%, 37% { background-color: #000; } 38%, 100% { background-color: transparent; } }
.apertura:not(.bg-black)[data-estado="destello"] { animation-name: apertura-sin-fondo-papel; }
@keyframes apertura-sin-fondo-papel { 0%, 37% { background-color: var(--papel); } 38%, 100% { background-color: transparent; } }
/* Los nombres de la portada se escriben también tras el destello. */
main[data-trazo="1"][data-ap="destello"] .${CLASE_TITULAR_PORTADA},
main[data-trazo="1"][data-ap="levantando"] .${CLASE_TITULAR_PORTADA} {
  view-transition-name: none;
  animation: invitoo-trazo 1100ms var(--ease-velo, cubic-bezier(.65,0,.35,1)) 260ms both;
}

/* El sobre es de papel crema aunque la boda sea oscura (Órbita): dentro de
   la apertura, la tinta vuelve a ser oscura para que los nombres pasen AA. */
main[data-modo="oscuro"] > .apertura:not(.bg-black) {
  --tinta: #241a16;
  --acento-texto: color-mix(in srgb, var(--acento) 55%, #1a1020);
}

/* —— U1 · VELO ———————————————————————————————————————————————————————
   La capa entera es un velo: sube con el dedo (--velo, 0–1) y deja ver
   la portada debajo; el borde inferior se curva como una tela. */
.apertura[data-velo="1"] {
  touch-action: none;
  transform: translate3d(0, calc(var(--velo, 0) * -104%), 0);
  border-bottom-left-radius: calc(var(--velo, 0) * 48vw) calc(var(--velo, 0) * 9rem);
  border-bottom-right-radius: calc(var(--velo, 0) * 48vw) calc(var(--velo, 0) * 9rem);
  box-shadow: 0 1.5rem 3rem rgb(0 0 0 / calc(var(--velo, 0) * .35));
}
.apertura[data-velo="1"] video { transform: scale(calc(1 + var(--velo, 0) * .08)); transform-origin: 50% 0; }
.apertura[data-velo-vuelve="1"] { transition: transform 420ms var(--ease-carta, cubic-bezier(.22,.61,.36,1)), border-radius 420ms var(--ease-carta, cubic-bezier(.22,.61,.36,1)); }
.apertura[data-estado="levantando"] {
  --velo: 1 !important;
  pointer-events: none;
  transition: transform var(--velo-dur, 620ms) var(--ease-velo, cubic-bezier(.65,0,.35,1)), border-radius var(--velo-dur, 620ms) var(--ease-velo, cubic-bezier(.65,0,.35,1));
}
.apertura-pista {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 1.4rem);
  display: flex; flex-direction: column; align-items: center; gap: .3rem;
  color: #fff; text-shadow: 0 1px 14px rgba(0,0,0,.6);
  opacity: 0; transition: opacity 900ms var(--ease-carta, ease) 400ms;
}
.apertura[data-rotulo="1"] .apertura-pista { opacity: .92; }
.apertura:not(.bg-black) .apertura-pista { color: var(--tinta); text-shadow: none; }
@media (prefers-reduced-motion: no-preference) {
  .apertura-pista svg { animation: apertura-pista 2.2s cubic-bezier(.45,0,.55,1) 3; }
}
@keyframes apertura-pista { 0%, 100% { transform: none; } 50% { transform: translateY(-6px); } }
/* Con «Desliza para abrir» abajo, el botón de sonido sube un poco. */
.apertura[data-velo="1"] .apertura-sonido { bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem) !important; }

@media (prefers-reduced-motion: reduce) {
  .apertura[data-velo="1"] { transform: none; border-radius: 0; box-shadow: none; }
  .apertura[data-estado="saliendo"] { transition: opacity 200ms linear !important; }
  .apertura-rotulo, .apertura-velo, .apertura-amp, .apertura[data-estado="saliendo"] { transition: none; filter: none; transform: none; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
  /* El sobre sin gesto: al tocar, un fundido simple y nada más. */
  .apertura[data-quieto="1"][data-estado="saliendo"] { transition: opacity 450ms ease-out; }
  main[data-trazo="1"][data-ap="fuera"] .${CLASE_TITULAR_PORTADA} { animation: none; }
}
`;

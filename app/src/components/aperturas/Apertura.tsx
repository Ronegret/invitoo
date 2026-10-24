import BotonSonido from "@/components/BotonSonido";
import { usaSobre } from "@/components/sobre/config";
import { aperturaSinVideo } from "@/plantillas/aperturas";
import { medidasMovimiento, resolverMovimiento } from "@/lib/movimiento";
import type { Invitacion } from "@/lib/tipos";
import ArranqueApertura from "./ArranqueApertura";
import SaludoApertura from "./SaludoApertura";
import SobreEscena from "./Sobre";
import { CLASE_TITULAR_PORTADA, programaApertura, type ConfigApertura } from "./programa";

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
            className="absolute inset-x-0 z-10 flex justify-center"
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
main:has(> .apertura[data-estado="fuera"]) .${CLASE_TITULAR_PORTADA} { view-transition-name: invitoo-nombres; }
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
main[data-trazo="1"]:has(> .apertura[data-estado="fuera"]) .${CLASE_TITULAR_PORTADA} {
  view-transition-name: none;
  animation: invitoo-trazo 1200ms var(--ease-velo, cubic-bezier(.65,0,.35,1)) 240ms both;
}
@keyframes invitoo-trazo {
  from { clip-path: inset(-20% 100% -20% -6%); filter: blur(1.5px); }
  60%  { filter: blur(0); }
  to   { clip-path: inset(-20% -6% -20% -6%); filter: none; }
}

@media (prefers-reduced-motion: reduce) {
  .apertura-rotulo, .apertura-velo, .apertura-amp, .apertura[data-estado="saliendo"] { transition: none; filter: none; transform: none; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
  /* El sobre sin gesto: al tocar, un fundido simple y nada más. */
  .apertura[data-quieto="1"][data-estado="saliendo"] { transition: opacity 450ms ease-out; }
  main[data-trazo="1"]:has(> .apertura[data-estado="fuera"]) .${CLASE_TITULAR_PORTADA} { animation: none; }
}
`;

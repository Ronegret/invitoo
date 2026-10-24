import Link from "next/link";
import Revelar from "@/components/Revelar";
import { DIRECTO, DIRECTO_PASOS } from "@/data/sitio";
import s from "./directo.module.css";

/**
 * «El día de la boda, en directo», en la portada.
 *
 * Es el único momento de la web que ocurre de noche: fondo de tinta, como
 * un salón con las luces bajadas, y en medio la TV. No es una captura: la
 * TV pasa cuatro fotos con fundidos lentos, a la tercera se le posa un
 * mensaje en una tarjeta de papel, y el móvil de al lado sube justo la foto
 * que entra después. Todo con CSS y un reloj compartido (`directo.module.css`),
 * así que se ve igual sin JavaScript y se queda quieto si se pide menos
 * movimiento.
 *
 * Las fotos son propias de Invitoo (`public/generadas/directo-*`, generadas
 * con IA, personas ficticias): fotos «de invitado» de una boda cualquiera.
 */

const FOTOS = [
  "/generadas/directo-brindis-768.avif",
  "/generadas/directo-amigas-768.avif",
  "/generadas/directo-pista-768.avif",
  "/generadas/directo-tarta-768.avif",
];
/** La que sube el móvil: entra en la TV en segundo lugar. */
const SUBIDA = FOTOS[1];
const CLASES = [s.d0, s.d1, s.d2, s.d3];

export default function EnDirecto() {
  return (
    <section
      data-cursor-tema="oscuro"
      id="en-directo"
      aria-labelledby="en-directo-titulo"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--tinta)] px-4 py-24 text-[var(--papel)] sm:px-6 sm:py-32"
    >
      {/* La luz de la pantalla sobre la pared: un halo, sin más. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[55%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(232,185,191,.16), transparent)" }}
      />

      <div className="relative mx-auto max-w-[72rem]">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-[1rem] text-[#e8b9bf]">
              <span aria-hidden className="h-px w-8 bg-current" />
              Mientras pasa
            </p>
            <h2
              id="en-directo-titulo"
              className="display mt-4 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.02]"
            >
              El día de la boda, <span className="whitespace-nowrap">en directo</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="max-w-[34rem] text-[1.06rem] leading-[1.8] opacity-80">
              Vuestros invitados escanean el QR de su mesa y suben fotos,
              vídeos y mensajes. Sin app y sin registrarse. Todo va saliendo
              en la TV del salón, despacio, y al día siguiente os lo
              descargáis entero.
            </p>
            <p className="mt-4 text-[1rem] opacity-60">
              {DIRECTO.precio} €, IVA incluido. En el plan Estudio va dentro.
            </p>
          </div>
        </div>

        {/* ───────────── La escena ───────────── */}
        <div
          className={`${s.escena} mt-16 sm:mt-20`}
          role="img"
          aria-label="Ilustración: una TV en el salón pasa las fotos de los invitados y un mensaje en una tarjeta, mientras un móvil sube otra foto."
        >
          <div className="lg:mr-[10rem]">
            <div className={s.tv}>
              <div className={s.pantalla}>
                {FOTOS.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- maqueta decorativa, AVIF ya optimizado
                  <img
                    key={f}
                    src={f}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`${s.diapo} ${CLASES[i]}`}
                  />
                ))}
                <div className={s.velo} />
                <div className={s.mensaje}>
                  <div className={s.tarjeta}>
                    <p className={s.tarjetaTexto}>
                      Que la vida os dé muchas noches como ésta.
                    </p>
                    <p className={s.tarjetaFirma}>Tía Pilar, mesa 4</p>
                  </div>
                </div>
                <div className={s.rotulo}>
                  <p className={s.rotuloNombres}>Laura &amp; Rubén</p>
                  <p className={s.rotuloCuenta}>214 recuerdos esta noche</p>
                </div>
                <div className={s.qr}>
                  <QrFalso />
                  <span>
                    Subid las vuestras
                    <br />
                    <span style={{ opacity: 0.6 }}>con el QR de la mesa</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={s.peana} />
          </div>

          <div className="relative mx-auto -mt-4 w-[13rem] sm:-mt-20 sm:mr-6 sm:w-[13rem] lg:absolute lg:bottom-[-3rem] lg:right-0 lg:mr-0 lg:mt-0 lg:w-[14.5rem]">
            <div className={s.movil}>
              <div className={s.movilPantalla}>
                <span className={s.isla} />
                <p className={s.movilTitulo}>Laura &amp; Rubén</p>
                <p className={s.movilSub}>Las fotos de la boda</p>
                <div className={s.foto}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- maqueta decorativa */}
                  <img src={SUBIDA} alt="" loading="lazy" decoding="async" />
                </div>
                <div className={s.barra}>
                  <span />
                </div>
                <p className={s.estado}>
                  <span className={s.subiendo}>Subiendo…</span>
                  <span className={s.hecho}>Ya está en la pantalla</span>
                </p>
                <div className={s.ultimas}>
                  <p>Lo último que ha llegado</p>
                  <div>
                    {[FOTOS[0], FOTOS[2], FOTOS[3]].map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element -- maqueta decorativa
                      <img key={f} src={f} alt="" loading="lazy" decoding="async" />
                    ))}
                  </div>
                </div>
                <div className={s.acciones}>
                  <span className={`${s.accion} ${s.accionLlena}`}>Subir foto o vídeo</span>
                  <span className={s.accion}>Escribir un mensaje</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────── Cómo va: es una secuencia, va numerada ───────────── */}
        <ol className="mt-24 grid gap-px border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-5">
          {DIRECTO_PASOS.map((p, i) => (
            <Revelar as="li" key={p.titulo} retraso={i * 90} className="bg-[var(--tinta)] p-6">
              <span className="display text-[1.3rem] text-[#e8b9bf] tabular-nums">{i + 1}</span>
              <h3 className="display mt-2 text-[1.45rem] leading-tight">{p.titulo}</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] opacity-70">{p.texto}</p>
            </Revelar>
          ))}
        </ol>

        <p className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/en-directo"
            className="inline-flex min-h-12 items-center rounded-full bg-[var(--papel)] px-6 text-[1rem] text-[var(--tinta)] transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            Ver En directo
          </Link>
          <Link
            href="/servicios#en-directo"
            className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-white/30 underline-offset-4"
          >
            Qué hace falta en el salón
          </Link>
          <Link
            href="/precios#en-directo"
            className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-white/30 underline-offset-4"
          >
            Precios: {DIRECTO.precio} € o {DIRECTO.precioGestionado} € gestionado
          </Link>
        </p>
      </div>
    </section>
  );
}

/**
 * Un QR de mentira, solo para la maqueta: los tres ojos de verdad y un
 * relleno fijo. No se puede escanear, y no debe: no lleva a ninguna parte.
 */
function QrFalso() {
  const n = 21;
  const ojo = (x: number, y: number) => x < 7 && y < 7;
  const enOjo = (x: number, y: number) =>
    ojo(x, y) || ojo(n - 1 - x, y) || ojo(x, n - 1 - y);
  const celdas: [number, number][] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (enOjo(x, y)) continue;
      // Un patrón fijo que parece aleatorio y sale igual en servidor y cliente.
      if (((x * 7 + y * 13 + x * y) % 5) < 2) celdas.push([x, y]);
    }
  }
  const marco = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fbf8f3" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} aria-hidden shapeRendering="crispEdges">
      {celdas.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
      {marco(0, 0)}
      {marco(n - 7, 0)}
      {marco(0, n - 7)}
    </svg>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import DemoEnDirecto from "@/components/directo/DemoEnDirecto";
import { ANADIDOS } from "@/data/sitio";
import { AMPLIACIONES_MOMENTOS, PLANES_MOMENTOS } from "@/lib/momentos/planes";

/**
 * /en-directo — «En directo» como producto.
 *
 * Una sola página que se lee de arriba abajo en el móvil: la TV de verdad
 * (cambia de estilo sola) y un móvil que sube una foto que aparece en ella;
 * cómo funciona en cuatro pasos; qué hace falta en el salón; privacidad;
 * qué os queda después; precios (de `lib/momentos/planes.ts`); preguntas y
 * cómo contratarlo.
 *
 * Es la única página de la web que ocurre de noche: fondo de tinta, como el
 * salón con las luces bajadas. Luego amanece (papel) para leer con calma.
 */

export const metadata: Metadata = {
  title: "En directo: las fotos de vuestros invitados en la TV del salón",
  description: `Vuestros invitados suben fotos con un QR, con un mensaje si quieren, y salen al momento en la TV y en el móvil de todos. Después os lo entregamos todo. ${PLANES_MOMENTOS.directo.precio} €, pago único.`,
  alternates: { canonical: "/en-directo" },
};

const ED = PLANES_MOMENTOS.directo;
const GE = PLANES_MOMENTOS.gestionado;
const CONSERVAR = AMPLIACIONES_MOMENTOS.conservar;
const LIBRO = ANADIDOS.find((a) => a.nombre === "Libro de la Boda");

const PASOS = [
  {
    titulo: "Lo contratáis y lo diseñáis",
    texto: "Desde vuestro panel, en un minuto. Elegís cómo se ve la pantalla —Revista, Polaroid, Cine o Mosaico— con los colores y la letra de vuestra invitación, y lo veis mientras lo cambiáis.",
  },
  {
    titulo: "Ponéis un QR en cada mesa",
    texto: "Os damos las tarjetas listas para imprimir. Con el Gestionado, os llegan impresas.",
  },
  {
    titulo: "Los invitados suben sus fotos",
    texto: `Escanean y suben, sin app ni registro. Cada foto puede llevar unas palabras. Salen al momento en la TV y en la pestaña «En directo» del móvil de todos. Vídeos de hasta ${ED.duracionVideo} segundos.`,
  },
  {
    titulo: "Al día siguiente, todo es vuestro",
    texto: "Las fotos, los vídeos y los mensajes, en un ZIP con un álbum que se abre sin conexión. Los mensajes pasan solos a vuestro Libro de buenos deseos.",
  },
];

const SALON = [
  { titulo: "Una pantalla", texto: "Una TV con HDMI y un portátil, un Chromecast o un proyector. Cualquier navegador sirve." },
  { titulo: "Conexión para la pantalla", texto: "La wifi del local o los datos de un móvil. Si se corta, la pantalla sigue con las últimas fotos." },
  { titulo: "Nada más", texto: "Los invitados usan su móvil y sus datos. Con el Gestionado, lo probamos antes con el local." },
];

const PRIVACIDAD = [
  { titulo: "Cada invitado da su permiso", texto: "Antes de subir, marca que tiene permiso de quien sale en la foto." },
  { titulo: "Cualquiera puede retirar una foto", texto: "Desde su móvil, al instante. Deja de verse en la TV y en el muro, y os avisamos." },
  { titulo: "Vosotros decidís qué sale", texto: "Moderación automática o manual, desde el móvil, en plena fiesta." },
  { titulo: "Privado y en la UE", texto: "No sale en Google, la TV se abre con una clave vuestra y las fotos se guardan en servidores de la Unión Europea (Irlanda)." },
  { titulo: "Con fecha de borrado", texto: `Online ${ED.mesesOnline} meses después de la boda. Pasado el plazo se borra todo; antes, lo descargáis.` },
];

const PREGUNTAS = [
  {
    p: "¿Cómo se paga?",
    r: "Desde vuestro panel, con tarjeta, Apple Pay, Google Pay o Bizum, en una página de pago segura de Stripe. Es un pago único, sin suscripción, y os llega la factura con el IVA desglosado.",
  },
  {
    p: "¿Y si al final no lo usamos?",
    r: "Si cambiáis de idea antes de la boda y todavía no lo habéis usado, os devolvemos el dinero. Escribidnos a info@invitoo.es.",
  },
  {
    p: "¿Los invitados tienen que instalar algo?",
    r: "No. Escanean el QR con la cámara y se abre una página en el navegador. Escriben su nombre una vez y suben.",
  },
  {
    p: "¿Cuántas fotos caben?",
    r: `Sin límite práctico: hasta ${ED.fotos.toLocaleString("es-ES")} fotos y ${ED.videos} vídeos por boda. Las fotos se preparan en el móvil antes de subir, así que van rápido incluso con mala cobertura.`,
  },
  {
    p: "¿Se puede ver sin la TV?",
    r: "Sí. Cada invitado tiene la pestaña «En directo» en su móvil, con todas las fotos y sus mensajes, que se actualiza sola. La TV es para el salón; el muro, para todos.",
  },
  {
    p: "¿Qué pasa si sube algo que no queremos?",
    r: "Lo ocultáis con un toque desde el panel y desaparece de la TV y del muro. Si preferís, activad la moderación manual: nada sale hasta que lo aprobéis.",
  },
  {
    p: "¿Qué recibimos al final?",
    r: "Un ZIP con todas las fotos y vídeos, un archivo que se abre en cualquier navegador con cada foto y su mensaje, y los mensajes en texto. Además, los mensajes pasan a vuestro Libro de buenos deseos, que podéis descargar en PDF e imprimir.",
  },
  {
    p: "¿Y si queremos tenerlo online más tiempo?",
    r: `Son ${CONSERVAR.precio} € por cada año más, desde el panel.`,
  },
];

export default function PaginaEnDirecto() {
  return (
    <>
      {/* ───────────── De noche: la escena ───────────── */}
      <section aria-labelledby="ed-titulo" className="relative overflow-hidden bg-[#1f1a17] px-4 pb-20 pt-[calc(env(safe-area-inset-top,0px)+7.5rem)] text-[#f4efe8] sm:px-6 sm:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[62%] h-[60%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(232,185,191,.14), transparent)" }}
        />
        <div className="relative mx-auto max-w-[72rem]">
          <div className="max-w-[44rem]">
            <h1 id="ed-titulo" className="display text-[clamp(2.5rem,9vw,5rem)] leading-[1.02]">
              Las fotos de vuestros invitados, en directo
            </h1>
            <p className="mt-6 max-w-[36rem] text-[1.125rem] leading-[1.75] text-[#f4efe8]/85">
              Suben la foto con un QR, con un mensaje si quieren, y en unos segundos sale en la TV del salón y en el móvil de todos.
              Después os lo entregamos todo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/panel"
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#f4efe8] px-7 text-[1.0625rem] font-medium text-[#1f1a17] transition-transform active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e8b9bf]"
              >
                Contratar desde vuestro panel · {ED.precio} €
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/35 px-7 text-[1.0625rem] font-medium transition-colors hover:border-white/70 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e8b9bf]"
              >
                Cómo funciona
              </a>
            </div>
            <p className="mt-4 text-[1rem] text-[#f4efe8]/70">Pago único, IVA incluido. En el plan Estudio va dentro.</p>
          </div>

          <div className="mt-14 sm:mt-16">
            <DemoEnDirecto />
          </div>
        </div>
      </section>

      {/* ───────────── Cómo funciona ───────────── */}
      <section id="como-funciona" aria-labelledby="ed-pasos" className="scroll-mt-24 bg-[var(--papel,#faf7f2)] px-4 py-20 text-[var(--tinta,#1f1a17)] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <h2 id="ed-pasos" className="display max-w-[30rem] text-[clamp(2rem,6vw,3.4rem)] leading-[1.05]">
            Cómo funciona
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {PASOS.map((x, i) => (
              <li key={x.titulo} className="border-t border-current/20 pt-5">
                <span aria-hidden className="display text-[2.4rem] leading-none text-[#8c1d2c]">{i + 1}</span>
                <h3 className="mt-3 text-[1.1875rem] font-medium leading-snug">{x.titulo}</h3>
                <p className="mt-2 text-[1.0625rem] leading-[1.7] text-[#5e5650]">{x.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── El salón y la privacidad ───────────── */}
      <section aria-labelledby="ed-salon" className="bg-[#f2ece3] px-4 py-20 text-[#1f1a17] sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-[72rem] gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="ed-salon" className="display text-[clamp(1.9rem,5.4vw,3rem)] leading-[1.08]">
              Qué hace falta en el salón
            </h2>
            <dl className="mt-8 space-y-6">
              {SALON.map((x) => (
                <div key={x.titulo}>
                  <dt className="text-[1.125rem] font-medium">{x.titulo}</dt>
                  <dd className="mt-1 text-[1.0625rem] leading-[1.7] text-[#5e5650]">{x.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="display text-[clamp(1.9rem,5.4vw,3rem)] leading-[1.08]">Las fotos, con cuidado</h2>
            <ul className="mt-8 space-y-6">
              {PRIVACIDAD.map((x) => (
                <li key={x.titulo}>
                  <p className="text-[1.125rem] font-medium">{x.titulo}</p>
                  <p className="mt-1 text-[1.0625rem] leading-[1.7] text-[#5e5650]">{x.texto}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[1rem]">
              <Link href="/privacidad#fotos" className="inline-flex min-h-12 items-center underline decoration-[#8c1d2c]/50 underline-offset-4 hover:decoration-[#8c1d2c]">
                Política de privacidad de las fotos
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── Después ───────────── */}
      <section aria-labelledby="ed-despues" className="bg-[var(--papel,#faf7f2)] px-4 py-20 text-[#1f1a17] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <h2 id="ed-despues" className="display max-w-[34rem] text-[clamp(1.9rem,5.4vw,3rem)] leading-[1.08]">
            Y después, todo vuestro
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            <div>
              <h3 className="text-[1.1875rem] font-medium">La descarga</h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.7] text-[#5e5650]">
                Un ZIP con las fotos y los vídeos a buena calidad, ordenados, y un álbum que se abre en cualquier navegador con cada foto y su mensaje.
              </p>
            </div>
            <div>
              <h3 className="text-[1.1875rem] font-medium">Vuestro Libro de buenos deseos</h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.7] text-[#5e5650]">
                Los mensajes de las fotos se suman a los deseos de la invitación. Lo descargáis en PDF, listo para imprimir como regalo.
              </p>
            </div>
            <div>
              <h3 className="text-[1.1875rem] font-medium">El Libro de la Boda, impreso</h3>
              <p className="mt-2 text-[1.0625rem] leading-[1.7] text-[#5e5650]">
                {LIBRO?.nota ?? "Los deseos y las fotos de los invitados, maquetados a mano."}
                {LIBRO ? ` ${LIBRO.precio} €.` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Precios ───────────── */}
      <section id="precios-directo" aria-labelledby="ed-precios" className="scroll-mt-24 bg-[#1f1a17] px-4 py-20 text-[#f4efe8] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[72rem]">
          <h2 id="ed-precios" className="display text-[clamp(1.9rem,5.4vw,3rem)] leading-[1.08]">
            Precio
          </h2>
          <p className="mt-3 max-w-[36rem] text-[1.0625rem] leading-[1.7] text-[#f4efe8]/80">
            Pago único, IVA incluido. Se contrata aparte, desde vuestro panel, cuando queráis. En el plan Estudio ya va dentro.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { plan: ED, destacado: true },
              { plan: GE, destacado: false },
            ].map(({ plan, destacado }) => (
              <article key={plan.id} className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${destacado ? "border-[#f4efe8]/60 bg-white/[.04]" : "border-white/20"}`}>
                <h3 className="text-[1.25rem] font-medium">{plan.nombre}</h3>
                <p className="display mt-2 text-[3rem] leading-none tabular-nums">{plan.precio} €</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.incluye.map((x) => (
                    <li key={x} className="flex gap-3 text-[1.0625rem] leading-snug text-[#f4efe8]/90">
                      <span aria-hidden className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8b9bf]" />
                      {x}
                    </li>
                  ))}
                </ul>
                {plan.nota && <p className="mt-5 text-[1rem] text-[#f4efe8]/70">{plan.nota}</p>}
              </article>
            ))}
          </div>
          <p className="mt-6 text-[1.0625rem] text-[#f4efe8]/85">
            ¿Lo queréis online más tiempo? {CONSERVAR.nombre}: {CONSERVAR.precio} €.
          </p>
        </div>
      </section>

      {/* ───────────── Preguntas ───────────── */}
      <section aria-labelledby="ed-preguntas" className="bg-[var(--papel,#faf7f2)] px-4 py-20 text-[#1f1a17] sm:px-6 sm:py-28">
        <div className="mx-auto max-w-[46rem]">
          <h2 id="ed-preguntas" className="display text-[clamp(1.9rem,5.4vw,3rem)] leading-[1.08]">
            Preguntas frecuentes
          </h2>
          <div className="mt-8 divide-y divide-current/15 border-y border-current/15">
            {PREGUNTAS.map((x) => (
              <details key={x.p} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.125rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c1d2c] [&::-webkit-details-marker]:hidden">
                  {x.p}
                  <span aria-hidden className="text-[1.5rem] leading-none text-[#8c1d2c] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-[1.0625rem] leading-[1.7] text-[#5e5650]">{x.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Contratar ───────────── */}
      <section aria-labelledby="ed-cta" className="bg-[#f2ece3] px-4 py-20 text-center text-[#1f1a17] sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[40rem]">
          <h2 id="ed-cta" className="display text-[clamp(2rem,6vw,3.4rem)] leading-[1.05]">
            Que nadie se pierda nada
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-[1.7] text-[#5e5650]">
            Si ya tenéis vuestra invitación, se activa desde el panel en un minuto. Si todavía no, empezad por ella: En directo se añade cuando queráis.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/panel"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#8c1d2c] px-7 text-[1.0625rem] font-medium text-white transition-transform active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#8c1d2c]"
            >
              Ya tengo invitación: contratar
            </Link>
            <Link
              href="/precios"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#1f1a17]/30 px-7 text-[1.0625rem] font-medium transition-colors hover:border-[#1f1a17]/60 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#8c1d2c]"
            >
              Ver las invitaciones
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";

/**
 * Bodas reales.
 *
 * Es el hueco más grande que tenía la web frente a la competencia: nada
 * decía que alguien hubiese comprado esto nunca. Doce plantillas preciosas
 * y cero prueba de que funcionen con una boda de verdad.
 *
 * Aquí NO hay testimonios inventados ni cifras redondeadas al alza. Van las
 * invitaciones reales que ya están publicadas y en marcha, con su enlace:
 * quien dude puede abrirlas y verlas funcionando. Eso vale más que cinco
 * estrellas y una foto de banco de imágenes.
 *
 * Los datos salen de `BODAS`. Cuando haya más, se añaden ahí y ya está.
 */

type BodaReal = {
  pareja: string;
  cuando: string;
  donde: string;
  enlace?: string;
  nota: string;
};

/**
 * Solo bodas que existen y están publicadas. Si una no tiene enlace
 * público, se queda sin enlace: no se inventa uno.
 */
const BODAS: BodaReal[] = [
  {
    pareja: "Nico & Gaby",
    cuando: "Agosto de 2026",
    donde: "El Manzano",
    enlace: "https://nico-y-gaby.invitoo.es/",
    nota: "Sobre con lacre, su vídeo de la pedida dentro y la historia contada por capítulos.",
  },
  {
    pareja: "Consuelo & Marc",
    cuando: "Noviembre de 2025",
    donde: "Alella, Barcelona",
    enlace: "https://consueloymarc.invitoo.es/",
    nota: "Siete hoteles recomendados, banda sonora propia y muro de mensajes.",
  },
];

export default function BodasReales() {
  return (
    <section className="grano relative bg-[var(--papel)] px-5 py-28 sm:py-32">
      <div className="mx-auto max-w-[62rem]">
        <Revelar>
          <div className="text-center">
            <p className="text-[0.75rem] uppercase tracking-[0.42em] opacity-50">
              No es una maqueta
            </p>
            <h2 className="display mt-5 text-[clamp(2.2rem,7vw,3.6rem)] leading-[1.06]">
              Bodas que ya están en marcha
            </h2>
            <Rama
              forma="guirnalda"
              ancho={180}
              className="mx-auto mt-6 text-[var(--verde)]"
            />
            <p className="mx-auto mt-8 max-w-[36rem] text-[1.02rem] leading-[1.85] opacity-72">
              Éstas no son muestras. Son invitaciones de parejas reales, con
              sus invitados confirmando dentro. Abridlas y juzgad vosotros.
            </p>
          </div>
        </Revelar>

        <ul className="mt-16 grid gap-6 sm:grid-cols-2">
          {BODAS.map((b, i) => (
            <Revelar
              as="li"
              key={b.pareja}
              retraso={i * 110}
              className="flex flex-col border border-[var(--tinta)]/12 bg-[var(--bruma)]/40 p-8"
            >
              <p className="text-[0.75rem] uppercase tracking-[0.28em] text-[var(--acento)] opacity-80">
                {b.cuando}
              </p>
              <h3 className="display mt-3 text-[2rem] leading-tight">{b.pareja}</h3>
              <p className="mt-1 text-[0.9rem] opacity-55">{b.donde}</p>
              <p className="mt-5 flex-1 text-[0.98rem] leading-[1.7] opacity-72">
                {b.nota}
              </p>
              {b.enlace && (
                <a
                  href={b.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton mt-8 inline-flex min-h-13 items-center justify-center rounded-full border border-[var(--tinta)]/25 px-7 text-[0.76rem] uppercase tracking-[0.18em]"
                >
                  Abrir su invitación
                </a>
              )}
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}

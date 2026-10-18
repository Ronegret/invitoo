import Rama from "@/components/Botanica";
import Revelar from "@/components/Revelar";

/**
 * La portada de una página interior —precios, servicios, plantillas—.
 *
 * No repite la portada de la home: aquella es a pantalla completa y con
 * vídeo, y eso funciona una vez. Aquí basta una banda de fotografía con el
 * título encima, alta pero no entera, porque quien entra a /precios ya ha
 * decidido mirar y lo que quiere es llegar al contenido.
 *
 * La banda existe por una razón concreta: la cabecera del sitio es blanca
 * sobre la fotografía de la home. Sin una imagen detrás, en una página
 * interior se quedaría en blanco sobre crema, o sea invisible.
 */
export default function Encabezado({
  sobre,
  titulo,
  bajo,
  foto,
}: {
  sobre: string;
  titulo: string;
  bajo?: string;
  foto: string;
}) {
  return (
    <header className="relative isolate flex min-h-[58svh] items-end overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- AVIF ya optimizado */}
      <img
        src={foto}
        alt=""
        width={1600}
        height={1000}
        // Es el LCP de la página: se pide con prioridad y sin lazy.
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(12,10,9,.82) 0%, rgba(12,10,9,.44) 46%, rgba(12,10,9,.34) 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-[72rem] px-5 pb-16 pt-32 text-[var(--papel)] sm:pb-20">
        <Revelar>
          <p className="text-[0.75rem] uppercase tracking-[0.42em] opacity-65">
            {sobre}
          </p>
          <h1 className="display mt-5 max-w-[16ch] text-[clamp(2.7rem,9vw,5rem)] leading-[1.02]">
            {titulo}
          </h1>
          <Rama forma="guirnalda" ancho={170} className="mt-7 opacity-45" />
          {bajo && (
            <p className="mt-8 max-w-[40rem] text-[1.06rem] leading-[1.85] opacity-80">
              {bajo}
            </p>
          )}
        </Revelar>
      </div>
    </header>
  );
}

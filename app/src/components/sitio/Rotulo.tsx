import Revelar from "@/components/Revelar";

/**
 * La cabecera de una sección.
 *
 * Antes todas las secciones eran iguales: versalita centrada, titular
 * centrado, guirnalda, párrafo centrado. Seis veces seguidas, la página se
 * leía como una sola nota repetida. Ahora el rótulo se compone como en una
 * revista: el titular grande a la izquierda y la entradilla a la derecha,
 * alineada a su pie, para que el ojo baje en diagonal. `centrado` queda
 * para el cierre y poco más.
 *
 * `sobre` no va en versalitas: es una línea corta en el granate del lacre,
 * con un filete delante, que dice de qué va la sección y nada más.
 *
 * Entra con un fundido corto (`Revelar`): sale visible del servidor, y solo
 * se funde lo que todavía está por debajo de la pantalla.
 */
export default function Rotulo({
  sobre,
  titulo,
  bajo,
  claro = false,
  centrado = false,
  nivel = 2,
}: {
  sobre?: string;
  titulo: string;
  bajo?: string;
  claro?: boolean;
  centrado?: boolean;
  nivel?: 1 | 2;
}) {
  const H = nivel === 1 ? "h1" : "h2";
  const color = claro ? "opacity-70" : "text-[var(--acento)]";

  if (centrado) {
    return (
      <Revelar className="mx-auto max-w-[40rem] text-center">
        {sobre && <p className={`text-[1rem] ${color}`}>{sobre}</p>}
        <H className="display mt-4 text-[clamp(2.4rem,7vw,4.4rem)] leading-[1.04]">
          {titulo}
        </H>
        {bajo && (
          <p className="mx-auto mt-7 max-w-[34rem] text-[1.06rem] leading-[1.8] opacity-75">
            {bajo}
          </p>
        )}
      </Revelar>
    );
  }

  return (
    <Revelar className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-7">
        {sobre && (
          <p className={`flex items-center gap-3 text-[1rem] ${color}`}>
            <span aria-hidden className="h-px w-8 bg-current" />
            {sobre}
          </p>
        )}
        <H className="display mt-4 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.02]">
          {titulo}
        </H>
      </div>
      {bajo && (
        <p className="max-w-[34rem] text-[1.06rem] leading-[1.8] opacity-75 lg:col-span-5 lg:pb-2">
          {bajo}
        </p>
      )}
    </Revelar>
  );
}

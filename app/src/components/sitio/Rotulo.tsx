import Rama from "@/components/Botanica";

/**
 * La cabecera de una sección.
 *
 * Mismo vocabulario que las invitaciones —versalita espaciada arriba,
 * display grande, guirnalda debajo— y por eso está suelto en su propio
 * archivo: lo usan la home, precios, servicios y preguntas, y si cada
 * página lo escribiera por su cuenta acabarían midiendo distinto.
 */
export default function Rotulo({
  sobre,
  titulo,
  bajo,
  claro = false,
}: {
  sobre?: string;
  titulo: string;
  bajo?: string;
  claro?: boolean;
}) {
  return (
    <div className="text-center">
      {sobre && (
        <p
          className="text-[0.75rem] uppercase tracking-[0.42em]"
          style={{ opacity: claro ? 0.6 : 0.5 }}
        >
          {sobre}
        </p>
      )}
      <h2 className="display mt-5 text-[clamp(2.4rem,8vw,4.2rem)] leading-[1.05]">
        {titulo}
      </h2>
      <Rama
        forma="guirnalda"
        ancho={180}
        className={`mx-auto mt-6 ${claro ? "text-current opacity-40" : "text-[var(--verde)]"}`}
      />
      {bajo && (
        <p
          className="mx-auto mt-8 max-w-[36rem] text-[1.04rem] leading-[1.85]"
          style={{ opacity: 0.72 }}
        >
          {bajo}
        </p>
      )}
    </div>
  );
}

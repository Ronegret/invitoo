import Apertura from "@/components/aperturas/Apertura";
import BotonSonido from "@/components/BotonSonido";
import SelloAlianzas from "@/components/SelloAlianzas";
import BarraDemo from "@/components/sitio/BarraDemo";
import { obtenerPlantilla, PLANTILLAS } from "@/data/plantillas";
import { FUENTES, MAQUETAS } from "@/plantillas";
import { resolverTokens, variablesCss } from "@/plantillas/tokens";
import { atributosMovimiento, resolverMovimiento, variablesMovimiento } from "@/lib/movimiento";
import type { Bloque, Invitacion } from "@/lib/tipos";

/**
 * El cuerpo de una invitación. Lo usan la ruta pública `/i/[slug]` (estática)
 * y la vista previa del estudio (`/estudio/vista/[id]`, que enseña borradores).
 *
 * No lee la URL: nada de `searchParams`. La personalización por invitado
 * (`?n=`, `?c=`) se hace en el cliente para que la página siga siendo estática.
 *
 * Un solo lienzo: el `<main>` lleva los tokens de la boda
 * (`variablesCss(resolverTokens(...))`) y las fuentes de su plantilla, para
 * que la apertura y la firma del pie vistan igual que la maqueta. La maqueta
 * pinta dentro su `plantillas/Lienzo.tsx` (mismos tokens + ganchos
 * `data-plantilla`), y su `VarianteCliente` aplica `?c=` a ambos con
 * `variablesDeVariantes(...)[c]`.
 */
export default function Cuerpo({
  inv,
  conBarraDemo = true,
}: {
  inv: Invitacion;
  conBarraDemo?: boolean;
}) {
  const plantilla = obtenerPlantilla(inv.plantilla);
  const muestra = conBarraDemo ? PLANTILLAS.find((p) => p.demo === inv.slug) : undefined;
  const tokens = resolverTokens(inv.plantilla, inv.tema);
  // El movimiento también en el <main>: la apertura y la música lo leen.
  const mov = resolverMovimiento(plantilla.id, inv.tema?.movimiento);

  /**
   * El buscador de bloques que recibe la maqueta. Los datos de la boda
   * siguen siendo el JSON de Supabase —un itinerario, una galería, un
   * dress code—; lo que cambia según la plantilla es dónde se coloca cada
   * cosa, y eso lo decide su archivo.
   */
  const buscar = <T extends Bloque["t"]>(t: T) =>
    inv.bloques.find((x) => x.t === t) as Extract<Bloque, { t: T }> | undefined;

  const Maqueta = MAQUETAS[plantilla.id];

  return (
    <main
      className={`grano relative min-h-dvh overflow-x-clip ${FUENTES[plantilla.id]}`}
      data-modo={tokens.modo}
      {...atributosMovimiento(mov)}
      style={
        {
          ...variablesCss(tokens),
          ...variablesMovimiento(mov),
          background: "var(--papel)",
          color: "var(--tinta)",
          fontFamily: "var(--texto)",
        } as React.CSSProperties
      }
    >
      <Apertura inv={inv} />

      {inv.musica && <BotonSonido url={inv.musica.url} titulo={inv.musica.titulo} />}

      {/* Aquí entra la plantilla. Un archivo por plantilla. */}
      <Maqueta inv={inv} b={buscar} />

      {/* La firma. Es la puerta de entrada del motor de referidos:
          120 personas en edad de casarse ven esto en cada boda. */}
      {/* Abajo, el hueco del botón de música (fijo a 5,5 rem + safe-area, 48 px):
          el último enlace nunca queda debajo de él. */}
      <footer
        className="flex flex-col items-center gap-3 px-6 pt-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 9.5rem)" }}
      >
        <SelloAlianzas size={26} className="opacity-40" />
        <a
          href="/para-invitados"
          className="inline-flex min-h-12 items-center px-4 py-3 text-[1rem] uppercase tracking-[0.22em] opacity-75"
        >
          Diseñado por Invitoo
        </a>
        {/* El código de esta boda: 20 € para los invitados que se casan. */}
        <a
          href={`/para-invitados?codigo=${encodeURIComponent(inv.slug)}`}
          className="inline-flex min-h-12 max-w-[30rem] items-center px-4 py-2 text-center text-[1.0625rem] leading-snug opacity-80 underline-offset-4 hover:underline"
        >
          ¿También os casáis? 20 € de descuento con el código {inv.slug.toUpperCase()}
        </a>
        {muestra && (
          <p className="max-w-[30rem] text-center text-[1.0625rem] leading-snug opacity-75">
            Invitación de muestra: la pareja es ficticia y las fotos están generadas con IA.
          </p>
        )}
      </footer>

      {muestra && (
        <BarraDemo nombre={muestra.nombre} variantes={muestra.variantes} slug={inv.slug} />
      )}
      {/* Las muestras llevan una marca discreta: «Demo». Arriba a la
          izquierda (el «Saltar» de la apertura va a la derecha), sin
          capturar toques. */}
      {muestra && (
        <span
          className="marca-demo pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-[2147483000] rounded-full border border-white/40 bg-black/35 px-2.5 py-1 text-[0.6875rem] font-medium uppercase leading-none tracking-[0.18em] text-white backdrop-blur-sm"
          aria-label="Invitación de demostración"
        >
          Demo
        </span>
      )}
    </main>
  );
}

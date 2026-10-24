import FoleySobre from "@/components/sobre/FoleySobre";
import { manuscrita } from "@/components/sobre/fuentes";
import NombreEnSobre from "@/components/sobre/NombreEnSobre";
import LuzSobre from "@/components/sobre/LuzSobre";
import PetalosSobre from "@/components/sobre/PetalosSobre";
import Sobre from "@/components/sobre/Sobre";
import { CERAS, fechaMatasellos, iniciales, resolverSobre } from "@/components/sobre/config";
import SobreApertura3D from "@/components/tresd/SobreApertura3D";
import type { Invitacion } from "@/lib/tipos";

/**
 * Apertura «Sobre»: el sobre de papel de verdad, en SVG y CSS (antes era
 * metraje de stock). Es la de Sobre y Carta por defecto, y cualquier boda
 * puede pedirla con `tema.sobre.activo = true`.
 *
 * Server Component: lo único que hidrata es el nombre escrito a mano y el
 * foley. El toque lo escucha el guion de la apertura (`programa.ts`), que
 * pone `data-fase="abriendo"` en la capa; lo demás es CSS, así que el sobre
 * se abre aunque React aún no haya llegado.
 *
 * Con `tema.sobre.modo = "3d"` (X1), detrás va además el sobre en WebGL
 * (`tresd/SobreApertura3D`): si el dispositivo lo merece, sustituye al de
 * papel en cuanto pinta; si no, no se carga nada y queda el de papel.
 */
/** «30 · marzo · 2027», en hora de Madrid, como la cartulina de papel. */
function fechaCartulina(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { ...o, timeZone: "Europe/Madrid" }).format(d);
  return `${f({ day: "numeric" })} · ${f({ month: "long" })} · ${f({ year: "numeric" })}`;
}

export default function SobreEscena({ inv }: { inv: Invitacion }) {
  const ajustes = resolverSobre(inv);
  const ini = iniciales(inv.pareja.a, inv.pareja.b);
  return (
    <>
      {/* El 3D: con `modo = "3d"`, o para enseñarlo con `?sobre3d` en la URL. */}
      <SobreApertura3D
        modo3d={ajustes.modo === "3d"}
        slug={inv.slug}
        a={inv.pareja.a}
        b={inv.pareja.b}
        fecha={fechaCartulina(inv.pareja.fecha)}
        iniciales={ini}
        papel={ajustes.papel}
        forroColor={ajustes.forroColor}
        lacreColor={(CERAS[ajustes.lacreColor] ?? CERAS.granate).base}
        sello={ajustes.lacre}
        matasellos={
          ajustes.matasellos
            ? { aro: `${ajustes.ciudad || "Con amor"} · ${fechaMatasellos(inv.pareja.fecha)} ·`, centro: ini.join("") }
            : null
        }
        tinta={inv.tema?.tinta || "#241a16"}
        acento={inv.tema?.acento || "#8c1d2c"}
        letraMano={manuscrita.style.fontFamily}
      />
      <Sobre
        a={inv.pareja.a}
        b={inv.pareja.b}
        fechaIso={inv.pareja.fecha}
        ajustes={ajustes}
        pid={`ap-${inv.slug}`}
        boton
        claseManuscrita={manuscrita.variable}
        escrito={<NombreEnSobre slug={inv.slug} />}
      />
      <FoleySobre activo={Boolean(inv.musica)} />
      <PetalosSobre />
      <LuzSobre />
    </>
  );
}

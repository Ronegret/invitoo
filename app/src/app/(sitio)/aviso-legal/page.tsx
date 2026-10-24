import type { Metadata } from "next";
import Link from "next/link";
import Legal from "@/components/sitio/Legal";
import { TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Quién está detrás de Invitoo y las condiciones de uso de la web y de las invitaciones.",
  alternates: { canonical: "/aviso-legal" },
};

/**
 * Aviso legal (art. 10 LSSI). PLANTILLA: datos del titular en `lib/legal.ts`,
 * pendiente de revisión por un abogado.
 */
export default function AvisoLegal() {
  const t = TITULAR;
  return (
    <Legal titulo="Aviso legal">
      <h2 id="titular">Titular</h2>
      <ul>
        <li>Nombre o razón social: {t.razonSocial}</li>
        <li>NIF: {t.nif}</li>
        <li>Domicilio: {t.domicilio}</li>
        <li>
          Email: <a href={`mailto:${t.email}`}>{t.email}</a>
        </li>
        <li>Sitio web: {t.web}</li>
      </ul>

      <h2 id="uso">Uso de la web</h2>
      <p>
        {t.marca} diseña invitaciones de boda digitales y las herramientas que las acompañan: confirmaciones, panel de los
        novios y fotos en directo. Al usar la web, una invitación o la página de subida de fotos te comprometes a hacerlo de
        buena fe: sin subir contenido ilegal, ofensivo o de terceros sin su permiso, y sin intentar acceder a lo que no es
        tuyo.
      </p>
      <p>
        Cada invitación es de la pareja que la encarga. Lo que escriben los invitados en el muro o suben a En directo es
        responsabilidad de quien lo sube; los novios lo moderan y nosotros retiramos lo que se nos comunique como ilícito.
      </p>

      <h2 id="propiedad">Propiedad intelectual</h2>
      <p>
        La marca, el diseño de la web, las plantillas y el código son de {t.razonSocial}. Las fotos y textos de cada
        invitación son de la pareja o de sus autores. No se pueden copiar ni reutilizar sin permiso.
      </p>

      <h2 id="responsabilidad">Responsabilidad</h2>
      <p>
        Cuidamos que la web funcione y esté al día, pero no podemos garantizar que no haya nunca interrupciones. No
        respondemos de los contenidos de las webs externas a las que se enlace (mapas, listas de boda, reservas).
      </p>

      <h2 id="datos">Datos personales</h2>
      <p>
        Cómo tratamos los datos de las parejas y de los invitados está en la página de{" "}
        <Link href="/privacidad">privacidad</Link>.
      </p>

      <h2 id="ley">Ley aplicable</h2>
      <p>
        Se aplica la ley española. Para cualquier conflicto, y si quien reclama es un consumidor, son competentes los
        juzgados de su domicilio.
      </p>
    </Legal>
  );
}

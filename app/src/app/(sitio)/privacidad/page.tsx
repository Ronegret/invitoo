import type { Metadata } from "next";
import Legal from "@/components/sitio/Legal";
import { TITULAR } from "@/lib/legal";
import { AVISO_BORRADO_DIAS, PLANES_MOMENTOS } from "@/lib/momentos/planes";
import { TEXTO_PERMISO_SALUD } from "@/lib/rsvp";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Qué datos tratamos en Invitoo, de quién, para qué y durante cuánto tiempo: parejas, invitados y confirmaciones (con alergias solo con permiso) y las fotos de En directo.",
  alternates: { canonical: "/privacidad" },
  robots: { index: true, follow: true },
};

const MESES = PLANES_MOMENTOS.directo.mesesOnline;

/**
 * Política de privacidad. PLANTILLA: los datos del titular salen de
 * `lib/legal.ts` (con marcadores) y todo el texto está pendiente de revisión
 * por un abogado; lo dice el banner de arriba.
 *
 * Está escrita para lo que hace el producto hoy: si cambia un plazo o un
 * proveedor, hay que cambiarlo aquí también.
 */
export default function Privacidad() {
  const t = TITULAR;
  return (
    <Legal titulo="Privacidad">
      <p>
        En {t.marca} hacemos invitaciones de boda digitales. Eso significa tratar datos de dos tipos de personas: las
        parejas que nos encargan la invitación y sus invitados. Aquí explicamos, sin letra pequeña, qué datos son, quién
        decide sobre ellos, para qué se usan y cuándo se borran.
      </p>

      <h2 id="quien">Quién es quién</h2>
      <ul>
        <li>
          <strong>Titular de {t.web}:</strong> {t.razonSocial}, NIF {t.nif}, con domicilio en {t.domicilio}. Email:{" "}
          <a href={`mailto:${t.email}`}>{t.email}</a>.
        </li>
        <li>
          <strong>Datos de las parejas (nuestros clientes):</strong> {t.marca} es el <em>responsable del tratamiento</em>.
        </li>
        <li>
          <strong>Datos de los invitados</strong> (confirmaciones, mensajes, fotos y vídeos de En directo): el{" "}
          <em>responsable</em> es la pareja que se casa, que decide a quién invita y qué pide.
          {` ${t.marca}`} actúa como <em>encargado del tratamiento</em> (art. 28 RGPD): los guardamos y los mostramos por
          cuenta de la pareja y no los usamos para nada más.
        </li>
      </ul>

      <h2 id="parejas">Si sois la pareja</h2>
      <p>
        Tratamos vuestros nombres, la fecha y los lugares de la boda, el email con el que entráis al panel (y el de quien
        invitéis a ayudaros, como vuestra wedding planner), vuestro teléfono si nos escribís por WhatsApp y los datos de
        facturación y pago del encargo. Los usamos para hacer la invitación, daros acceso al panel, atenderos y cumplir
        con nuestras obligaciones contables y fiscales.
      </p>
      <p>
        Base legal: el contrato que nos une (art. 6.1.b RGPD) y el cumplimiento de obligaciones legales (art. 6.1.c) para
        la facturación. Los datos de facturación se conservan el tiempo que exige la ley; el resto, mientras dure el
        servicio y después hasta que prescriban las posibles responsabilidades.
      </p>
      <p id="correos">
        Os escribimos por email lo que hace falta para el servicio (bienvenida, cuándo se publica la invitación, el
        resumen de confirmaciones, la cuenta atrás y el álbum después de la boda) y, como clientes, alguna vez algo
        relacionado (pediros una reseña, el código para amigos que se casan o la felicitación del aniversario; art. 21.2
        LSSI). Como mucho un correo al día. En cada uno hay un enlace para darse de baja con un clic y otro para elegir
        qué os llega. Los correos salen con Resend, nuestro proveedor de envío. No llevan píxeles de seguimiento ni
        enlaces rastreados: no sabemos si los abrís. Guardamos un registro de qué correo salió y cuándo (para no
        mandarlo dos veces) durante 36 meses, y vuestras preferencias mientras queráis que las respetemos. A los
        invitados no les escribimos.
      </p>

      <h2 id="invitados">Si eres invitado</h2>
      <h3>Qué datos</h3>
      <ul>
        <li>Tu nombre y el de quienes vengan contigo, si vienes o no, el menú y si usáis el autobús.</li>
        <li>Un teléfono y un mensaje para los novios, si quieres darlos (son opcionales).</li>
        <li>Lo que escribas en el muro de la invitación.</li>
        <li>
          <strong>Alergias e intolerancias.</strong> Son datos de salud (art. 9 RGPD) y solo se comparten si das tu
          permiso expreso marcando la casilla «{TEXTO_PERMISO_SALUD}». Si no la marcas, los novios y el catering solo ven
          que tienen que preguntarte; el detalle no aparece en su panel ni en el Excel. Puedes retirar el permiso cuando
          quieras corrigiendo tu respuesta desde el mismo enlace o escribiéndonos.
        </li>
      </ul>
      <h3>Para qué</h3>
      <p>
        Para que los novios sepan quién viene, preparen el menú y el transporte, y para pasarle al catering lo
        que necesita para cocinar. Nada más: no hay publicidad, no vendemos datos y no los cruzamos con nada.
      </p>
      <h3>Quién los ve</h3>
      <p>
        Los novios y las personas a las que ellos den acceso a su panel (por ejemplo, su wedding planner). El catering y
        el transportista reciben de los novios el Excel con lo que necesitan.
      </p>

      <h2 id="fotos">Fotos y mensajes de En directo</h2>
      <p>
        El día de la boda, los invitados pueden subir fotos, vídeos cortos y mensajes desde un código QR, sin apps ni
        registro. Para eso pedimos solo un nombre (vale un apodo) y que confirmes que tienes permiso de quienes salen en
        las fotos, y que no subes imágenes de menores sin el consentimiento de sus padres o tutores.
      </p>
      <ul>
        <li>
          <strong>Dónde se ven:</strong> en la pantalla del salón (si los novios la usan), en la galería de la página de
          subida y en el panel de los novios, que pueden descargarlo todo en un ZIP.
        </li>
        <li>
          <strong>Retirada inmediata:</strong> cualquier invitado puede retirar una foto desde la página de subida. Deja de
          verse al momento y queda «pendiente de revisar» para los novios, que deciden si la restauran o la dejan fuera.
        </li>
        <li>
          <strong>Antiabusos:</strong> guardamos un identificador aleatorio de tu navegador junto a cada subida y usamos tu
          dirección IP solo un rato, en memoria, para limitar el ritmo de subidas. No se usa para nada más.
        </li>
        <li>
          <strong>Las fotos se preparan en tu móvil</strong> antes de subir: se reducen de tamaño y se quitan los datos
          internos de la cámara (como la ubicación GPS) al volver a codificarlas. Los vídeos se suben tal cual y, si los
          novios tienen contratado guardar el original de cada foto, ese original también.
        </li>
      </ul>
      <p>
        Base legal: la de los novios como responsables. Para quien sube, su propia decisión de hacerlo; para quien aparece,
        el interés legítimo de los novios en conservar el recuerdo de su boda, con el derecho a pedir la retirada en
        cualquier momento.
      </p>

      <h2 id="plazos">Cuánto tiempo</h2>
      <ul>
        <li>
          La invitación y la página de fotos siguen en línea {MESES} meses después de la boda, salvo que se acuerde otra
          fecha (los novios pueden ampliar el plazo de las fotos).
        </li>
        <li>
          Las fotos, los vídeos y los mensajes se borran automáticamente al terminar ese plazo. Avisamos a los novios{" "}
          {AVISO_BORRADO_DIAS} días antes para que puedan descargarlo todo.
        </li>
        <li>
          Las confirmaciones y la lista de invitados se pueden borrar en cualquier momento desde el panel. Si no, se borran
          cuando la invitación deja de estar en línea, con un margen máximo de [PLAZO DE BORRADO].
        </li>
      </ul>

      <h2 id="proveedores">Con quién trabajamos</h2>
      <p>Para dar el servicio usamos estos proveedores (subencargados), con contrato de encargo de tratamiento:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: base de datos, cuentas y almacenamiento de las fotos. Los datos se guardan en servidores
          de la Unión Europea (Irlanda).
        </li>
        <li>
          <strong>Vercel</strong>: alojamiento de la web y entrega de las páginas. Vercel Inc. es una empresa de Estados
          Unidos; las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. y en las cláusulas
          contractuales tipo de la Comisión Europea.
        </li>
        <li>
          <strong>Resend</strong>: envío de los correos automáticos (vuestro email, el asunto y el contenido de cada
          correo, que Resend guarda 30 días). Resend Inc. es una empresa de Estados Unidos y guarda esos datos allí; las
          transferencias se amparan en su certificación en el Marco de Privacidad de Datos UE-EE. UU. y en las cláusulas
          contractuales tipo de la Comisión Europea incluidas en su contrato de encargo de tratamiento.
        </li>
        <li>
          Si nos pagáis o nos escribís: el proveedor de pagos del enlace de pago, WhatsApp y el correo electrónico, cada uno
          con su propia política.
        </li>
      </ul>

      <h2 id="cookies">Cookies y almacenamiento del navegador</h2>
      <p>
        No usamos cookies de publicidad ni de analítica. Solo las técnicas imprescindibles: la de la sesión del panel de
        los novios y, en tu navegador, unos datos locales para recordar tu respuesta, tu nombre en la página de fotos y que
        ya aceptaste las condiciones. Se quedan en tu móvil y puedes borrarlos desde el navegador.
      </p>
      <p id="visitas">
        Para saber cuánta gente visita la web y abre cada invitación contamos las visitas nosotros mismos, sin cookies
        y sin guardar nada en tu navegador: sumamos páginas vistas, de qué web llegas (solo el dominio) y los clics en
        «Reservar» y en WhatsApp. Para estimar cuántas personas distintas nos visitan cada día calculamos un resumen
        irreversible (hash) de la conexión y del navegador con una clave aleatoria que cambia cada día; la clave y los
        resúmenes se borran a la mañana siguiente, así que después ya no se pueden relacionar con nadie. Tu IP no se
        guarda nunca. Solo quedan totales por día, que conservamos 25 meses, no compartimos con nadie y no cruzamos con
        otros datos. Si tu navegador tiene activado «No rastrear» o Global Privacy Control, no contamos tu visita. Base
        legal: nuestro interés legítimo en entender cómo se usa la web (art. 6.1.f RGPD).
      </p>

      <h2 id="derechos">Vuestros derechos</h2>
      <p>
        Podéis pedir acceso a vuestros datos, rectificarlos, suprimirlos, oponeros o limitar su tratamiento, llevarlos a
        otro sitio (portabilidad) y retirar un consentimiento sin que eso afecte a lo hecho antes. Si eres invitado, lo más
        rápido es pedírselo a los novios; también puedes escribirnos a <a href={`mailto:${t.email}`}>{t.email}</a> y se lo
        hacemos llegar o lo resolvemos con ellos. Respondemos en un plazo máximo de un mes.
      </p>
      <p>
        Si creéis que no lo hemos hecho bien, podéis reclamar ante la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          aepd.es
        </a>
        ).
      </p>
    </Legal>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Legal from "@/components/sitio/Legal";
import { ANADIDOS, GARANTIA, PLANES, euros } from "@/data/sitio";
import { TITULAR } from "@/lib/legal";
import { AMPLIACIONES_MOMENTOS, PLANES_MOMENTOS } from "@/lib/momentos/planes";
import { PLAZOS_CAMBIO, RONDAS_TRAS_PUBLICAR } from "@/lib/planes-boda";

export const metadata: Metadata = {
  title: "Condiciones de contratación",
  description:
    "Qué compráis en Invitoo, cuánto tarda, qué cambios entran, cómo se paga y cuándo os devolvemos el dinero.",
  alternates: { canonical: "/condiciones" },
};

/**
 * Condiciones de contratación.
 *
 * BORRADOR: REVISAR CON ASESOR. Ni los datos del titular (marcadores de
 * `lib/legal.ts`) ni la política de devoluciones están validados. Lo que hay
 * aquí es la PROPUESTA: devolución íntegra hasta que empieza el diseño y,
 * desde entonces, ninguna, apoyada en la excepción del art. 103 c) del
 * TRLGDCU (servicios hechos según las especificaciones del consumidor) y en
 * el consentimiento expreso para empezar dentro del plazo de desistimiento
 * (arts. 103 a) y 108.3). Un asesor tiene que confirmar el texto y cómo se
 * recoge ese consentimiento antes de publicar.
 *
 * Precios, plazos y rondas salen de `data/sitio.ts`, `lib/planes-boda.ts` y
 * `lib/momentos/planes.ts`: si cambian allí, cambian aquí.
 */
export default function Condiciones() {
  const t = TITULAR;
  const directo = PLANES_MOMENTOS.directo;
  const gestionado = PLANES_MOMENTOS.gestionado;
  const conservar = AMPLIACIONES_MOMENTOS.conservar;
  const rondas = (id: keyof typeof RONDAS_TRAS_PUBLICAR) => {
    const n = RONDAS_TRAS_PUBLICAR[id];
    return n === null ? "sin límite" : n === 1 ? "1 ronda" : `${n} rondas`;
  };

  return (
    <Legal titulo="Condiciones de contratación">
      <p>
        Esto es lo que contratáis cuando nos encargáis vuestra invitación: qué incluye, cuánto tarda, cómo se paga y qué
        pasa si cambiáis de idea. Lo hemos escrito para que se entienda a la primera.
      </p>

      <h2 id="quien">Quién os lo vende</h2>
      <ul>
        <li>Nombre o razón social: {t.razonSocial}</li>
        <li>NIF: {t.nif}</li>
        <li>Domicilio: {t.domicilio}</li>
        <li>
          Email: <a href={`mailto:${t.email}`}>{t.email}</a> · Web: {t.web}
        </li>
      </ul>

      <h2 id="que">Qué compráis</h2>
      <p>
        Una invitación de boda digital hecha a medida por nosotros, con vuestro panel para gestionar invitados y
        confirmaciones, online hasta doce meses después de la boda. Cada plan dice en <Link href="/precios">precios</Link>{" "}
        lo que incluye y lo que no. En resumen:
      </p>
      <ul>
        {PLANES.map((p) => (
          <li key={p.id}>
            <strong>
              {p.nombre}: {p.desde ? "desde " : ""}
              {euros(p.precio)} €
            </strong>
            . {p.resumen} {p.plazo}.{p.desde ? " El precio final se cierra en un presupuesto antes de empezar." : ""}
          </li>
        ))}
        <li>
          <strong>
            {directo.nombre}: {euros(directo.precio)} €
          </strong>{" "}
          ({gestionado.nombre}, {euros(gestionado.precio)} €). Las fotos de los invitados en directo en la pantalla del
          salón. {conservar.nombre}: {euros(conservar.precio)} € por cada año más.
        </li>
        <li>
          Los añadidos (
          {ANADIDOS.map((a) => `${a.nombre.charAt(0).toLowerCase()}${a.nombre.slice(1)}, ${a.desde ? "desde " : ""}${euros(a.precio)} €${a.unidad ? ` ${a.unidad}` : ""}`).join("; ")}
          ).
        </li>
      </ul>

      <h2 id="precio">Precio y pago</h2>
      <ul>
        <li>Todos los precios llevan el IVA (21 %) incluido. Es un pago único: sin cuotas ni comisión por invitado.</li>
        <li>
          Se paga en línea con Stripe, una plataforma de pago segura: tarjeta, Apple Pay, Google Pay y, cuando esté
          disponible, Bizum. Nosotros no vemos ni guardamos los datos de vuestra tarjeta.
        </li>
        <li>Al pagar os llegan por correo la confirmación y la factura.</li>
        <li>
          En el Estudio, o en encargos a medida, os podemos proponer pagar una señal al empezar y el resto al publicar. Lo
          que se acuerde va escrito en el presupuesto.
        </li>
        <li>
          Si venís de una boda nuestra, tenéis un código de descuento: se escribe en la página de pago. Un código por
          reserva.
        </li>
      </ul>

      <h2 id="plazos">Cómo empezamos y plazos de entrega</h2>
      <ul>
        <li>
          Después de pagar, os escribimos en menos de un día laborable para fijar la videollamada de diseño (unos veinte
          minutos).
        </li>
        <li>
          El plazo cuenta desde esa videollamada y desde que nos mandáis lo necesario (nombres, fecha, lugares, fotos y
          textos): Invitoo y Con canción, cinco días laborables; Estudio, entrega prioritaria en 48 horas o lo que diga el
          presupuesto. Si algo nuestro se retrasa, os avisamos antes y con fecha nueva.
        </li>
        <li>
          Cuando nos pedís un cambio, os respondemos en unas {PLAZOS_CAMBIO.respuestaHoras} horas laborables y queda hecho
          en {PLAZOS_CAMBIO.hechoHoras} horas laborables.
        </li>
      </ul>

      <h2 id="cambios">Cambios incluidos</h2>
      <p>
        {GARANTIA.titulo}: {GARANTIA.texto.charAt(0).toLowerCase() + GARANTIA.texto.slice(1)} Después de publicarla, cada
        plan incluye unas rondas de cambios (una ronda es una petición, con todo lo que queráis cambiar en ella): Invitoo,{" "}
        {rondas("invitoo")}; Con canción, {rondas("cancion")}; Estudio, {rondas("estudio")}. Las rondas de más, o un
        rediseño desde cero, se presupuestan aparte.
      </p>

      <h2 id="desistimiento">Si cambiáis de idea: desistimiento y devoluciones</h2>
      <p>
        Como compráis a distancia, tenéis derecho a desistir en un plazo de catorce días naturales desde la contratación,
        sin dar explicaciones (art. 102 y siguientes del texto refundido de la Ley General para la Defensa de los
        Consumidores y Usuarios, TRLGDCU).
      </p>
      <p>
        Pero lo que hacemos es un trabajo a medida: vuestra invitación se diseña con vuestros nombres, vuestra historia y
        vuestras indicaciones. Por eso, y conforme al art. 103 del TRLGDCU (servicios confeccionados según las
        especificaciones del consumidor, y servicios que se empiezan a prestar con vuestro consentimiento expreso),{" "}
        <strong>nuestra política es esta:</strong>
      </p>
      <ul>
        <li>
          <strong>Hasta que empecemos el diseño, os devolvemos el importe entero</strong>, por el mismo medio de pago y en
          un máximo de catorce días.
        </li>
        <li>
          Empezamos el diseño solo cuando nos dais vuestra conformidad expresa (por escrito, en el email o el mensaje con
          el que os confirmamos que nos ponemos a ello) y reconocéis que, desde ese momento, perdéis el derecho de
          desistimiento.{" "}
          <strong>Desde que empieza el diseño, no hay devolución</strong>, porque el trabajo ya está hecho para vosotros y
          no se puede reaprovechar.
        </li>
        <li>
          Lo mismo vale para {directo.nombre} y los añadidos: devolución íntegra hasta que empecemos a prepararlos para
          vuestra boda.
        </li>
        <li>
          Si no podemos entregar lo contratado por causa nuestra, os devolvemos lo pagado por lo que no se haya entregado.
          Esto no limita los derechos que os da la ley.
        </li>
      </ul>
      <p>
        Para desistir, escribidnos a <a href={`mailto:${t.email}`}>{t.email}</a> diciendo que desistís del contrato, con
        vuestros nombres y el email con el que pagasteis. Podéis usar este modelo, aunque no es obligatorio:
      </p>
      <blockquote className="mt-4 border-l-2 border-[var(--acento)]/50 pl-5 opacity-85">
        A la atención de {t.razonSocial}, {t.domicilio}, {t.email}: os comunico que desisto del contrato de prestación del
        siguiente servicio: […]. Contratado el […]. Nombre: […]. Domicilio: […]. Firma (solo en papel): […]. Fecha: […].
      </blockquote>

      <h2 id="online">Cuánto tiempo sigue online</h2>
      <p>
        La invitación, el álbum y el libro de buenos deseos siguen online doce meses después de la boda. Antes de borrar
        nada, os avisamos para que podáis descargarlo todo o ampliarlo un año más ({euros(conservar.precio)} €).
      </p>

      <h2 id="contenido">Lo que nos mandáis</h2>
      <p>
        Nos dais permiso para usar las fotos, textos y música que nos mandáis solo para hacer vuestra invitación. Tienen que
        ser vuestros o tener permiso de su autor. No enseñamos vuestra invitación como ejemplo sin preguntaros antes.
      </p>

      <h2 id="reclamaciones">Dudas y reclamaciones</h2>
      <p>
        Escribidnos a <a href={`mailto:${t.email}`}>{t.email}</a>: respondemos en un día laborable. Si no quedáis
        conformes, podéis acudir a los servicios de consumo de vuestra comunidad autónoma. Se aplica la ley española y,
        siendo consumidores, son competentes los juzgados de vuestro domicilio. Más en el{" "}
        <Link href="/aviso-legal">aviso legal</Link> y en <Link href="/privacidad">privacidad</Link>.
      </p>
    </Legal>
  );
}

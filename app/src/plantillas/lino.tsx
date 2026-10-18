import {
  Alojamiento,
  Capitulos,
  Cierre,
  CuentaAtras,
  DressCode,
  Entra,
  Galeria,
  Itinerario,
  Muro,
  Notas,
  Playlist,
  PortadaFoto,
  Regalos,
  Rsvp,
  type Props,
} from "./comun";

/**
 * LINO — boda de mediodía, sencilla y luminosa
 *
 * Criterio: **una casa abierta**. Ni protocolo ni secciones de más: el orden
 * es el de quien llega, saluda, come y se queda. Portada editorial,
 * itinerario en lista y diez secciones justas. Es la hermana tranquila de
 * Sobre: el mismo criterio de papel, pero sin misa y sin etiqueta.
 */
export default function Lino({ inv, b }: Props) {
  const portada = b("portada");
  const itinerario = b("itinerario");
  const capitulos = b("capitulos");
  const galeria = b("galeria");
  const notas = b("notas");
  const dress = b("dressCode");
  const aloj = b("alojamiento");
  const playlist = b("playlist");
  const regalos = b("regalos");
  const rsvp = b("rsvp");

  return (
    <>
      {portada && (
        <PortadaFoto
          a={inv.pareja.a}
          b={inv.pareja.b}
          fecha={inv.pareja.fecha}
          frase={portada.frase}
          foto={portada.foto}
          variante="bajo"
        />
      )}

      {itinerario && (
        <Entra>
          <Itinerario {...itinerario} fecha={inv.pareja.fecha} forma="lista" />
        </Entra>
      )}

      <Entra>
        <CuentaAtras hasta={inv.pareja.fecha} />
      </Entra>

      {notas && (
        <Entra>
          <Notas {...notas} />
        </Entra>
      )}

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}

      {galeria && (
        <Entra>
          <Galeria fotos={galeria.fotos} titulo={galeria.titulo} variante="sangre" />
        </Entra>
      )}

      {dress && (
        <Entra>
          <DressCode {...dress} />
        </Entra>
      )}

      {aloj && (
        <Entra>
          <Alojamiento {...aloj} />
        </Entra>
      )}

      {regalos && (
        <Entra>
          <Regalos {...regalos} />
        </Entra>
      )}

      {playlist && (
        <Entra>
          <Playlist {...playlist} />
        </Entra>
      )}

      {rsvp && (
        <Entra>
          <Rsvp slug={inv.slug} {...rsvp} />
        </Entra>
      )}

      <Entra>
        <Muro slug={inv.slug} />
      </Entra>

      <Cierre a={inv.pareja.a} b={inv.pareja.b} fecha={inv.pareja.fecha} />
    </>
  );
}

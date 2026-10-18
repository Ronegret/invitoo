import {
  Album,
  Alojamiento,
  Capitulos,
  Cierre,
  CuentaAtras,
  DressCode,
  Entra,
  Galeria,
  Hashtag,
  Itinerario,
  Muro,
  Notas,
  Playlist,
  PortadaFoto,
  Regalos,
  Respiro,
  Rsvp,
  type Props,
} from "./comun";

/**
 * FLORACIÓN — boda de campo, primavera, verdes y terracota
 *
 * Criterio: **se entra por la emoción**. Una boda de campo se elige con el
 * corazón, así que aquí manda la fotografía y la historia, y la logística
 * viene detrás. El itinerario va en lista compacta y no en tarjetas
 * centradas: en el campo hay cuatro momentos y se leen de un vistazo.
 */
export default function Floracion({ inv, b }: Props) {
  const portada = b("portada");
  const itinerario = b("itinerario");
  const capitulos = b("capitulos");
  const galeria = b("galeria");
  const notas = b("notas");
  const hashtag = b("hashtag");
  const dress = b("dressCode");
  const aloj = b("alojamiento");
  const playlist = b("playlist");
  const regalos = b("regalos");
  const album = b("album");
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
          variante="centro"
        />
      )}

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}

      <Respiro foto={galeria?.fotos[1]} frase={"Nos casamos entre olivos. Venid con calzado cómodo."} />

      {itinerario && (
        <Entra>
          <Itinerario {...itinerario} fecha={inv.pareja.fecha} forma="lista" />
        </Entra>
      )}

      <Entra>
        <CuentaAtras hasta={inv.pareja.fecha} />
      </Entra>

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

      {notas && (
        <Entra>
          <Notas {...notas} />
        </Entra>
      )}

      {playlist && (
        <Entra>
          <Playlist {...playlist} />
        </Entra>
      )}

      {regalos && (
        <Entra>
          <Regalos {...regalos} />
        </Entra>
      )}

      {album && (
        <Entra>
          <Album {...album} />
        </Entra>
      )}

      {hashtag && (
        <Entra>
          <Hashtag {...hashtag} />
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

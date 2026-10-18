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
 * CONSTELACIÓN — boda de noche, moderna, azul y oro
 *
 * Criterio: **empieza por la fiesta**. Es la única de las doce donde lo
 * importante no es la ceremonia sino lo que viene después: itinerario y
 * cuenta atrás arriba del todo, la banda sonora y el hashtag en mitad —que
 * es cuando se enseña a los amigos— y la historia al final, ya de
 * madrugada, para quien siga despierto.
 */
export default function Constelacion({ inv, b }: Props) {
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
          <Galeria fotos={galeria.fotos} titulo={galeria.titulo} variante="tira" />
        </Entra>
      )}

      <Respiro foto={galeria?.fotos[1]} frase={"A medianoche encendemos las bengalas."} />

      {dress && (
        <Entra>
          <DressCode {...dress} />
        </Entra>
      )}

      {playlist && (
        <Entra>
          <Playlist {...playlist} />
        </Entra>
      )}

      {hashtag && (
        <Entra>
          <Hashtag {...hashtag} />
        </Entra>
      )}

      {notas && (
        <Entra>
          <Notas {...notas} />
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

      {album && (
        <Entra>
          <Album {...album} />
        </Entra>
      )}

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
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

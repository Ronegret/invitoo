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
 * TERRACOTA — boda boho, finca de secano, barro y naranja quemado
 *
 * Criterio: **se come y se baila**. La comida es el centro de esta boda, así
 * que el itinerario va el primero con sus cuatro momentos y las notas del
 * sitio —que hay camino de tierra, que a las diez refresca, que hay
 * mosquitos— van pegadas detrás, porque aquí importan de verdad y en
 * cualquier otra plantilla estarían enterradas al final.
 */
export default function Terracota({ inv, b }: Props) {
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
          variante="partida"
        />
      )}

      {itinerario && (
        <Entra>
          <Itinerario {...itinerario} fecha={inv.pareja.fecha} forma="centrado" />
        </Entra>
      )}

      {notas && (
        <Entra>
          <Notas {...notas} />
        </Entra>
      )}

      <Entra>
        <CuentaAtras hasta={inv.pareja.fecha} />
      </Entra>

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}

      <Respiro foto={galeria?.fotos[1]} frase={"Venid con hambre."} />

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

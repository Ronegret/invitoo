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
 * BRASA — boda de atardecer largo, rojos, cobre y sombra
 *
 * Criterio: **la luz manda**. Todo gira alrededor de la hora exacta del
 * atardecer, así que cuenta atrás e itinerario van juntos y pegados arriba,
 * y el aviso de puntualidad —en las notas— va justo detrás, que es donde se
 * lee. En una boda que empieza cuando se pone el sol, llegar tarde es
 * perderse la boda entera.
 */
export default function Brasa({ inv, b }: Props) {
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

      <Entra>
        <CuentaAtras hasta={inv.pareja.fecha} />
      </Entra>

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

      <Respiro foto={galeria?.fotos[1]} frase={"Se pone el sol a las siete y media. Sed puntuales."} />

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}

      {galeria && (
        <Entra>
          <Galeria fotos={galeria.fotos} titulo={galeria.titulo} variante="tira" />
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

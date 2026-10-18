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
  Playlist,
  PortadaFoto,
  Regalos,
  Rsvp,
  type Props,
} from "./comun";

/**
 * VELO — boda de etiqueta, urbana, paleta neutra
 *
 * Criterio: **sobriedad**. Nada de cortes a sangre a mitad de página: aquí
 * manda el aire y el silencio. Portada partida, galería en mosaico contenido
 * y menos secciones que en ninguna otra —una boda de etiqueta no lleva
 * hashtag ni álbum colaborativo, y fingir lo contrario la abarata—.
 */
export default function Velo({ inv, b }: Props) {
  const portada = b("portada");
  const itinerario = b("itinerario");
  const capitulos = b("capitulos");
  const galeria = b("galeria");
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

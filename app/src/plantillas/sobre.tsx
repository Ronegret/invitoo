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
 * SOBRE — boda clásica, ceremonia religiosa, invitados de todas las edades.
 *
 * Criterio de esta plantilla: **el orden de una invitación de papel**.
 * Primero la fórmula (quiénes, cuándo, dónde), después lo demás. Por eso la
 * portada es editorial —foto arriba, nombres debajo sobre papel, como una
 * cartulina— y el itinerario va inmediatamente después: la tía que la abre
 * quiere saber la hora de la misa, no leer una historia de amor.
 *
 * La historia y las fotos van al final, que es donde las leen los que
 * tienen tiempo.
 */
export default function Sobre({ inv, b }: Props) {
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
          variante="bajo"
        />
      )}

      {/* Lo primero que se busca en una invitación clásica: la hora. */}
      {itinerario && (
        <Entra>
          <Itinerario {...itinerario} fecha={inv.pareja.fecha} />
        </Entra>
      )}

      <Entra>
        <CuentaAtras hasta={inv.pareja.fecha} />
      </Entra>

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

      {/* Confirmar, pronto: quien ya sabe que va no tiene por qué leerse
          la historia entera antes de decirlo. */}
      {rsvp && (
        <Entra>
          <Rsvp slug={inv.slug} {...rsvp} />
        </Entra>
      )}

      <Respiro
        foto={galeria?.fotos[2]}
        frase="Y ahora, si os apetece, un poco de nosotros."
      />

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}
      {galeria && (
        <Entra>
          <Galeria {...galeria} variante="sangre" />
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
      <Entra>
        <Muro slug={inv.slug} />
      </Entra>

      <Cierre a={inv.pareja.a} b={inv.pareja.b} fecha={inv.pareja.fecha} />
    </>
  );
}

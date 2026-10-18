import {
  Capitulos,
  Cierre,
  CuentaAtras,
  Entra,
  Itinerario,
  Muro,
  Notas,
  PortadaFoto,
  Rsvp,
  type Props,
} from "./comun";

/**
 * TINTA — boda mínima, en blanco y negro
 *
 * Criterio: **quitar**. Es la más corta de las doce a propósito: seis
 * secciones. Quien elige esta plantilla no quiere quince. Sin galería
 * grande, sin hashtag, sin álbum, sin playlist, sin alojamiento. Lo que hay
 * que saber y nada más. Que se pueda pedir una invitación así es una
 * posición de mercado, no una plantilla incompleta.
 */
export default function Tinta({ inv, b }: Props) {
  const portada = b("portada");
  const itinerario = b("itinerario");
  const capitulos = b("capitulos");
  const notas = b("notas");
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

      {capitulos && (
        <Entra>
          <Capitulos {...capitulos} />
        </Entra>
      )}

      {notas && (
        <Entra>
          <Notas {...notas} />
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

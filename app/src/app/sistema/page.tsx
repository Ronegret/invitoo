import type { Metadata } from "next";
import SelloAlianzas from "@/components/SelloAlianzas";
import { Boton, CursorInvitoo, Magnetico } from "@/components/sistema";
import { CAPAS, DURACION, EASE, RADIOS } from "@/lib/diseno/tokens";
import "./muestra.css";

export const metadata: Metadata = {
  title: "Sistema de diseño · Invitoo",
  robots: { index: false, follow: false },
};

const flecha = (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
  </svg>
);

const NIVELES = [
  { n: 1, uso: "Reposo" },
  { n: 2, uso: "Levantado" },
  { n: 3, uso: "Flotante" },
  { n: 4, uso: "Destacado" },
  { n: 5, uso: "Modal" },
];

const PLANTILLAS = [
  { nombre: "Sobre", fondo: "#f3ebe0", tinta: "#5a1420" },
  { nombre: "Constelación", fondo: "#1b2036", tinta: "#e9d9b4" },
  { nombre: "Floración", fondo: "#ece9dc", tinta: "#4c5a3c" },
];

function Sombras() {
  return (
    <div className="sm-rejilla">
      {NIVELES.map(({ n, uso }) => (
        <figure key={n} className="sm-ficha" style={{ boxShadow: `var(--sombra-${n})` }}>
          <span className="sm-ficha-num">{n}</span>
          <figcaption>
            <code>--sombra-{n}</code>
            <span>{uso}</span>
          </figcaption>
        </figure>
      ))}
      <figure className="sm-ficha sm-ficha-papel" style={{ boxShadow: "var(--sombra-papel)" }}>
        <span className="sm-ficha-filete" aria-hidden="true" />
        <figcaption>
          <code>--sombra-papel</code>
          <span>Tarjetas y sobres</span>
        </figcaption>
      </figure>
      <figure className="sm-ficha sm-ficha-centro">
        <span className="sm-lacre" style={{ boxShadow: "var(--sombra-lacre)" }}>
          <SelloAlianzas size={34} />
        </span>
        <figcaption>
          <code>--sombra-lacre</code>
          <span>El sello</span>
        </figcaption>
      </figure>
      <figure className="sm-ficha sm-ficha-centro">
        <span className="sm-pastilla-oro" style={{ boxShadow: "var(--sombra-dorada)" }} />
        <figcaption>
          <code>--sombra-dorada</code>
          <span>Botones de oro</span>
        </figcaption>
      </figure>
    </div>
  );
}

export default function PaginaSistema() {
  return (
    <main className="sm">
      <CursorInvitoo />

      <header className="sm-cabecera">
        <p className="sm-marca">Invitoo · uso interno</p>
        <h1 className="display">Sistema de diseño</h1>
        <p className="sm-entradilla">
          Sombras cálidas teñidas de tinta, radios, foco, curvas y el cursor. Todo lo que hay aquí sale del bloque
          SISTEMA de <code>globals.css</code> y de <code>src/lib/diseno/tokens.ts</code>.
        </p>
      </header>

      <section className="sm-seccion" aria-labelledby="t-sombras">
        <h2 id="t-sombras" className="display">Sombras sobre papel</h2>
        <p className="sm-nota">Contacto corto más difusa larga con spread negativo. Nunca gris: siempre la tinta #12100E.</p>
        <Sombras />
      </section>

      <section className="sm-seccion sm-oscura superficie-oscura" data-cursor-tema="oscuro" aria-labelledby="t-oscuro">
        <h2 id="t-oscuro" className="display">Sobre oscuro</h2>
        <p className="sm-nota">En lo oscuro separa la luz: un filo claro arriba y más densidad abajo. El cursor cambia solo a su versión clara.</p>
        <Sombras />
        <div className="sm-fila">
          <Boton variante="oro" icono={flecha}>Ver la invitación</Boton>
          <Boton variante="contorno">Hablamos</Boton>
          <Boton variante="fantasma">Saltar</Boton>
        </div>
      </section>

      <section className="sm-seccion" aria-labelledby="t-botones">
        <h2 id="t-botones" className="display">Botones</h2>
        <p className="sm-nota">48 px por defecto y 56 px para el gesto principal. Pulsado a 0,98; el oro cruza un brillo al pasar.</p>
        <div className="sm-tabla-botones">
          {(["primario", "oro", "contorno", "fantasma"] as const).map((v) => (
            <div key={v} className="sm-fila">
              <span className="sm-etiqueta">{v}</span>
              <Boton variante={v}>Confirmar</Boton>
              <Boton variante={v} tamano={56} icono={flecha}>¿Vienes?</Boton>
              <Boton variante={v} cargando>Enviando</Boton>
            </div>
          ))}
          <div className="sm-fila">
            <span className="sm-etiqueta">especiales</span>
            <Boton tamano={56} petalos magnetico>
              Con pétalos y magnético
            </Boton>
            <Magnetico>
              <Boton variante="oro" tamano={56} href="#t-cursor">
                Enlace magnético
              </Boton>
            </Magnetico>
            <Boton variante="contorno" disabled>
              Deshabilitado
            </Boton>
          </div>
        </div>
      </section>

      <section className="sm-seccion" aria-labelledby="t-cursor">
        <h2 id="t-cursor" className="display">El cursor</h2>
        <p className="sm-nota">
          Solo con ratón. Pasa por encima de cada pieza: el aro dice lo que va a pasar. Nunca recibe clics y nunca tapa: es un
          tinte.
        </p>
        <div className="sm-cursor">
          <button type="button" className="sm-sobre" data-cursor="abrir" data-cursor-petalos aria-label="Abrir el sobre de ejemplo">
            <span className="sm-sobre-solapa" aria-hidden="true" />
            <span className="sm-lacre sm-sobre-lacre" style={{ boxShadow: "var(--sombra-lacre)" }} aria-hidden="true">
              <SelloAlianzas size={26} />
            </span>
          </button>
          <div className="sm-plantillas">
            {PLANTILLAS.map((p) => (
              <a key={p.nombre} href="#t-cursor" className="sm-plantilla" data-cursor="ver" style={{ background: p.fondo, color: p.tinta }}>
                <span className="display">{p.nombre}</span>
              </a>
            ))}
          </div>
          <div className="sm-carrusel" data-cursor="arrastrar" tabIndex={0} aria-label="Carrusel de ejemplo">
            {["Ceremonia", "Banquete", "Fiesta", "Alojamiento", "Regalo", "Música"].map((t) => (
              <div key={t} className="sm-diapo">
                {t}
              </div>
            ))}
          </div>
          <p className="sm-texto">
            Sobre un párrafo el aro se convierte en una barra fina del alto de la letra, como la caña de una pluma: se lee lo que
            hay debajo y se sabe que se puede seleccionar.
          </p>
          <form className="sm-formulario" action="#">
            <label htmlFor="sm-nombre">En los formularios manda el cursor del sistema</label>
            <input id="sm-nombre" name="nombre" placeholder="Vuestro nombre" autoComplete="off" />
          </form>
        </div>
      </section>

      <section className="sm-seccion" aria-labelledby="t-foco">
        <h2 id="t-foco" className="display">Foco</h2>
        <p className="sm-nota">
          Pulsa Tab. Anillo doble, papel y granate, con <code>box-shadow: var(--foco)</code> o la clase <code>foco-sistema</code>.
        </p>
        <div className="sm-fila">
          <Boton variante="primario">Primero</Boton>
          <Boton variante="contorno">Segundo</Boton>
          <a href="#t-foco" className="sm-enlace foco-sistema">Un enlace de texto</a>
        </div>
      </section>

      <section className="sm-seccion" aria-labelledby="t-radios">
        <h2 id="t-radios" className="display">Radios, curvas y tiempos</h2>
        <div className="sm-rejilla sm-rejilla-radios">
          {Object.entries(RADIOS).map(([k, v]) => (
            <figure key={k} className="sm-radio" style={{ borderRadius: `var(--radio-${k})` }}>
              <figcaption>
                <code>--radio-{k}</code>
                <span>{v}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <ul className="sm-curvas">
          {(["carta", "velo", "sello", "suave"] as const).map((k) => (
            <li key={k} className="sm-curva">
              <span className="sm-curva-pista" aria-hidden="true">
                <span className="sm-curva-bola" style={{ transitionTimingFunction: `var(--ease-${k})` }} />
              </span>
              <code>--ease-{k}</code>
              <span className="sm-valor">{EASE[k]}</span>
            </li>
          ))}
        </ul>
        <div className="sm-dos">
          <dl className="sm-lista">
            {Object.entries(DURACION).map(([k, v]) => (
              <div key={k}>
                <dt><code>--dur-{k}</code></dt>
                <dd>{v} ms</dd>
              </div>
            ))}
          </dl>
          <dl className="sm-lista">
            {Object.entries(CAPAS).map(([k, v]) => (
              <div key={k}>
                <dt><code>--capa-{k}</code></dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}

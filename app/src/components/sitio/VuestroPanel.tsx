import Link from "next/link";
import FlipCard from "@/components/sitio/efectos/FlipCard";
import PulseHeart from "@/components/sitio/efectos/PulseHeart";
import { ENTRADA_PANEL, MENU_PANEL, PANEL } from "@/data/sitio";
import s from "./panel.module.css";

/**
 * «Vuestro panel», en la portada.
 *
 * Una FlipCard: de un lado, lo que ve el invitado al confirmar; del otro,
 * lo que os llega a vosotros en ese momento. Es la misma respuesta vista
 * desde los dos lados, y es lo que mejor explica qué hace el panel.
 *
 * Las dos caras son maquetas en HTML (nítidas a cualquier tamaño, sin
 * peso) con los datos de la boda de ejemplo. El panel ya no tiene mesas ni
 * cronograma (no hacemos de wedding planner): invitados con la lista para
 * imprimir, Libro de buenos deseos, avisos, pedir un cambio, En directo
 * (que se contrata aparte: si no está, se ve en gris con un candado) y el
 * diseño.
 */

const INVITADOS = [
  { nombre: "Carmen Ortega", estado: "Viene", menu: "Carne", nota: "" },
  { nombre: "Javier y Lucía Ruiz", estado: "Vienen", menu: "Pescado · Carne", nota: "Sin gluten" },
  { nombre: "Abuela Pilar", estado: "Viene", menu: "Pescado", nota: "Sin lactosa" },
  { nombre: "Marcos Vidal", estado: "Pendiente", menu: "—", nota: "" },
];

export default function VuestroPanel() {
  const viene = 96;
  const pendientes = 18;
  const noVienen = 6;

  return (
    <section
      id="panel"
      aria-labelledby="panel-titulo"
      className="relative scroll-mt-24 border-t border-[var(--tinta)]/10 bg-[var(--papel)] px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="mx-auto max-w-[72rem]">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-[1rem] text-[var(--acento)]">
              <span aria-hidden className="h-px w-8 bg-current" />
              Vuestra cuenta
            </p>
            <h2 id="panel-titulo" className="display mt-4 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.02]">
              Vuestro panel
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="max-w-[34rem] text-[1.06rem] leading-[1.8] opacity-75">
              Cuando un invitado dice que sí, os llega a vosotros, con su menú
              y sus alergias. Sin hojas de cálculo a medias ni mensajes sueltos.
              Y sin mesas ni horarios que mantener: no os pedimos que hagáis de
              wedding planner.
            </p>
            <p className="mt-4 max-w-[34rem] text-[1rem] leading-[1.7] opacity-70">{ENTRADA_PANEL}</p>
          </div>
        </div>

        <div className="mt-14">
          <FlipCard
            etiquetas={["Lo que ve el invitado", "Lo que veis vosotros"]}
            frente={<CaraInvitado />}
            dorso={<CaraPanel viene={viene} pendientes={pendientes} noVienen={noVienen} />}
          />
        </div>

        {/* ───────────── Lo que hay dentro ───────────── */}
        <ListaPanel className="mt-16" />

        <p className="mt-10">
          <Link
            href="/cuenta/entrar"
            className="enlace-sub inline-flex min-h-12 items-center text-[1rem] underline decoration-[var(--tinta)]/30 underline-offset-4"
          >
            ¿Ya tenéis invitación? Entrad en vuestro panel
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Lo que hay en el panel, con En directo marcado como «aparte». También en /servicios. */
export function ListaPanel({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid border-t border-[var(--tinta)]/15 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 ${className}`}>
      {PANEL.map((p) => (
        <li
          key={p.titulo}
          className={s.entrada}
          data-aparte={p.aparte ? "" : undefined}
          data-latir={p.corazon ? "" : undefined}
        >
          <h3 className="display flex items-center gap-2.5 text-[1.5rem] leading-tight">
            {p.titulo}
            {p.corazon && <PulseHeart size={20} />}
          </h3>
          <p className="mt-2 text-[1rem] leading-[1.65] opacity-75">{p.texto}</p>
          {p.aparte && (
            <p className={s.aparte}>
              <Candado />
              {p.aparte}. Si no lo tenéis, lo veis en gris con un candado y una vista previa.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ─────────────── Cara A: la invitación, en el móvil del invitado ─────────────── */

function CaraInvitado() {
  return (
    <div className={s.mesa}>
      <div
        className={s.movil}
        role="img"
        aria-label="Ilustración de la invitación en el móvil de Carmen: confirma que va, elige carne y deja un deseo para Laura y Rubén."
      >
        <div className={s.movilPantalla} aria-hidden>
          <p className={s.movilSobre}>Para Carmen</p>
          <p className={s.movilNombres}>
            Laura <em>&amp;</em> Rubén
          </p>
          <p className={s.movilPregunta}>¿Nos acompañas?</p>
          <div className={s.opciones}>
            <span className={s.si}>
              Sí, allí estaré <PulseHeart size={16} className={s.corazonSi} />
            </span>
            <span className={s.no}>No podré ir</span>
          </div>
          <p className={s.campoTitulo}>Tu menú</p>
          <div className={s.chips}>
            <span data-sel>Carne</span>
            <span>Pescado</span>
            <span>Vegetal</span>
          </div>
          <p className={s.campoTitulo}>Un deseo para ellos</p>
          <p className={s.deseo}>Que os queráis siempre como el día que os conocimos.</p>
        </div>
      </div>
      <p className={s.nota}>
        Un enlace que la saluda por su nombre. Responde en un minuto, sin
        registrarse.
      </p>
    </div>
  );
}

/* ─────────────── Cara B: lo que os llega a vosotros ─────────────── */

function CaraPanel({ viene, pendientes, noVienen }: { viene: number; pendientes: number; noVienen: number }) {
  const total = viene + pendientes + noVienen;
  return (
    <div
      className={s.ventana}
      role="img"
      aria-label={`Ilustración del panel de los novios: ${viene} de ${total} invitados confirmados, aviso de que Carmen acaba de confirmar, la lista con menús y alergias, el botón Imprimir lista y En directo con candado porque no está contratado.`}
    >
      <div className={s.barra} aria-hidden>
        <i />
        <i />
        <i />
        <span className={s.url}>invitoo.es/panel</span>
        <span className={s.campana}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2.2 2.2 0 0 0 4 0" />
          </svg>
          <b>3</b>
        </span>
      </div>
      <div className={s.cuerpo} aria-hidden>
        <ul className={s.menu}>
          {MENU_PANEL.map((m) => (
            <li
              key={m}
              aria-current={m === "Invitados" ? "page" : undefined}
              data-bloqueado={m === "En directo" ? "" : undefined}
            >
              {m}
              {m === "En directo" && <Candado />}
            </li>
          ))}
        </ul>

        <div className={s.principal}>
          <div className={s.aviso}>
            <PulseHeart size={16} />
            <span>
              <b>Carmen</b> viene · carne · ha dejado un deseo
            </span>
            <span className={s.ahora}>ahora</span>
          </div>

          <div className={s.titulo}>
            <div>
              <p className="display text-[1.6rem] leading-none">Invitados</p>
              <p className="mt-1.5 text-[0.86rem] opacity-70">Laura &amp; Rubén · 30 de marzo de 2027</p>
            </div>
            <span className={s.imprimir}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M7 9V3.5h10V9M7 17H4.5V10h15v7H17M7 14h10v6.5H7Z" />
              </svg>
              Imprimir lista
            </span>
          </div>

          <div className={s.cifras}>
            {[
              { n: viene, t: "vienen" },
              { n: pendientes, t: "por contestar" },
              { n: noVienen, t: "no vienen" },
            ].map((c) => (
              <div key={c.t}>
                <p className="display text-[1.7rem] leading-none tabular-nums">{c.n}</p>
                <p className="mt-1 text-[0.8rem] opacity-70">{c.t}</p>
              </div>
            ))}
          </div>

          <table className={s.tabla}>
            <thead>
              <tr>
                <th>Invitado</th>
                <th>Respuesta</th>
                <th className={s.ancha}>Menú</th>
                <th className={s.ancha}>Alergias</th>
              </tr>
            </thead>
            <tbody>
              {INVITADOS.map((g) => (
                <tr key={g.nombre} data-estado={g.estado === "Pendiente" ? "pendiente" : "si"}>
                  <td>{g.nombre}</td>
                  <td>
                    <span className={s.estado}>{g.estado}</span>
                  </td>
                  <td className={s.ancha}>{g.menu}</td>
                  <td className={s.ancha}>{g.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Candado() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden className="shrink-0">
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

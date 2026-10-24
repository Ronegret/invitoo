import Link from "next/link";
import Cabecera, { Vacio } from "@/components/panel/Cabecera";
import { BotonCopiar } from "@/components/panel/BotonWhatsApp";
import Formulario, { Enviar } from "@/components/panel/Formulario";
import IconoPanel from "@/components/panel/IconosPanel";
import TarjetaDeseo, { type DeseoVista } from "@/components/panel/TarjetaDeseo";
import { exigirPanel, invitacionDelPanel, origen } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import { leerTodosDeseosAccion } from "@/lib/deseos/acciones-panel";
import { listarDeseos, NOMBRE_ORIGEN, ORIGENES, esOrigen, type Deseo } from "@/lib/deseos/datos";
import { formatearFecha, formatearHora } from "@/lib/fecha";
import { qrElegante } from "@/lib/momentos/qr";

export const dynamic = "force-dynamic";

type Ver = "todos" | "nuevos" | "favoritos" | "ocultos";
const VER: { id: Ver; texto: string }[] = [
  { id: "todos", texto: "Todos" },
  { id: "nuevos", texto: "Sin leer" },
  { id: "favoritos", texto: "Favoritos" },
  { id: "ocultos", texto: "Ocultos" },
];

/**
 * El Libro de buenos deseos: lo que os escriben en la invitación, en
 * En directo y por el QR propio, juntos. Aquí se lee, se marca favorito, se
 * oculta lo que no queráis y se descarga «Nuestro libro de buenos deseos»
 * en PDF (A5) para imprimirlo como regalo después de la boda.
 */
export default async function Deseos({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ver?: string; origen?: string }>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  const acceso = await exigirPanel(slug);
  const [inv, todos, base] = await Promise.all([invitacionDelPanel(slug), listarDeseos(acceso.invitacionId), origen()]);

  const ver: Ver = VER.some((v) => v.id === q.ver) ? (q.ver as Ver) : "todos";
  const de = esOrigen(q.origen) ? q.origen : null;
  const cuenta = {
    todos: todos.length,
    nuevos: todos.filter((d) => !d.leido && !d.oculto).length,
    favoritos: todos.filter((d) => d.favorito && !d.oculto).length,
    ocultos: todos.filter((d) => d.oculto).length,
  };
  const pasa = (d: Deseo) =>
    (!de || d.origen === de) &&
    // «Todos» enseña también los ocultos (en gris): al ocultar uno no desaparece
    // de golpe y se puede deshacer en el sitio.
    (ver === "ocultos" ? d.oculto : ver === "todos" || !d.oculto) &&
    (ver !== "nuevos" || !d.leido) &&
    (ver !== "favoritos" || d.favorito);
  const lista = todos.filter(pasa);
  const nuevos = todos.filter((d) => !d.leido && !d.oculto);
  const visibles = todos.length - cuenta.ocultos;

  const vista = (d: Deseo): DeseoVista => ({
    clave: d.clave,
    origen: d.origen,
    nombreOrigen: NOMBRE_ORIGEN[d.origen],
    nombre: d.nombre,
    texto: d.texto,
    original: d.original,
    corregido: d.corregido,
    foto: d.foto,
    oculto: d.oculto,
    favorito: d.favorito,
    leido: d.leido,
    fecha: `${formatearFecha(d.creado, { day: "numeric", month: "short" })}, ${formatearHora(d.creado)}`,
  });

  const enlaceQr = `${base}/i/${slug}/deseos`;
  const qr = qrElegante(enlaceQr, { papel: "transparent" });
  const filtro = (v: Ver, o: string | null = de) => {
    const p = new URLSearchParams();
    if (v !== "todos") p.set("ver", v);
    if (o) p.set("origen", o);
    const s = p.toString();
    return `/panel/${slug}/deseos${s ? `?${s}` : ""}#t-deseos`;
  };

  return (
    <>
      <Cabecera eyebrow="Libro de buenos deseos" titulo="Lo que os desean">
        Los mensajes de la invitación, de En directo y del QR de deseos, todos juntos. Después de la boda, en un libro para
        imprimir.
      </Cabecera>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* ── el libro */}
        <section aria-labelledby="t-libro" className={`${ui.tarjeta} grano relative overflow-hidden`}>
          <div className="flex flex-col gap-5 sm:flex-row">
            <div
              aria-hidden="true"
              className="mx-auto flex aspect-[148/210] w-32 shrink-0 flex-col items-center justify-center rounded-[3px] border border-[#B08D57]/50 bg-[#FBF8F2] p-3 text-center shadow-[var(--sombra-3,0_10px_24px_rgba(0,0,0,.12))] outline outline-1 outline-offset-[-7px] outline-[#B08D57]/40 sm:mx-0"
            >
              <span className="text-[0.42rem] uppercase tracking-[0.2em] text-[var(--acento)]">Nuestro libro de buenos deseos</span>
              <span className="display mt-3 text-[0.95rem] italic leading-tight">
                {inv.pareja.a} &amp; {inv.pareja.b}
              </span>
              <span className="mt-2 h-px w-6 bg-[var(--acento)]" />
              <span className="mt-2 text-[0.5rem] text-[var(--suave)]">
                {formatearFecha(inv.pareja.fecha, { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="t-libro" className={ui.h2}>Nuestro libro de buenos deseos</h2>
              <p className={`mt-1 ${ui.suave}`}>
                A5, con portada, vuestro sello, un índice de quién os escribe y la tipografía de vuestra invitación.{" "}
                {visibles === 1 ? "1 deseo" : `${visibles} deseos`} hasta ahora.
              </p>
            </div>
          </div>
          <form action={`/panel/${slug}/deseos/libro`} method="get" target="_blank" className="mt-5 flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className={ui.etiqueta}>Composición</legend>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {[
                  ["editorial", "Varios por página", "Más corto, como un libro de firmas"],
                  ["uno", "Uno por página", "Cada deseo con su sitio, y su foto"],
                ].map(([v, t, a]) => (
                  <label
                    key={v}
                    className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[var(--linea)] bg-white p-3 has-[:checked]:border-[var(--acento)] has-[:checked]:ring-2 has-[:checked]:ring-[var(--acento)]/20 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--acento)]"
                  >
                    <input type="radio" name="composicion" value={v} defaultChecked={v === "editorial"} className="mt-1 h-4 w-4 accent-[var(--acento)]" />
                    <span>
                      <span className="block text-[0.95rem] font-medium">{t}</span>
                      <span className={`block text-[0.85rem] ${ui.suave}`}>{a}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex min-h-12 items-center gap-3 text-[0.95rem]">
              <input type="checkbox" name="favoritos" value="1" className="h-5 w-5 accent-[var(--acento)]" disabled={cuenta.favoritos === 0} />
              Solo los favoritos {cuenta.favoritos > 0 ? `(${cuenta.favoritos})` : "(aún no hay)"}
            </label>
            <div>
              <label htmlFor="dedicatoria" className={ui.etiqueta}>Dedicatoria (opcional)</label>
              <input
                id="dedicatoria"
                name="dedicatoria"
                maxLength={180}
                placeholder="Para dentro de muchos años"
                className={ui.campo}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={ui.botonLleno}>
                <IconoPanel id="descargar" size={20} /> Descargar PDF
              </button>
              <span className={`text-[0.88rem] ${ui.suave}`}>Se abre en otra pestaña. Listo para la imprenta o para casa.</span>
            </div>
          </form>
        </section>

        {/* ── el QR */}
        <section aria-labelledby="t-qr" className={ui.tarjeta}>
          <h2 id="t-qr" className={ui.h2}>El QR de deseos</h2>
          <p className={`mt-1 ${ui.suave}`}>
            Ponedlo en las mesas o junto al libro de firmas: se abre una página con vuestro estilo donde cada uno deja su nombre
            y su deseo.
          </p>
          <div className="mt-5 flex flex-col items-center gap-5 min-[480px]:flex-row lg:flex-col xl:flex-row">
            <div
              className="w-36 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-[var(--linea)] [&>svg]:h-auto [&>svg]:w-full"
              role="img"
              aria-label="Código QR que abre la página de deseos"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div className="flex w-full min-w-0 flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-1">
              <Link href={`/panel/${slug}/imprimir/deseos-qr`} className={ui.botonLleno}>
                <IconoPanel id="imprimir" size={20} /> Tarjetas para imprimir
              </Link>
              <a href={`/i/${slug}/deseos`} target="_blank" rel="noopener" className={ui.boton}>
                <IconoPanel id="ojo" size={20} /> Ver la página
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>
              <BotonCopiar texto={enlaceQr}>Copiar el enlace</BotonCopiar>
            </div>
          </div>
        </section>
      </div>

      {/* ── los deseos */}
      <section aria-labelledby="t-deseos" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="t-deseos" className={ui.h2}>Los deseos</h2>
          {nuevos.length > 0 && (
            <Formulario accion={leerTodosDeseosAccion} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="claves" value={nuevos.map((d) => d.clave).join(",")} />
              <Enviar variante="borde" pendiente="Marcando…">Marcar todo como leído</Enviar>
            </Formulario>
          )}
        </div>

        <nav aria-label="Filtrar deseos" className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <ul className="flex w-max gap-2">
            {VER.map((v) => (
              <li key={v.id}>
                <Link
                  href={filtro(v.id)}
                  aria-current={ver === v.id ? "true" : undefined}
                  className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-[0.92rem] ${ver === v.id ? "border-[var(--acento)] bg-[var(--acento-claro)] font-medium text-[var(--acento)]" : "border-[var(--linea)] bg-white"} ${ui.foco}`}
                >
                  {v.texto}
                  <span className="tabular-nums opacity-80">{cuenta[v.id]}</span>
                </Link>
              </li>
            ))}
            <li aria-hidden="true" className="mx-1 w-px self-stretch bg-[var(--linea)]" />
            {ORIGENES.map((o) => (
              <li key={o}>
                <Link
                  href={filtro(ver, de === o ? null : o)}
                  aria-current={de === o ? "true" : undefined}
                  className={`inline-flex min-h-12 items-center rounded-full border px-4 text-[0.92rem] ${de === o ? "border-[var(--tinta)] bg-[var(--tinta)] text-white" : "border-[var(--linea)] bg-white"} ${ui.foco}`}
                >
                  {NOMBRE_ORIGEN[o]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-5">
          {todos.length === 0 ? (
            <Vacio
              titulo="Aún no hay deseos"
              accion={
                <Link href={`/panel/${slug}/imprimir/deseos-qr`} className={ui.botonLleno}>
                  Imprimir las tarjetas del QR
                </Link>
              }
            >
              Aquí llegarán los mensajes que os dejen en la invitación, en la pantalla del salón y por el QR de deseos.
            </Vacio>
          ) : lista.length === 0 ? (
            <p className={`rounded-2xl border border-dashed border-[var(--linea)] p-6 text-center ${ui.suave}`}>
              Nada con este filtro.{" "}
              <Link href={filtro("todos", null)} className={ui.enlace}>
                Ver todos
              </Link>
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {lista.map((d) => (
                <li key={d.clave}>
                  <TarjetaDeseo slug={slug} d={vista(d)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

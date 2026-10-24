import Link from "next/link";
import { leerBuzon } from "@/lib/correos/enviar";
import { ASUNTOS_B, datosEjemplo, forzarOscuro, renderizar } from "@/lib/correos/plantillas";
import { FICHAS, SECUENCIA, TEXTO_BASE, describirDisparador } from "@/lib/correos/secuencia";
import { GRUPO_DE, IDS_CORREO, esIdCorreo, type IdCorreo, type IdNovios } from "@/lib/correos/tipos";
import { baseUrl } from "@/lib/momentos/servidor";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const GRUPOS: { titulo: string; ids: IdCorreo[] }[] = [
  { titulo: "Novios · servicio", ids: IDS_CORREO.filter((id) => SECUENCIA.find((p) => p.id === id)?.categoria === "servicio") },
  { titulo: "Novios · fidelización", ids: IDS_CORREO.filter((id) => SECUENCIA.find((p) => p.id === id)?.categoria === "fidelizacion") },
  { titulo: "Estudio", ids: IDS_CORREO.filter((id) => SECUENCIA.find((p) => p.id === id)?.categoria === "estudio") },
];

/**
 * Galería de correos (solo estudio): cada plantilla con datos de ejemplo,
 * a 390 o 600 px, en claro u oscuro, en HTML o texto plano, con su asunto
 * A/B y su ficha; y el buzón local, donde cae todo lo que el motor «envía»
 * cuando no hay Resend.
 */
export default async function Correos({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const vista = uno(sp.vista) === "buzon" ? "buzon" : "plantillas";
  const ancho = uno(sp.ancho) === "390" ? 390 : 600;
  const oscuro = uno(sp.tema) === "oscuro";
  const formato = uno(sp.formato) === "texto" ? "texto" : "html";
  const variante = uno(sp.variante) === "b" ? "b" : "a";
  const idPedido = uno(sp.id);
  const id: IdCorreo = esIdCorreo(idPedido) ? idPedido : "bienvenida";

  const base = await baseUrl();
  const enlace = (cambios: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    const actual: Record<string, string | number | undefined> = { vista, id, ancho, tema: oscuro ? "oscuro" : "claro", formato, variante, correo: uno(sp.correo) };
    for (const [k, v] of Object.entries({ ...actual, ...cambios })) if (v !== undefined && v !== "") q.set(k, String(v));
    return `/estudio/correos?${q.toString()}`;
  };

  return (
    <main className="mx-auto max-w-[76rem] px-5 py-12">
      <p className="text-[0.78rem] uppercase tracking-[0.28em] opacity-60">
        <Link href="/estudio" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Bodas</Link> · Correos
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[clamp(2.2rem,8vw,3.2rem)]">Correos</h1>
        <nav aria-label="Vista" className="flex gap-1">
          <Pastilla href={enlace({ vista: "plantillas" })} activo={vista === "plantillas"}>Plantillas</Pastilla>
          <Pastilla href={enlace({ vista: "buzon" })} activo={vista === "buzon"}>Buzón local</Pastilla>
        </nav>
      </div>

      {vista === "plantillas" ? (
        <Plantillas id={id} base={base} ancho={ancho} oscuro={oscuro} formato={formato} variante={variante} enlace={enlace} />
      ) : (
        <Buzon seleccion={uno(sp.correo)} ancho={ancho} oscuro={oscuro} formato={formato} enlace={enlace} />
      )}
    </main>
  );
}

type Enlace = (c: Record<string, string | number | undefined>) => string;

function Plantillas({ id, base, ancho, oscuro, formato, variante, enlace }: { id: IdCorreo; base: string; ancho: number; oscuro: boolean; formato: string; variante: "a" | "b"; enlace: Enlace }) {
  const datos = datosEjemplo(id, base);
  const correo = renderizar(id, datos, variante);
  const asuntoA = renderizar(id, datos, "a").asunto;
  const asuntoB = ASUNTOS_B[id](datos);
  const ficha = FICHAS[id];
  const pasos = SECUENCIA.filter((p) => p.id === id);
  const grupo = (GRUPO_DE as Record<string, string>)[id as IdNovios] as string | undefined;

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_1fr]">
      <nav aria-label="Plantillas" className="order-2 flex flex-col gap-6 lg:order-1">
        {GRUPOS.map((g) => (
          <div key={g.titulo}>
            <h2 className="text-[0.78rem] uppercase tracking-[0.22em] opacity-60">{g.titulo}</h2>
            <ul className="mt-2 flex flex-col">
              {g.ids.map((x) => (
                <li key={x}>
                  <Link
                    href={enlace({ id: x })}
                    aria-current={x === id ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-[var(--radio-s)] px-3 py-2 text-[1rem] leading-snug ${x === id ? "bg-[var(--tinta)] text-[var(--papel)]" : "hover:bg-[var(--tinta)]/6"}`}
                  >
                    {SECUENCIA.find((p) => p.id === x)?.nombre ?? x}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <section aria-labelledby="ficha" className="order-1 min-w-0 lg:order-2">
        <h2 id="ficha" className="sr-only">Ficha del correo</h2>
        <dl className="grid gap-x-6 gap-y-3 border-y border-[var(--tinta)]/12 py-5 text-[1rem] sm:grid-cols-[9rem_1fr]">
          <dt className="opacity-60">Asunto A</dt>
          <dd className="font-medium">{asuntoA}</dd>
          <dt className="opacity-60">Asunto B</dt>
          <dd className="font-medium">{asuntoB}</dd>
          <dt className="opacity-60">Preheader</dt>
          <dd>{correo.preheader}</dd>
          <dt className="opacity-60">Cuándo</dt>
          <dd>{pasos.map((p) => describirDisparador(p.disparador)).join(" · o · ")}{pasos.some((p) => p.condicion && p.disparador.tipo !== "recurrente") ? ", si se cumple la condición" : ""}</dd>
          <dt className="opacity-60">Objetivo</dt>
          <dd>{ficha.objetivo}</dd>
          <dt className="opacity-60">Base legal</dt>
          <dd>{TEXTO_BASE[ficha.base]}{pasos.some((p) => p.imprescindible) ? " · imprescindible (no se apaga)" : ""}</dd>
          {grupo && (
            <>
              <dt className="opacity-60">Se apaga en</dt>
              <dd>Preferencias → «{grupo}»</dd>
            </>
          )}
          <dt className="opacity-60">Métrica</dt>
          <dd>{ficha.metrica}</dd>
        </dl>

        <Controles ancho={ancho} oscuro={oscuro} formato={formato} variante={variante} enlace={enlace} conVariante />

        <Vista html={correo.html} texto={correo.texto} ancho={ancho} oscuro={oscuro} formato={formato} titulo={`Vista previa: ${correo.asunto}`} />
        <p className="mt-3 text-[0.95rem] opacity-60">Datos de ejemplo (pareja ficticia). El modo oscuro aquí está forzado; en el cliente lo decide el sistema.</p>
      </section>
    </div>
  );
}

async function Buzon({ seleccion, ancho, oscuro, formato, enlace }: { seleccion?: string; ancho: number; oscuro: boolean; formato: string; enlace: Enlace }) {
  const buzon = await leerBuzon().catch(() => []);
  const elegido = buzon.find((c) => c.id === seleccion) ?? buzon[0];
  if (!buzon.length) {
    return (
      <p className="mt-10 max-w-[40rem] border-l-2 border-[var(--acento)] pl-4 text-[1rem] leading-relaxed opacity-75">
        El buzón local está vacío. Sin <code>RESEND_API_KEY</code> no sale nada: lo que el motor envía se guarda aquí (en <code>.correos-local/</code>) para revisarlo.
      </p>
    );
  }
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[22rem_1fr]">
      <nav aria-label="Correos del buzón">
        <ul className="flex flex-col">
          {buzon.slice(0, 60).map((c) => (
            <li key={c.id} className="border-t border-[var(--tinta)]/10">
              <Link
                href={enlace({ correo: c.id })}
                aria-current={c.id === elegido?.id ? "page" : undefined}
                className={`block px-3 py-3 ${c.id === elegido?.id ? "bg-[var(--tinta)] text-[var(--papel)]" : "hover:bg-[var(--tinta)]/6"}`}
              >
                <span className="block text-[1rem] font-medium">{c.asunto}</span>
                <span className="block text-[0.9rem] opacity-70">
                  {c.correo} · {c.para} · {new Date(c.creado).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {elegido && (
        <section className="min-w-0" aria-label="Correo seleccionado">
          <dl className="grid gap-x-6 gap-y-2 border-y border-[var(--tinta)]/12 py-5 text-[1rem] sm:grid-cols-[9rem_1fr]">
            <dt className="opacity-60">De</dt>
            <dd>{elegido.de}</dd>
            <dt className="opacity-60">Para</dt>
            <dd>{elegido.para}</dd>
            <dt className="opacity-60">Asunto</dt>
            <dd className="font-medium">{elegido.asunto}</dd>
            <dt className="opacity-60">Preheader</dt>
            <dd>{elegido.preheader}</dd>
            {Object.entries(elegido.cabeceras ?? {}).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="opacity-60">{k}</dt>
                <dd className="break-all text-[0.95rem]">{v}</dd>
              </div>
            ))}
          </dl>
          <Controles ancho={ancho} oscuro={oscuro} formato={formato} variante="a" enlace={enlace} />
          <Vista html={elegido.html} texto={elegido.texto} ancho={ancho} oscuro={oscuro} formato={formato} titulo={`Vista previa: ${elegido.asunto}`} />
        </section>
      )}
    </div>
  );
}

function Controles({ ancho, oscuro, formato, variante, enlace, conVariante }: { ancho: number; oscuro: boolean; formato: string; variante: "a" | "b"; enlace: Enlace; conVariante?: boolean }) {
  return (
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
      <Grupo nombre="Ancho">
        <Pastilla href={enlace({ ancho: 390 })} activo={ancho === 390}>390 px</Pastilla>
        <Pastilla href={enlace({ ancho: 600 })} activo={ancho === 600}>600 px</Pastilla>
      </Grupo>
      <Grupo nombre="Tema">
        <Pastilla href={enlace({ tema: "claro" })} activo={!oscuro}>Claro</Pastilla>
        <Pastilla href={enlace({ tema: "oscuro" })} activo={oscuro}>Oscuro</Pastilla>
      </Grupo>
      <Grupo nombre="Formato">
        <Pastilla href={enlace({ formato: "html" })} activo={formato === "html"}>HTML</Pastilla>
        <Pastilla href={enlace({ formato: "texto" })} activo={formato === "texto"}>Texto plano</Pastilla>
      </Grupo>
      {conVariante && (
        <Grupo nombre="Asunto">
          <Pastilla href={enlace({ variante: "a" })} activo={variante === "a"}>A</Pastilla>
          <Pastilla href={enlace({ variante: "b" })} activo={variante === "b"}>B</Pastilla>
        </Grupo>
      )}
    </div>
  );
}

function Vista({ html, texto, ancho, oscuro, formato, titulo }: { html: string; texto: string; ancho: number; oscuro: boolean; formato: string; titulo: string }) {
  if (formato === "texto") {
    return (
      <pre className="mt-6 max-w-[40rem] overflow-x-auto whitespace-pre-wrap rounded-[var(--radio-m)] border border-[var(--tinta)]/12 bg-[var(--papel)] p-5 font-mono text-[0.95rem] leading-relaxed">
        {texto}
      </pre>
    );
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-[var(--radio-l)] border border-[var(--tinta)]/12 bg-[var(--tinta)]/4 p-3">
      <iframe
        title={titulo}
        srcDoc={oscuro ? forzarOscuro(html) : html}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="mx-auto block rounded-[var(--radio-m)] bg-white"
        style={{ width: ancho, maxWidth: "100%", height: 1500, colorScheme: oscuro ? "dark" : "light" }}
      />
    </div>
  );
}

function Grupo({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={nombre} className="flex items-center gap-1">
      <span className="mr-1 text-[0.85rem] uppercase tracking-[0.16em] opacity-60">{nombre}</span>
      {children}
    </div>
  );
}

function Pastilla({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[0.95rem] ${activo ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--papel)]" : "border-[var(--tinta)]/20 hover:border-[var(--tinta)]/50"}`}
    >
      {children}
    </Link>
  );
}

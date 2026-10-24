"use client";

import { useId, useState } from "react";
import { bloqueVacio, NOMBRES, TIPOS, type TipoBloque } from "@/lib/bloques";
import type { Bloque, Hotel, Parada } from "@/lib/tipos";

/**
 * Los bloques de una boda, como formularios.
 *
 * Un formulario por tipo, en el orden de la lista (que es el de los datos;
 * cada plantilla decide luego dónde pinta cada cosa). Se ordena con ↑/↓, se
 * añade y se quita. Para lo raro queda el JSON avanzado, plegado.
 *
 * El estado vive aquí y viaja al servidor como JSON en un campo oculto
 * `bloques`: el servidor lo vuelve a validar entero (`lib/bloques.ts`).
 */

const campo =
  "mt-2 w-full border-b border-[var(--tinta)]/25 bg-transparent py-2.5 text-[1rem] outline-none focus:border-[var(--acento)]";
const etiqueta = "block text-[0.76rem] uppercase tracking-[0.24em] opacity-60";
const botonIcono =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-[var(--tinta)]/20 px-3 text-[0.95rem] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";
const botonTexto =
  "inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-5 text-[0.76rem] uppercase tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)]";

function mover<T>(lista: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

// ─────────────────────────────────────────────────────────────── piezas

function Texto({
  nombre,
  valor,
  onCambio,
  lineas,
  pista,
  tipo = "text",
}: {
  nombre: string;
  valor: string | undefined;
  onCambio: (v: string) => void;
  lineas?: number;
  pista?: string;
  tipo?: string;
}) {
  return (
    <label className="block">
      <span className={etiqueta}>{nombre}</span>
      {lineas ? (
        <textarea
          rows={lineas}
          value={valor ?? ""}
          placeholder={pista}
          onChange={(e) => onCambio(e.target.value)}
          className={`${campo} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type={tipo}
          value={valor ?? ""}
          placeholder={pista}
          onChange={(e) => onCambio(e.target.value)}
          className={campo}
        />
      )}
    </label>
  );
}

function Casilla({
  nombre,
  valor,
  onCambio,
}: {
  nombre: string;
  valor: boolean | undefined;
  onCambio: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-[1rem]">
      <input
        type="checkbox"
        checked={Boolean(valor)}
        onChange={(e) => onCambio(e.target.checked)}
        className="h-5 w-5 accent-[var(--acento)]"
      />
      {nombre}
    </label>
  );
}

function Elegir<T extends string>({
  nombre,
  valor,
  opciones,
  onCambio,
}: {
  nombre: string;
  valor: T | undefined;
  opciones: [T | "", string][];
  onCambio: (v: T | undefined) => void;
}) {
  return (
    <label className="block">
      <span className={etiqueta}>{nombre}</span>
      <select
        value={valor ?? ""}
        onChange={(e) => onCambio((e.target.value || undefined) as T | undefined)}
        className={campo}
      >
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Lista de elementos con ↑/↓/quitar y «Añadir». */
function Lista<T>({
  nombre,
  items,
  onCambio,
  nuevo,
  children,
}: {
  nombre: string;
  items: T[];
  onCambio: (items: T[]) => void;
  nuevo: () => T;
  children: (item: T, set: (cambios: Partial<T>) => void, i: number) => React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={etiqueta}>{nombre}</legend>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-[var(--tinta)]/12 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[0.85rem] opacity-60">{i + 1}</span>
            <div className="flex gap-2">
              <button type="button" className={botonIcono} disabled={i === 0} onClick={() => onCambio(mover(items, i, -1))} aria-label={`Subir ${i + 1}`}>↑</button>
              <button type="button" className={botonIcono} disabled={i === items.length - 1} onClick={() => onCambio(mover(items, i, 1))} aria-label={`Bajar ${i + 1}`}>↓</button>
              <button type="button" className={botonIcono} onClick={() => onCambio(items.filter((_, j) => j !== i))} aria-label={`Quitar ${i + 1}`}>✕</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {children(item, (c) => onCambio(items.map((x, j) => (j === i ? { ...x, ...c } : x))), i)}
          </div>
        </div>
      ))}
      <button type="button" className={`${botonTexto} self-start`} onClick={() => onCambio([...items, nuevo()])}>
        Añadir
      </button>
    </fieldset>
  );
}

const porLineas = (t: string) => t.split("\n");
const porParrafos = (t: string) => t.split(/\n[ \t]*\n/);

// ─────────────────────────────────────────────────────── un formulario por tipo

function Formulario({ b, onCambio }: { b: Bloque; onCambio: (b: Bloque) => void }) {
  // Mezcla cambios conservando el tipo del bloque.
  const set = <B extends Bloque>(actual: B, c: Partial<B>) => onCambio({ ...actual, ...c });

  switch (b.t) {
    case "cuentaAtras":
    case "muro":
      return <p className="text-[0.95rem] opacity-60">Este bloque no tiene nada que rellenar.</p>;
    case "portada":
      return (
        <div className="grid gap-5">
          <Texto nombre="Frase" lineas={2} valor={b.frase} onCambio={(v) => set(b, { frase: v })} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Texto nombre="Foto (ruta o URL)" valor={b.foto} onCambio={(v) => set(b, { foto: v || undefined })} pista="/generadas/…-1080.avif o una URL" />
            <Elegir nombre="Composición" valor={b.variante} opciones={[["", "La de la plantilla"], ["centro", "Foto a sangre"], ["bajo", "Editorial"], ["partida", "Partida"]]} onCambio={(v) => set(b, { variante: v })} />
          </div>
        </div>
      );
    case "historia":
      return (
        <div className="grid gap-5">
          <Texto nombre="Párrafos (separados por una línea en blanco)" lineas={8} valor={b.parrafos.join("\n\n")} onCambio={(v) => set(b, { parrafos: porParrafos(v) })} />
          <Texto nombre="Fotos (una por línea)" lineas={3} valor={(b.fotos ?? []).join("\n")} onCambio={(v) => set(b, { fotos: porLineas(v) })} />
        </div>
      );
    case "capitulos":
      return (
        <div className="grid gap-5">
          <Texto nombre="Título de la sección" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} />
          <Lista nombre="Capítulos" items={b.capitulos} onCambio={(c) => set(b, { capitulos: c })} nuevo={(): (typeof b.capitulos)[number] => ({ titulo: "", texto: "" })}>
            {(c, s) => (
              <>
                <Texto nombre="Cuándo" valor={c.cuando} onCambio={(v) => s({ cuando: v || undefined })} pista="2019" />
                <Texto nombre="Título" valor={c.titulo} onCambio={(v) => s({ titulo: v })} />
                <div className="sm:col-span-2"><Texto nombre="Texto" lineas={3} valor={c.texto} onCambio={(v) => s({ texto: v })} /></div>
                <Texto nombre="Foto" valor={c.foto} onCambio={(v) => s({ foto: v || undefined })} />
              </>
            )}
          </Lista>
        </div>
      );
    case "itinerario":
      return (
        <div className="grid gap-5">
          <Texto nombre="Título de la sección" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} pista="El gran día" />
          <Lista nombre="Paradas (hora de Madrid)" items={b.paradas} onCambio={(p) => set(b, { paradas: p })} nuevo={(): Parada => ({ titulo: "", hora: "", lugar: "", direccion: "" })}>
            {(p, s) => (
              <>
                <Texto nombre="Nombre del momento" valor={p.titulo} onCambio={(v) => s({ titulo: v })} pista="Ceremonia" />
                <Texto nombre="Hora" tipo="time" valor={p.hora} onCambio={(v) => s({ hora: v })} />
                <Texto nombre="Lugar" valor={p.lugar} onCambio={(v) => s({ lugar: v })} />
                <Texto nombre="Dirección" valor={p.direccion} onCambio={(v) => s({ direccion: v })} />
                <Texto nombre="Enlace al mapa" valor={p.mapa} onCambio={(v) => s({ mapa: v || undefined })} />
                <Texto nombre="Icono" valor={p.icono} onCambio={(v) => s({ icono: v || undefined })} pista="iglesia, copas, plato…" />
              </>
            )}
          </Lista>
        </div>
      );
    case "rsvp":
      return (
        <div className="flex flex-wrap gap-x-8">
          <Casilla nombre="Pide menú" valor={b.pideMenu} onCambio={(v) => set(b, { pideMenu: v })} />
          <Casilla nombre="Pide alergias" valor={b.pideAlergias} onCambio={(v) => set(b, { pideAlergias: v })} />
          <Casilla nombre="Pide autobús" valor={b.pideBus} onCambio={(v) => set(b, { pideBus: v })} />
          <div className="mt-4 grid w-full gap-5 sm:grid-cols-2">
            <Texto
              nombre="Confirmar antes del"
              tipo="date"
              valor={b.limite?.slice(0, 10)}
              onCambio={(v) => set(b, { limite: v || undefined })}
            />
            <Texto nombre="Por qué esa fecha" valor={b.motivoLimite} onCambio={(v) => set(b, { motivoLimite: v || undefined })} pista="El catering necesita el número final" />
          </div>
        </div>
      );
    case "album":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} />
          <Casilla nombre="Los invitados pueden subir fotos" valor={b.subidaInvitados} onCambio={(v) => set(b, { subidaInvitados: v })} />
        </div>
      );
    case "playlist":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="Enlace de Spotify" valor={b.spotify} onCambio={(v) => set(b, { spotify: v })} />
          <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} />
          <div className="sm:col-span-2"><Texto nombre="Nota" lineas={2} valor={b.nota} onCambio={(v) => set(b, { nota: v || undefined })} /></div>
        </div>
      );
    case "regalos":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="IBAN" valor={b.iban} onCambio={(v) => set(b, { iban: v || undefined })} />
          <Texto nombre="Enlace de pago" valor={b.enlacePago} onCambio={(v) => set(b, { enlacePago: v || undefined })} />
          <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} />
          <Texto nombre="Nota" valor={b.nota} onCambio={(v) => set(b, { nota: v || undefined })} />
        </div>
      );
    case "dressCode":
      return (
        <div className="grid gap-5">
          <Texto nombre="Nota" lineas={2} valor={b.nota} onCambio={(v) => set(b, { nota: v })} />
          <fieldset>
            <legend className={etiqueta}>Paleta</legend>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {b.paleta.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <input type="color" value={c} aria-label={`Color ${i + 1}`} onChange={(e) => set(b, { paleta: b.paleta.map((x, j) => (j === i ? e.target.value : x)) })} className="h-11 w-11 cursor-pointer rounded-full border border-[var(--tinta)]/20 bg-transparent" />
                  <button type="button" className={botonIcono} aria-label={`Quitar color ${i + 1}`} onClick={() => set(b, { paleta: b.paleta.filter((_, j) => j !== i) })}>✕</button>
                </span>
              ))}
              <button type="button" className={botonTexto} onClick={() => set(b, { paleta: [...b.paleta, "#8c1d2c"] })}>Añadir color</button>
            </div>
          </fieldset>
        </div>
      );
    case "alojamiento":
      return (
        <Lista nombre="Opciones" items={b.opciones} onCambio={(o) => set(b, { opciones: o })} nuevo={(): Hotel => ({ nombre: "" })}>
          {(h, s) => (
            <>
              <Texto nombre="Nombre" valor={h.nombre} onCambio={(v) => s({ nombre: v })} />
              <Texto nombre="Nota" valor={h.nota} onCambio={(v) => s({ nota: v || undefined })} pista="A 8 minutos · desde 95 €" />
              <div className="sm:col-span-2"><Texto nombre="Enlace" valor={h.enlace} onCambio={(v) => s({ enlace: v || undefined })} /></div>
            </>
          )}
        </Lista>
      );
    case "galeria":
      return (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} />
            <Elegir nombre="Forma" valor={b.variante} opciones={[["", "La de la plantilla"], ["sangre", "A sangre"], ["tira", "Tira"]]} onCambio={(v) => set(b, { variante: v })} />
          </div>
          <Texto nombre="Fotos (una por línea)" lineas={5} valor={b.fotos.join("\n")} onCambio={(v) => set(b, { fotos: porLineas(v) })} />
        </div>
      );
    case "notas":
      return (
        <Lista nombre="Notas" items={b.items} onCambio={(n) => set(b, { items: n })} nuevo={() => ({ titulo: "", texto: "" })}>
          {(n, s) => (
            <>
              <Texto nombre="Título" valor={n.titulo} onCambio={(v) => s({ titulo: v })} />
              <Texto nombre="Texto" lineas={2} valor={n.texto} onCambio={(v) => s({ texto: v })} />
            </>
          )}
        </Lista>
      );
    case "hashtag":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="Etiqueta (sin #)" valor={b.etiqueta} onCambio={(v) => set(b, { etiqueta: v })} />
          <Texto nombre="Nota" valor={b.nota} onCambio={(v) => set(b, { nota: v || undefined })} />
        </div>
      );
    // —— Protocolo de boda española (docs/12 §3) ——
    case "anuncio":
      return (
        <div className="grid gap-5">
          <Elegir nombre="Quién invita" valor={b.estilo} opciones={[["clasico", "Clásico: los padres"], ["moderno", "Moderno: la pareja"]]} onCambio={(v) => set(b, { estilo: v ?? "moderno" })} />
          <Texto nombre="Texto" lineas={4} valor={b.texto} onCambio={(v) => set(b, { texto: v })} pista="Carmen y Luis, y Ana y Pedro, tienen el placer de invitaros…" />
          <Texto nombre="Padrinos (opcional)" valor={b.padrinos} onCambio={(v) => set(b, { padrinos: v || undefined })} />
        </div>
      );
    case "ninos":
      return (
        <div className="grid gap-5">
          <Elegir nombre="Los niños" valor={b.admitidos} opciones={[["si", "Son bienvenidos"], ["solo-familia", "Solo los de la familia"], ["no", "Noche de adultos"]]} onCambio={(v) => set(b, { admitidos: v ?? "si" })} />
          <Texto nombre="Nota" lineas={2} valor={b.nota} onCambio={(v) => set(b, { nota: v })} />
          <Casilla nombre="Habrá menú infantil" valor={b.menuInfantil} onCambio={(v) => set(b, { menuInfantil: v || undefined })} />
        </div>
      );
    case "preguntas":
      return (
        <div className="grid gap-5">
          <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v || undefined })} pista="Lo que nos estáis preguntando" />
          <Lista nombre="Preguntas" items={b.items} onCambio={(x) => set(b, { items: x })} nuevo={() => ({ p: "", r: "" })}>
            {(q, s) => (
              <>
                <Texto nombre="Pregunta" valor={q.p} onCambio={(v) => s({ p: v })} />
                <Texto nombre="Respuesta" lineas={2} valor={q.r} onCambio={(v) => s({ r: v })} />
              </>
            )}
          </Lista>
        </div>
      );
    case "autobus":
      return (
        <div className="grid gap-5">
          <Lista nombre="Salidas de ida" items={b.ida} onCambio={(x) => set(b, { ida: x })} nuevo={(): { hora: string; desde: string; mapa?: string } => ({ hora: "", desde: "" })}>
            {(i, s) => (
              <>
                <Texto nombre="Hora" tipo="time" valor={i.hora} onCambio={(v) => s({ hora: v })} />
                <Texto nombre="Desde" valor={i.desde} onCambio={(v) => s({ desde: v })} pista="Plaza de España, junto al quiosco" />
                <div className="sm:col-span-2"><Texto nombre="Mapa (opcional)" valor={i.mapa} onCambio={(v) => s({ mapa: v || undefined })} /></div>
              </>
            )}
          </Lista>
          <Texto nombre="Vueltas (una hora por línea)" lineas={3} valor={b.vueltas.join("\n")} onCambio={(v) => set(b, { vueltas: porLineas(v) })} pista={"01:30\n04:00"} />
          <Texto nombre="Nota" lineas={2} valor={b.nota} onCambio={(v) => set(b, { nota: v || undefined })} />
        </div>
      );
    case "extranjeros":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="Título" valor={b.titulo} onCambio={(v) => set(b, { titulo: v })} pista="For our guests from abroad" />
          <Texto nombre="Idioma (código)" valor={b.idioma} onCambio={(v) => set(b, { idioma: v || undefined })} pista="en, fr, de, it…" />
          <div className="sm:col-span-2"><Texto nombre="Texto" lineas={4} valor={b.texto} onCambio={(v) => set(b, { texto: v })} /></div>
        </div>
      );
    case "preboda":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Texto nombre="Cuándo" valor={b.cuando} onCambio={(v) => set(b, { cuando: v })} pista="Viernes 17, desde las 20:00" />
          <Texto nombre="Dónde" valor={b.lugar} onCambio={(v) => set(b, { lugar: v })} />
          <Texto nombre="Dirección (opcional)" valor={b.direccion} onCambio={(v) => set(b, { direccion: v || undefined })} />
          <div className="sm:col-span-2"><Texto nombre="Texto" lineas={3} valor={b.texto} onCambio={(v) => set(b, { texto: v })} /></div>
        </div>
      );
  }
}

// ──────────────────────────────────────────────────────────────── la lista

export default function EditorBloques({ inicial }: { inicial: Bloque[] }) {
  const [bloques, setBloques] = useState<Bloque[]>(inicial);
  const [tipoNuevo, setTipoNuevo] = useState<TipoBloque>("historia");
  const [borrador, setBorrador] = useState<string | null>(null);
  const [errorJson, setErrorJson] = useState<string | null>(null);
  const idSelect = useId();

  const json = JSON.stringify(bloques, null, 2);

  function aplicarJson() {
    try {
      const v = JSON.parse(borrador ?? json);
      if (!Array.isArray(v)) throw new Error("Tiene que ser una lista: [ … ]");
      setBloques(v as Bloque[]);
      setBorrador(null);
      setErrorJson(null);
    } catch (e) {
      setErrorJson(e instanceof Error ? e.message : "JSON no válido");
    }
  }

  return (
    <section className="mt-14" aria-labelledby="titulo-bloques">
      <input type="hidden" name="bloques" value={json} />
      <h2 id="titulo-bloques" className={etiqueta}>
        Bloques — el contenido de la invitación
      </h2>
      <p className="mt-2 text-[0.92rem] opacity-60">
        Cada plantilla decide dónde va cada bloque; el orden de aquí es el de
        los datos y lo usan las plantillas que siguen la lista.
      </p>

      <ol className="mt-6 flex flex-col gap-5">
        {bloques.map((b, i) => (
          <li key={i} className="rounded-xl border border-[var(--tinta)]/15 bg-[var(--papel)] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="display text-[1.35rem]">
                <span className="mr-2 text-[0.9rem] opacity-50">{i + 1}.</span>
                {NOMBRES[b.t] ?? b.t}
              </h3>
              <div className="flex gap-2">
                <button type="button" className={botonIcono} disabled={i === 0} onClick={() => setBloques(mover(bloques, i, -1))} aria-label={`Subir ${NOMBRES[b.t]}`}>↑</button>
                <button type="button" className={botonIcono} disabled={i === bloques.length - 1} onClick={() => setBloques(mover(bloques, i, 1))} aria-label={`Bajar ${NOMBRES[b.t]}`}>↓</button>
                <button
                  type="button"
                  className={botonIcono}
                  onClick={() => {
                    if (window.confirm(`¿Quitar el bloque «${NOMBRES[b.t]}»?`)) {
                      setBloques(bloques.filter((_, j) => j !== i));
                    }
                  }}
                  aria-label={`Quitar ${NOMBRES[b.t]}`}
                >
                  ✕
                </button>
              </div>
            </div>
            {NOMBRES[b.t] ? (
              <Formulario b={b} onCambio={(nuevo) => setBloques(bloques.map((x, j) => (j === i ? nuevo : x)))} />
            ) : (
              <p className="text-[0.95rem] text-[var(--acento)]">Tipo desconocido: edítalo en el JSON avanzado.</p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label htmlFor={idSelect} className="sr-only">Tipo de bloque</label>
        <select id={idSelect} value={tipoNuevo} onChange={(e) => setTipoNuevo(e.target.value as TipoBloque)} className="min-h-11 border-b border-[var(--tinta)]/25 bg-transparent py-2 text-[1rem]">
          {TIPOS.map((t) => (
            <option key={t} value={t}>{NOMBRES[t]}</option>
          ))}
        </select>
        <button type="button" className={botonTexto} onClick={() => setBloques([...bloques, bloqueVacio(tipoNuevo)])}>
          Añadir bloque
        </button>
      </div>

      <details className="mt-10 rounded-lg border border-[var(--tinta)]/12 p-4">
        <summary className="min-h-11 cursor-pointer py-2 text-[0.85rem] uppercase tracking-[0.18em] opacity-70">
          JSON avanzado
        </summary>
        <p className="mt-2 text-[0.9rem] opacity-60">
          Para casos raros. «Aplicar» sustituye los bloques de arriba; el
          servidor lo valida al guardar.
        </p>
        <textarea
          rows={18}
          spellCheck={false}
          value={borrador ?? json}
          onChange={(e) => setBorrador(e.target.value)}
          aria-label="Bloques en JSON"
          className="mt-3 w-full rounded-lg border border-[var(--tinta)]/20 bg-[var(--papel)] p-4 font-mono text-[0.85rem] leading-relaxed outline-none focus:border-[var(--acento)]"
        />
        {errorJson && (
          <p role="alert" className="mt-2 text-[0.95rem] text-[var(--acento)]">{errorJson}</p>
        )}
        <div className="mt-3 flex gap-3">
          <button type="button" className={botonTexto} onClick={aplicarJson}>Aplicar</button>
          {borrador !== null && (
            <button type="button" className={botonTexto} onClick={() => { setBorrador(null); setErrorJson(null); }}>Descartar</button>
          )}
        </div>
      </details>
    </section>
  );
}

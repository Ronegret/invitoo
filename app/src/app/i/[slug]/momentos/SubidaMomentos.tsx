"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SelloAlianzas from "@/components/SelloAlianzas";
import {
  confirmarSubida,
  enviarMensajeDirecto,
  pedirRetirada,
  ponerPie,
  prepararSubida,
} from "@/lib/momentos/acciones-invitado";
import {
  ArchivoNoValido,
  cola,
  conReintento,
  ErrorRed,
  idDispositivo,
  prepararFoto,
  prepararVideo,
  subir,
  type EnCola,
} from "@/lib/momentos/navegador";
import type { Feed, MomentoPublico } from "@/lib/momentos/tipos";
import { useHidratado, useLocal } from "@/lib/momentos/useLocal";

/**
 * La página de subida del invitado, con dos pestañas:
 *
 *  · «Subir»: un nombre y una casilla (una sola vez), un mensaje opcional
 *    para la tanda, el botón enorme y la lista de lo que se sube, donde cada
 *    foto puede llevar su propio mensaje. Cada foto se comprime en el móvil
 *    y se guarda en una cola (IndexedDB) ANTES de subir: si se va la wifi,
 *    se retoma sola.
 *  · «En directo»: el muro de todos, que se actualiza solo (Realtime si
 *    está configurado; si no, polling: 6 s con la pestaña delante, 30 s
 *    detrás, nada con el móvil bloqueado). Lo nuevo entra con un fundido;
 *    si estás leyendo más abajo, espera arriba («3 nuevas») para que nada
 *    salte. Al tocar una foto se abre a pantalla completa con su mensaje y
 *    su autor, y se pasa de una a otra deslizando.
 */

export type EstadoSubida = "abierto" | "cerrado" | "subidasCerradas" | "muestra" | "caducado";
type Vista = "subir" | "directo";

type Props = {
  slug: string;
  tokenUrl: string | null;
  tokenUrlValido: boolean;
  pareja: { a: string; b: string; fecha: string };
  estado: EstadoSubida;
  videos: { duracion: number } | null;
  pantalla: boolean;
  borrado: string | null;
  retos: string[];
  diseno: { marco: boolean; frase: string };
  maxPie: number;
  vistaInicial: Vista;
  realtime: { url: string; anon: string; canal: string } | null;
};

type Item = {
  clave: string;
  nombre: string;
  tipo: "foto" | "video";
  estado: "preparando" | "esperando" | "subiendo" | "listo" | "pendiente" | "error";
  progreso: number;
  error?: string;
  vista?: string;
  /** El archivo ya está preparado (y en la cola): se puede volver a intentar. */
  reintentable?: boolean;
  /** El pie de foto (de la tanda o suyo). */
  mensaje: string | null;
  /** El id en el servidor, cuando ya ha entrado. */
  id?: string;
};

type Visible = MomentoPublico & { local?: boolean };

const SIMULTANEAS = 2;
const CADA_DELANTE_MS = 6_000;
const CADA_DETRAS_MS = 30_000;
const CADA_REALTIME_MS = 45_000;
const CADA_COMPLETO_MS = 120_000;
const MAX_MURO = 150;

function aleatorio() {
  return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Una server action que falla por red lanza: eso se reintenta. */
async function llamar<T>(fn: () => Promise<T>): Promise<T> {
  return conReintento(async () => {
    try {
      return await fn();
    } catch {
      throw new ErrorRed("acción");
    }
  });
}

const limpiarPie = (t: string, max: number) => t.replace(/\s+/g, " ").trim().slice(0, max) || null;

export default function SubidaMomentos(p: Props) {
  const hidratado = useHidratado();
  const [nombre, setNombre] = useLocal("invitoo:momentos:nombre");
  const [aceptado, setAceptado] = useLocal(`invitoo:momentos:rgpd:${p.slug}`);
  const [tokenGuardado, setTokenGuardado] = useLocal(`invitoo:momentos:token:${p.slug}`);
  const token = p.tokenUrlValido ? p.tokenUrl : tokenGuardado;

  useEffect(() => {
    if (p.tokenUrlValido && p.tokenUrl && p.tokenUrl !== tokenGuardado) setTokenGuardado(p.tokenUrl);
  }, [p.tokenUrlValido, p.tokenUrl, tokenGuardado, setTokenGuardado]);

  const [editandoNombre, setEditandoNombre] = useState(false);
  const listo = hidratado && Boolean(nombre) && aceptado === "1" && !editandoNombre;

  return (
    <div className="momentos mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-[1.0625rem] leading-relaxed">
      <Cabecera pareja={p.pareja} diseno={p.diseno} />

      {!hidratado ? (
        <div className="min-h-[50vh]">
          <noscript>
            <section className="mt-14 text-center">
              <h2 className="display text-[2rem] leading-tight">Hace falta JavaScript para subir fotos</h2>
              <p className="mx-auto mt-5 max-w-[26rem] text-[1.125rem] leading-relaxed opacity-85">
                Las fotos se preparan en tu móvil antes de subirlas, para que vayan rápido y ocupen poco. Activa
                JavaScript en el navegador (o abre esta página en Chrome o Safari) y vuelve a intentarlo.
              </p>
            </section>
          </noscript>
        </div>
      ) : p.estado === "caducado" ? (
        <Aviso titulo="Este álbum ya se ha cerrado">
          Las fotos ya no están aquí. Si quieres alguna, pídesela a {p.pareja.a} y {p.pareja.b}.
        </Aviso>
      ) : p.estado === "cerrado" ? (
        <Aviso titulo="El álbum se abre el día de la boda">
          Vuelve a escanear el código QR el {p.pareja.fecha}. Aquí podrás subir tus fotos y verlas
          {p.pantalla ? " en la pantalla del salón" : " todas juntas"}.
        </Aviso>
      ) : !token ? (
        <Aviso titulo="Escanea el código de tu mesa">
          Para subir fotos, abre la cámara del móvil y apunta al código QR que hay en las mesas. Se
          abrirá esta misma página, lista para subir. También puedes entrar desde el enlace personal de tu
          invitación.
        </Aviso>
      ) : !listo ? (
        <Bienvenida
          {...p}
          nombreInicial={nombre ?? ""}
          yaAceptado={aceptado === "1"}
          onListo={(n) => {
            setNombre(n);
            setAceptado("1");
            setEditandoNombre(false);
          }}
        />
      ) : (
        <Album {...p} token={token} nombre={nombre!} onCambiarNombre={() => setEditandoNombre(true)} />
      )}

      <footer className="mt-auto flex flex-col items-center gap-3 pt-16 text-center">
        <SelloAlianzas size={22} className="opacity-40" />
        <p className="text-[1rem] uppercase tracking-[0.2em] opacity-70">Invitoo</p>
        <a href="/privacidad#fotos" className="inline-flex min-h-12 items-center text-[1rem] underline underline-offset-4 opacity-75">
          Privacidad de las fotos
        </a>
      </footer>

      <style>{ESTILOS}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── piezas

function Cabecera({ pareja, diseno }: { pareja: Props["pareja"]; diseno: Props["diseno"] }) {
  const ini = (s: string) => (s.trim().match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("es-ES");
  return (
    <header className="entra text-center">
      {diseno.marco && (
        <p aria-hidden className="display monograma-m mx-auto mb-5 inline-flex min-h-12 items-center rounded-full border px-5 text-[1.375rem] tracking-[0.06em]">
          {ini(pareja.a)}
          <span className="mx-1.5 italic text-[var(--acento-texto,var(--acento))]">&amp;</span>
          {ini(pareja.b)}
        </p>
      )}
      <p className="text-[1.0625rem] uppercase tracking-[0.22em] opacity-75">Las fotos de la boda</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,12vw,3.6rem)] leading-[1.02]">
        {pareja.a}
        <span className="mx-2 italic text-[var(--acento-texto,var(--acento))]">&amp;</span>
        {pareja.b}
      </h1>
      <p className="mt-3 text-[1.0625rem] opacity-80">{pareja.fecha}</p>
      {diseno.frase && <p className="display mx-auto mt-4 max-w-[24ch] text-[1.25rem] italic leading-snug opacity-85">{diseno.frase}</p>}
      <div aria-hidden className="mx-auto mt-6 h-px w-24 bg-current opacity-25" />
    </header>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="entra mt-14 text-center">
      <h2 className="display text-[2rem] leading-tight">{titulo}</h2>
      <p className="mx-auto mt-5 max-w-[26rem] text-[1.125rem] leading-relaxed opacity-85">{children}</p>
    </section>
  );
}

function textoRgpd(p: Pick<Props, "pantalla" | "borrado" | "pareja">) {
  const donde = p.pantalla
    ? "Las fotos y sus mensajes se mostrarán en la pantalla del salón y en la pestaña «En directo» de esta página"
    : "Las fotos y sus mensajes se mostrarán aquí a los invitados";
  const cuando = p.borrado ? `las borra el ${p.borrado}` : "las borra cuando termina el plazo contratado";
  return `Al subir confirmas que tienes permiso de las personas que aparecen y que no subes imágenes de menores sin el consentimiento de sus padres o tutores. ${donde} y las recibirán ${p.pareja.a} y ${p.pareja.b}, responsables del álbum. Invitoo las aloja como encargado del tratamiento y ${cuando}. Puedes pedir que se retire una foto desde aquí.`;
}

const campo =
  "mt-3 block min-h-14 w-full border-0 border-b-2 border-current/30 bg-transparent px-1 py-3 text-[1.25rem] outline-none focus:border-[var(--acento-texto,var(--acento))]";
const botonPrincipal =
  "flex min-h-[4.5rem] w-full items-center justify-center gap-3 px-6 text-[1.3125rem] font-medium tracking-[0.01em] shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] transition-transform active:scale-[.985] disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto,var(--acento))]";
const botonSecundario =
  "flex min-h-14 w-full items-center justify-center gap-3 border border-current/30 px-4 text-[1.0625rem] font-medium leading-tight transition-colors hover:border-current/60 disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";
const radio = { borderRadius: "max(var(--radio, 0px), 6px)" } as const;
const acento = { ...radio, background: "var(--acento)", color: "var(--sobre-acento, #fff)" } as const;
const foco = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto,var(--acento))]";

function Bienvenida(
  p: Props & { nombreInicial: string; yaAceptado: boolean; onListo: (nombre: string) => void },
) {
  const [nombre, setNombre] = useState(p.nombreInicial);
  const [acepta, setAcepta] = useState(p.yaAceptado);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="entra mt-12"
      onSubmit={(e) => {
        e.preventDefault();
        const limpio = nombre.replace(/\s+/g, " ").trim();
        if (limpio.length < 2) return setError("Escribe tu nombre, para que los novios sepan de quién son.");
        if (!acepta) return setError("Marca la casilla para poder subir fotos.");
        p.onListo(limpio.slice(0, 60));
      }}
    >
      <h2 className="display text-center text-[2rem] leading-tight">Gracias por venir</h2>
      <p className="mt-4 text-center text-[1.125rem] opacity-85">
        {p.pantalla
          ? "Sube tus fotos, con unas palabras si quieres, y saldrán en la pantalla del salón y en el móvil de todos."
          : "Sube tus fotos y quedarán todas juntas para los novios."}
      </p>

      <label htmlFor="m-nombre" className="mt-10 block text-[1.125rem] font-medium">
        ¿Cómo te llamas?
      </label>
      <input
        id="m-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoComplete="name"
        enterKeyHint="next"
        maxLength={60}
        placeholder="Tu nombre"
        className={campo}
      />

      <label className="mt-8 flex min-h-12 cursor-pointer items-center gap-4">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          aria-describedby="m-rgpd"
          className="h-7 w-7 shrink-0 accent-[var(--acento)]"
        />
        <span className="text-[1.125rem] font-medium leading-snug">Tengo permiso para compartir estas fotos</span>
      </label>
      <details className="mt-2 pl-11 text-[1.0625rem]">
        <summary className="inline-flex min-h-12 cursor-pointer items-center underline underline-offset-4 opacity-80">
          Más información
        </summary>
        <p id="m-rgpd" className="mt-2 leading-relaxed opacity-85">
          {textoRgpd(p)}{" "}
          <a href="/privacidad#fotos" className="underline underline-offset-4">Privacidad</a>
        </p>
      </details>

      {error && (
        <p role="alert" className="mt-5 text-[1.0625rem] font-medium text-[var(--acento-texto,var(--acento))]">
          {error}
        </p>
      )}

      <button type="submit" className={`${botonPrincipal} mt-9`} style={acento}>
        Continuar
      </button>
      {p.estado === "muestra" && (
        <p className="mt-6 text-center text-[1.0625rem] opacity-75">
          Esta es una boda de muestra: puedes probarlo, pero no se guarda nada.
        </p>
      )}
    </form>
  );
}

// ──────────────────────────────────────────────────────────────── álbum

function Album(p: Props & { token: string; nombre: string; onCambiarNombre: () => void }) {
  const { slug, token, nombre } = p;
  const abierto = p.estado === "abierto" || p.estado === "muestra";
  const [vista, setVista] = useState<Vista>(p.vistaInicial);
  const [items, setItems] = useState<Item[]>([]);
  const [muro, setMuro] = useState<Visible[]>([]);
  const [enEspera, setEnEspera] = useState<Visible[]>([]);
  const [nuevosIds, setNuevosIds] = useState<Set<string>>(() => new Set());
  const [total, setTotal] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [mensajeAbierto, setMensajeAbierto] = useState(false);
  const [pieLote, setPieLote] = useState("");
  const [reto, setReto] = useState(() => 0);
  const [visor, setVisor] = useState<number | null>(null);

  const preparados = useRef(new Map<string, EnCola>());
  const vistas = useRef(new Map<string, string>());
  const fallidas = useRef(new Set<string>());
  const pendientes = useRef<string[]>([]);
  const activos = useRef(0);
  const dispositivo = useRef<string>("");
  const desde = useRef<string | null>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);
  const muroRef = useRef<HTMLElement>(null);
  const vistaRef = useRef(vista);
  useEffect(() => {
    vistaRef.current = vista;
  }, [vista]);

  const cambiar = useCallback((clave: string, c: Partial<Item>) => {
    setItems((xs) => xs.map((x) => (x.clave === clave ? { ...x, ...c } : x)));
  }, []);

  // ─────────── subir un archivo ya preparado (y en la cola)
  const subirUno = useCallback(
    async (clave: string) => {
      const enCola = preparados.current.get(clave);
      if (!enCola) return;
      const pr = enCola.preparado;
      cambiar(clave, { estado: "subiendo", progreso: 0.03, error: undefined });
      try {
        const bytes = {
          grande: pr.grande.size,
          pantalla: pr.tipo === "foto" ? pr.pantalla.size : undefined,
          miniatura: pr.miniatura?.size,
        };
        const r = await llamar(() =>
          prepararSubida({
            slug,
            token,
            dispositivo: dispositivo.current,
            archivos: [{ clave, tipo: pr.tipo, mime: pr.mime, bytes, duracion: pr.tipo === "video" ? pr.duracion : undefined }],
          }),
        );
        if (!r.ok) {
          cambiar(clave, { estado: "error", error: r.error, reintentable: true });
          return;
        }
        const destino = r.archivos[0];
        if (destino.yaSubida) {
          await cola.quitar(clave);
          preparados.current.delete(clave);
          cambiar(clave, { estado: "listo", progreso: 1 });
          return;
        }
        const partes: { blob: Blob; d: { url: string; cabeceras: Record<string, string>; ruta: string } }[] = [
          { blob: pr.grande, d: destino.grande },
        ];
        if (pr.tipo === "foto" && destino.pantalla) partes.push({ blob: pr.pantalla, d: destino.pantalla });
        if (pr.miniatura && destino.miniatura) partes.push({ blob: pr.miniatura, d: destino.miniatura });
        const totalBytes = partes.reduce((s, x) => s + x.blob.size, 0) || 1;
        let hecho = 0;
        for (const x of partes) {
          await conReintento(() =>
            subir(x.d.url, x.blob, x.d.cabeceras, (f) =>
              cambiar(clave, { progreso: 0.03 + ((hecho + f * x.blob.size) / totalBytes) * 0.9 }),
            ),
          );
          hecho += x.blob.size;
        }
        // El pie se lee AHORA (puede haberse escrito mientras subía).
        const mensaje = preparados.current.get(clave)?.mensaje ?? null;
        const c = await llamar(() =>
          confirmarSubida({
            slug,
            token,
            dispositivo: dispositivo.current,
            tipo: pr.tipo,
            rutas: { grande: destino.grande.ruta, pantalla: destino.pantalla?.ruta, miniatura: destino.miniatura?.ruta },
            ancho: pr.ancho,
            alto: pr.alto,
            duracion: pr.tipo === "video" ? pr.duracion : null,
            autor: nombre,
            mensaje,
          }),
        );
        if (!c.ok) {
          cambiar(clave, { estado: "error", error: c.error, reintentable: true });
          return;
        }
        await cola.quitar(clave);
        preparados.current.delete(clave);
        cambiar(clave, { estado: c.estado === "pendiente" ? "pendiente" : "listo", progreso: 1, id: c.id });
        const vistaLocal = vistas.current.get(clave);
        if (c.estado === "visible" && vistaLocal) {
          // Al muro al instante, con la vista local; el feed traerá la de verdad.
          setMuro((m) => [
            {
              id: c.id,
              tipo: pr.tipo,
              url: null,
              pantalla: null,
              miniatura: vistaLocal,
              ancho: pr.ancho,
              alto: pr.alto,
              duracion: null,
              autor: nombre,
              mensaje,
              destacado: false,
              capitulo: null,
              creado: new Date().toISOString(),
              local: true,
            },
            ...m.filter((y) => y.id !== c.id),
          ]);
          setNuevosIds((s) => new Set(s).add(c.id));
        }
      } catch (e) {
        if (e instanceof ErrorRed || e instanceof TypeError) fallidas.current.add(clave);
        cambiar(clave, {
          estado: "error",
          reintentable: true,
          error:
            e instanceof ErrorRed || e instanceof TypeError
              ? "No hay conexión. Lo intentaremos en cuanto vuelva."
              : "No ha podido subirse.",
        });
      }
    },
    [cambiar, nombre, slug, token],
  );

  const otraVez = useRef<() => void>(() => {});
  const bombear = useCallback(() => {
    while (activos.current < SIMULTANEAS && pendientes.current.length) {
      const clave = pendientes.current.shift()!;
      activos.current++;
      void subirUno(clave).finally(() => {
        activos.current--;
        otraVez.current();
      });
    }
  }, [subirUno]);
  useEffect(() => {
    otraVez.current = bombear;
  }, [bombear]);

  const encolar = useCallback(
    (clave: string) => {
      if (!pendientes.current.includes(clave)) pendientes.current.push(clave);
      cambiar(clave, { estado: "esperando", error: undefined });
      bombear();
    },
    [bombear, cambiar],
  );

  // ─────────── al entrar: el dispositivo y la cola pendiente
  useEffect(() => {
    dispositivo.current = idDispositivo();
    let vivo = true;
    void cola.todas(slug).then((xs) => {
      if (!vivo || !xs.length) return;
      for (const x of xs) preparados.current.set(x.clave, x);
      const retomados = xs.map<Item>((x) => {
        const v = x.preparado.miniatura ? URL.createObjectURL(x.preparado.miniatura) : undefined;
        if (v) vistas.current.set(x.clave, v);
        return { clave: x.clave, nombre: x.nombre, tipo: x.preparado.tipo, estado: "esperando", progreso: 0, vista: v, mensaje: x.mensaje ?? null };
      });
      setItems((ys) => [...retomados, ...ys]);
      for (const x of xs) pendientes.current.push(x.clave);
      bombear();
    });
    return () => {
      vivo = false;
    };
  }, [slug, bombear]);

  useEffect(() => {
    const f = () => {
      for (const clave of fallidas.current) {
        if (preparados.current.has(clave) && !pendientes.current.includes(clave)) pendientes.current.push(clave);
      }
      fallidas.current.clear();
      bombear();
    };
    window.addEventListener("online", f);
    return () => window.removeEventListener("online", f);
  }, [bombear]);

  // ─────────── el muro: polling eficiente (y Realtime si lo hay)
  const pedirAhora = useRef<(completo?: boolean) => void>(() => {});
  const conectado = useRef(false);
  useEffect(() => {
    let vivo = true;
    let temporizador = 0;
    let ultimoCompleto = 0;
    let primera = true;
    async function pedir(completo = false) {
      window.clearTimeout(temporizador);
      // Con el móvil bloqueado o en otra app, no se pide nada.
      if (document.visibilityState === "hidden") return;
      const todo = completo || !desde.current || Date.now() - ultimoCompleto > CADA_COMPLETO_MS;
      try {
        const q = new URLSearchParams({ t: token, limite: "120" });
        if (!todo && desde.current) q.set("desde", desde.current);
        const r = await fetch(`/api/momentos/${slug}/feed?${q}`, { cache: "no-store" });
        if (r.ok) {
          const f = (await r.json()) as Feed;
          if (!vivo) return;
          if (todo) ultimoCompleto = Date.now();
          setTotal(f.total);
          const llegan = f.momentos.filter((x) => x.tipo !== "video" || x.miniatura);
          const leyendoAbajo =
            !primera && vistaRef.current === "directo" && (muroRef.current?.getBoundingClientRect().top ?? 0) < -240;
          setMuro((m) => {
            const conocidos = new Set(m.filter((x) => !x.local).map((x) => x.id));
            const ids = new Set(llegan.map((x) => x.id));
            const vivos = f.ids ? new Set(f.ids) : null;
            // Lo que de verdad es nuevo para este móvil (no un refresco).
            const reciente = llegan.filter((x) => !conocidos.has(x.id) && !m.some((y) => y.id === x.id && y.local));
            if (!primera && reciente.length) setNuevosIds((s) => new Set([...s, ...reciente.map((x) => x.id)]));
            const resto = m.filter((x) => !ids.has(x.id) && (!vivos || vivos.has(x.id) || x.local));
            if (leyendoAbajo && reciente.length) {
              // No se mueve nada mientras lees: esperan arriba.
              setEnEspera((e) => [...reciente.filter((x) => !e.some((y) => y.id === x.id)), ...e]);
              const sinNuevos = llegan.filter((x) => !reciente.includes(x));
              return [...sinNuevos, ...resto].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, MAX_MURO);
            }
            return [...llegan, ...resto].sort((a, b) => b.creado.localeCompare(a.creado)).slice(0, MAX_MURO);
          });
          primera = false;
          desde.current = f.ahora;
        }
      } catch {}
      if (!vivo) return;
      const cada = conectado.current ? CADA_REALTIME_MS : vistaRef.current === "directo" ? CADA_DELANTE_MS : CADA_DETRAS_MS;
      temporizador = window.setTimeout(() => pedir(), cada);
    }
    pedirAhora.current = (completo) => void pedir(completo);
    void pedir(true);
    const alVolver = () => {
      if (document.visibilityState === "visible") void pedir();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", alVolver);
    return () => {
      vivo = false;
      window.clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [slug, token]);

  // Al pasar a «En directo», se pide al momento.
  useEffect(() => {
    if (vista === "directo") pedirAhora.current();
  }, [vista]);

  useEffect(() => {
    if (!p.realtime) return;
    const rt = p.realtime;
    let vivo = true;
    let cerrar: (() => void) | null = null;
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (!vivo) return;
      const sb = createClient(rt.url, rt.anon, { auth: { persistSession: false } });
      const ch = sb
        .channel(rt.canal)
        .on("broadcast", { event: "nuevo" }, () => pedirAhora.current())
        .on("broadcast", { event: "cambio" }, () => pedirAhora.current(true))
        .subscribe((estado) => {
          conectado.current = estado === "SUBSCRIBED";
        });
      cerrar = () => void sb.removeChannel(ch);
    });
    return () => {
      vivo = false;
      conectado.current = false;
      cerrar?.();
    };
  }, [p.realtime]);

  function verEnEspera() {
    setMuro((m) => [...enEspera, ...m.filter((x) => !enEspera.some((y) => y.id === x.id))].slice(0, MAX_MURO));
    setEnEspera([]);
    muroRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  // ─────────── elegir archivos
  async function elegir(lista: FileList | null) {
    if (!lista?.length) return;
    setAviso(null);
    const archivos = [...lista].slice(0, 30);
    const mensaje = limpiarPie(pieLote, p.maxPie);
    if (lista.length > 30) setAviso("Hemos cogido las 30 primeras. Sube el resto en otra tanda.");
    else if (mensaje) setAviso(`Tu mensaje irá con ${archivos.length === 1 ? "esta foto" : `estas ${archivos.length} fotos`}. Puedes cambiarlo en cada una.`);
    setPieLote("");
    const nuevos: Item[] = archivos.map((f) => ({
      clave: aleatorio(),
      nombre: f.name,
      tipo: f.type.startsWith("video/") ? "video" : "foto",
      estado: "preparando",
      progreso: 0,
      mensaje,
    }));
    setItems((xs) => [...nuevos, ...xs]);
    for (let i = 0; i < archivos.length; i++) {
      const f = archivos[i];
      const { clave, tipo } = nuevos[i];
      try {
        if (tipo === "video" && !p.videos) throw new ArchivoNoValido("En este álbum solo caben fotos.");
        const preparado = tipo === "video" ? await prepararVideo(f, p.videos!.duracion) : await prepararFoto(f);
        const enCola: EnCola = { clave, slug, nombre: f.name, creado: Date.now(), preparado, mensaje };
        preparados.current.set(clave, enCola);
        await cola.poner(enCola);
        const v = preparado.miniatura ? URL.createObjectURL(preparado.miniatura) : undefined;
        if (v) vistas.current.set(clave, v);
        cambiar(clave, { vista: v });
        encolar(clave);
      } catch (e) {
        if (e instanceof ErrorRed || e instanceof TypeError) fallidas.current.add(clave);
        cambiar(clave, {
          estado: "error",
          error: e instanceof ArchivoNoValido ? e.message : "Este archivo no se puede abrir.",
        });
      }
    }
  }

  /** El mensaje de UNA foto: si aún sube, viaja con ella; si ya entró, se guarda aparte. */
  async function guardarPie(it: Item, texto: string): Promise<string | null> {
    const mensaje = limpiarPie(texto, p.maxPie);
    const enCola = preparados.current.get(it.clave);
    if (enCola && !it.id) {
      enCola.mensaje = mensaje;
      try {
        await cola.poner(enCola);
      } catch {}
      cambiar(it.clave, { mensaje });
      return null;
    }
    if (!it.id) return "Espera a que termine de subir.";
    try {
      const r = await ponerPie({ slug, token, dispositivo: dispositivo.current, id: it.id, mensaje: mensaje ?? "" });
      if (!r.ok) return r.error;
      cambiar(it.clave, { mensaje: r.mensaje });
      setMuro((m) => m.map((x) => (x.id === it.id ? { ...x, mensaje: r.mensaje } : x)));
      return null;
    } catch {
      return "No hay conexión. Prueba otra vez.";
    }
  }

  const enCurso = items.filter((x) => x.estado !== "listo" && x.estado !== "pendiente").length;
  const subidas = items.filter((x) => x.estado === "listo" || x.estado === "pendiente").length;
  const accept = p.videos ? "image/*,video/*" : "image/*";
  const medios = muro.filter((m) => m.tipo !== "mensaje");

  return (
    <>
      <section className="entra mt-10 text-center">
        <p className="text-[1.125rem]">
          Hola, <strong className="font-medium">{nombre}</strong>.{" "}
          <button type="button" onClick={p.onCambiarNombre} className={`min-h-12 px-1 underline underline-offset-4 opacity-75 ${foco}`}>
            ¿No eres tú?
          </button>
        </p>
      </section>

      {/* ─────────── las pestañas */}
      <div className="pestanas sticky top-0 z-20 -mx-5 mt-6 px-5 pb-3 pt-[max(.75rem,env(safe-area-inset-top))]" style={{ background: "var(--papel)" }}>
        <div role="tablist" aria-label="Fotos de la boda" className="grid grid-cols-2 gap-1 rounded-full border border-current/20 p-1">
          {(
            [
              ["subir", "Subir"],
              ["directo", "En directo"],
            ] as const
          ).map(([id, texto]) => (
            <button
              key={id}
              id={`pest-${id}`}
              type="button"
              role="tab"
              aria-selected={vista === id}
              aria-controls={`panel-${id}`}
              tabIndex={vista === id ? 0 : -1}
              onClick={() => setVista(id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  const otra = id === "subir" ? "directo" : "subir";
                  setVista(otra);
                  document.getElementById(`pest-${otra}`)?.focus();
                }
              }}
              className={`pestana flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[1.0625rem] font-medium transition-colors ${foco}`}
              style={vista === id ? { background: "var(--acento)", color: "var(--sobre-acento, #fff)" } : undefined}
            >
              {id === "directo" && <span aria-hidden className={`latido h-2 w-2 shrink-0 rounded-full ${vista === id ? "bg-current" : "bg-[var(--acento)]"}`} />}
              {texto}
              {id === "directo" && total !== null && total > 0 && (
                <span className="tabular-nums opacity-80">
                  <span className="sr-only">, </span>
                  {total.toLocaleString("es-ES")}
                  <span className="sr-only"> recuerdos</span>
                </span>
              )}
            </button>
          ))}
        </div>
        {vista === "directo" && enEspera.length > 0 && (
          <button type="button" onClick={verEnEspera} className={`${botonSecundario} mt-2 min-h-12`} style={radio}>
            {enEspera.length === 1 ? "1 nueva · Ver" : `${enEspera.length} nuevas · Ver`}
          </button>
        )}
      </div>

      {/* ─────────── Subir */}
      <div id="panel-subir" role="tabpanel" aria-labelledby="pest-subir" hidden={vista !== "subir"}>
        <section className="mt-6 text-center">
          {abierto ? (
            <>
              <input
                ref={galeria}
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void elegir(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={camara}
                type="file"
                accept={accept}
                capture="environment"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  void elegir(e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="text-left">
                <label htmlFor="m-pie-lote" className="block text-[1.0625rem] font-medium">
                  Un mensaje para tus fotos <span className="font-normal opacity-75">(opcional)</span>
                </label>
                <textarea
                  id="m-pie-lote"
                  value={pieLote}
                  onChange={(e) => setPieLote(e.target.value)}
                  maxLength={p.maxPie}
                  rows={2}
                  enterKeyHint="done"
                  placeholder="«¡Qué noche!», «Para la abuela»…"
                  className={`${campo} mt-2 resize-none text-[1.125rem] leading-snug`}
                />
                <p className="mt-1 flex justify-between gap-3 text-[1rem] opacity-70">
                  <span>Sale con la foto en la pantalla y en el álbum.</span>
                  <span className="tabular-nums">{pieLote.length}/{p.maxPie}</span>
                </p>
              </div>
              <button type="button" onClick={() => galeria.current?.click()} className={`${botonPrincipal} mt-6`} style={acento}>
                <IconoSubir />
                Subir fotos
              </button>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => camara.current?.click()} className={botonSecundario} style={radio}>
                  Hacer una foto
                </button>
                <button
                  type="button"
                  onClick={() => setMensajeAbierto((x) => !x)}
                  aria-expanded={mensajeAbierto}
                  className={botonSecundario}
                  style={radio}
                >
                  Solo unas palabras
                </button>
              </div>
              <p className="mt-4 text-[1.0625rem] opacity-75">
                {p.videos
                  ? `Puedes elegir varias a la vez. Vídeos de hasta ${p.videos.duracion} segundos.`
                  : "Puedes elegir varias a la vez."}
              </p>
            </>
          ) : (
            <p className="mx-auto mt-4 max-w-[26rem] text-[1.125rem] opacity-85">
              Los novios ya han cerrado las subidas. ¡Gracias por todas las fotos!
            </p>
          )}

          {aviso && (
            <p role="status" className="mt-4 text-[1.0625rem] font-medium">
              {aviso}
            </p>
          )}
        </section>

        {mensajeAbierto && abierto && (
          <FormMensaje slug={slug} token={token} nombre={nombre} dispositivo={dispositivo} onCerrar={() => setMensajeAbierto(false)} />
        )}

        {items.length > 0 && (
          <section className="mt-10" aria-labelledby="m-tus">
            <h2 id="m-tus" className="text-[1.125rem] font-medium">
              {enCurso ? `Subiendo ${enCurso} ${enCurso === 1 ? "archivo" : "archivos"}…` : `¡Listo! ${subidas} ${subidas === 1 ? "subida" : "subidas"}.`}
            </h2>
            {enCurso > 0 && (
              <p className="mt-1 text-[1rem] opacity-75">Puedes seguir en la fiesta: si se va la conexión, seguirá sola al volver.</p>
            )}
            <ul className="mt-4 space-y-4">
              {items.map((it) => (
                <FilaSubida
                  key={it.clave}
                  it={it}
                  maxPie={p.maxPie}
                  onReintentar={() => encolar(it.clave)}
                  puedeReintentar={Boolean(it.reintentable)}
                  onPie={(t) => guardarPie(it, t)}
                />
              ))}
            </ul>
            {!enCurso && subidas > 0 && (
              <button type="button" onClick={() => setVista("directo")} className={`${botonSecundario} mt-6`} style={radio}>
                Verlas en directo
              </button>
            )}
          </section>
        )}

        {abierto && p.retos.length > 0 && (
          <aside className="mt-10 border-y border-current/15 py-6 text-center" aria-label="Reto de foto">
            <p className="text-[1rem] uppercase tracking-[0.2em] opacity-70">Un reto para ti</p>
            <p className="display mt-3 text-[1.75rem] leading-tight" aria-live="polite">
              «{p.retos[reto % p.retos.length]}»
            </p>
            <button
              type="button"
              onClick={() => setReto((r) => r + 1)}
              className={`mt-3 min-h-12 px-4 text-[1.0625rem] underline underline-offset-4 opacity-80 ${foco}`}
            >
              Otro reto
            </button>
          </aside>
        )}

        <details className="mt-14 border-t border-current/15 pt-6 text-[1.0625rem]">
          <summary className="min-h-12 cursor-pointer py-2 font-medium">Privacidad y tus fotos</summary>
          <p className="mt-3 leading-relaxed opacity-85">{textoRgpd(p)}</p>
          <p className="mt-3 leading-relaxed opacity-85">
            Para retirar una foto, ábrela en «En directo» y pulsa «Pedir que se retire»: deja de verse al instante y
            avisamos a los novios. Para cualquier otra cosa, escribe a info@invitoo.es o lee la{" "}
            <a href="/privacidad#fotos" className="underline underline-offset-4">política de privacidad</a>.
          </p>
        </details>
      </div>

      {/* ─────────── En directo */}
      <div id="panel-directo" role="tabpanel" aria-labelledby="pest-directo" hidden={vista !== "directo"}>
        <section ref={muroRef} className="mt-6 scroll-mt-24" aria-labelledby="m-muro">
          <div className="text-center">
            <h2 id="m-muro" className="display text-[2rem] leading-tight">
              Lo que estáis compartiendo
            </h2>
            <p className="mt-2 text-[1.0625rem] opacity-80">
              {total ? `${total.toLocaleString("es-ES")} ${total === 1 ? "recuerdo" : "recuerdos"} · ` : ""}se actualiza solo
            </p>
          </div>
          {muro.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-[1.125rem] opacity-85">Todavía no hay nada. ¡Sé el primero!</p>
              {abierto && (
                <button type="button" onClick={() => setVista("subir")} className={`${botonPrincipal} mt-6`} style={acento}>
                  Subir la primera
                </button>
              )}
            </div>
          ) : (
            <ul className="muro-m mt-6 grid grid-cols-2 gap-x-3 gap-y-5">
              {muro.map((m) =>
                m.tipo === "mensaje" ? (
                  <li key={m.id} className={`col-span-2 ${nuevosIds.has(m.id) ? "llega" : ""}`}>
                    <figure className="border border-current/15 px-5 py-5" style={radio}>
                      <blockquote className="display text-[1.375rem] leading-snug">«{m.mensaje}»</blockquote>
                      <figcaption className="mt-2 text-[1rem] opacity-80">— {m.autor}</figcaption>
                    </figure>
                  </li>
                ) : (
                  <li key={m.id} className={`min-w-0 ${nuevosIds.has(m.id) ? "llega" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setVisor(medios.findIndex((x) => x.id === m.id))}
                      aria-label={`${m.tipo === "video" ? "Vídeo" : "Foto"} de ${m.autor}${m.mensaje ? `: «${m.mensaje}»` : ""}. Ver en grande`}
                      className={`block w-full text-left ${foco}`}
                    >
                      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-current/5" style={radio}>
                        {m.miniatura && (
                          // eslint-disable-next-line @next/next/no-img-element -- URL firmada o blob local
                          <img src={m.miniatura} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        )}
                        {m.tipo === "video" && (
                          <span aria-hidden className="absolute inset-0 grid place-items-center text-white drop-shadow">
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block px-0.5">
                        {m.mensaje && (
                          <span className="pie-2 display block text-[1.0625rem] italic leading-snug">«{m.mensaje}»</span>
                        )}
                        <span className="mt-0.5 block truncate text-[1rem] opacity-80">{m.autor}</span>
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>

      {visor !== null && medios[visor] && (
        <Visor
          lista={medios}
          indice={visor}
          onIndice={setVisor}
          onCerrar={() => setVisor(null)}
          onRetirar={async (m) => {
            const r = await pedirRetirada({ slug, token, dispositivo: dispositivo.current, id: m.id });
            if (r.ok) {
              setMuro((xs) => xs.filter((x) => x.id !== m.id));
              setVisor(null);
              setAviso("Retirada. Ya no sale en la pantalla y hemos avisado a los novios.");
            }
            return r.ok ? null : r.error;
          }}
        />
      )}
    </>
  );
}

function FilaSubida({
  it,
  maxPie,
  onReintentar,
  puedeReintentar,
  onPie,
}: {
  it: Item;
  maxPie: number;
  onReintentar: () => void;
  puedeReintentar: boolean;
  onPie: (texto: string) => Promise<string | null>;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(it.mensaje ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const estado =
    it.estado === "preparando"
      ? "Preparando…"
      : it.estado === "esperando"
        ? "En cola"
        : it.estado === "subiendo"
          ? `Subiendo ${Math.round(it.progreso * 100)} %`
          : it.estado === "listo"
            ? "Subida"
            : it.estado === "pendiente"
              ? "Subida · los novios la verán antes de que salga"
              : (it.error ?? "No ha podido subirse");
  const puedePie = it.estado !== "error";
  return (
    <li>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden bg-current/10" style={radio}>
          {it.vista && (
            // eslint-disable-next-line @next/next/no-img-element -- blob local
            <img src={it.vista} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[1.0625rem] leading-snug ${it.estado === "error" ? "font-medium text-[var(--acento-texto,var(--acento))]" : ""}`} role={it.estado === "error" ? "alert" : undefined}>
            {(it.estado === "listo" || it.estado === "pendiente") && <span aria-hidden>✓ </span>}
            {estado}
          </p>
          {(it.estado === "subiendo" || it.estado === "esperando" || it.estado === "preparando") && (
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-current/12"
              role="progressbar"
              aria-label={`Subiendo ${it.tipo === "video" ? "vídeo" : "foto"}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(it.progreso * 100)}
            >
              <div className="barra h-full rounded-full" style={{ width: `${Math.max(4, it.progreso * 100)}%`, background: "var(--acento)" }} />
            </div>
          )}
          {it.mensaje && !editando && <p className="display mt-1 truncate text-[1.0625rem] italic opacity-85">«{it.mensaje}»</p>}
        </div>
        {it.estado === "error" && puedeReintentar ? (
          <button type="button" onClick={onReintentar} className={`min-h-14 shrink-0 border border-current/30 px-4 text-[1.0625rem] font-medium ${foco}`} style={radio}>
            Reintentar
          </button>
        ) : puedePie && !editando ? (
          <button
            type="button"
            onClick={() => {
              setTexto(it.mensaje ?? "");
              setEditando(true);
            }}
            aria-label={it.mensaje ? "Cambiar el mensaje de esta foto" : "Añadir un mensaje a esta foto"}
            className={`min-h-12 shrink-0 border border-current/25 px-3.5 text-[1rem] font-medium ${foco}`}
            style={radio}
          >
            {it.mensaje ? "Cambiar" : "Mensaje"}
          </button>
        ) : null}
      </div>
      {editando && (
        <form
          className="mt-3 pl-20"
          onSubmit={async (e) => {
            e.preventDefault();
            setOcupado(true);
            const err = await onPie(texto);
            setOcupado(false);
            setError(err);
            if (!err) setEditando(false);
          }}
        >
          <label htmlFor={`pie-${it.clave}`} className="sr-only">Mensaje de esta foto</label>
          <input
            id={`pie-${it.clave}`}
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={maxPie}
            enterKeyHint="done"
            placeholder="Escribe algo (opcional)"
            className={`${campo} mt-0 min-h-12 py-2 text-[1.125rem]`}
          />
          {error && <p role="alert" className="mt-2 text-[1rem] font-medium text-[var(--acento-texto,var(--acento))]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={ocupado} className={`min-h-12 flex-1 px-4 text-[1.0625rem] font-medium ${foco}`} style={acento}>
              {ocupado ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setEditando(false)} className={`min-h-12 border border-current/25 px-4 text-[1.0625rem] ${foco}`} style={radio}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

function FormMensaje({
  slug,
  token,
  nombre,
  dispositivo,
  onCerrar,
}: {
  slug: string;
  token: string;
  nombre: string;
  dispositivo: React.RefObject<string>;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const caja = useRef<HTMLTextAreaElement>(null);
  useEffect(() => caja.current?.focus(), []);

  if (resultado?.ok) {
    return (
      <section className="entra mt-8 text-center" role="status">
        <p className="display text-[1.75rem] leading-tight">Gracias, {nombre}</p>
        <p className="mt-3 text-[1.0625rem] opacity-85">{resultado.texto}</p>
        <button type="button" onClick={onCerrar} className={`${botonSecundario} mt-6`} style={radio}>
          Volver
        </button>
      </section>
    );
  }
  return (
    <form
      className="entra mt-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        try {
          const r = await enviarMensajeDirecto({ slug, token, dispositivo: dispositivo.current, autor: nombre, mensaje: texto });
          setResultado(
            r.ok
              ? {
                  ok: true,
                  texto: r.estado === "pendiente" ? "Los novios lo leerán antes de que salga en la pantalla." : "Saldrá en la pantalla en unos segundos.",
                }
              : { ok: false, texto: r.error },
          );
        } catch {
          setResultado({ ok: false, texto: "No hay conexión. Prueba otra vez en un momento." });
        }
        setEnviando(false);
      }}
    >
      <label htmlFor="m-mensaje" className="block text-[1.125rem] font-medium">
        Unas palabras para los novios
      </label>
      <textarea
        id="m-mensaje"
        ref={caja}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={280}
        rows={4}
        placeholder="Un deseo, un consejo, un recuerdo…"
        className={`${campo} resize-none`}
      />
      <p className="mt-2 text-right text-[1rem] tabular-nums opacity-70">{texto.length} / 280</p>
      {resultado && !resultado.ok && (
        <p role="alert" className="mt-2 text-[1.0625rem] font-medium text-[var(--acento-texto,var(--acento))]">
          {resultado.texto}
        </p>
      )}
      <button type="submit" disabled={enviando || texto.trim().length < 2} className={`${botonPrincipal} mt-5`} style={acento}>
        {enviando ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}

/**
 * Una foto a pantalla completa, con su mensaje y su autor DEBAJO (nunca
 * encima). Se pasa de una a otra deslizando, con las flechas del teclado o
 * con los botones. Diálogo modal: Escape cierra y devuelve el foco.
 */
function Visor({
  lista,
  indice,
  onIndice,
  onCerrar,
  onRetirar,
}: {
  lista: Visible[];
  indice: number;
  onIndice: (i: number) => void;
  onCerrar: () => void;
  onRetirar: (m: Visible) => Promise<string | null>;
}) {
  const cerrar = useRef<HTMLButtonElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const toque = useRef<{ x: number; y: number; t: number } | null>(null);
  const [arrastre, setArrastre] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const m = lista[indice];
  const hayAntes = indice > 0;
  const hayDespues = indice < lista.length - 1;

  const ir = useCallback(
    (d: number) => {
      const j = indice + d;
      if (j < 0 || j >= lista.length) return;
      setConfirmando(false);
      setError(null);
      onIndice(j);
    },
    [indice, lista.length, onIndice],
  );

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = scroll;
      previo?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ir, onCerrar]);

  // Precarga las vecinas: deslizar no espera a la red.
  useEffect(() => {
    for (const x of [lista[indice - 1], lista[indice + 1]]) {
      const src = x?.url ?? x?.miniatura;
      if (src && x?.tipo === "foto") new Image().src = src;
    }
  }, [indice, lista]);

  if (!m) return null;
  const src = m.url ?? m.miniatura ?? undefined;
  return (
    <div role="dialog" aria-modal="true" aria-label={`Foto ${indice + 1} de ${lista.length}, de ${m.autor}`} className="visor-m fixed inset-0 z-50 flex flex-col bg-[#0d0b0a] text-white">
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(.75rem,env(safe-area-inset-top))]">
        <p className="text-[1rem] tabular-nums opacity-80" aria-hidden>
          {indice + 1} / {lista.length}
        </p>
        <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar" className={`grid h-12 w-12 place-items-center rounded-full border border-white/40 text-[1.75rem] ${foco}`}>
          <span aria-hidden>×</span>
        </button>
      </div>

      <div
        ref={pista}
        className="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={(e) => {
          toque.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        }}
        onPointerMove={(e) => {
          if (!toque.current) return;
          const dx = e.clientX - toque.current.x;
          if (Math.abs(dx) > Math.abs(e.clientY - toque.current.y)) setArrastre(dx);
        }}
        onPointerUp={(e) => {
          const t = toque.current;
          toque.current = null;
          if (!t) return;
          const dx = e.clientX - t.x;
          const rapido = Math.abs(dx) / Math.max(1, Date.now() - t.t) > 0.5;
          setArrastre(0);
          if (dx < -60 || (rapido && dx < -20)) ir(1);
          else if (dx > 60 || (rapido && dx > 20)) ir(-1);
        }}
        onPointerCancel={() => {
          toque.current = null;
          setArrastre(0);
        }}
      >
        <div
          key={m.id}
          className="visor-foto absolute inset-0 grid place-items-center p-3"
          style={{ transform: arrastre ? `translate3d(${arrastre}px,0,0)` : undefined, transition: arrastre ? "none" : undefined }}
        >
          {m.tipo === "video" && m.url ? (
            <video src={m.url} controls playsInline className="max-h-full max-w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada
            <img src={src} alt={m.mensaje ? `Foto de ${m.autor}: «${m.mensaje}»` : `Foto de ${m.autor}`} draggable={false} className="max-h-full max-w-full object-contain" />
          )}
        </div>
      </div>

      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-[30rem] text-center" aria-live="polite">
          {m.mensaje && <p className="display text-[1.375rem] italic leading-snug">«{m.mensaje}»</p>}
          <p className="mt-1 text-[1.0625rem] opacity-85">{m.autor}</p>
        </div>
        <div className="mx-auto mt-3 grid max-w-[30rem] grid-cols-[3rem_1fr_3rem] items-center gap-3">
          <button type="button" onClick={() => ir(-1)} disabled={!hayAntes} aria-label="Foto anterior" className={`grid h-12 w-12 place-items-center rounded-full border border-white/40 disabled:opacity-30 ${foco}`}>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          {!m.local ? (
            confirmando ? (
              <div className="flex flex-col gap-2">
                <p className="text-center text-[1rem]">Dejará de verse en la pantalla y aquí, y avisaremos a los novios.</p>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    setError(await onRetirar(m));
                    setOcupado(false);
                  }}
                  className={`min-h-12 rounded-full bg-white px-5 text-[1.0625rem] font-medium text-black disabled:opacity-60 ${foco}`}
                >
                  {ocupado ? "Retirando…" : "Sí, retirarla"}
                </button>
                <button type="button" onClick={() => setConfirmando(false)} className={`min-h-12 text-[1.0625rem] underline underline-offset-4 ${foco}`}>
                  No, dejarla
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmando(true)} className={`min-h-12 rounded-full border border-white/40 px-4 text-[1rem] ${foco}`}>
                Pedir que se retire
              </button>
            )
          ) : (
            <span />
          )}
          <button type="button" onClick={() => ir(1)} disabled={!hayDespues} aria-label="Foto siguiente" className={`grid h-12 w-12 place-items-center rounded-full border border-white/40 disabled:opacity-30 ${foco}`}>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-center text-[1rem]">{error}</p>}
      </div>
    </div>
  );
}

function IconoSubir() {
  return (
    <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16.5v2A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-2" />
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    </svg>
  );
}

const ESTILOS = `
  .momentos .entra { animation: momEntra 900ms cubic-bezier(.25,.1,.12,1) both; }
  @keyframes momEntra { from { opacity: 0; transform: translate3d(0, 10px, 0); } to { opacity: 1; transform: none; } }
  .momentos .barra { transition: width 400ms cubic-bezier(.22,.61,.36,1); }
  .momentos .monograma-m { border-color: color-mix(in oklab, var(--acento) 45%, transparent); }
  .momentos .muro-m { overflow-anchor: auto; }
  .momentos .llega { animation: momLlega 700ms cubic-bezier(.22,.61,.36,1) both; }
  @keyframes momLlega { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
  .momentos .pie-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .momentos .latido { animation: momLatido 2.4s ease-in-out infinite; }
  @keyframes momLatido { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  .momentos .pestana { transition: background-color 200ms ease, color 200ms ease; }
  .visor-m { animation: momFundido 220ms ease-out both; }
  .visor-m .visor-foto { animation: momFundido 260ms ease-out both; transition: transform 260ms cubic-bezier(.22,.61,.36,1); }
  @keyframes momFundido { from { opacity: 0 } to { opacity: 1 } }
  @media (prefers-reduced-motion: reduce) {
    .momentos .entra, .visor-m, .visor-m .visor-foto, .momentos .llega, .momentos .latido { animation: none; }
    .momentos .barra, .visor-m .visor-foto { transition: none; }
  }
`;

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SelloAlianzas from "@/components/SelloAlianzas";
import { aMano } from "@/components/directo/fuentes";
import {
  DISENO_INICIAL,
  iniciales,
  MENSAJE_DISENO,
  MENSAJE_FOTO,
  normalizarDiseno,
  type DisenoDirecto,
  type EstiloPase,
} from "@/lib/momentos/diseno";
import type { Feed, MomentoPublico } from "@/lib/momentos/tipos";

/**
 * La pantalla del salón, con cuatro estilos de pase:
 *
 *  · Revista  — una foto o composiciones de dos y tres, fundido cruzado lento.
 *  · Polaroid — las fotos caen sobre la mesa y se apilan, con el nombre a mano.
 *  · Cine     — panorámica con bandas, Ken Burns lento.
 *  · Mosaico  — un muro de doce que se renueva de una en una.
 *
 * Reglas que valen para los cuatro:
 *  · Nunca pasa por negro: lo nuevo entra ENCIMA de lo viejo.
 *  · Ningún texto encima de una foto: los nombres, el pie de foto, el
 *    contador y el QR viven en la BANDA de abajo, que las fotos no pisan; el
 *    marco y las iniciales, en el margen del escenario.
 *  · `prefers-reduced-motion`: sin Ken Burns, sin caídas, sin brillo, sin
 *    rótulo animado (todo entra con un fundido corto).
 *  · Cada imagen se descarga entera (blob) ANTES de enseñarla y se guarda en
 *    memoria: si se cae la wifi, el pase sigue con las últimas ~90.
 *  · Tiempo real con Supabase Realtime si está configurado; si no, polling
 *    cada 5 s al feed. Feed completo cada 2 min (quita lo ocultado, renueva
 *    URLs y trae el diseño si los novios lo cambian).
 *
 * `muestra`: la vista previa (panel, compra y web). No pide nada al
 * servidor: pinta las fotos de muestra y escucha por postMessage el diseño
 * y la foto que «sube» el móvil de la web.
 */

type M = MomentoPublico;
type Tipo = "portada" | "foto" | "video" | "pareja" | "trio" | "mensaje" | "capitulo";

type Pieza = {
  id: string;
  src: string;
  autor: string;
  mensaje: string | null;
  tipo: "foto" | "video";
  ancho: number;
  alto: number;
  apaisada: boolean;
  capitulo: string | null;
};
type Diapo = {
  key: number;
  tipo: Tipo;
  piezas: Pieza[];
  texto?: { mensaje: string; autor: string; fijado: boolean };
  titulo?: string;
  nuevo: boolean;
  dur: number;
  kb: { dx: number; dy: number; origen: string };
};
type EnPila = { key: number; pieza?: Pieza; texto?: { mensaje: string; autor: string }; x: number; y: number; r: number };
type Tesela = { key: number; pieza?: Pieza; texto?: { mensaje: string; autor: string } };
type Pie = { key: number; autor: string; mensaje: string | null; nuevo: boolean; capitulo: string | null } | null;

type Props = {
  slug: string;
  clave: string;
  pareja: { a: string; b: string };
  qr: string;
  enlaceCorto: string;
  inicial: Feed;
  realtime: { url: string; anon: string; canal: string } | null;
  /** Fundido cruzado, en ms (del movimiento de la boda). */
  cruce: number;
  curva: string;
  diseno?: DisenoDirecto;
  /** Vista previa: sin red, con las fotos de muestra y postMessage. */
  muestra?: boolean;
  /** Multiplica las duraciones (la vista previa va algo más deprisa). */
  ritmo?: number;
};

const MAX_CACHE = 90;
const SIMULTANEAS = 4;
const CADA_COMPLETO_MS = 120_000;
const ORIGENES = ["50% 50%", "35% 40%", "65% 40%", "40% 65%", "60% 60%"];
const MAX_PILA = 8;
const TESELAS = 12;

const azar = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const entre = (a: number, b: number) => a + Math.random() * (b - a);

function kenBurns() {
  return {
    dx: Math.round((Math.random() * 2 - 1) * 15) / 10,
    dy: Math.round((Math.random() * 2 - 1) * 12) / 10,
    origen: azar(ORIGENES),
  };
}

export default function Pantalla(p: Props) {
  const [diseno, setDiseno] = useState<DisenoDirecto>(() => normalizarDiseno(p.diseno ?? p.inicial.diseno ?? DISENO_INICIAL));
  const [capas, setCapas] = useState<(Diapo & { saliendo?: boolean })[]>([
    { key: 0, tipo: "portada", piezas: [], nuevo: false, dur: 9000, kb: kenBurns() },
  ]);
  const [pila, setPila] = useState<EnPila[]>([]);
  const [teselas, setTeselas] = useState<Tesela[]>([]);
  const [ultimaTesela, setUltimaTesela] = useState<number | null>(null);
  const [pie, setPie] = useState<Pie>(null);
  const [total, setTotal] = useState(p.inicial.total);
  const [sinRed, setSinRed] = useState(false);
  const [claveCaducada, setClaveCaducada] = useState(false);
  const [capitulo, setCapitulo] = useState(p.inicial.capitulo ?? null);
  const [controles, setControles] = useState(false);
  const [completa, setCompleta] = useState(false);

  // ─────────── el estado del pase (refs: no se pinta, se decide)
  const todos = useRef(new Map<string, M>());
  const orden = useRef<string[]>([]);
  const listos = useRef(new Map<string, string>());
  const cargando = useRef(new Set<string>());
  const nuevos = useRef<string[]>([]);
  const marcados = useRef(new Set<string>());
  const mensajesNuevos = useRef<string[]>([]);
  const vistas = useRef(new Map<string, number>());
  const fijado = useRef<M | null>(p.inicial.fijado ?? null);
  const capituloRef = useRef<{ titulo: string; desde: string } | null>(p.inicial.capitulo ?? null);
  // En la vista previa, el momento de `?cap=` se enseña con su rótulo.
  const capituloMostrado = useRef<string | null>(p.muestra ? null : (p.inicial.capitulo?.desde ?? null));
  const cuenta = useRef({ desdeMensaje: 0, desdeFijado: 0, diapos: 0 });
  const enPantalla = useRef<Set<string>>(new Set());
  const llave = useRef(1);
  const desde = useRef<string | null>(p.inicial.ahora);
  const iniciado = useRef(false);
  const disenoRef = useRef(diseno);
  const pilaRef = useRef<EnPila[]>([]);
  const teselasRef = useRef<Tesela[]>([]);
  const forzar = useRef<() => void>(() => {});
  const ultimaTeselaRef = useRef<number | null>(null);
  const ritmo = p.ritmo ?? 1;

  useEffect(() => {
    disenoRef.current = diseno;
  }, [diseno]);

  // ─────────── descargar una imagen entera antes de enseñarla
  const precargar = useCallback(function precargar() {
    const pendientesNuevos = [...marcados.current].filter(
      (id) => todos.current.has(id) && !listos.current.has(id) && !cargando.current.has(id),
    );
    const candidatos = [
      ...pendientesNuevos,
      ...orden.current.filter((id) => !listos.current.has(id) && !cargando.current.has(id)),
    ];
    for (const id of candidatos) {
      if (cargando.current.size >= SIMULTANEAS) break;
      const m = todos.current.get(id);
      if (!m || m.tipo === "mensaje" || !m.pantalla) continue;
      const esNuevo = pendientesNuevos.includes(id);
      if (listos.current.size >= MAX_CACHE && !esNuevo) break;
      cargando.current.add(id);
      void cargar(m)
        .then((src) => {
          if (!todos.current.has(id)) {
            if (src.startsWith("blob:")) URL.revokeObjectURL(src);
            return;
          }
          listos.current.set(id, src);
          if (marcados.current.has(id)) {
            marcados.current.delete(id);
            nuevos.current.push(id);
          }
          recortarCache(listos.current, enPantalla.current, vistas.current);
        })
        .catch(() => {})
        .finally(() => {
          cargando.current.delete(id);
          precargar();
        });
    }
  }, []);

  // ─────────── meter un feed
  const incorporar = useCallback(
    (f: Feed, esInicial = false) => {
      setTotal(f.total);
      fijado.current = f.fijado ?? null;
      if (f.diseno) {
        const d = normalizarDiseno(f.diseno);
        if (JSON.stringify(d) !== JSON.stringify(disenoRef.current)) setDiseno(d);
      }
      if ((f.capitulo?.desde ?? null) !== (capituloRef.current?.desde ?? null)) {
        capituloRef.current = f.capitulo ?? null;
        setCapitulo(f.capitulo ?? null);
      }
      if (f.ids) {
        const vivos = new Set(f.ids);
        for (const id of [...todos.current.keys()]) {
          if (vivos.has(id)) continue;
          todos.current.delete(id);
          const src = listos.current.get(id);
          if (src?.startsWith("blob:") && !enPantalla.current.has(id)) URL.revokeObjectURL(src);
          listos.current.delete(id);
        }
        nuevos.current = nuevos.current.filter((id) => vivos.has(id));
        mensajesNuevos.current = mensajesNuevos.current.filter((id) => vivos.has(id));
        // Lo ocultado sale también de la pila y del mosaico.
        if (pilaRef.current.some((x) => x.pieza && !vivos.has(x.pieza.id))) {
          pilaRef.current = pilaRef.current.filter((x) => !x.pieza || vivos.has(x.pieza.id));
          setPila(pilaRef.current);
        }
        if (teselasRef.current.some((x) => x.pieza && !vivos.has(x.pieza.id))) {
          teselasRef.current = teselasRef.current.map((x) => (x.pieza && !vivos.has(x.pieza.id) ? { key: llave.current++ } : x));
          setTeselas(teselasRef.current);
        }
      }
      // Del más antiguo al más nuevo: en el orden en que llegaron.
      for (const m of [...f.momentos].reverse()) {
        const ya = todos.current.has(m.id);
        todos.current.set(m.id, m);
        if (ya) {
          if (m.tipo === "video" && m.pantalla && listos.current.has(m.id)) listos.current.set(m.id, m.pantalla);
          continue;
        }
        if (!esInicial) {
          if (m.tipo === "mensaje") mensajesNuevos.current.push(m.id);
          else marcados.current.add(m.id);
        }
      }
      orden.current = [...todos.current.values()].sort((a, b) => b.creado.localeCompare(a.creado)).map((m) => m.id);
      precargar();
    },
    [precargar],
  );

  // ─────────── elegir la siguiente diapositiva
  const elegir = useCallback((): Diapo => {
    const key = llave.current++;
    const kb = kenBurns();
    const c = cuenta.current;
    const estilo = disenoRef.current.estilo;
    // Cine: siempre de una en una. Revista, Polaroid y Mosaico: hasta tres.
    const maxJuntas = estilo === "cine" ? 1 : 3;
    const pieza = (id: string): Pieza | null => {
      const m = todos.current.get(id);
      const src = listos.current.get(id);
      if (!m || !src || m.tipo === "mensaje") return null;
      const ancho = m.ancho ?? 4;
      const alto = Math.max(1, m.alto ?? 3);
      return {
        id,
        src,
        autor: m.autor,
        mensaje: m.mensaje,
        tipo: m.tipo,
        ancho,
        alto,
        apaisada: ancho / alto > 1.25,
        capitulo: m.capitulo,
      };
    };
    const mensaje = (m: M, esFijado = false): Diapo => {
      c.desdeMensaje = 0;
      if (esFijado) c.desdeFijado = 0;
      vistas.current.set(m.id, (vistas.current.get(m.id) ?? 0) + 1);
      const largo = (m.mensaje ?? "").length;
      return {
        key,
        tipo: "mensaje",
        piezas: [],
        texto: { mensaje: m.mensaje ?? "", autor: m.autor, fijado: esFijado },
        nuevo: !esFijado && (vistas.current.get(m.id) ?? 0) <= 1,
        dur: Math.min(15000, 7500 + largo * 35),
        kb,
      };
    };
    const conFoto = (tipo: Tipo, piezas: Pieza[], nuevo: boolean): Diapo => {
      c.desdeMensaje++;
      c.desdeFijado++;
      for (const x of piezas) vistas.current.set(x.id, (vistas.current.get(x.id) ?? 0) + 1);
      const video = piezas[0]?.tipo === "video" ? todos.current.get(piezas[0].id) : null;
      const dur =
        tipo === "video"
          ? Math.min(30, video?.duracion ?? 15) * 1000 + 900
          : tipo === "trio"
            ? 11000
            : tipo === "pareja"
              ? 10000
              : 8000;
      return { key, tipo, piezas, nuevo, dur, kb };
    };

    // 1. Un momento programado recién lanzado: rótulo a pantalla completa.
    const cap = capituloRef.current;
    if (cap && capituloMostrado.current !== cap.desde) {
      capituloMostrado.current = cap.desde;
      if (disenoRef.current.rotulos) return { key, tipo: "capitulo", piezas: [], titulo: cap.titulo, nuevo: true, dur: 6500, kb };
    }
    // 2. El mensaje fijado, cada siete diapositivas.
    if (fijado.current && c.desdeFijado >= 7) return mensaje(fijado.current, true);
    // 3. Mensajes recién llegados.
    while (mensajesNuevos.current.length) {
      const m = todos.current.get(mensajesNuevos.current.shift()!);
      if (m) return mensaje(m);
    }
    // 4. Fotos recién llegadas, con prioridad (vídeos, solos).
    const listosNuevos = nuevos.current.filter((id) => listos.current.has(id));
    if (listosNuevos.length) {
      const primero = pieza(listosNuevos[0]);
      if (primero?.tipo === "video") {
        nuevos.current = nuevos.current.filter((id) => id !== primero.id);
        return conFoto("video", [primero], true);
      }
      const fotos = listosNuevos.map(pieza).filter((x): x is Pieza => x?.tipo === "foto").slice(0, maxJuntas);
      nuevos.current = nuevos.current.filter((id) => !fotos.some((f) => f.id === id));
      if (fotos.length >= 3) return conFoto("trio", fotos, true);
      if (fotos.length === 2) return conFoto("pareja", fotos, true);
      if (fotos.length === 1) return conFoto("foto", fotos, true);
    }
    // 5. Un mensaje de vez en cuando (cada cinco fotos).
    const mensajes = orden.current.map((id) => todos.current.get(id)!).filter((m) => m?.tipo === "mensaje");
    const disponibles = orden.current.filter((id) => listos.current.has(id) && !enPantalla.current.has(id));
    if (mensajes.length && (c.desdeMensaje >= 5 || !disponibles.length)) {
      return mensaje(menosVisto(mensajes, vistas.current));
    }
    if (!disponibles.length) return { key, tipo: "portada", piezas: [], nuevo: false, dur: 10000, kb };
    // 6. La rotación: lo menos visto primero (lo destacado cuenta la mitad).
    const peso = (id: string) => {
      const m = todos.current.get(id)!;
      return (vistas.current.get(id) ?? 0) / (m.destacado ? 2 : 1) + Math.random() * 0.6;
    };
    const porVer = [...disponibles].sort((a, b) => peso(a) - peso(b));
    const fotos = porVer.map(pieza).filter((x): x is Pieza => x?.tipo === "foto");
    c.diapos++;
    if (estilo === "revista" && fotos.length >= 6 && c.diapos % 4 === 0) return conFoto("trio", fotos.slice(0, 3), false);
    if (estilo === "polaroid" && fotos.length >= 4 && c.diapos % 5 === 0) return conFoto("pareja", fotos.slice(0, 2), false);
    const primera = pieza(porVer[0]);
    if (!primera) return { key, tipo: "portada", piezas: [], nuevo: false, dur: 10000, kb };
    return conFoto(primera.tipo === "video" ? "video" : "foto", [primera], false);
  }, []);

  // ─────────── enseñar una diapositiva, según el estilo
  const enseñar = useCallback(
    (d: Diapo): number => {
      const estilo = disenoRef.current.estilo;
      const cruce = p.cruce;
      const conFotos = d.tipo === "foto" || d.tipo === "video" || d.tipo === "pareja" || d.tipo === "trio";
      // El pie de la banda: la primera con mensaje, si no la primera.
      if (conFotos) {
        const x = d.piezas.find((y) => y.mensaje) ?? d.piezas[0];
        const varias = d.piezas.length > 1 && !x.mensaje;
        setPie({
          key: d.key,
          autor: varias ? listaNombres(d.piezas.map((y) => y.autor)) : x.autor,
          mensaje: x.mensaje,
          nuevo: d.nuevo,
          capitulo: x.capitulo,
        });
      } else setPie(null);

      const superpuesta = d.tipo === "portada" || d.tipo === "capitulo";
      if (estilo === "revista" || estilo === "cine" || superpuesta) {
        if (estilo === "revista" || estilo === "cine") {
          enPantalla.current = new Set(d.piezas.map((x) => x.id));
          setCapas((cs) => [cs[cs.length - 1], d].filter(Boolean));
          window.setTimeout(() => setCapas((cs) => cs.filter((c) => c.key === d.key)), cruce + 200);
          return d.dur * ritmo;
        }
        // Polaroid y Mosaico: la portada y el rótulo se superponen al muro.
        if (d.tipo === "portada" && (pilaRef.current.length || teselasRef.current.some((t) => t.pieza))) {
          return 2500 * ritmo; // ya hay muro: el QR está en la banda.
        }
        setCapas([d]);
        return d.dur * ritmo;
      }
      // Polaroid / Mosaico con fotos o mensaje: se va la capa superpuesta.
      setCapas((cs) => cs.map((c) => ({ ...c, saliendo: true })));
      window.setTimeout(() => setCapas((cs) => cs.filter((c) => !c.saliendo)), cruce * 0.6 + 200);

      if (estilo === "polaroid") {
        const nuevosEnPila: EnPila[] = d.tipo === "mensaje" && d.texto
          ? [{ key: d.key * 10, texto: { mensaje: d.texto.mensaje, autor: d.texto.autor }, x: entre(30, 70), y: entre(38, 62), r: entre(-4, 4) }]
          : d.piezas.map((pz, i) => ({
              key: d.key * 10 + i,
              pieza: pz,
              // Que no se salgan de la mesa: las apaisadas, más hacia el centro.
              x: d.piezas.length > 1 ? 28 + (44 / (d.piezas.length - 1)) * i + entre(-3, 3) : pz.apaisada ? entre(34, 66) : entre(26, 74),
              y: entre(44, 56),
              r: entre(-8, 8),
            }));
        pilaRef.current = [...pilaRef.current, ...nuevosEnPila].slice(-MAX_PILA);
        setPila(pilaRef.current);
        enPantalla.current = new Set(pilaRef.current.flatMap((x) => (x.pieza ? [x.pieza.id] : [])));
        const base = d.tipo === "mensaje" ? d.dur : 6500 + (d.piezas.length - 1) * 1500;
        return Math.min(d.dur, base) * ritmo;
      }

      // Mosaico: cada pieza (o el mensaje) ocupa una tesela; primero las vacías.
      if (d.tipo === "mensaje" && d.texto && teselasRef.current.some((t) => t.texto?.mensaje === d.texto!.mensaje && t.texto?.autor === d.texto!.autor)) {
        return 600 * ritmo; // ya está en el muro: a por la siguiente.
      }
      let ts = teselasRef.current.length ? [...teselasRef.current] : Array.from({ length: TESELAS }, () => ({ key: llave.current++ }) as Tesela);
      const entrantes: Tesela[] =
        d.tipo === "mensaje" && d.texto
          ? [{ key: llave.current++, texto: { mensaje: d.texto.mensaje, autor: d.texto.autor } }]
          : d.piezas.map((pz) => ({ key: llave.current++, pieza: pz }));
      let ultima: number | null = null;
      for (const t of entrantes) {
        const vacias = ts.map((x, i) => (!x.pieza && !x.texto ? i : -1)).filter((i) => i >= 0);
        let i: number;
        if (vacias.length) i = vacias[Math.floor(Math.random() * vacias.length)];
        else {
          // Sin hueco: la que lleva más tiempo (key más baja), nunca la de justo antes.
          i = -1;
          for (let j = 0; j < ts.length; j++) {
            if (j === ultima || j === ultimaTeselaRef.current) continue;
            if (i < 0 || ts[j].key < ts[i].key) i = j;
          }
        }
        ts[i] = t;
        ultima = i;
      }
      ts = ts.slice(0, TESELAS);
      teselasRef.current = ts;
      ultimaTeselaRef.current = ultima;
      setTeselas(ts);
      setUltimaTesela(ultima);
      enPantalla.current = new Set(ts.flatMap((x) => (x.pieza ? [x.pieza.id] : [])));
      const llenas = ts.filter((x) => x.pieza || x.texto).length;
      // Mientras se llena, va rápido; luego, una cada cuatro segundos y medio.
      return (llenas < TESELAS ? 1400 : d.tipo === "mensaje" ? 7000 : 4500) * ritmo;
    },
    [p.cruce, ritmo],
  );

  // ─────────── el reloj del pase
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    incorporar(p.inicial, true);
    let temporizador = 0;
    const avanzar = () => {
      window.clearTimeout(temporizador);
      const d = elegir();
      let espera = enseñar(d);
      // Aún bajando las primeras fotos: se vuelve a mirar enseguida.
      const hayFotos = [...todos.current.values()].some((m) => m.tipo !== "mensaje");
      if (d.tipo === "portada" && hayFotos && listos.current.size === 0) espera = Math.min(espera, 2500);
      temporizador = window.setTimeout(avanzar, espera);
    };
    forzar.current = avanzar;
    // La portada se queda unos segundos mientras bajan las primeras fotos.
    temporizador = window.setTimeout(avanzar, 6000 * ritmo);
    return () => {
      window.clearTimeout(temporizador);
      iniciado.current = false;
    };
  }, [elegir, enseñar, incorporar, p.inicial, ritmo]);

  // Al cambiar de estilo: se vacía el muro y se empieza al momento.
  const estiloPrevio = useRef<EstiloPase>(diseno.estilo);
  useEffect(() => {
    if (estiloPrevio.current === diseno.estilo) return;
    estiloPrevio.current = diseno.estilo;
    pilaRef.current = [];
    teselasRef.current = [];
    ultimaTeselaRef.current = null;
    enPantalla.current = new Set();
    setPila([]);
    setTeselas([]);
    setUltimaTesela(null);
    const t = window.setTimeout(() => forzar.current(), 80);
    return () => window.clearTimeout(t);
  }, [diseno.estilo]);

  // ─────────── vista previa: diseño y foto nueva por postMessage
  useEffect(() => {
    if (!p.muestra) return;
    const alMensaje = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const datos = ev.data as { tipo?: string; diseno?: unknown; foto?: { src: string; ancho: number; alto: number; autor: string; mensaje?: string } };
      if (datos?.tipo === MENSAJE_DISENO) setDiseno(normalizarDiseno(datos.diseno));
      if (datos?.tipo === MENSAJE_FOTO && datos.foto) {
        const f = datos.foto;
        const id = `movil${Date.now().toString(36)}`;
        incorporar({
          momentos: [
            {
              id,
              tipo: "foto",
              url: f.src,
              pantalla: f.src,
              miniatura: f.src,
              ancho: f.ancho,
              alto: f.alto,
              duracion: null,
              autor: f.autor,
              mensaje: f.mensaje ?? null,
              destacado: true,
              capitulo: null,
              creado: new Date().toISOString(),
            },
          ],
          ahora: new Date().toISOString(),
          activo: true,
          subidasAbiertas: true,
          total: (todos.current.size || 0) + 113,
        });
        // En cuanto baje, entra.
        const mirar = window.setInterval(() => {
          if (listos.current.has(id)) {
            window.clearInterval(mirar);
            forzar.current();
          }
        }, 120);
        window.setTimeout(() => window.clearInterval(mirar), 6000);
      }
    };
    window.addEventListener("message", alMensaje);
    window.parent?.postMessage({ tipo: "invitoo:directo:lista" }, window.location.origin);
    return () => window.removeEventListener("message", alMensaje);
  }, [incorporar, p.muestra]);

  // ─────────── feed: polling (y tiempo real si lo hay)
  const conectado = useRef(false);
  const pedirAhora = useRef<(completo?: boolean) => void>(() => {});
  useEffect(() => {
    if (p.muestra) return;
    let vivo = true;
    let temporizador = 0;
    let fallos = 0;
    let ultimoCompleto = Date.now();
    async function pedir(completo = false) {
      window.clearTimeout(temporizador);
      const todo = completo || Date.now() - ultimoCompleto > CADA_COMPLETO_MS;
      try {
        const q = new URLSearchParams({ k: p.clave });
        if (!todo && desde.current) q.set("desde", desde.current);
        const r = await fetch(`/api/momentos/${p.slug}/feed?${q}`, { cache: "no-store" });
        if (r.status === 403) {
          if (vivo) setClaveCaducada(true);
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        const f = (await r.json()) as Feed;
        if (!vivo) return;
        if (todo) ultimoCompleto = Date.now();
        desde.current = f.ahora;
        incorporar(f);
        fallos = 0;
        setSinRed(false);
      } catch {
        fallos++;
        if (vivo && fallos >= 2) setSinRed(true);
      }
      if (!vivo) return;
      const base = conectado.current ? 30_000 : 5_000;
      temporizador = window.setTimeout(() => pedir(), Math.min(30_000, base * Math.max(1, fallos)));
    }
    pedirAhora.current = (completo) => void pedir(completo);
    temporizador = window.setTimeout(() => pedir(), 5_000);
    const alVolver = () => void pedir(true);
    window.addEventListener("online", alVolver);
    return () => {
      vivo = false;
      window.clearTimeout(temporizador);
      window.removeEventListener("online", alVolver);
    };
  }, [incorporar, p.clave, p.slug, p.muestra]);

  useEffect(() => {
    if (!p.realtime || p.muestra) return;
    const rt = p.realtime;
    let cerrar: (() => void) | null = null;
    let vivo = true;
    void import("@supabase/supabase-js").then(({ createClient }) => {
      if (!vivo) return;
      const sb = createClient(rt.url, rt.anon, { auth: { persistSession: false } });
      const canal = sb
        .channel(rt.canal)
        .on("broadcast", { event: "nuevo" }, () => pedirAhora.current())
        .on("broadcast", { event: "cambio" }, () => pedirAhora.current(true))
        .subscribe((estado) => {
          conectado.current = estado === "SUBSCRIBED";
          if (estado === "SUBSCRIBED") pedirAhora.current();
        });
      cerrar = () => void sb.removeChannel(canal);
    });
    return () => {
      vivo = false;
      conectado.current = false;
      cerrar?.();
    };
  }, [p.realtime, p.muestra]);

  // ─────────── que la TV no se duerma
  useEffect(() => {
    if (p.muestra) return;
    let cerrojo: WakeLockSentinel | null = null;
    const pedir = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          cerrojo = await navigator.wakeLock.request("screen");
        }
      } catch {}
    };
    void pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      document.removeEventListener("visibilitychange", pedir);
      void cerrojo?.release().catch(() => {});
    };
  }, [p.muestra]);

  // ─────────── controles: aparecen al mover el ratón
  useEffect(() => {
    if (p.muestra) return;
    let t = 0;
    const mostrar = () => {
      setControles(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setControles(false), 3000);
    };
    const pantalla = () => setCompleta(Boolean(document.fullscreenElement));
    window.addEventListener("pointermove", mostrar);
    window.addEventListener("keydown", mostrar);
    document.addEventListener("fullscreenchange", pantalla);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointermove", mostrar);
      window.removeEventListener("keydown", mostrar);
      document.removeEventListener("fullscreenchange", pantalla);
    };
  }, [p.muestra]);

  const alternarPantalla = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (claveCaducada) {
    return (
      <div className="fixed inset-0 grid place-items-center p-10 text-center">
        <div>
          <h1 className="display text-[clamp(2.4rem,5vw,4rem)]">La clave de esta pantalla ha cambiado</h1>
          <p className="mt-6 text-[1.375rem] opacity-80">Abrid el enlace nuevo desde vuestro panel.</p>
        </div>
      </div>
    );
  }

  const estilo = diseno.estilo;
  const conPortada = capas.some((c) => c.tipo === "portada" && !c.saliendo);
  const ini = iniciales(p.pareja.a, p.pareja.b);

  return (
    <div
      className={`pantalla fixed inset-0 estilo-${estilo} ${diseno.marco ? "con-marco" : ""} ${aMano.variable} ${controles ? "" : "cursor-none"}`}
      data-estilo={estilo}
      style={{ "--cruce": `${p.cruce}ms`, "--curva": p.curva } as React.CSSProperties}
    >
      {/* ─────────── el escenario: donde viven las fotos (nunca bajo la banda) */}
      <div className="escenario">
        <div className="lienzo">
          {estilo === "polaroid" && <Mesa pila={pila} />}
          {estilo === "mosaico" && <Muro teselas={teselas} ultima={ultimaTesela} manuscritas={diseno.manuscritas} ini={ini} />}
          {capas.map((d, i) => (
            <Capa
              key={d.key}
              d={d}
              entra={i > 0 || d.key > 0}
              sale={Boolean(d.saliendo) || (capas.length > 1 && i === 0)}
              soloTexto={!d.saliendo && (estilo === "revista" || estilo === "cine")}
              p={p}
              diseno={diseno}
              ini={ini}
            />
          ))}
        </div>
      </div>

      {/* ─────────── el marco: en el margen, nunca encima de una foto */}
      {diseno.marco && (
        <div aria-hidden className="marco">
          <span className="cartela display">
            {ini.a}
            <span className="amp">&amp;</span>
            {ini.b}
          </span>
        </div>
      )}

      {/* ─────────── la banda: nombres, pie de foto, contador y QR */}
      <footer className="banda">
        <div className={`banda-nombres ${conPortada ? "oculto" : ""}`}>
          <SelloAlianzas size={44} className="sello shrink-0" />
          <p className="display nombres">
            {p.pareja.a} <span className="amp">&amp;</span> {p.pareja.b}
          </p>
        </div>
        <div className="banda-pie" aria-live="off">
          {pie && !conPortada && (
            <div key={pie.key} className="pie-entra">
              <p className="pie-eyebrow">
                {pie.nuevo ? "Recién llegada" : capitulo ? `Ahora · ${capitulo.titulo}` : pie.capitulo ? pie.capitulo : " "}
              </p>
              {pie.mensaje ? (
                <p className={`pie-texto ${diseno.manuscritas ? "a-mano" : "display italic"} ${pie.mensaje.length > 90 ? "largo" : ""}`}>
                  «{pie.mensaje}» <span className="pie-autor">— {pie.autor}</span>
                </p>
              ) : (
                <p className="pie-texto display italic">De {pie.autor}</p>
              )}
            </div>
          )}
          {!pie && capitulo && !conPortada && (
            <p className="pie-eyebrow pie-entra" key={capitulo.desde}>Ahora · {capitulo.titulo}</p>
          )}
        </div>
        <div className={`banda-qr ${conPortada ? "oculto" : ""}`}>
          <div className="text-right">
            {total > 0 && (
              <p className="contador display italic">
                {total.toLocaleString("es-ES")} {total === 1 ? "recuerdo" : "recuerdos"}
              </p>
            )}
            <p className="subid">Subid vuestras fotos</p>
          </div>
          <div className="qr-caja" dangerouslySetInnerHTML={{ __html: p.qr }} />
        </div>
      </footer>

      {sinRed && (
        <p role="status" className="aviso-red">Sin conexión · seguimos con las últimas fotos</p>
      )}

      {!p.muestra && (
        <button
          type="button"
          onClick={alternarPantalla}
          aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
          className={`boton-completa ${controles ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {completa ? "Salir" : "Pantalla completa"}
        </button>
      )}

      <style>{ESTILOS}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── capas

function Capa({
  d,
  entra,
  sale,
  soloTexto,
  p,
  diseno,
  ini,
}: {
  d: Diapo;
  entra: boolean;
  sale: boolean;
  soloTexto: boolean;
  p: Props;
  diseno: DisenoDirecto;
  ini: { a: string; b: string };
}) {
  const fuerte = diseno.estilo === "cine";
  const kb = {
    "--kb-dx": `${d.kb.dx * (fuerte ? 2.2 : 1)}%`,
    "--kb-dy": `${d.kb.dy * (fuerte ? 1.6 : 1)}%`,
    "--kb-escala": fuerte ? "1.14" : "1.055",
    "--kb-dur": `${d.dur + p.cruce + 400}ms`,
    transformOrigin: d.kb.origen,
  } as React.CSSProperties;

  return (
    <div
      className={`capa absolute inset-0 overflow-hidden ${sale ? (soloTexto ? "sale" : "sale-todo") : entra ? "entra" : ""} capa-${d.tipo}`}
      aria-hidden={d.tipo === "portada" ? undefined : true}
    >
      {d.tipo === "portada" && <Portada p={p} diseno={diseno} ini={ini} />}

      {d.tipo === "capitulo" && <Rotulo titulo={d.titulo ?? ""} />}

      {d.tipo === "mensaje" && d.texto && (
        <div className="grid h-full place-items-center px-[8%]" style={{ background: "var(--papel)", color: "var(--tinta)" }}>
          {diseno.manuscritas ? (
            <figure className="texto tarjeta-mano" style={{ "--r": `${(d.key % 5) - 2}deg` } as React.CSSProperties}>
              {d.texto.fijado && <p className="tarjeta-para">Para los novios</p>}
              <blockquote className="a-mano" style={{ fontSize: d.texto.mensaje.length > 160 ? "clamp(2rem,3.3vw,4rem)" : "clamp(2.6rem,4.4vw,5.4rem)" }}>
                {d.texto.mensaje}
              </blockquote>
              <figcaption className="a-mano firma">— {d.texto.autor}</figcaption>
            </figure>
          ) : (
            <figure className="texto max-w-[70rem] text-center">
              {d.texto.fijado && <p className="mb-8 text-[clamp(1rem,1.2vw,1.4rem)] uppercase tracking-[0.3em] opacity-60">Para los novios</p>}
              <span aria-hidden className="display block text-[clamp(5rem,9vw,9rem)] leading-[0.5] text-[var(--acento-texto,var(--acento))] opacity-70">
                “
              </span>
              <blockquote
                className="display mt-4 leading-[1.12]"
                style={{ fontSize: d.texto.mensaje.length > 160 ? "clamp(2rem,3.4vw,3.8rem)" : "clamp(2.6rem,4.6vw,5.4rem)" }}
              >
                {d.texto.mensaje}
              </blockquote>
              <figcaption className="mt-10 text-[clamp(1.3rem,1.8vw,2.1rem)] italic opacity-75">— {d.texto.autor}</figcaption>
            </figure>
          )}
        </div>
      )}

      {(d.tipo === "foto" || d.tipo === "video") && d.piezas[0] &&
        (fuerte ? (
          <div className="cine-cuadro">
            <Sola x={d.piezas[0]} kb={kb} cine />
            <div aria-hidden className="cine-vineta" />
          </div>
        ) : (
          <Sola x={d.piezas[0]} kb={kb} cine={false} />
        ))}

      {d.tipo === "pareja" && (
        <div className="grid h-full grid-cols-2 gap-[1.6vw] p-[2.4vw]">
          {d.piezas.map((x) => (
            <Marco key={x.id} x={x} kb={kb} />
          ))}
        </div>
      )}

      {d.tipo === "trio" && (
        <div className="grid h-full grid-cols-[1.7fr_1fr] grid-rows-2 gap-[1.4vw] p-[2.2vw]">
          <div className="row-span-2 min-h-0">
            <Marco x={d.piezas[0]} kb={kb} />
          </div>
          {d.piezas.slice(1).map((x) => (
            <Marco key={x.id} x={x} kb={kb} />
          ))}
        </div>
      )}

      {d.nuevo && d.tipo !== "capitulo" && d.tipo !== "mensaje" && <div aria-hidden className="brillo pointer-events-none absolute inset-0" />}
    </div>
  );
}

function Sola({ x, kb, cine }: { x: Pieza; kb: React.CSSProperties; cine: boolean }) {
  // En Cine todo va a sangre (encuadre panorámico, con la cara arriba).
  const cubrir = x.apaisada || cine;
  return (
    <>
      {/* Fondo: la misma foto, desenfocada. Así una vertical no deja bandas negras. */}
      {x.tipo === "foto" && !cubrir && (
        // eslint-disable-next-line @next/next/no-img-element -- blob local ya descargado
        <img src={x.src} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80 blur-[48px] brightness-[.72]" />
      )}
      <div className="kb absolute inset-0" style={kb}>
        {x.tipo === "video" ? (
          <video src={x.src} autoPlay muted playsInline className="h-full w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- blob local ya descargado
          <img src={x.src} alt="" className={`h-full w-full ${cubrir ? "object-cover" : "object-contain"}`} style={cine ? { objectPosition: "50% 32%" } : undefined} />
        )}
      </div>
    </>
  );
}

/** Una foto de una composición: la imagen arriba y el nombre DEBAJO, nunca encima. */
function Marco({ x, kb }: { x: Pieza; kb: React.CSSProperties }) {
  return (
    <figure className="marco-foto flex h-full min-h-0 w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[4px] shadow-[0_24px_60px_-20px_rgba(0,0,0,.8)]">
        <div className="kb absolute inset-0" style={kb}>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob local ya descargado */}
          <img src={x.src} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <figcaption className="texto mt-[1.2vh] truncate text-[clamp(1rem,1.25vw,1.5rem)] italic opacity-85" style={{ fontFamily: "var(--display)" }}>
        {x.autor}
      </figcaption>
    </figure>
  );
}

/** El rótulo de un momento: las palabras suben de una en una y la línea se dibuja. */
function Rotulo({ titulo }: { titulo: string }) {
  const palabras = titulo.split(/\s+/);
  return (
    <div className="grid h-full place-items-center text-center" style={{ background: "var(--fondo-rotulo)", color: "var(--texto-rotulo)" }}>
      <div className="texto rotulo">
        <p className="rotulo-ahora">Ahora</p>
        <h2 className="display rotulo-titulo">
          {palabras.map((w, i) => (
            <span key={i} className="rotulo-palabra">
              <span style={{ animationDelay: `${300 + i * 140}ms` }}>{w}</span>
            </span>
          ))}
        </h2>
        <div aria-hidden className="rotulo-linea" />
      </div>
    </div>
  );
}

function Portada({ p, diseno, ini }: { p: Props; diseno: DisenoDirecto; ini: { a: string; b: string } }) {
  return (
    <div className="portada grid h-full items-center px-[6%]" style={{ background: "var(--papel)", color: "var(--tinta)" }}>
      <div className="texto grid grid-cols-[1.25fr_1fr] items-center gap-[5vw]">
        <div>
          <p className="monograma display" aria-hidden>
            {ini.a}
            <span>&amp;</span>
            {ini.b}
          </p>
          <h1 className="display mt-[3vh] text-[clamp(3.4rem,6.6vw,8.4rem)] leading-[0.95]">
            {p.pareja.a} <span className="italic text-[var(--acento-texto,var(--acento))]">&amp;</span> {p.pareja.b}
          </h1>
          {diseno.frase && (
            <p className={`mt-[4vh] max-w-[36ch] leading-snug opacity-85 ${diseno.manuscritas ? "a-mano text-[clamp(2rem,3vw,3.6rem)]" : "display italic text-[clamp(1.6rem,2.3vw,2.8rem)]"}`}>
              {diseno.frase}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="h-[clamp(180px,34vh,380px)] w-[clamp(180px,34vh,380px)] rounded-[14px] bg-white p-[1.2vw] shadow-[0_20px_60px_-24px_rgba(0,0,0,.45)] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: p.qr }} />
          <p className="display mt-[3vh] text-[clamp(1.8rem,2.6vw,3.2rem)] leading-tight">Subid vuestras fotos</p>
          <p className="mt-[1.2vh] text-[clamp(1.1rem,1.3vw,1.6rem)] leading-snug opacity-80">Con la cámara del móvil. Sin apps ni registro.</p>
          <p className="mt-[0.8vh] text-[clamp(1rem,1.05vw,1.25rem)] opacity-65">{p.enlaceCorto}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── polaroid

function Mesa({ pila }: { pila: EnPila[] }) {
  return (
    <div className="mesa absolute inset-0" aria-hidden>
      {pila.map((x, i) => {
        const arriba = i === pila.length - 1;
        const estilo = { left: `${x.x}%`, top: `${x.y}%`, "--r": `${x.r}deg`, zIndex: i + 1 } as React.CSSProperties;
        if (x.texto) {
          return (
            <figure key={x.key} className={`pol-tarjeta cae ${arriba ? "arriba" : ""}`} style={estilo}>
              <blockquote className="a-mano" style={{ fontSize: x.texto.mensaje.length > 140 ? "clamp(1.6rem,2.3vw,2.8rem)" : "clamp(2rem,3vw,3.6rem)" }}>
                {x.texto.mensaje}
              </blockquote>
              <figcaption className="a-mano firma">— {x.texto.autor}</figcaption>
            </figure>
          );
        }
        const pz = x.pieza!;
        return (
          <figure key={x.key} className={`pol cae ${arriba ? "arriba" : ""}`} style={estilo}>
            <div className="pol-foto" style={{ aspectRatio: `${pz.ancho} / ${pz.alto}` }}>
              {pz.tipo === "video" ? (
                <video src={pz.src} autoPlay muted playsInline loop className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- blob local ya descargado
                <img src={pz.src} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <figcaption className="a-mano pol-nombre">{pz.autor}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── mosaico

function Muro({
  teselas,
  ultima,
  manuscritas,
  ini,
}: {
  teselas: Tesela[];
  ultima: number | null;
  manuscritas: boolean;
  ini: { a: string; b: string };
}) {
  const ts = teselas.length ? teselas : Array.from({ length: TESELAS }, (_, i) => ({ key: -1 - i }) as Tesela);
  return (
    <div className="muro absolute inset-0" aria-hidden>
      {ts.map((t, i) => (
        <div key={i} className={`tes ${ultima === i ? "ultima" : ""}`}>
          <div key={t.key} className="tes-capa">
            {t.pieza ? (
              t.pieza.tipo === "video" ? (
                <video src={t.pieza.src} autoPlay muted playsInline loop className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- blob local ya descargado
                <img src={t.pieza.src} alt="" className="h-full w-full object-cover" />
              )
            ) : t.texto ? (
              <div className="tes-texto">
                <p className={manuscritas ? "a-mano" : "display italic"} style={{ fontSize: t.texto.mensaje.length > 90 ? "clamp(1.1rem,1.5vw,1.9rem)" : "clamp(1.4rem,2vw,2.5rem)" }}>
                  {t.texto.mensaje}
                </p>
                <p className={`mt-[1vh] ${manuscritas ? "a-mano" : "italic"} opacity-80`} style={{ fontSize: "clamp(1.1rem,1.4vw,1.7rem)" }}>
                  — {t.texto.autor}
                </p>
              </div>
            ) : (
              <div className="tes-vacia display">
                <span>
                  {ini.a}
                  <span>&amp;</span>
                  {ini.b}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── utilidades

function listaNombres(xs: string[]) {
  const u = [...new Set(xs)];
  if (u.length === 1) return u[0];
  return `${u.slice(0, -1).join(", ")} y ${u[u.length - 1]}`;
}

async function cargar(m: M): Promise<string> {
  if (m.tipo === "video") return m.pantalla!;
  const r = await fetch(m.pantalla!, { cache: "force-cache" });
  if (!r.ok) throw new Error(String(r.status));
  const url = URL.createObjectURL(await r.blob());
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("no decodifica");
  }
  return url;
}

/** Si la memoria se llena, se sueltan las más vistas (nunca las que están en pantalla). */
function recortarCache(listos: Map<string, string>, enPantalla: Set<string>, vistas: Map<string, number>) {
  if (listos.size <= MAX_CACHE) return;
  const sobran = [...listos.keys()]
    .filter((id) => !enPantalla.has(id))
    .sort((a, b) => (vistas.get(b) ?? 0) - (vistas.get(a) ?? 0))
    .slice(0, listos.size - MAX_CACHE);
  for (const id of sobran) {
    const src = listos.get(id);
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    listos.delete(id);
  }
}

function menosVisto(xs: M[], vistas: Map<string, number>) {
  return [...xs].sort((a, b) => (vistas.get(a.id) ?? 0) - (vistas.get(b.id) ?? 0) + (Math.random() - 0.5) * 0.4)[0];
}

const ESTILOS = `
  .pantalla {
    --banda: 15vh;
    --fondo: #120f0d; --texto-banda: #f4efe8; --linea-banda: rgba(244,239,232,.16);
    --fondo-rotulo: #120f0d; --texto-rotulo: #f4efe8;
    background: var(--fondo); color: var(--texto-banda);
  }
  .pantalla.estilo-cine { --fondo: #060505; --fondo-rotulo: #060505; }
  .pantalla.estilo-polaroid, .pantalla.estilo-mosaico {
    --fondo: var(--papel); --texto-banda: var(--tinta); --linea-banda: color-mix(in oklab, var(--tinta) 16%, transparent);
    --fondo-rotulo: var(--papel); --texto-rotulo: var(--tinta);
  }
  .pantalla .a-mano { font-family: var(--a-mano), "Segoe Print", cursive; font-weight: 500; line-height: 1.12; }

  /* El escenario deja libre la banda; con marco, también el margen. */
  .pantalla .escenario { position: absolute; left: 0; right: 0; top: 0; bottom: var(--banda); }
  .pantalla.con-marco .escenario { padding: 7vh 3vw 1.4vh; }
  .pantalla.estilo-cine .escenario { padding-top: 9vh; }
  .pantalla.estilo-cine.con-marco .escenario { padding: 9vh 3vw 1.4vh; }
  .pantalla .lienzo { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .pantalla.con-marco .lienzo { border-radius: 2px; }

  .pantalla .marco { position: absolute; left: 1.4vw; right: 1.4vw; top: 3.5vh; bottom: calc(var(--banda) + .5vh);
    border: 1px solid color-mix(in oklab, var(--acento) 60%, var(--texto-banda)); outline: 1px solid color-mix(in oklab, var(--acento) 30%, transparent); outline-offset: 5px; pointer-events: none; }
  .pantalla .cartela { position: absolute; left: 50%; top: 0; transform: translate(-50%, -50%); background: var(--fondo); padding: 0 1.6vw;
    font-size: clamp(1.4rem, 2.4vw, 2.9rem); line-height: 1; letter-spacing: .04em; color: var(--texto-banda); white-space: nowrap; }
  .pantalla .cartela .amp, .pantalla .monograma span, .pantalla .tes-vacia span span { font-style: italic; color: var(--acento-texto, var(--acento)); margin: 0 .18em; }
  .pantalla.estilo-revista .cartela .amp, .pantalla.estilo-cine .cartela .amp { color: color-mix(in oklab, var(--acento) 45%, #fff); }

  /* La banda: nombres · pie de foto · contador y QR. Las fotos no la pisan. */
  .pantalla .banda { position: absolute; left: 0; right: 0; bottom: 0; height: var(--banda); display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2.1fr) minmax(0, 1fr); align-items: center; gap: 2.2vw;
    padding: 0 3vw; border-top: 1px solid var(--linea-banda); background: var(--fondo); color: var(--texto-banda); }
  .pantalla .banda-nombres { display: flex; align-items: center; gap: 1vw; min-width: 0; transition: opacity 700ms ease; }
  .pantalla .banda-nombres .sello { width: clamp(28px, 2.6vw, 52px); height: auto; opacity: .75; }
  .pantalla .nombres { font-size: clamp(1.3rem, 2vw, 2.5rem); line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pantalla .nombres .amp { font-style: italic; opacity: .7; }
  .pantalla .banda-pie { min-width: 0; text-align: center; }
  .pantalla .pie-eyebrow { font-size: clamp(.85rem, 1vw, 1.2rem); letter-spacing: .24em; text-transform: uppercase; opacity: .72; }
  .pantalla .pie-texto { margin-top: .5vh; font-size: clamp(1.2rem, 1.9vw, 2.35rem); line-height: 1.22;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pantalla .pie-texto.a-mano { font-size: clamp(1.5rem, 2.4vw, 2.9rem); line-height: 1.08; }
  .pantalla .pie-texto.largo { font-size: clamp(1rem, 1.4vw, 1.75rem); -webkit-line-clamp: 3; }
  .pantalla .pie-texto.a-mano.largo { font-size: clamp(1.25rem, 1.8vw, 2.2rem); }
  .pantalla .pie-autor { font-style: normal; opacity: .75; white-space: nowrap; }
  .pantalla .banda-qr { display: flex; align-items: center; justify-content: flex-end; gap: 1.2vw; transition: opacity 700ms ease; }
  .pantalla .contador { font-size: clamp(1rem, 1.2vw, 1.5rem); opacity: .85; }
  .pantalla .subid { font-size: clamp(.95rem, 1.1vw, 1.35rem); margin-top: .3vh; }
  .pantalla .qr-caja { height: calc(var(--banda) - 3.4vh); aspect-ratio: 1; background: #fff; border-radius: 10px; padding: .55vh; flex-shrink: 0; box-shadow: 0 10px 30px -14px rgba(0,0,0,.55); }
  .pantalla .qr-caja svg { width: 100%; height: 100%; display: block; }
  .pantalla .oculto { opacity: 0; }
  .pantalla .pie-entra { animation: pPie 900ms cubic-bezier(.22,.61,.36,1) calc(var(--cruce) * .55) both; }
  @keyframes pPie { from { opacity: 0; transform: translate3d(0, 8px, 0); } to { opacity: 1; transform: none; } }

  /* Capas: fundido cruzado sin pasar por negro (la nueva entra ENCIMA). */
  .pantalla .capa { background: var(--fondo); }
  .pantalla .capa.sale .texto { animation: pSale calc(var(--cruce) * .3) ease-out both; }
  .pantalla .capa.sale-todo { animation: pSale calc(var(--cruce) * .6) ease-out both; z-index: 20; }
  .pantalla .capa.entra { animation: pFundido calc(var(--cruce) * .75) var(--curva) calc(var(--cruce) * .25) both; z-index: 21; }
  .pantalla .capa.entra .texto { animation: pFundido calc(var(--cruce) * .4) ease-out calc(var(--cruce) * .85) both; }
  @keyframes pFundido { from { opacity: 0 } to { opacity: 1 } }
  @keyframes pSale { from { opacity: 1 } to { opacity: 0 } }
  .pantalla .kb { animation: pKenBurns var(--kb-dur) linear both; will-change: transform; }
  @keyframes pKenBurns {
    from { transform: scale(1) translate3d(0, 0, 0); }
    to   { transform: scale(var(--kb-escala, 1.055)) translate3d(var(--kb-dx), var(--kb-dy), 0); }
  }
  .pantalla .brillo {
    background: radial-gradient(60% 50% at 50% 45%, rgba(255,248,235,.3), rgba(255,248,235,0) 70%);
    animation: pBrillo 3200ms ease-out both; animation-delay: calc(var(--cruce) * .4);
  }
  @keyframes pBrillo { 0% { opacity: 0 } 35% { opacity: 1 } 100% { opacity: 0 } }
  .pantalla.estilo-cine .capa-foto, .pantalla.estilo-cine .capa-video { background: #000; }
  .pantalla .cine-cuadro { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); aspect-ratio: 2.39 / 1; max-height: 100%; overflow: hidden; }
  .pantalla .cine-vineta { position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(130% 120% at 50% 50%, transparent 58%, rgba(0,0,0,.42)); }
  .pantalla.estilo-cine .pie-texto:not(.a-mano) { font-style: normal; letter-spacing: .01em; }

  /* Portada */
  .pantalla .monograma { font-size: clamp(1.6rem, 2.6vw, 3.2rem); letter-spacing: .06em; display: inline-flex; align-items: center;
    border: 1px solid color-mix(in oklab, var(--acento) 55%, transparent); border-radius: 999px; padding: .5vh 1.4vw; }

  /* Tarjeta manuscrita (Revista y Cine) */
  .pantalla .tarjeta-mano { max-width: min(78%, 62rem); background: color-mix(in oklab, var(--papel) 70%, #fff); color: var(--tinta);
    padding: 6vh 4.5vw 5vh; transform: rotate(var(--r, -1deg)); box-shadow: 0 30px 70px -30px rgba(0,0,0,.45), 0 2px 0 rgba(0,0,0,.04);
    background-image: repeating-linear-gradient(to bottom, transparent 0 calc(1.12em - 1px), color-mix(in oklab, var(--acento) 14%, transparent) calc(1.12em - 1px) 1.12em); }
  .pantalla .tarjeta-para { font-size: clamp(1rem, 1.2vw, 1.4rem); letter-spacing: .24em; text-transform: uppercase; opacity: .6; margin-bottom: 2.4vh; }
  .pantalla .firma { margin-top: 3vh; text-align: right; font-size: clamp(1.8rem, 2.6vw, 3.2rem); color: var(--acento-texto, var(--acento)); }

  /* Rótulo de momento */
  .pantalla .rotulo-ahora { font-size: clamp(1.1rem, 1.5vw, 1.8rem); letter-spacing: .4em; text-transform: uppercase; opacity: .7; animation: pFundido 700ms ease-out 150ms both; }
  .pantalla .rotulo-titulo { margin-top: 4vh; font-size: clamp(3.6rem, 8.5vw, 10rem); line-height: 1; }
  .pantalla .rotulo-palabra { display: inline-block; overflow: hidden; padding: 0 .12em .08em; vertical-align: bottom; }
  .pantalla .rotulo-palabra > span { display: inline-block; animation: pSube 1100ms cubic-bezier(.19,1,.22,1) both; }
  @keyframes pSube { from { transform: translate3d(0, 105%, 0); opacity: 0; } to { transform: none; opacity: 1; } }
  .pantalla .rotulo-linea { margin: 5vh auto 0; height: 1px; width: 12vw; background: var(--acento-texto, var(--acento)); transform-origin: center; animation: pLinea 1400ms cubic-bezier(.65,0,.35,1) 700ms both; }
  .pantalla.estilo-revista .rotulo-linea, .pantalla.estilo-cine .rotulo-linea { background: color-mix(in oklab, var(--acento) 45%, #fff); }
  @keyframes pLinea { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* Polaroid: la mesa y la pila */
  .pantalla .mesa { background:
      radial-gradient(120% 90% at 50% 40%, transparent 55%, color-mix(in oklab, var(--tinta) 10%, transparent)),
      repeating-linear-gradient(90deg, color-mix(in oklab, var(--tinta) 2.5%, transparent) 0 2px, transparent 2px 7px),
      var(--papel); }
  .pantalla .pol, .pantalla .pol-tarjeta { position: absolute; transform: translate(-50%, -50%) rotate(var(--r)); will-change: transform; }
  .pantalla .pol { background: #fdfcf9; padding: 1.3vh 1.3vh 0; box-shadow: 0 2px 3px rgba(0,0,0,.12), 0 18px 40px -18px rgba(0,0,0,.45); }
  .pantalla .pol-foto { height: 52vh; max-width: 46vw; overflow: hidden; background: #eee; }
  .pantalla .pol-nombre { height: 9vh; display: grid; place-items: center; color: #2a2420; font-size: clamp(1.6rem, 2.6vw, 3.1rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; padding: 0 1vw; }
  .pantalla .pol-tarjeta { width: min(40vw, 46rem); background: color-mix(in oklab, var(--papel) 60%, #fff); color: #2a2420; padding: 4.5vh 3vw 3.6vh;
    box-shadow: 0 2px 3px rgba(0,0,0,.1), 0 22px 44px -20px rgba(0,0,0,.4);
    background-image: repeating-linear-gradient(to bottom, transparent 0 calc(1.12em - 1px), color-mix(in oklab, var(--acento) 16%, transparent) calc(1.12em - 1px) 1.12em); }
  .pantalla .pol-tarjeta .firma { font-size: clamp(1.4rem, 2vw, 2.4rem); }
  .pantalla .cae { animation: pCae 1250ms cubic-bezier(.2,.75,.25,1) both; }
  .pantalla .cae:not(.arriba) { filter: saturate(.92); }
  @keyframes pCae {
    0%   { transform: translate(-50%, calc(-50% - 85vh)) rotate(calc(var(--r) + 14deg)) scale(1.12); opacity: 0; }
    12%  { opacity: 1; }
    78%  { transform: translate(-50%, calc(-50% + .6vh)) rotate(calc(var(--r) - 1deg)) scale(1); }
    100% { transform: translate(-50%, -50%) rotate(var(--r)) scale(1); }
  }

  /* Mosaico */
  .pantalla .muro { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: .9vw; padding: .9vw; }
  .pantalla .tes { position: relative; overflow: hidden; border-radius: 3px; background: color-mix(in oklab, var(--tinta) 6%, var(--papel)); }
  .pantalla .tes.ultima { box-shadow: 0 0 0 3px var(--papel), 0 0 0 5px var(--acento); }
  .pantalla .tes-capa { position: absolute; inset: 0; animation: pFundido 1100ms var(--curva) both; }
  .pantalla .tes-texto { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 1.6vw; color: var(--tinta);
    background: color-mix(in oklab, var(--papel) 55%, #fff); }
  .pantalla .tes-texto p:first-child { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
  .pantalla .tes-vacia { height: 100%; display: grid; place-items: center; font-size: clamp(1.6rem, 2.6vw, 3rem); color: color-mix(in oklab, var(--tinta) 30%, transparent); }

  .pantalla .aviso-red { position: absolute; left: 50%; top: 1.4vh; transform: translateX(-50%); border-radius: 999px; background: rgba(0,0,0,.6); color: #fff; padding: .5rem 1.25rem; font-size: 1rem; z-index: 40; }
  .pantalla .boton-completa { position: absolute; right: 3vw; top: 2vh; z-index: 40; min-height: 3.5rem; min-width: 3.5rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.4);
    background: rgba(0,0,0,.55); color: #fff; padding: 0 1.25rem; font-size: 1rem; transition: opacity 300ms ease; }

  @media (prefers-reduced-motion: reduce) {
    .pantalla .kb, .pantalla .brillo { animation: none; }
    .pantalla .brillo { opacity: 0; }
    .pantalla .capa.sale .texto, .pantalla .capa.sale-todo { animation-duration: 300ms; }
    .pantalla .capa.entra { animation-duration: 600ms; animation-delay: 300ms; }
    .pantalla .capa.entra .texto { animation-duration: 300ms; animation-delay: 900ms; }
    .pantalla .cae { animation: pFundido 500ms ease-out both; transform: translate(-50%, -50%) rotate(var(--r)); }
    .pantalla .rotulo-palabra > span, .pantalla .rotulo-linea, .pantalla .rotulo-ahora { animation: pFundido 400ms ease-out both; }
    .pantalla .pie-entra { animation: pFundido 300ms ease-out both; }
    .pantalla .tes-capa { animation-duration: 400ms; }
  }
`;

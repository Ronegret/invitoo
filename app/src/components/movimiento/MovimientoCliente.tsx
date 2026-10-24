"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, useState } from "react";
import {
  atributosMovimiento,
  decodificarMovimiento,
  limpiarMovimiento,
  resolverMovimiento,
  variablesMovimiento,
  type MensajeMovimiento,
} from "@/lib/movimiento";
import type { Movimiento } from "@/lib/tipos";
import { programaMovimiento } from "./programa";

/** El canvas solo se descarga si la boda pide partículas. */
const Particulas = dynamic(() => import("./Particulas"), { ssr: false });
/** El cursor de la casa (G2): solo con ratón de verdad, y solo entonces se descarga. */
const Cursor = dynamic(() => import("@/components/sistema/CursorInvitoo"), { ssr: false });

/**
 * La parte del movimiento que necesita React, que es poca:
 *
 *  · Si el guion en línea no llegó a correr (navegación en cliente), lo
 *    arranca, antes del pintado (`useLayoutEffect`).
 *  · `?mov=<base64url>` sobrescribe el movimiento guardado, y con
 *    `?vista=1` escucha los mensajes de la vista previa del editor
 *    (`AjustesMovimiento`) para cambiarlo en vivo sin recargar.
 *    La invitación sigue siendo estática: todo esto pasa en el navegador.
 *  · Monta las partículas, si las hay.
 */
export default function MovimientoCliente({
  plantilla,
  guardado,
}: {
  plantilla: string;
  guardado?: Partial<Movimiento>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [particulas, setParticulas] = useState<Movimiento["particulas"]>(
    () => resolverMovimiento(plantilla, guardado).particulas,
  );

  const [cursor, setCursor] = useState(false);

  useLayoutEffect(() => {
    const raiz = ref.current?.parentElement;
    if (!raiz) return;
    programaMovimiento(raiz);
    try {
      const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // En la vista previa del panel (iframe) no: allí manda el del panel.
      // Lectura única de matchMedia al montar (sistema externo); no hay
      // forma de conocerlo en el render del servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fino && !quieto && window.self === window.top) setCursor(true);
    } catch {
      /* noop */
    }

    const destinos = [raiz, raiz.closest("main")].filter(Boolean) as HTMLElement[];

    // La invitación viva (flores/): capa de interacción y color vivo. Solo
    // se descargan si la boda los tiene encendidos, y se encienden y apagan
    // en vivo desde la vista previa del editor.
    let apagarCapa: (() => void) | null = null;
    let apagarColor: (() => void) | null = null;
    let firmaCapa = "";
    let firmaColor = false;
    let vigente = 0;
    let quieto = false;
    try {
      quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* noop */
    }
    const vivir = (m0: Movimiento) => {
      // Con «menos movimiento» no hay nada decorativo: ni se descarga.
      const m = quieto ? { ...m0, interaccion: false, petalosAlTocar: false, colorVivo: false } : m0;
      const yo = ++vigente;
      const marca = raiz.querySelector<HTMLElement>("[data-capa]");
      const pide = (k: string) => !marca || marca.getAttribute(`data-capa-${k}`) !== "0";
      const op = {
        petalos: m.petalosAlTocar && pide("petalos"),
        reflejo: m.interaccion && pide("reflejo"),
        destellos: m.interaccion && pide("destellos"),
      };
      const firma = `${+op.petalos}${+op.reflejo}${+op.destellos}`;
      if (firma !== firmaCapa) {
        firmaCapa = firma;
        apagarCapa?.();
        apagarCapa = null;
        if (op.petalos || op.reflejo || op.destellos) {
          void import("@/components/flores/capa").then((x) => {
            if (yo === vigente) apagarCapa = x.montarCapa(op);
          });
        }
      }
      if (m.colorVivo !== firmaColor) {
        firmaColor = m.colorVivo;
        apagarColor?.();
        apagarColor = null;
        if (m.colorVivo) {
          void import("@/components/flores/color-vivo").then((x) => {
            if (yo === vigente || firmaColor) apagarColor ??= x.montarColor(raiz);
          });
        }
      }
    };
    const apagarTodo = () => {
      vigente++;
      apagarCapa?.();
      apagarColor?.();
    };

    const aplicar = (encima: Partial<Movimiento>) => {
      const m = resolverMovimiento(plantilla, guardado, encima);
      vivir(m);
      for (const nodo of destinos) {
        for (const [k, v] of Object.entries(variablesMovimiento(m))) nodo.style.setProperty(k, v);
        for (const [k, v] of Object.entries(atributosMovimiento(m))) nodo.setAttribute(k, v);
      }
      setParticulas(m.particulas);
    };

    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      params = new URLSearchParams();
    }
    const pedida = params.get("mov");
    if (pedida) aplicar(decodificarMovimiento(pedida));
    else vivir(resolverMovimiento(plantilla, guardado));
    if (params.get("vista") !== "1") return apagarTodo;

    const repetir = () =>
      (raiz as HTMLElement & { __movRepetir?: () => void }).__movRepetir?.();
    const alMensaje = (e: MessageEvent<MensajeMovimiento>) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== "object") return;
      if (e.data.tipo === "invitoo:mov") {
        aplicar(limpiarMovimiento(e.data.mov));
        repetir();
      } else if (e.data.tipo === "invitoo:mov-repetir") {
        window.scrollTo({ top: 0 });
        repetir();
      }
    };
    window.addEventListener("message", alMensaje);
    // Avisa al editor de que ya puede mandar ajustes.
    try {
      window.parent?.postMessage({ tipo: "invitoo:mov-listo" }, window.location.origin);
    } catch {
      /* noop */
    }
    return () => {
      window.removeEventListener("message", alMensaje);
      apagarTodo();
    };
  }, [plantilla, guardado]);

  return (
    <>
      <span ref={ref} hidden />
      {particulas !== "ninguna" && <Particulas tipo={particulas} />}
      {cursor && <Cursor />}
    </>
  );
}

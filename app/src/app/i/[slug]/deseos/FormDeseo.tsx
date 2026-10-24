"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { dejarDeseo, type ResultadoDeseo } from "@/lib/deseos/acciones";

const CLAVE = "invitoo_dispositivo";

function idLocal() {
  try {
    let id = localStorage.getItem(CLAVE);
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(CLAVE, id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * Tu nombre + tu deseo. Formulario de verdad (vale sin JS); con JS añade la
 * hora de pintado y un id de dispositivo para el antispam, y al enviar
 * enseña las gracias sin recargar.
 */
export default function FormDeseo({ slug, pareja }: { slug: string; pareja: string }) {
  const [estado, enviar] = useActionState<ResultadoDeseo, FormData>(dejarDeseo, null);
  const pintado = useRef<HTMLInputElement>(null);
  const dispositivo = useRef<HTMLInputElement>(null);
  const [otro, setOtro] = useState(0);
  const gracias = useRef<HTMLDivElement>(null);
  const error = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Campos ocultos del antispam: se rellenan en el DOM, sin re-render.
    if (pintado.current) pintado.current.value = String(Date.now());
    if (dispositivo.current) dispositivo.current.value = idLocal();
  }, [otro]);

  const hecho = estado?.ok && estado.t > otro;
  useEffect(() => {
    if (hecho) gracias.current?.focus();
    else if (estado && !estado.ok) error.current?.focus();
  }, [estado, hecho]);

  if (hecho) {
    return (
      <div ref={gracias} tabIndex={-1} role="status" className="deseo-gracias mt-10 rounded-[calc(var(--radio,12px)+6px)] border border-[color-mix(in_oklab,var(--tinta)_14%,transparent)] bg-[color-mix(in_oklab,var(--papel)_88%,white)] px-6 py-10 text-center shadow-[var(--sombra-3,0_14px_40px_rgba(0,0,0,.08))] outline-none">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="deseo-latido mx-auto h-10 w-10 text-[var(--acento-texto)]" fill="currentColor">
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
        </svg>
        <p className="mt-4 text-[1.9rem] leading-tight" style={{ fontFamily: "var(--display)" }}>
          Gracias, {estado.nombre.length <= 22 ? estado.nombre : estado.nombre.split(" ")[0]}
        </p>
        <p className="mx-auto mt-3 max-w-[22rem] text-[1.0625rem] leading-relaxed opacity-90">
          Tu deseo ya está en el libro de {pareja}. Les va a encantar leerlo.
        </p>
        <button
          type="button"
          onClick={() => setOtro(Date.now())}
          className="mt-7 inline-flex min-h-12 items-center rounded-full border border-[color-mix(in_oklab,var(--tinta)_25%,transparent)] px-6 text-[1rem] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-texto)]"
        >
          Escribir otro deseo
        </button>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .deseo-gracias { animation: deseo-sube 700ms cubic-bezier(.2,.7,.2,1) both; }
            .deseo-latido { animation: deseo-latido 1.6s ease-in-out 400ms 2; transform-origin: center; }
            @keyframes deseo-sube { from { opacity: 0; transform: translateY(16px) scale(.98); } }
            @keyframes deseo-latido { 0%,100% { transform: scale(1); } 30% { transform: scale(1.18); } 60% { transform: scale(.96); } }
          }
        `}</style>
      </div>
    );
  }

  const campo =
    "mt-2 w-full rounded-[var(--radio,12px)] border border-[color-mix(in_oklab,var(--tinta)_22%,transparent)] bg-[color-mix(in_oklab,var(--papel)_80%,white)] px-4 text-[1.0625rem] text-[var(--tinta)] outline-none transition-[border-color,box-shadow] placeholder:text-[color-mix(in_oklab,var(--tinta)_55%,transparent)] focus:border-[var(--acento-texto)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--acento)_22%,transparent)]";

  return (
    <form key={otro} action={enviar} className="mt-10 flex flex-col gap-6" noValidate={false}>
      <input type="hidden" name="slug" value={slug} />
      <input ref={pintado} type="hidden" name="pintado" defaultValue="" />
      <input ref={dispositivo} type="hidden" name="dispositivo" defaultValue="" />
      {/* Trampa para bots: oculta a personas y a lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Tu web
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="d-nombre" className="text-[1rem] font-medium">Tu nombre</label>
        <input id="d-nombre" name="nombre" required minLength={2} maxLength={80} autoComplete="name" className={`${campo} min-h-14`} />
      </div>
      <div>
        <label htmlFor="d-deseo" className="text-[1rem] font-medium">Tu deseo</label>
        <textarea
          id="d-deseo"
          name="deseo"
          required
          minLength={4}
          maxLength={1200}
          rows={6}
          placeholder="Que nunca os falten las ganas de bailar…"
          className={`${campo} py-3.5 leading-relaxed`}
        />
      </div>

      {estado && !estado.ok && (
        <p ref={error} tabIndex={-1} role="alert" className="rounded-[var(--radio,12px)] border-l-4 border-[var(--acento-texto)] bg-[color-mix(in_oklab,var(--acento)_10%,var(--papel))] px-4 py-3 text-[1rem] outline-none">
          {estado.error}
        </p>
      )}

      <Enviar />
      <p className="text-center text-[0.95rem] opacity-80">Solo lo leerán {pareja}. Nada de cuentas ni apps.</p>
    </form>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--acento)] px-8 text-[1.0625rem] font-medium text-[var(--sobre-acento)] shadow-[var(--sombra-2,0_6px_18px_rgba(0,0,0,.12))] transition-[transform,filter] hover:brightness-105 active:scale-[.98] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--acento-texto)]"
    >
      {pending ? "Guardando tu deseo…" : "Dejar mi deseo"}
    </button>
  );
}

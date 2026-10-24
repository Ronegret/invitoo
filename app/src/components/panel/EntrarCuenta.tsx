"use client";

import { useActionState, useEffect, useRef } from "react";
import { pedirCodigo, verificarCodigo, type EstadoEntrar } from "@/lib/auth/acciones";
import { ui } from "./estilos";

/**
 * Entrar sin contraseña, en dos pasos: email → código. El enlace del correo
 * también vale (lleva a /cuenta/confirmar); el código es para quien abre el
 * correo en el móvil y el panel en el portátil.
 */
export default function EntrarCuenta({ volver }: { volver: string }) {
  const [estado, pedir, pidiendo] = useActionState<EstadoEntrar, FormData>(pedirCodigo, { paso: "email" });
  const [verif, verificar, verificando] = useActionState<EstadoEntrar, FormData>(verificarCodigo, {
    paso: "codigo",
    email: "",
  });
  const codigoRef = useRef<HTMLInputElement>(null);

  const enCodigo = estado.paso === "codigo";
  const email = estado.paso === "codigo" ? estado.email : "";
  const errorCodigo = verif.paso === "codigo" && verif.email ? verif.error : undefined;

  useEffect(() => {
    if (enCodigo) codigoRef.current?.focus();
  }, [enCodigo]);

  if (!enCodigo) {
    return (
      <form action={pedir} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="volver" value={volver} />
        <label>
          <span className={ui.etiqueta}>Vuestro email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="laura@ejemplo.es"
            aria-invalid={Boolean(estado.error)}
            aria-describedby={estado.error ? "error-email" : undefined}
            className={ui.campo}
          />
        </label>
        {estado.error && (
          <p id="error-email" role="alert" className="text-[0.95rem] text-[var(--acento)]">
            {estado.error}
          </p>
        )}
        <button type="submit" disabled={pidiendo} className={ui.botonLleno}>
          {pidiendo ? "Enviando…" : "Enviadme el código"}
        </button>
        <p className={`text-[0.9rem] ${ui.suave}`}>
          Sin contraseñas: os mandamos un correo con un enlace y un código de 6 cifras.
        </p>
      </form>
    );
  }

  return (
    <form action={verificar} className="flex flex-col gap-5">
      <input type="hidden" name="volver" value={volver} />
      <input type="hidden" name="email" value={email} />
      <p role="status" className="rounded-xl bg-[var(--verde-claro)] p-4 text-[0.95rem] text-[var(--verde)]">
        {estado.aviso}
      </p>
      <label>
        <span className={ui.etiqueta}>Código de 6 cifras</span>
        <input
          ref={codigoRef}
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          placeholder="123456"
          aria-invalid={Boolean(errorCodigo)}
          aria-describedby={errorCodigo ? "error-codigo" : undefined}
          className={`${ui.campo} text-center text-[1.4rem] tracking-[0.4em] tabular-nums`}
        />
      </label>
      {errorCodigo && (
        <p id="error-codigo" role="alert" className="text-[0.95rem] text-[var(--acento)]">
          {errorCodigo}
        </p>
      )}
      <button type="submit" disabled={verificando} className={ui.botonLleno}>
        {verificando ? "Comprobando…" : "Entrar"}
      </button>
      <p className={`text-[0.9rem] ${ui.suave}`}>
        Lo hemos mandado a <strong className="font-medium text-[var(--tinta)]">{email}</strong>. ¿No
        llega? Mirad en «Promociones» o en spam, o{" "}
        <a href={`/cuenta/entrar?volver=${encodeURIComponent(volver)}`} className={ui.enlace}>
          probad con otro email
        </a>
        .
      </p>
    </form>
  );
}

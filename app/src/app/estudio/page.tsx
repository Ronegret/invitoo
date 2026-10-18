import Link from "next/link";
import { haySupabase, listarTodas, tokenDelPanel } from "@/lib/datos";

const ETIQUETA: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
};

/** La lista de bodas. Es la pantalla de trabajo diaria. */
export default async function Estudio() {
  const invitaciones = await listarTodas();
  const conPanel = await Promise.all(
    invitaciones.map(async (inv) => ({
      inv,
      token: inv.id ? await tokenDelPanel(inv.id) : null,
    })),
  );

  return (
    <main className="mx-auto max-w-[60rem] px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[clamp(2.2rem,8vw,3.2rem)]">Bodas</h1>
        <Link
          href="/estudio/nueva"
          className="inline-flex min-h-12 items-center rounded-full bg-[var(--tinta)] px-6 text-[0.76rem] uppercase tracking-[0.16em] text-[var(--papel)]"
        >
          Nueva boda
        </Link>
      </div>

      {!haySupabase() && (
        <p className="mt-8 border-l-2 border-[var(--acento)] pl-4 text-[0.95rem] leading-relaxed opacity-75">
          Sin Supabase configurado. Lo que ves son los datos de ejemplo y no se
          puede guardar. Copia <code>.env.example</code> a{" "}
          <code>.env.local</code> con las claves del proyecto.
        </p>
      )}

      <ul className="mt-12 flex flex-col">
        {conPanel.map(({ inv, token }) => (
          <li
            key={inv.slug}
            className="flex flex-col gap-3 border-t border-[var(--tinta)]/12 py-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="display text-[1.6rem]">
                {inv.pareja.a} &amp; {inv.pareja.b}
              </p>
              <p className="mt-1 text-[0.85rem] opacity-55">
                {new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
                  new Date(inv.pareja.fecha),
                )}{" "}
                · {inv.plantilla} ·{" "}
                <span
                  style={
                    inv.estado === "publicada"
                      ? undefined
                      : { color: "var(--acento)" }
                  }
                >
                  {ETIQUETA[inv.estado]}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {inv.id && (
                <Link
                  href={`/estudio/${inv.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-5 text-[0.79rem] uppercase tracking-[0.16em]"
                >
                  Editar
                </Link>
              )}
              <Link
                href={`/i/${inv.slug}`}
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-5 text-[0.79rem] uppercase tracking-[0.16em]"
              >
                Ver
              </Link>
              {token && (
                <Link
                  href={`/novios/${token}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--tinta)]/25 px-5 text-[0.79rem] uppercase tracking-[0.16em]"
                  title="Enlace privado para la pareja"
                >
                  Panel
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      {invitaciones.length === 0 && (
        <p className="mt-12 text-[1rem] opacity-60">
          Todavía no hay ninguna. Empieza por «Nueva boda».
        </p>
      )}
    </main>
  );
}

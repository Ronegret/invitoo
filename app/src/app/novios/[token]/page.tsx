import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SelloAlianzas from "@/components/SelloAlianzas";
import { invitacionPorToken, obtenerMuro, obtenerRsvps } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Vuestra boda · Invitoo",
  robots: { index: false, follow: false },
};

// El panel cambia cada vez que alguien confirma: no se cachea.
export const dynamic = "force-dynamic";

/**
 * El panel de los novios.
 *
 * Sin login, con un enlace privado. Es el mismo criterio que con el RSVP:
 * una boda no es sitio para gestionar contraseñas, y la pareja va a abrir
 * esto desde el móvil en la cola del súper.
 *
 * El token vive en la tabla `paneles`, que no tiene política pública. Quien
 * no tenga el enlace no llega, y el enlace no aparece en ninguna página.
 */
export default async function PanelNovios({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inv = await invitacionPorToken(token);
  if (!inv) notFound();

  const [rsvps, muro] = await Promise.all([
    obtenerRsvps(inv.id),
    obtenerMuro(inv.id),
  ]);

  const vienen = rsvps.filter((r) => r.asiste);
  const total = vienen.reduce((n, r) => n + 1 + r.acompanantes, 0);
  const noVienen = rsvps.length - vienen.length;
  const bus = vienen.filter((r) => r.bus).reduce((n, r) => n + 1 + r.acompanantes, 0);
  const alergias = vienen.filter((r) => r.alergias);

  const menus = new Map<string, number>();
  for (const r of vienen) {
    if (!r.menu) continue;
    menus.set(r.menu, (menus.get(r.menu) ?? 0) + 1 + r.acompanantes);
  }

  const dias = Math.max(
    0,
    Math.ceil(
      (new Date(inv.pareja.fecha).getTime() - Date.now()) / 86_400_000,
    ),
  );

  return (
    <main className="grano relative mx-auto max-w-[56rem] px-5 py-12">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--tinta)]/12 pb-6">
        <div>
          <p className="text-[0.78rem] uppercase tracking-[0.3em] opacity-50">
            Vuestra boda
          </p>
          <h1 className="display mt-2 text-[clamp(2rem,7vw,2.8rem)]">
            {inv.pareja.a} &amp; {inv.pareja.b}
          </h1>
        </div>
        <SelloAlianzas size={38} className="shrink-0 opacity-45" />
      </header>

      {/* Lo primero es lo que van a mirar cada vez: cuántos son. */}
      <section className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {[
          ["Vienen", String(total)],
          ["No pueden", String(noVienen)],
          ["Sin contestar", "—"],
          ["Faltan", `${dias} d`],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <p className="display text-[clamp(2.2rem,9vw,3rem)] leading-none">
              {valor}
            </p>
            <p className="mt-2 text-[0.76rem] uppercase tracking-[0.24em] opacity-50">
              {etiqueta}
            </p>
          </div>
        ))}
      </section>

      {(menus.size > 0 || bus > 0) && (
        <section className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--tinta)]/12 pt-8">
          {[...menus].map(([m, n]) => (
            <p key={m} className="text-[0.95rem]">
              <span className="opacity-55">{m}</span>{" "}
              <span className="display text-[1.3rem]">{n}</span>
            </p>
          ))}
          {bus > 0 && (
            <p className="text-[0.95rem]">
              <span className="opacity-55">Autobús</span>{" "}
              <span className="display text-[1.3rem]">{bus}</span>
            </p>
          )}
        </section>
      )}

      {alergias.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[0.78rem] uppercase tracking-[0.3em] opacity-50">
            Alergias y dietas — para el catering
          </h2>
          <ul className="mt-5 flex flex-col gap-2.5">
            {alergias.map((r) => (
              <li key={r.id} className="text-[0.98rem] leading-relaxed">
                <strong className="font-normal">{r.nombre}:</strong>{" "}
                <span className="opacity-70">{r.alergias}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-[0.78rem] uppercase tracking-[0.3em] opacity-50">
          Quién ha contestado
        </h2>
        {rsvps.length === 0 ? (
          <p className="mt-6 text-[1rem] opacity-60">
            Todavía nadie. En cuanto alguien confirme aparecerá aquí.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem]">
              <thead>
                <tr className="border-b border-[var(--tinta)]/15 text-[0.76rem] uppercase tracking-[0.2em] opacity-50">
                  <th className="py-3 font-normal">Nombre</th>
                  <th className="py-3 font-normal">Viene</th>
                  <th className="py-3 font-normal">Con</th>
                  <th className="py-3 font-normal">Menú</th>
                  <th className="py-3 font-normal">Bus</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--tinta)]/8">
                    <td className="py-3.5">{r.nombre}</td>
                    <td className="py-3.5" style={{ color: r.asiste ? undefined : "var(--acento)" }}>
                      {r.asiste ? "Sí" : "No"}
                    </td>
                    <td className="py-3.5 opacity-70">{r.acompanantes || "—"}</td>
                    <td className="py-3.5 opacity-70">{r.menu ?? "—"}</td>
                    <td className="py-3.5 opacity-70">{r.bus ? "Sí" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-[var(--tinta)]/12 pt-10">
        <h2 className="text-[0.78rem] uppercase tracking-[0.3em] opacity-50">
          Lo que os escriben
        </h2>
        {muro.length === 0 ? (
          <p className="mt-6 text-[1rem] opacity-60">
            Todavía nada. Esto se llena solo según se acerca el día.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-8">
            {muro.map((m) => (
              <li key={m.id} className="max-w-[38rem]">
                <p className="text-[1.02rem] leading-[1.7]">{m.mensaje}</p>
                <p className="mt-2 text-[0.8rem] uppercase tracking-[0.18em] opacity-45">
                  {m.nombre}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-16 text-[0.8rem] leading-relaxed opacity-45">
        Este enlace es privado. No lo compartáis con los invitados: desde aquí
        se ve quién viene y quién no.
      </p>
    </main>
  );
}

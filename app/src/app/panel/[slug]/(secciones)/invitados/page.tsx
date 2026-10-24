import Link from "next/link";
import Cabecera, { Vacio } from "@/components/panel/Cabecera";
import IconoPanel from "@/components/panel/IconosPanel";
import CamposInvitado from "@/components/panel/CamposInvitado";
import Formulario, { Enviar } from "@/components/panel/Formulario";
import ListaInvitados, { type FilaInvitado } from "@/components/panel/ListaInvitados";
import { exigirPanel, invitacionDelPanel, origen } from "@/components/panel/cargar";
import { ui } from "@/components/panel/estilos";
import { diasEsperando, estadoDe, ahoraMs } from "@/components/panel/util";
import { importarAccion, guardarInvitadoAccion } from "@/app/panel/acciones";
import { listarInvitadosPanel, obtenerRsvps } from "@/lib/datos";
import { enlacePersonal } from "@/lib/enlaces";
import { nombreMenu } from "@/lib/rsvp";

export const dynamic = "force-dynamic";

export default async function Invitados({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const acceso = await exigirPanel(slug);
  const [inv, invitados, rsvps, base, q] = await Promise.all([
    invitacionDelPanel(slug),
    listarInvitadosPanel(acceso.invitacionId),
    obtenerRsvps(acceso.invitacionId),
    origen(),
    searchParams,
  ]);

  const respuestaDe = new Map(rsvps.filter((r) => r.invitado_id).map((r) => [r.invitado_id!, r]));
  const ahora = ahoraMs();
  const filas: FilaInvitado[] = invitados.map((i) => {
    const r = respuestaDe.get(i.id);
    const estado = estadoDe(r);
    const menus = r?.asiste ? [...new Set(r.personas.map((p) => p.menu))] : [];
    const alergias = Boolean(r?.asiste && r.personas.some((p) => p.alergenos.length || p.alergias_texto));
    const bus = Boolean(r?.asiste && r.bus !== "no");
    const n = r?.personas.length ?? 0;
    const resumen = r?.asiste
      ? [n > 1 ? `Vienen ${n}` : "Viene", menus.map(nombreMenu).join(", "), alergias && "Alergias", bus && "Bus"].filter(Boolean).join(" · ")
      : "";
    return {
      id: i.id,
      nombre: i.nombre,
      grupo: i.grupo,
      cupo: i.cupo,
      telefono: i.telefono,
      trato: i.trato,
      enlace: enlacePersonal(slug, i.token, base),
      estado,
      resumen,
      menus,
      alergias,
      bus,
      esperando: diasEsperando(i, ahora),
      enviado: Boolean(i.enviado_en || i.recordado_en),
    };
  });
  const grupos = [...new Set(invitados.map((i) => i.grupo || "Sin grupo"))].sort((a, b) => a.localeCompare(b, "es"));
  const estado = q.estado === "pendiente" || q.estado === "viene" || q.estado === "noViene" ? q.estado : "";
  const sinLista = rsvps.filter((r) => !r.invitado_id).length;

  return (
    <>
      <Cabecera
        eyebrow="Invitados"
        titulo="Vuestra lista"
        acciones={
          <>
            <Link href={`/panel/${slug}/imprimir/invitados`} className={ui.boton}>
              <IconoPanel id="imprimir" size={20} /> Imprimir lista
            </Link>
            <Link href={`/panel/${slug}/invitados/respuestas`} className={ui.boton}>
              <IconoPanel id="respuestas" size={20} /> Respuestas y menús
            </Link>
          </>
        }
      >
        Cada invitado tiene su enlace personal: la invitación le saluda por su nombre y solo deja confirmar sus plazas.
      </Cabecera>

      <datalist id="grupos-invitados">
        {grupos.filter((g) => g !== "Sin grupo").map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      <section id="anadir" aria-labelledby="t-anadir" className={`${ui.tarjeta} mb-4 scroll-mt-6`}>
        <h2 id="t-anadir" className="font-medium">Añadir a alguien</h2>
        <Formulario accion={guardarInvitadoAccion} limpiar className="mt-4 grid gap-4 sm:grid-cols-4 sm:items-end">
          <input type="hidden" name="slug" value={slug} />
          <CamposInvitado prefijo="nuevo" />
          <div className="sm:col-span-4">
            <Enviar pendiente="Añadiendo…">Añadir a la lista</Enviar>
          </div>
        </Formulario>
      </section>

      <details className={`${ui.tarjeta} mb-8`}>
        <summary className={`flex min-h-12 cursor-pointer items-center font-medium ${ui.foco}`}>
          Importar una lista (pegada o en CSV)
        </summary>
        <Formulario accion={importarAccion} limpiar className="mt-4 flex flex-col gap-5">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label htmlFor="imp-lista" className={ui.etiqueta}>Una línea por invitación: nombre; plazas; teléfono</label>
            <textarea
              id="imp-lista"
              name="lista"
              rows={7}
              placeholder={"Tía Carmen; 2; 600 111 222\nFamilia Fernández; 4\nÍñigo"}
              aria-describedby="imp-ayuda"
              className={ui.area}
            />
            <p id="imp-ayuda" className={`mt-2 text-[0.9rem] ${ui.suave}`}>
              Vale copiar las columnas desde Excel o Google Sheets. Las plazas y el teléfono son opcionales. Si
              la primera fila trae títulos (Nombre, Grupo, Plazas, Teléfono), las usamos en ese orden.
            </p>
          </div>
          <div>
            <label htmlFor="imp-archivo" className={ui.etiqueta}>O subid un archivo CSV</label>
            <input
              id="imp-archivo"
              name="archivo"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="mt-2 block min-h-12 w-full text-[0.95rem] file:mr-4 file:min-h-12 file:rounded-full file:border file:border-[var(--linea)] file:bg-white file:px-5 file:text-[0.95rem]"
            />
          </div>
          <div className="sm:max-w-[20rem]">
            <label htmlFor="imp-grupo" className={ui.etiqueta}>Grupo para todos (opcional)</label>
            <input id="imp-grupo" name="grupo" list="grupos-invitados" maxLength={60} className={ui.campo} />
          </div>
          <div>
            <Enviar pendiente="Importando…">Importar</Enviar>
          </div>
        </Formulario>
      </details>

      {filas.length === 0 ? (
        <Vacio titulo="Aún no hay nadie en la lista">
          Añadid a vuestros invitados uno a uno o pegad la lista entera. Sin lista también funciona: cada uno
          escribe su nombre al confirmar, pero no sabréis quién falta.
        </Vacio>
      ) : (
        <ListaInvitados
          slug={slug}
          pareja={`${inv.pareja.a} y ${inv.pareja.b}`}
          filas={filas}
          grupos={grupos}
          estadoInicial={estado}
          recordarInicial={q.recordar === "1"}
        />
      )}

      {sinLista > 0 && (
        <p className={`mt-6 text-[0.92rem] ${ui.suave}`}>
          Además, {sinLista === 1 ? "una persona ha confirmado" : `${sinLista} personas han confirmado`} sin enlace
          personal (escribiendo su nombre). Las veréis en «Respuestas y menús».
        </p>
      )}
    </>
  );
}

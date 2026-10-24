import type { FilaRsvp, Invitado } from "@/lib/datos";
import {
  ALERGENOS,
  ALERGIA_SIN_PERMISO,
  MENUS,
  nombreAlergeno,
  nombreBus,
  nombreMenu,
  saludSinPermiso,
  tieneDatosSalud,
  type PersonaRsvp,
} from "@/lib/rsvp";
import { aCsv } from "@/lib/csv";
import { formatearFecha, formatearHora } from "@/lib/fecha";

/**
 * Las cuentas del panel y las exportaciones: lo que mira la pareja, lo que
 * pide el catering (menús y alergias por persona) y lo que pide el
 * transportista (personas por parada).
 */

export type Resumen = {
  confirmados: number;
  noVienen: number;
  /** Invitados de la lista que aún no han contestado. */
  sinRespuesta: Invitado[];
  plazasSinRespuesta: number;
  menus: { id: string; nombre: string; n: number }[];
  alergenos: { id: string; nombre: string; n: number }[];
  conAlergias: { persona: PersonaRsvp; de: FilaRsvp }[];
  /** Personas que han indicado alergias sin dar permiso para compartirlas. */
  sinPermiso: { persona: PersonaRsvp; de: FilaRsvp }[];
  bus: { parada: string; ida: number; vuelta: number }[];
  respuestaDe: Map<string, FilaRsvp>;
};

export function resumir(rsvps: FilaRsvp[], invitados: Invitado[]): Resumen {
  const vienen = rsvps.filter((r) => r.asiste);
  const respuestaDe = new Map<string, FilaRsvp>();
  for (const r of rsvps) if (r.invitado_id) respuestaDe.set(r.invitado_id, r);
  const sinRespuesta = invitados.filter((i) => !respuestaDe.has(i.id));

  const menus = new Map<string, number>();
  const alergenos = new Map<string, number>();
  const conAlergias: Resumen["conAlergias"] = [];
  const sinPermiso: Resumen["sinPermiso"] = [];
  const bus = new Map<string, { ida: number; vuelta: number }>();

  for (const r of vienen) {
    for (const p of r.personas) {
      menus.set(p.menu, (menus.get(p.menu) ?? 0) + 1);
      if (!tieneDatosSalud(p)) continue;
      conAlergias.push({ persona: p, de: r });
      // Sin permiso no se cuenta ni el alérgeno: solo que hay que preguntar.
      if (saludSinPermiso(p)) sinPermiso.push({ persona: p, de: r });
      else for (const a of p.alergenos) alergenos.set(a, (alergenos.get(a) ?? 0) + 1);
    }
    if (r.bus !== "no") {
      const parada = r.parada?.trim() || "Sin parada";
      const b = bus.get(parada) ?? { ida: 0, vuelta: 0 };
      const n = r.personas.length;
      if (r.bus === "ida" || r.bus === "ida_vuelta") b.ida += n;
      if (r.bus === "vuelta" || r.bus === "ida_vuelta") b.vuelta += n;
      bus.set(parada, b);
    }
  }

  return {
    confirmados: vienen.reduce((n, r) => n + r.personas.length, 0),
    noVienen: rsvps.filter((r) => !r.asiste).reduce((n, r) => n + Math.max(1, r.personas.length), 0),
    sinRespuesta,
    plazasSinRespuesta: sinRespuesta.reduce((n, i) => n + i.cupo, 0),
    menus: MENUS.map((m) => ({ id: m.id as string, nombre: m.nombre as string, n: menus.get(m.id) ?? 0 })).filter((m) => m.n > 0),
    alergenos: ALERGENOS.map((a) => ({ id: a.id as string, nombre: a.nombre as string, n: alergenos.get(a.id) ?? 0 })).filter((a) => a.n > 0),
    conAlergias,
    sinPermiso,
    bus: [...bus].map(([parada, v]) => ({ parada, ...v })).sort((a, b) => a.parada.localeCompare(b.parada, "es")),
    respuestaDe,
  };
}

const cuando = (iso: string) => `${formatearFecha(iso, { dateStyle: "short" })} ${formatearHora(iso)}`;

/** Una fila por persona. También los que no han contestado, para no perderlos. */
export function csvPersonas(rsvps: FilaRsvp[], invitados: Invitado[]): string {
  const porId = new Map(invitados.map((i) => [i.id, i]));
  const filas: unknown[][] = [
    ["Invitación", "Grupo", "Persona", "Asiste", "Menú", "Alérgenos", "Otras alergias", "Autobús", "Parada", "Teléfono", "Mensaje", "Respondido"],
  ];
  for (const r of rsvps) {
    const inv = r.invitado_id ? porId.get(r.invitado_id) : undefined;
    const personas = r.personas.length ? r.personas : [{ nombre: r.nombre, menu: "adulto", alergenos: [], alergias_texto: null } as PersonaRsvp];
    for (const p of personas) {
      filas.push([
        inv?.nombre ?? r.nombre,
        inv?.grupo ?? "",
        p.nombre,
        r.asiste ? "Sí" : "No",
        r.asiste ? nombreMenu(p.menu) : "",
        // Sin permiso del invitado (art. 9 RGPD), el detalle no sale del panel.
        r.asiste ? (saludSinPermiso(p) ? ALERGIA_SIN_PERMISO : p.alergenos.map(nombreAlergeno).join(", ")) : "",
        r.asiste && !saludSinPermiso(p) ? p.alergias_texto ?? "" : "",
        r.asiste ? nombreBus(r.bus) : "",
        r.asiste && r.bus !== "no" ? r.parada ?? "" : "",
        r.telefono ?? inv?.telefono ?? "",
        r.mensaje ?? "",
        cuando(r.actualizado_en),
      ]);
    }
  }
  const respondidos = new Set(rsvps.map((r) => r.invitado_id).filter(Boolean));
  for (const i of invitados) {
    if (respondidos.has(i.id)) continue;
    filas.push([i.nombre, i.grupo ?? "", i.nombre, "Sin respuesta", "", "", "", "", "", i.telefono ?? "", "", ""]);
  }
  return aCsv(filas);
}

/** Para el transportista: totales por parada y, debajo, quién sube en cada una. */
export function csvBus(rsvps: FilaRsvp[]): string {
  const { bus } = resumir(rsvps, []);
  const filas: unknown[][] = [["Parada", "Ida", "Vuelta"]];
  for (const b of bus) filas.push([b.parada, b.ida, b.vuelta]);
  filas.push([]);
  filas.push(["Parada", "Trayecto", "Persona", "Teléfono"]);
  const conBus = rsvps
    .filter((r) => r.asiste && r.bus !== "no")
    .sort((a, b) => (a.parada ?? "").localeCompare(b.parada ?? "", "es"));
  for (const r of conBus) {
    for (const p of r.personas) {
      filas.push([r.parada?.trim() || "Sin parada", nombreBus(r.bus), p.nombre, r.telefono ?? ""]);
    }
  }
  return aCsv(filas);
}

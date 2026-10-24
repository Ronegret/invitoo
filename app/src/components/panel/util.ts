import type { FilaRsvp, InvitadoPanel } from "@/lib/datos";
import { alergiasCompartibles, normalizarNombre, type PersonaRsvp } from "@/lib/rsvp";

/**
 * Cuentas puras del panel. Sin servidor: las usan tanto las páginas como las
 * islas de cliente (mesas, lista de invitados).
 */

/** Clave estable de una persona confirmada para sentarla en una mesa. */
export function clavePersona(rsvpId: string, nombre: string) {
  return `${rsvpId}:${normalizarNombre(nombre)}`;
}

export type PersonaConfirmada = {
  clave: string;
  nombre: string;
  /** Nombre de la invitación de la que viene («Familia Fernández»). */
  de: string;
  grupo: string | null;
  menu: PersonaRsvp["menu"];
  alergias: string;
};

/** Cada persona que viene, con su clave de mesa. */
export function personasConfirmadas(
  rsvps: FilaRsvp[],
  invitados: { id: string; nombre: string; grupo: string | null }[],
): PersonaConfirmada[] {
  const porId = new Map(invitados.map((i) => [i.id, i]));
  const salida: PersonaConfirmada[] = [];
  for (const r of rsvps) {
    if (!r.asiste) continue;
    const inv = r.invitado_id ? porId.get(r.invitado_id) : undefined;
    const vistas = new Set<string>();
    for (const p of r.personas) {
      let clave = clavePersona(r.id, p.nombre);
      // Dos «Acompañante» en la misma respuesta: no pueden compartir clave.
      for (let n = 2; vistas.has(clave); n++) clave = `${clavePersona(r.id, p.nombre)}#${n}`;
      vistas.add(clave);
      salida.push({
        clave,
        nombre: p.nombre,
        de: inv?.nombre ?? r.nombre,
        grupo: inv?.grupo ?? null,
        menu: p.menu,
        alergias: alergiasCompartibles(p),
      });
    }
  }
  return salida;
}

const DIA = 86_400_000;

/**
 * El instante de esta petición. Las páginas del panel son Server Components
 * dinámicos (se renderizan una vez por petición), así que leer el reloj aquí
 * es lo que se quiere; va en una función para que quede dicho.
 */
export function ahoraMs() {
  return Date.now();
}

export type Estado = "viene" | "noViene" | "pendiente";

export function estadoDe(r: FilaRsvp | undefined): Estado {
  if (!r) return "pendiente";
  return r.asiste ? "viene" : "noViene";
}

/** Días desde que se le mandó la invitación (o desde que está en la lista). */
export function diasEsperando(i: InvitadoPanel, ahora = Date.now()) {
  const desde = i.recordado_en ?? i.enviado_en ?? i.creado_en;
  return Math.floor((ahora - new Date(desde).getTime()) / DIA);
}

export function haceDias(iso: string, ahora = Date.now()) {
  return Math.floor((ahora - new Date(iso).getTime()) / DIA);
}

/** «hoy», «ayer», «hace 3 días». */
export function cuandoRelativo(iso: string, ahora = Date.now()) {
  const d = haceDias(iso, ahora);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.round(d / 30);
  return m === 1 ? "hace un mes" : `hace ${m} meses`;
}

export function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

/** Meses que la invitación sigue en línea tras la boda si no se fija otra fecha. */
export const MESES_ONLINE = 12;

/** Fecha hasta la que la invitación sigue en línea: la guardada o boda + 12 meses. */
export function onlineHasta(fechaBoda: string, guardada: string | null): Date {
  if (guardada) return new Date(`${guardada}T12:00:00Z`);
  const d = new Date(fechaBoda);
  d.setMonth(d.getMonth() + MESES_ONLINE);
  return d;
}

/** «hace 5 min», «ayer»… sin depender de la hora del servidor al hidratar. */
export function hace(iso: string, ahora: number) {
  const m = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}


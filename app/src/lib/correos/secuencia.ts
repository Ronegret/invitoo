/**
 * La secuencia declarativa de correos (E2 · Contenido). El motor (E1) la
 * recorre: cada paso dice CUÁNDO (disparador), SI (condición) y CON QUÉ
 * plantilla. La estrategia completa está en `docs/24a-secuencia-correos.md`.
 *
 * Reglas que se cumplen aquí:
 *  · Frecuencia moderada: como mucho un correo de cuenta atrás por hito y un
 *    resumen de RSVP a la semana, y solo si hay respuestas nuevas.
 *  · Todo se puede apagar por grupos (`GRUPO_DE` en tipos.ts), salvo el aviso
 *    de borrado del álbum, que es imprescindible (se perderían las fotos).
 *  · Las condiciones vuelven a mirarse en cada cron: si la pareja ya publicó,
 *    «completar-datos» no sale.
 *  · Un mismo `id` puede aparecer con dos disparadores (bienvenida: pago o
 *    vínculo); la clave de idempotencia es boda + paso + destinatario, así que
 *    sale una sola vez, con el primero que llegue.
 */
import type { ContextoPaso, Disparador, IdCorreo, Paso } from "./tipos.ts";

const futura = (c: ContextoPaso) => c.diasParaBoda == null || c.diasParaBoda > 0;

export const SECUENCIA: Paso[] = [
  /* ── Novios · servicio ─────────────────────────────────────────── */
  {
    id: "bienvenida",
    nombre: "Bienvenida tras pagar",
    categoria: "servicio",
    disparador: { tipo: "evento", evento: "pago" },
    plantilla: "bienvenida",
  },
  {
    id: "bienvenida",
    nombre: "Bienvenida al vincular la cuenta",
    categoria: "servicio",
    disparador: { tipo: "evento", evento: "vinculo" },
    plantilla: "bienvenida",
  },
  {
    id: "completar-datos",
    nombre: "Recordatorio: completar datos y aprobar el diseño",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "pago", dias: 3 },
    condicion: (c) => c.pagado && !c.publicada && (!c.datosCompletos || !c.disenoAprobado) && futura(c),
    plantilla: "completar-datos",
    ventanaDias: 4,
  },
  {
    id: "publicada",
    nombre: "Invitación publicada: cómo enviarla",
    categoria: "servicio",
    disparador: { tipo: "evento", evento: "publicada" },
    plantilla: "publicada",
  },
  {
    id: "rsvp-resumen",
    nombre: "Resumen semanal de confirmaciones",
    categoria: "servicio",
    disparador: { tipo: "recurrente", cadaDias: 7 },
    condicion: (c) => c.publicada && c.rsvpAbierto && futura(c) && (c.cifras?.nuevas ?? 0) > 0,
    plantilla: "rsvp-resumen",
  },
  {
    id: "rsvp-fecha-limite",
    nombre: "Se acerca la fecha límite de confirmación",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "limite-rsvp", dias: -5 },
    condicion: (c) => c.publicada && c.rsvpAbierto && c.diasHastaLimite != null && c.diasHastaLimite > 0,
    plantilla: "rsvp-fecha-limite",
    ventanaDias: 2,
  },
  {
    id: "faltan-30",
    nombre: "Faltan 30 días: detalles de Invitoo",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "boda", dias: -30 },
    condicion: (c) => c.pagado && futura(c),
    plantilla: "faltan-30",
    ventanaDias: 3,
  },
  {
    id: "faltan-7",
    nombre: "Faltan 7 días: tarjetas QR",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "boda", dias: -7 },
    condicion: (c) => c.pagado && c.publicada && futura(c),
    plantilla: "faltan-7",
    ventanaDias: 2,
  },
  {
    id: "faltan-1",
    nombre: "Mañana es el día",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "boda", dias: -1 },
    condicion: (c) => c.pagado && c.publicada && c.diasParaBoda === 1,
    plantilla: "faltan-1",
    ventanaDias: 0,
  },
  {
    id: "gracias",
    nombre: "Gracias: álbum y Libro de buenos deseos",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "boda", dias: 1 },
    condicion: (c) => c.pagado && c.publicada,
    plantilla: "gracias",
    ventanaDias: 3,
  },
  {
    id: "album-caduca",
    nombre: "El álbum se borra en 30 días",
    categoria: "servicio",
    disparador: { tipo: "desfase", ancla: "caducidad-album", dias: -30 },
    condicion: (c) => c.albumCaduca != null,
    plantilla: "album-caduca",
    ventanaDias: 7,
    imprescindible: true,
  },

  /* ── Novios · fidelización (LSSI 21.2, baja de un clic) ────────── */
  {
    id: "resena",
    nombre: "Un mes después: reseña y código para amigos",
    categoria: "fidelizacion",
    disparador: { tipo: "desfase", ancla: "boda", dias: 30 },
    condicion: (c) => c.pagado && c.publicada,
    plantilla: "resena",
    ventanaDias: 7,
  },
  {
    id: "aniversario",
    nombre: "Primer aniversario",
    categoria: "fidelizacion",
    disparador: { tipo: "desfase", ancla: "boda", dias: 365 },
    condicion: (c) => c.pagado,
    plantilla: "aniversario",
    ventanaDias: 2,
  },

  /* ── Estudio (Rodrigo) ─────────────────────────────────────────── */
  {
    id: "estudio-diario",
    nombre: "Resumen diario (solo si hubo actividad)",
    categoria: "estudio",
    disparador: { tipo: "cron", cuando: "diario" },
    plantilla: "estudio-diario",
  },
  {
    id: "estudio-semanal",
    nombre: "Resumen semanal (lunes)",
    categoria: "estudio",
    disparador: { tipo: "cron", cuando: "semanal" },
    plantilla: "estudio-semanal",
  },
  {
    id: "alerta-reserva",
    nombre: "Alerta: reserva pagada",
    categoria: "estudio",
    disparador: { tipo: "evento", evento: "pago" },
    plantilla: "alerta-reserva",
  },
  {
    id: "alerta-cobro",
    nombre: "Alerta: cobro pagado",
    categoria: "estudio",
    disparador: { tipo: "evento", evento: "cobro" },
    plantilla: "alerta-cobro",
  },
  {
    id: "alerta-cambio",
    nombre: "Alerta: solicitud de cambio",
    categoria: "estudio",
    disparador: { tipo: "evento", evento: "solicitud" },
    plantilla: "alerta-cambio",
  },
  {
    id: "alerta-pico",
    nombre: "Alerta: pico de visitas",
    categoria: "estudio",
    disparador: { tipo: "evento", evento: "pico" },
    plantilla: "alerta-pico",
  },
];

/* ───────────────────────── Fichas (galería y documentación) ───────────────────────── */

export type BaseLegal = "transaccional" | "cliente-lssi-21-2" | "interno";

export type Ficha = {
  objetivo: string;
  base: BaseLegal;
  /** La métrica que decide si el correo funciona. */
  metrica: string;
};

export const FICHAS: Record<IdCorreo, Ficha> = {
  bienvenida: { objetivo: "Que la pareja entre al panel y empiece a rellenar datos.", base: "transaccional", metrica: "% que abre el panel en 48 h" },
  "completar-datos": { objetivo: "Desbloquear parejas paradas antes del borrador.", base: "transaccional", metrica: "% que completa datos en 7 días tras el correo" },
  publicada: { objetivo: "Que envíen la invitación desde el panel (enlaces personales).", base: "transaccional", metrica: "% de invitados con enlace enviado en 72 h" },
  "rsvp-resumen": { objetivo: "Tranquilidad: saber cómo van sin entrar a mirar.", base: "transaccional", metrica: "Clics al panel / tasa de baja del grupo «rsvp» < 1 %" },
  "rsvp-fecha-limite": { objetivo: "Cerrar la lista a tiempo recordando solo a quien falta.", base: "transaccional", metrica: "Respuestas nuevas entre el correo y la fecha límite" },
  "faltan-30": { objetivo: "Activar En directo y el Libro de deseos con tiempo.", base: "transaccional", metrica: "% con QR de En directo / Libro activado antes de T-7" },
  "faltan-7": { objetivo: "Tarjetas QR impresas y pantalla probada.", base: "transaccional", metrica: "Descargas de tarjetas QR y pruebas de pantalla" },
  "faltan-1": { objetivo: "Calma: no hay nada que hacer.", base: "transaccional", metrica: "Respuestas pidiendo ayuda (debería ser ~0)" },
  gracias: { objetivo: "Que descubran el álbum y el Libro en PDF.", base: "transaccional", metrica: "% que abre el álbum o descarga el PDF en 7 días" },
  resena: { objetivo: "Reseñas reales y recomendaciones con código.", base: "cliente-lssi-21-2", metrica: "Reseñas publicadas / usos del código de amigos" },
  aniversario: { objetivo: "Recuerdo emocional; ofrecer conservar el álbum.", base: "cliente-lssi-21-2", metrica: "Ampliaciones «Conservar 1 año más» y bajas (< 0,5 %)" },
  "album-caduca": { objetivo: "Que nadie pierda sus fotos por no saberlo.", base: "transaccional", metrica: "% que descarga el ZIP o amplía antes de la fecha" },
  "estudio-diario": { objetivo: "Saber en 10 segundos qué pasó ayer.", base: "interno", metrica: "Rodrigo lo abre (y no lo silencia)" },
  "estudio-semanal": { objetivo: "Ver tendencias y el embudo de la semana.", base: "interno", metrica: "Decisiones tomadas el lunes" },
  "alerta-reserva": { objetivo: "Atender una reserva en minutos.", base: "interno", metrica: "Tiempo hasta el primer contacto" },
  "alerta-cobro": { objetivo: "Confirmar que el dinero entró.", base: "interno", metrica: "—" },
  "alerta-cambio": { objetivo: "Responder rápido a una solicitud.", base: "interno", metrica: "Tiempo de resolución de solicitudes" },
  "alerta-pico": { objetivo: "Aprovechar un pico (contestar WhatsApp, revisar la web).", base: "interno", metrica: "Conversión durante el pico" },
};

export const TEXTO_BASE: Record<BaseLegal, string> = {
  transaccional: "Servicio (transaccional)",
  "cliente-lssi-21-2": "Cliente, producto similar (LSSI 21.2) + baja",
  interno: "Interno",
};

/** «30 días antes de la boda», «Al pagar», «Cada 7 días»… */
export function describirDisparador(d: Disparador): string {
  if (d.tipo === "evento") {
    const ev: Record<string, string> = {
      pago: "Al pagar la reserva",
      vinculo: "Al vincular la cuenta",
      publicada: "Al publicar la invitación",
      rsvp: "Al llegar una respuesta",
      cobro: "Al cobrar un pago",
      solicitud: "Al llegar una solicitud de cambio",
      pico: "Al detectar un pico de visitas",
    };
    return ev[d.evento] ?? d.evento;
  }
  if (d.tipo === "recurrente") return `Cada ${d.cadaDias} días mientras se cumpla la condición`;
  if (d.tipo === "cron") return d.cuando === "diario" ? "Cada día, a primera hora" : "Los lunes, a primera hora";
  const ancla: Record<string, string> = {
    boda: "la boda",
    pago: "el pago",
    publicada: "la publicación",
    "caducidad-album": "el borrado del álbum",
    "limite-rsvp": "la fecha límite de confirmación",
  };
  const a = ancla[d.ancla] ?? d.ancla;
  if (d.dias === 0) return `El día de ${a}`;
  const n = Math.abs(d.dias);
  const u = n === 1 ? "día" : "días";
  return d.dias < 0 ? `${n} ${u} antes de ${a}` : `${n} ${u} después de ${a}`;
}

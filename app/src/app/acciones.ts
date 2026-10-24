"use server";

import { after } from "next/server";
import { avisarDeseo, avisarRespuesta } from "@/lib/avisos/avisar";
import { programar } from "@/lib/correos/programar";
import { guardarMensaje, guardarRsvp } from "@/lib/datos";
import {
  CUPO_SIN_TOKEN,
  esAlergeno,
  esBus,
  esMenu,
  type PersonaRsvp,
} from "@/lib/rsvp";

export type Resultado =
  | { ok: true; mensaje: string }
  | { ok: false; error: string };

/**
 * Acciones de servidor PÚBLICAS: las que usa el invitado.
 *
 * Validan aquí y solo aquí. El invitado no tiene cuenta, así que la escritura
 * en base de datos va con service role: no hay `auth.uid()` con el que darle
 * permiso bajo RLS. Por eso estas funciones son la frontera de confianza y no
 * pueden dar por bueno nada de lo que llega del formulario.
 *
 * Las del estudio NO están aquí: viven en `app/estudio/acciones.ts` y cada
 * una comprueba la sesión. Una server action se puede invocar por POST desde
 * cualquier ruta, así que el proxy de /estudio no las protege. Las del panel
 * de los novios están en `app/panel/acciones.ts` y cada una empieza por
 * `exigirAccesoBoda(slug)` (estudio, cuenta o enlace privado de /novios).
 */

function texto(datos: FormData, campo: string, max = 500) {
  return String(datos.get(campo) ?? "").trim().slice(0, max);
}

/**
 * Confirmación de asistencia. Contrato (ver BRIEF-EQUIPO.md):
 *   slug, token?, asiste=si|no, personas=N,
 *   p{i}_nombre, p{i}_menu, p{i}_alergenos (repetido), p{i}_alergias_texto,
 *   p{i}_consentimiento_salud=si (o uno general, consentimiento_salud=si),
 *   bus=no|ida|vuelta|ida_vuelta, parada?, mensaje?, telefono?,
 *   nombre_previo? (sin token: el nombre de la respuesta que se corrige)
 *
 * También entiende el formulario antiguo (invitacion, nombre, acompanantes,
 * menu, alergias, bus=si) para no romper nada mientras se cambia.
 */
export async function confirmarAsistencia(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  const slug = texto(datos, "slug", 80) || texto(datos, "invitacion", 80);
  const token = texto(datos, "token", 64) || null;
  const asisteCrudo = texto(datos, "asiste", 4);
  if (!slug) return { ok: false, error: "Algo ha fallado. Prueba a recargar." };
  if (asisteCrudo !== "si" && asisteCrudo !== "no") {
    return { ok: false, error: "Dinos si vienes o no." };
  }
  const asiste = asisteCrudo === "si";

  let personas: PersonaRsvp[];
  if (datos.has("personas")) {
    const n = Number(texto(datos, "personas", 3));
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return { ok: false, error: "Revisa cuántos sois." };
    }
    personas = [];
    for (let i = 0; i < n; i++) {
      const nombre = texto(datos, `p${i}_nombre`, 120);
      if (nombre.length < 2) {
        return {
          ok: false,
          error: i === 0 ? "Nos falta tu nombre." : `Nos falta el nombre de la persona ${i + 1}.`,
        };
      }
      const menu = texto(datos, `p${i}_menu`, 20) || "adulto";
      if (!esMenu(menu)) return { ok: false, error: "Revisa el menú elegido." };
      const alergenos = [
        ...new Set(datos.getAll(`p${i}_alergenos`).map(String).filter(esAlergeno)),
      ];
      const alergias_texto = texto(datos, `p${i}_alergias_texto`, 400) || null;
      // El permiso es por persona; vale también uno general (`consentimiento_salud`).
      const permiso =
        datos.get(`p${i}_consentimiento_salud`) === "si" || datos.get("consentimiento_salud") === "si";
      personas.push({
        nombre,
        menu,
        alergenos,
        alergias_texto,
        consentimiento_salud: alergenos.length > 0 || alergias_texto ? permiso : false,
      });
    }
  } else {
    // Formulario antiguo: una persona + N acompañantes sin nombre.
    const nombre = texto(datos, "nombre", 120);
    if (nombre.length < 2) return { ok: false, error: "Nos falta tu nombre." };
    const acompanantes = Number(datos.get("acompanantes") ?? 0);
    if (!Number.isInteger(acompanantes) || acompanantes < 0 || acompanantes >= CUPO_SIN_TOKEN) {
      return { ok: false, error: "Revisa el número de acompañantes." };
    }
    const menuViejo = texto(datos, "menu", 60).toLowerCase();
    const menu = esMenu(menuViejo) ? menuViejo : "adulto";
    const alergias = texto(datos, "alergias", 400) || null;
    personas = [
      { nombre, menu, alergenos: [], alergias_texto: alergias, consentimiento_salud: false },
      ...Array.from({ length: asiste ? acompanantes : 0 }, (_, i) => ({
        nombre: `Acompañante ${i + 1} de ${nombre}`,
        menu,
        alergenos: [],
        alergias_texto: null,
      })),
    ];
  }

  // Quien no viene no come: se guarda solo el nombre de cada uno.
  if (!asiste) {
    personas = personas.map((p) => ({
      ...p,
      menu: "adulto",
      alergenos: [],
      alergias_texto: null,
      consentimiento_salud: false,
    }));
  }

  const busCrudo = texto(datos, "bus", 12);
  const bus = busCrudo === "si" ? "ida_vuelta" : esBus(busCrudo) ? busCrudo : "no";

  const guardado = await guardarRsvp({
    slug,
    token,
    asiste,
    personas,
    bus,
    parada: texto(datos, "parada", 120) || null,
    mensaje: texto(datos, "mensaje", 1000) || null,
    telefono: texto(datos, "telefono", 30) || null,
    nombrePrevio: texto(datos, "nombre_previo", 120) || null,
  });

  if (!guardado.ok) return { ok: false, error: guardado.error };

  if (guardado.demo) {
    return {
      ok: true,
      mensaje:
        "Esto es una invitación de muestra, así que no se guarda. En la vuestra, les llegaría a los novios al momento.",
    };
  }

  // Avisos a la pareja (campana, email o push), sin retrasar la respuesta.
  after(() =>
    avisarRespuesta(slug, { nombre: personas[0].nombre, asiste, personas: personas.length, previo: guardado.previo ?? null }),
  );
  // Métricas del estudio (lib/correos): solo las respuestas nuevas, no las correcciones.
  if (guardado.previo == null) after(() => programar({ evento: "rsvp", slug }));

  const varios = personas.length > 1;
  if (!asiste) {
    return {
      ok: true,
      mensaje: varios
        ? "Gracias por avisar. Os echaremos de menos."
        : "Gracias por avisar. Te echaremos de menos.",
    };
  }
  return {
    ok: true,
    mensaje: varios
      ? "Contamos con vosotros. Si cambia algo, volved a este enlace y corregidlo."
      : "Contamos contigo. Si cambia algo, vuelve a este enlace y corrígelo.",
  };
}

export async function dejarMensaje(
  _previo: Resultado | null,
  datos: FormData,
): Promise<Resultado> {
  const slug = texto(datos, "slug", 80) || texto(datos, "invitacion", 80);
  const nombre = texto(datos, "nombre", 120);
  const mensaje = texto(datos, "mensaje", 2000);

  if (nombre.length < 2) return { ok: false, error: "Nos falta tu nombre." };
  if (mensaje.length < 4) return { ok: false, error: "Escribe algo más." };
  if (!slug) return { ok: false, error: "Algo ha fallado. Prueba a recargar." };

  const guardado = await guardarMensaje({ slug, nombre, mensaje });
  if (!guardado.ok) return { ok: false, error: guardado.error };
  if (guardado.demo) {
    return {
      ok: true,
      mensaje: "Esto es una invitación de muestra, así que no se guarda. En la vuestra, les llegaría a los novios.",
    };
  }
  after(() => avisarDeseo(slug, { nombre, texto: mensaje, donde: "en la invitación" }));
  return { ok: true, mensaje: "Escrito. Irá a su libro de buenos deseos." };
}

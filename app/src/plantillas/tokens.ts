import { obtenerPlantilla, VARIANTE_DE_ALIAS, type Plantilla } from "@/data/plantillas";
import type { Ornamento, PlantillaAntigua, Tema } from "@/lib/tipos";
import { AA, acentoLegible, contraste, esOscuro, hexARgb, rgbAHex, sobreAcento } from "./color";

/**
 * Los tokens de una invitación, ya resueltos: nada opcional.
 *
 * Se resuelven en este orden:
 *   1. variante pedida (?c=) si existe en la plantilla,
 *   2. el tema guardado de la boda, SI es compatible con la plantilla
 *      (tinta/papel con AA y el mismo modo claro/oscuro: una boda antigua de
 *      Constelación guardada con papel claro no puede apagar la noche),
 *   3. la variante que corresponde a su id antiguo («brasa» → Floración Brasa),
 *   4. la primera variante de la plantilla.
 */
export type Tokens = {
  display: string;
  texto: string;
  papel: string;
  tinta: string;
  acento: string;
  acentoTexto: string;
  sobreAcento: string;
  radio: string;
  ornamento: Ornamento;
  grano: number;
  modo: "claro" | "oscuro";
};

const GENERICA: Record<string, string> = {
  "Playfair Display": "Georgia, serif",
  "EB Garamond": "Garamond, Georgia, serif",
  Fraunces: "Georgia, serif",
  Figtree: "ui-sans-serif, system-ui, sans-serif",
  Italiana: "Didot, Georgia, serif",
  Jost: "ui-sans-serif, system-ui, sans-serif",
  Cinzel: "Trajan Pro, Georgia, serif",
  Manrope: "ui-sans-serif, system-ui, sans-serif",
  Marcellus: "Georgia, serif",
  Outfit: "ui-sans-serif, system-ui, sans-serif",
  "Instrument Serif": "Georgia, serif",
  Geist: "ui-sans-serif, system-ui, sans-serif",
  "Inter Tight": "Helvetica Neue, Arial, sans-serif",
  "Cormorant Garamond": "Garamond, Georgia, serif",
  "DM Sans": "ui-sans-serif, system-ui, sans-serif",
  "Instrument Sans": "ui-sans-serif, system-ui, sans-serif",
  // Temáticas (K1–K5): sin esto, mientras carga la fuente se pintaba con la
  // serif por defecto y el salto al llegar la sans era muy visible.
  "Albert Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Archivo": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Hanken Grotesk": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "IBM Plex Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Karla": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Lexend": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Libre Franklin": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Mulish": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Nunito Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Plus Jakarta Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Sora": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Space Grotesk": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Work Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Josefin Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Unbounded": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Barlow": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Tenor Sans": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  "Saira": '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
  "Barlow Condensed": '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
  "Big Shoulders": '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
  "Courier Prime": '"Courier New", Courier, ui-monospace, monospace',
  "Zilla Slab": 'Rockwell, "Roboto Slab", Georgia, serif',
  "Young Serif": 'Georgia, serif',
  "Yeseva One": 'Didot, Georgia, serif',
  "Libre Caslon Display": '"Big Caslon", Georgia, serif',
  "Gilda Display": 'Didot, Georgia, serif',
  "DM Serif Display": 'Georgia, serif',
  "Bodoni Moda": 'Didot, "Bodoni 72", Georgia, serif',
  "Bellefair": 'Didot, Georgia, serif',
  "Cormorant": 'Garamond, Georgia, serif',
  "Cinzel Decorative": '"Trajan Pro", Georgia, serif',
  "Lora": 'Georgia, serif',
  "Crimson Pro": 'Garamond, Georgia, serif',
};

function pila(variable: string, familia: string) {
  return `var(${variable}), "${familia}", ${GENERICA[familia] ?? "serif"}`;
}

function compatible(t: Tema | undefined, p: Plantilla): t is Tema {
  if (!t?.tinta || !t.papel || !t.acento) return false;
  if (contraste(t.tinta, t.papel) < AA) return false;
  return esOscuro(t.papel) === (p.modo === "oscuro");
}

export function resolverTokens(
  plantillaGuardada: string,
  guardado?: Tema,
  varianteId?: string | null,
): Tokens {
  const p = obtenerPlantilla(plantillaGuardada);
  const pedida = varianteId ? p.variantes.find((v) => v.id === varianteId) : undefined;
  const deAlias = p.variantes.find(
    (v) =>
      v.id === (VARIANTE_DE_ALIAS[plantillaGuardada as PlantillaAntigua] ?? guardado?.variante),
  );
  const colores = pedida ?? (compatible(guardado, p) ? guardado : (deAlias ?? p.variantes[0]));

  const acentoTextoPedido =
    !pedida && guardado?.acentoTexto && contraste(guardado.acentoTexto, colores.papel) >= AA
      ? guardado.acentoTexto
      : null;

  return {
    display: guardado?.display ?? pila("--p-display", p.tipografia.display),
    // Una sola familia (Registro): el cuerpo usa la variable de la display.
    texto:
      guardado?.texto ??
      pila(p.tipografia.texto === p.tipografia.display ? "--p-display" : "--p-texto", p.tipografia.texto),
    papel: colores.papel,
    tinta: colores.tinta,
    acento: colores.acento,
    acentoTexto: acentoTextoPedido ?? acentoLegible(colores.acento, colores.papel, colores.tinta),
    sobreAcento: sobreAcento(colores.acento),
    radio: guardado?.radio ?? p.radio,
    ornamento: guardado?.ornamento ?? p.ornamento,
    grano: guardado?.grano ?? p.grano,
    modo: p.modo,
  };
}

/**
 * Los tonos de sección (F2): para que la invitación no sea un solo papel de
 * arriba abajo. Se calculan, no se escriben, para que ninguna variante (ni
 * una paleta en vivo) pueda colar un texto sin AA.
 *
 *  · `velo`  el papel con un 11 % del acento: una banda apenas teñida.
 *  · `hondo` la sección en negativo: el acento hundido hacia la tinta hasta
 *            que el papel encima da 7:1 (en plantillas oscuras, al revés:
 *            el acento aclarado sobre la noche hasta que la tinta da 7:1).
 *  · `*-texto` / `*-acento` lo que se lee encima de cada uno, con AA.
 *
 * G3 (color en vivo) puede llamar a esta función con la paleta nueva y
 * aplicar el resultado como variables del lienzo.
 */
export function tonosDerivados(papel: string, tinta: string, acento: string) {
  const mezcla = (a: string, b: string, t: number) => {
    const x = hexARgb(a);
    const y = hexARgb(b);
    return rgbAHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  };
  const oscuro = esOscuro(papel);
  const velo = mezcla(papel, acento, oscuro ? 0.14 : 0.11);
  let hondo = oscuro ? mezcla(papel, acento, 0.22) : acento;
  const textoHondo = oscuro ? tinta : papel;
  for (let t = 0; t <= 1.0001 && contraste(textoHondo, hondo) < 7; t += 0.05) {
    hondo = oscuro ? mezcla(papel, acento, 0.22 * (1 - t)) : mezcla(acento, tinta, t);
  }
  return {
    "--velo": velo,
    "--velo-acento": acentoLegible(acento, velo, tinta),
    "--hondo": hondo,
    "--hondo-texto": textoHondo,
    "--hondo-acento": acentoLegible(oscuro ? acento : mezcla(acento, "#ffffff", 0.55), hondo, textoHondo),
  };
}

/** Los tokens como variables CSS, para el `style` del contenedor. */
export function variablesCss(t: Tokens): Record<string, string | number> {
  return {
    ...tonosDerivados(t.papel, t.tinta, t.acento),
    "--papel-base": t.papel,
    "--display": t.display,
    "--texto": t.texto,
    "--papel": t.papel,
    "--tinta": t.tinta,
    "--acento": t.acento,
    "--acento-texto": t.acentoTexto,
    "--sobre-acento": t.sobreAcento,
    "--radio": t.radio,
    "--grano": t.grano,
  };
}

/**
 * Las variables de cada variante de color, para cambiarla en el cliente sin
 * volver a pedir la página (la invitación es estática; ?c= se lee en el
 * navegador).
 */
export function variablesDeVariantes(plantillaGuardada: string, guardado?: Tema) {
  const p = obtenerPlantilla(plantillaGuardada);
  return Object.fromEntries(
    p.variantes.map((v) => [v.id, variablesCss(resolverTokens(p.id, guardado, v.id))]),
  ) as Record<string, Record<string, string | number>>;
}

/**
 * Reescribe los nombres de la pareja de muestra dentro de una invitación
 * ya pintada («Laura» → «Ana», «Rubén» → «Luis»), sin recargarla.
 *
 * La invitación es estática y no sabe nada de la web: aquí se recorren sus
 * nodos de texto (también los `<text>` de los SVG) y se cambia la palabra
 * exacta, respetando mayúsculas («LAURA» → «ANA»). Guarda el texto
 * original de cada nodo en un WeakMap, así que se puede reescribir tantas
 * veces como se teclee y volver al ejemplo sin acumular cambios.
 *
 * Solo toca el `<main>` (o el `<body>` si no hay) y el título.
 */

const ORIGINALES = new WeakMap<Document, { nodos: Map<Text, string>; titulo: string }>();

function escapar(x: string) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function partes(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return { anio: +m[1], mes: +m[2], dia: +m[3], semana: d.getUTCDay() };
}

/**
 * Las formas en que una invitación escribe una fecha, de la más larga a la
 * más corta, como pares [vieja, nueva]: «martes, 30 de marzo de 2027»,
 * «30 de marzo de 2027», «30 · marzo · 2027», «30.03.2027», «30/03/27»…
 */
function paresFecha(vieja: string, nueva: string): [RegExp, string][] {
  const a = partes(vieja);
  const b = partes(nueva);
  if (!a || !b) return [];
  const dd = (n: number) => String(n).padStart(2, "0");
  const sep = "\\s*[·.\\/\\-|]\\s*";
  return [
    [new RegExp(`${DIAS[a.semana]}(,?\\s+)`, "giu"), `${DIAS[b.semana]}$1`],
    [new RegExp(`\\b${a.dia}(\\s+de\\s+)${MESES[a.mes - 1]}(\\s+de\\s+)${a.anio}`, "giu"), `${b.dia}$1${MESES[b.mes - 1]}$2${b.anio}`],
    [new RegExp(`\\b${a.dia}(\\s+de\\s+)${MESES[a.mes - 1]}\\b`, "giu"), `${b.dia}$1${MESES[b.mes - 1]}`],
    [new RegExp(`\\b${a.dia}(${sep})${MESES[a.mes - 1]}(${sep})${a.anio}`, "giu"), `${b.dia}$1${MESES[b.mes - 1]}$2${b.anio}`],
    [new RegExp(`\\b0?${a.dia}(${sep})0?${a.mes}(${sep})(?:${a.anio}|${String(a.anio).slice(2)})\\b`, "gu"), `${dd(b.dia)}$1${dd(b.mes)}$2${b.anio}`],
    [new RegExp(`\\b${MESES[a.mes - 1]}(\\s+(?:de\\s+)?)${a.anio}\\b`, "giu"), `${MESES[b.mes - 1]}$1${b.anio}`],
    [new RegExp(`\\b${a.anio}\\b`, "gu"), `${b.anio}`],
  ];
}

/** Respeta las mayúsculas de lo que había («MARZO» → «JUNIO»). */
function comoEra(viejo: string, nuevo: string) {
  if (viejo === viejo.toLocaleUpperCase("es-ES") && viejo !== viejo.toLocaleLowerCase("es-ES"))
    return nuevo.toLocaleUpperCase("es-ES");
  if (viejo[0] && viejo[0] === viejo[0].toLocaleUpperCase("es-ES") && viejo[0] !== viejo[0].toLocaleLowerCase("es-ES"))
    return nuevo.charAt(0).toLocaleUpperCase("es-ES") + nuevo.slice(1);
  return nuevo;
}

export function reescribirNombres(
  doc: Document,
  ejemplo: [string, string],
  nuevos: [string, string],
  fechaVieja = "",
  fechaNueva = "",
) {
  const raiz = doc.querySelector("main") ?? doc.body;
  if (!raiz) return;

  let memoria = ORIGINALES.get(doc);
  if (!memoria) {
    memoria = { nodos: new Map(), titulo: doc.title };
    ORIGINALES.set(doc, memoria);
  }

  const pares = ejemplo
    .map((viejo, i) => [viejo.trim(), (nuevos[i] ?? "").trim() || viejo.trim()] as const)
    .filter(([viejo]) => viejo.length > 0);
  if (!pares.length) return;

  const patron = new RegExp(`(^|[^\\p{L}])(${pares.map(([v]) => escapar(v)).join("|")})(?=$|[^\\p{L}])`, "giu");

  const fechas = paresFecha(fechaVieja, fechaNueva);
  const cambiarFecha = (texto: string) =>
    fechas.reduce(
      (acc, [re, por]) => acc.replace(re, (...m) => comoEra(m[0], m[0].replace(new RegExp(re.source, re.flags.replace("g", "")), por))),
      texto,
    );
  const toca = (texto: string) => {
    patron.lastIndex = 0;
    if (patron.test(texto)) return true;
    return fechas.some(([re]) => {
      re.lastIndex = 0;
      const si = re.test(texto);
      re.lastIndex = 0;
      return si;
    });
  };
  const cambiar = (texto: string) => cambiarFecha(cambiarNombres(texto));
  const cambiarNombres = (texto: string) =>
    texto.replace(patron, (_m, antes: string, palabra: string) => {
      const par = pares.find(([v]) => v.toLocaleLowerCase("es-ES") === palabra.toLocaleLowerCase("es-ES"));
      if (!par) return antes + palabra;
      const nuevo = par[1];
      const mayus = palabra === palabra.toLocaleUpperCase("es-ES") && palabra !== palabra.toLocaleLowerCase("es-ES");
      return antes + (mayus ? nuevo.toLocaleUpperCase("es-ES") : nuevo);
    });

  const recorrido = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for (let n = recorrido.nextNode() as Text | null; n; n = recorrido.nextNode() as Text | null) {
    const padre = n.parentElement;
    if (!padre || padre.closest("script,style,noscript,input,textarea")) continue;
    const original = memoria.nodos.get(n) ?? n.data;
    if (!memoria.nodos.has(n)) {
      if (!toca(original)) continue;
      memoria.nodos.set(n, original);
    }
    patron.lastIndex = 0;
    const nuevo = cambiar(original);
    if (n.data !== nuevo) n.data = nuevo;
  }
  patron.lastIndex = 0;
  doc.title = cambiar(memoria.titulo);
}

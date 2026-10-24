/**
 * Paletas curadas por plantilla: 7–8 por cada una, con nombre de boda.
 *
 * Las tres primeras de cada plantilla son sus variantes de catálogo
 * (`src/data/plantillas.ts`), con el mismo id: así «Volver al original» y
 * `?c=` hablan el mismo idioma. El resto están elegidas para el carácter
 * de cada una:
 *
 *  · Carta      papel de algodón y tintas de pluma: finca y jardín.
 *  · Sobre      la boda clásica: burdeos, champán, rosa antiguo.
 *  · Floración  el campo: barro, salvia, girasol, eucalipto.
 *  · Mar        el destino: azules de costa, coral, salitre.
 *  · Velo       etiqueta: neutros con un solo matiz.
 *  · Constelación  de noche: fondos profundos y metales.
 *  · Tinta      casi blanco y negro: un solo matiz apagado.
 *  · Registro   papel blanco y un acento eléctrico, de ciudad.
 *  · Azulejo    el Mediterráneo: cal, añil, buganvilla, limonero.
 *
 * `acentoTexto` y `sobreAcento` NO se escriben: los calcula
 * `resolverPaleta` (ninguna puede colarse sin AA; lo comprueba la prueba).
 */

import type { Colores } from "./paleta";

export type PaletaCurada = Colores & { id: string; nombre: string; /** Variante de catálogo. */ original?: boolean };

const p = (id: string, nombre: string, papel: string, tinta: string, acento: string, original = false): PaletaCurada => ({
  id, nombre, papel, tinta, acento, ...(original ? { original } : {}),
});

export const PALETAS: Record<string, PaletaCurada[]> = {
  carta: [
    p("bosque", "Verde bosque", "#f6f0e4", "#1d2620", "#1f3a2e", true),
    p("granate", "Granate", "#f6efe6", "#2a1b1c", "#6e1f2b", true),
    p("noche", "Azul noche", "#faf6ee", "#171c29", "#1c2840", true),
    p("terracota-salvia", "Terracota y salvia", "#eff0e5", "#2a2b22", "#a4553a"),
    p("champan", "Champán", "#f7f1e6", "#2a241b", "#967841"),
    p("peonia", "Peonía empolvada", "#f8eeec", "#2e2226", "#ad5e78"),
    p("lavanda", "Lavanda de la Provenza", "#f4f1f6", "#262333", "#7a6aa6"),
    p("oliva-miel", "Oliva y miel", "#f5f1e3", "#26281c", "#857531"),
  ],
  sobre: [
    p("granate", "Granate", "#f6f1e9", "#241a16", "#8c1d2c", true),
    p("verdeoscuro", "Verde oscuro", "#f4f1e6", "#1b241d", "#33503a", true),
    p("azulnoche", "Azul noche", "#f3f0ea", "#161c2b", "#2f4470", true),
    p("champan-oro", "Champán y oro", "#f5efe3", "#2a231a", "#9c7a3c"),
    p("rosa-antiguo", "Rosa antiguo", "#f7efee", "#2d2124", "#a35d6a"),
    p("perla", "Marfil y gris perla", "#f4f2ee", "#1f2125", "#5c6470"),
    p("lavanda", "Lavanda de la Provenza", "#f5f2f6", "#25222f", "#6f5f96"),
  ],
  floracion: [
    p("olivo", "Olivo", "#f1f2e6", "#24301f", "#5e6f45", true),
    p("brasa", "Brasa", "#f8ede1", "#3a2418", "#a6532f", true),
    p("malva", "Malva", "#f5f0f2", "#2b2130", "#7b5b7e", true),
    p("terracota-salvia", "Terracota y salvia", "#eef0e4", "#2b2a20", "#b0583a"),
    p("peonia", "Peonía empolvada", "#f8eeec", "#2e2226", "#b9617b"),
    p("lavanda", "Lavanda de la Provenza", "#f3f0f5", "#27233a", "#76649e"),
    p("girasol", "Girasol de julio", "#f8f1dc", "#2c2617", "#c08a1e"),
    p("eucalipto", "Eucalipto", "#eef2ee", "#1f2b27", "#4d7a6a"),
  ],
  mar: [
    p("indigo", "Índigo", "#edf3f4", "#14283a", "#2f6a8a", true),
    p("turquesa", "Turquesa", "#edf5f2", "#10302e", "#2c7a70", true),
    p("arena", "Arena", "#f5eee2", "#2a241c", "#8f7046", true),
    p("mediterraneo", "Mediterráneo", "#eef4f6", "#0f2a3d", "#1b6fa8"),
    p("coral", "Coral y arena", "#f8efe6", "#2c211c", "#d4664a"),
    p("verde-agua", "Verde agua", "#ecf5f2", "#12302c", "#3a9a8a"),
    p("salitre", "Salitre", "#f1f3f2", "#1d2629", "#6b8790"),
  ],
  velo: [
    p("piedra", "Piedra", "#eeeae3", "#1e1c1a", "#76664f", true),
    p("perla", "Perla", "#f1f1ee", "#1c1e21", "#69727c", true),
    p("champan", "Champán", "#f3ede0", "#231e17", "#836a3c", true),
    p("blanco-negro", "Blanco roto y negro", "#f5f4f0", "#141414", "#2b2b2b"),
    p("topo", "Topo", "#efebe6", "#221e1b", "#7d6b5d"),
    p("azul-noche", "Azul noche", "#f2f1ee", "#151a26", "#2a3550"),
    p("salvia", "Salvia empolvada", "#eef0ea", "#1d221d", "#6b7a66"),
  ],
  constelacion: [
    p("medianoche", "Medianoche", "#0e1428", "#ece7da", "#c9a55c", true),
    p("plata", "Plata", "#13161d", "#e7eaf0", "#b9c1cf", true),
    p("vino", "Vino", "#1d1017", "#f2e8e9", "#d9a08c", true),
    p("bosque-noche", "Bosque de noche", "#0f1a16", "#e7eee8", "#9cc7aa"),
    p("ciruela", "Ciruela y oro rosa", "#1a1220", "#f1e9ef", "#e0a6a0"),
    p("cobre", "Tinta y cobre", "#141414", "#eeeae4", "#d08a5a"),
    p("lavanda-noche", "Lavanda de noche", "#16142a", "#ece8f6", "#b5a6e8"),
  ],
  tinta: [
    p("negro", "Negro", "#f7f7f4", "#141414", "#55534e", true),
    p("sepia", "Sepia", "#f6f1e8", "#221c16", "#6f5e48", true),
    p("azulacero", "Azul acero", "#f2f4f6", "#14181d", "#465563", true),
    p("niebla", "Gris niebla", "#f4f4f2", "#1a1a1a", "#6a6a66"),
    p("verde-tinta", "Verde tinta", "#f4f5f1", "#151a17", "#3f5a4c"),
    p("burdeos-tinta", "Burdeos de tinta", "#f7f4f2", "#1a1414", "#6a2a30"),
    p("grafito-arena", "Grafito y arena", "#f3efe8", "#1c1a17", "#7a6a55"),
  ],
  registro: [
    p("lima", "Lima", "#ffffff", "#1f2124", "#c6f432", true),
    p("naranja", "Naranja", "#ffffff", "#1f2124", "#ff5b1f", true),
    p("cobalto", "Azul eléctrico", "#ffffff", "#1f2124", "#2f4bff", true),
    p("fucsia", "Fucsia", "#ffffff", "#1f2124", "#ff2e88"),
    p("menta", "Menta", "#ffffff", "#1f2124", "#2ee6a6"),
    p("yema", "Amarillo yema", "#ffffff", "#1f2124", "#ffd400"),
    p("violeta", "Violeta eléctrico", "#ffffff", "#1f2124", "#8c5df7"),
  ],
  azulejo: [
    p("cobalto", "Cobalto", "#fbf8f2", "#1a2236", "#1f4e9c", true),
    p("buganvilla", "Buganvilla", "#fbf8f2", "#2a1a24", "#b23a6e", true),
    p("ocre", "Ocre", "#fbf8f2", "#2a2216", "#d9a441", true),
    p("mediterraneo", "Mediterráneo", "#fbf8f2", "#14263a", "#1f6fb2"),
    p("terracota-salvia", "Terracota y salvia", "#f8f3ea", "#2a221c", "#b5563a"),
    p("verde-patio", "Verde patio", "#f7f8f1", "#1c2a22", "#2f7a55"),
    p("anil", "Añil", "#f8f7f3", "#171a33", "#3b3f9e"),
  ],
};

export function paletasDe(plantilla: string): PaletaCurada[] {
  return PALETAS[plantilla] ?? PALETAS.sobre;
}

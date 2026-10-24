#!/usr/bin/env node
/**
 * Fuente de la dirección de arte de Invitoo → escribe encargos.json.
 *   node herramientas/imagenes/encargos-fuente.mjs
 *
 * Reglas (M1, docs/18-imagenes-ia.md):
 *  - Personas FICTICIAS. Nunca famosos ni gente real reconocible. Diversidad real (orígenes, edades, parejas del mismo sexo).
 *  - Sin logos, sin marcas, sin texto incrustado: los nombres van en HTML.
 *  - Luz natural, fotografía editorial de boda (documental, no posado de tienda de novias).
 *  - Paleta coherente con cada plantilla. La misma pareja en todas las fotos de su plantilla:
 *    la portada se genera primero y sirve de referencia al resto (Gemini y FLUX.2 klein aceptan referencias).
 *  - Escenarios de España.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

const NEG_PERSONAS = "bridal-shop posing, forced smiles looking at camera, heavy contouring makeup, plastic skin, extra fingers, distorted hands, duplicated people";
const NEG_OBJETOS = "text, engraved letters, monogram letters, scribbles, logos, brand marks, price tags, plastic, cheap glitter";

/** Las 12 plantillas: pareja ficticia, escenario y paleta. */
const PLANTILLAS = [
  {
    id: "carta", nombre: "Carta", pareja: "Inés y Gonzalo", sustituye_portada: "fotos/p-jardin.avif",
    album_actual: ["fotos/bodas/terracota-1.avif", "fotos/bodas/jardin-1.avif", "fotos/bodas/terracota-4.avif", "fotos/bodas/jardin-2.avif"],
    personas: "a Spanish couple in their early thirties: the bride has shoulder-length chestnut hair in soft loose waves, light olive skin and a few freckles, wearing an ivory long-sleeved crepe gown with a boat neckline; the groom has short dark-brown hair, a neatly trimmed beard and warm tan skin, wearing a deep forest-green suit with a white shirt",
    lugar: "the granite village and pine forest of Valsaín near La Granja de San Ildefonso, Segovia, in mid-September",
    paleta: "forest green, warm cream paper, muted antique gold, a touch of deep wine red",
    luz: "late-afternoon sun filtering through tall Scots pines, soft haze",
    album: [
      ["3:2", "walking hand in hand along a pine-needle path between tall Scots pines, seen from behind at a distance, golden haze"],
      ["2:3", "close moment under the pines: she laughs with her forehead against his cheek, candid, shallow depth of field"],
      ["3:2", "long rustic table set under the pines with cream linen, beeswax candles, green wine glasses, wild herbs and small white roses, guests arriving softly out of focus"],
      ["2:3", "detail of their hands: she holds a small bouquet of white garden roses, eucalyptus, pine sprigs and olive leaves tied with cream silk ribbon"],
    ],
    extra: [
      { id: "carta-capitulo-1", aspecto: "3:2", uso: "Carta · capítulo 1 «El autobús de las siete» (sustituye fotos/bodas/brasa-3.avif)", sustituye: ["fotos/bodas/brasa-3.avif"], escena: "years before the wedding: the same two people in casual autumn clothes, she with a sketchbook and pencils, he in running clothes, sitting two seats apart in an old mountain bus at dawn, window light, nostalgic 35mm film look" },
      { id: "carta-capitulo-2", aspecto: "2:3", uso: "Carta · capítulo 2 «Cuarenta mapas y un coche viejo» (sustituye fotos/bodas/brasa-1.avif)", sustituye: ["fotos/bodas/brasa-1.avif"], escena: "road trip: the same couple in casual clothes leaning on an old pale-blue hatchback car with no badges at a dry Andalusian coastal road at sunset, paper road map unfolded on the bonnet, 35mm film look" },
      { id: "carta-capitulo-3", aspecto: "2:3", uso: "Carta · capítulo 3 «La pregunta» (sustituye fotos/bodas/jardin-4.avif)", sustituye: ["fotos/bodas/jardin-4.avif"], escena: "the proposal at sunset on a granite viewpoint bench overlooking the Segovia plain, he kneels holding a small open ring box with a solitaire ring, she covers her mouth with both hands, seen from a respectful distance" },
      { id: "carta-capitulo-4", aspecto: "3:2", uso: "Carta · capítulo 4 «Nos casamos entre pinos» (sustituye fotos/bodas/brasa-4.avif)", sustituye: ["fotos/bodas/brasa-4.avif"], escena: "the wedding exit from a small baroque stone church in La Granja, guests throwing dried olive leaves and rice, the couple laughing, motion in the confetti" },
    ],
  },
  {
    id: "sobre", nombre: "Sobre", pareja: "Laura y Rubén", sustituye_portada: "fotos/p-sobre.avif",
    album_actual: ["fotos/bodas/sobre-1.avif", "fotos/bodas/sobre-2.avif", "fotos/bodas/sobre-3.avif", "fotos/bodas/sobre-4.avif"],
    personas: "a classic Spanish couple in their late twenties: the bride has dark-blonde hair in a low chignon, fair skin, wearing a long-sleeved Chantilly lace gown and a long cathedral veil; the groom is clean-shaven with short black hair and light brown skin, wearing a charcoal three-piece suit with a burgundy tie",
    lugar: "a neoclassical church in Madrid and the ivy-covered courtyard of an old stone country house with a garden",
    paleta: "deep burgundy (wax-seal red), warm ivory, aged brass, dark green ivy",
    luz: "soft bright overcast midday light, gentle and flattering",
    album: [
      ["3:2", "walking down the central aisle of a neoclassical church just married, guests standing in pews out of focus, natural window light"],
      ["2:3", "portrait in an ivy-covered stone courtyard, she adjusts his burgundy tie, quiet complicity"],
      ["3:2", "dinner table in a garden under old plane trees, white linen, burgundy dahlias and ranunculus in low arrangements, brass candlesticks"],
      ["2:3", "bride's bouquet of burgundy dahlias, deep red ranunculus, ivory garden roses and trailing ivy held against the lace of her gown"],
    ],
  },
  {
    id: "floracion", nombre: "Floración", pareja: "Nora y Sebas", sustituye_portada: "fotos/p-floracion.avif",
    album_actual: ["fotos/bodas/floracion-1.avif", "fotos/bodas/floracion-2.avif", "fotos/bodas/floracion-3.avif", "fotos/bodas/floracion-4.avif"],
    personas: "an Afro-Spanish bride in her early thirties with natural curly hair worn loose with a few small white flowers, deep brown skin, wearing a flowing ivory chiffon gown with thin straps; and a groom of Argentine origin, early thirties, wavy light-brown hair, short beard, wearing a sand-coloured linen suit with an open collar",
    lugar: "a centuries-old olive grove on a finca near Chinchón, Madrid, with red earth and a white pergola",
    paleta: "olive green, terracotta, sun-bleached sand, cream",
    luz: "golden hour, low warm sun through olive leaves, dust in the air",
    album: [
      ["3:2", "ceremony under an ancient olive tree, guests on simple wooden chairs, the couple holding hands, wide shot"],
      ["2:3", "he twirls her between olive trees, the chiffon skirt flying, candid laughter"],
      ["3:2", "long table under a white pergola with festoon bulbs, terracotta linen runners, olive branches, small clay vases with wildflowers"],
      ["2:3", "close-up of the bouquet: olive branches, white cosmos, dried grasses and terracotta roses, held at her waist"],
    ],
  },
  {
    id: "mar", nombre: "Mar", pareja: "Sara y Marcos", sustituye_portada: "fotos/p-cielo.avif",
    album_actual: ["fotos/bodas/cielo-1.avif", "fotos/bodas/cielo-2.avif", "fotos/bodas/marea-1.avif", "fotos/bodas/marea-2.avif"],
    personas: "a sun-kissed couple in their early thirties: the bride has long sun-lightened brown hair, light tan skin, wearing a simple silk slip dress, barefoot; the groom has curly dark hair, olive skin, wearing a white linen shirt with rolled sleeves and light sand trousers",
    lugar: "a small rocky cove (cala) in Ibiza with turquoise water, pines on the cliffs and a whitewashed beach house",
    paleta: "deep indigo, sea turquoise, sand, white",
    luz: "sunset, warm side light, sea breeze",
    album: [
      ["2:3", "barefoot on the wet sand at the water's edge, her dress moving in the wind, sunset behind"],
      ["3:2", "ceremony on a rock terrace above the cove, simple arch of driftwood and white flowers, guests in light clothes"],
      ["2:3", "beach dinner table on the sand with white linen, hurricane lanterns, glass bottles with olive branches, blue hour"],
      ["3:2", "fiesta descalzos: guests dancing barefoot on a terrace under string lights, motion blur, joy"],
    ],
  },
  {
    id: "velo", nombre: "Velo", pareja: "Claudia y Jorge", sustituye_portada: "fotos/p-velo.avif",
    album_actual: ["fotos/bodas/velo-1.avif", "fotos/bodas/velo-2.avif", "fotos/bodas/velo-3.avif", "fotos/bodas/velo-4.avif"],
    personas: "an elegant urban couple around forty, together for twelve years: the bride has a sleek dark bob, light skin, wearing a minimalist ivory crepe column gown and a long sheer tulle veil; the groom has short salt-and-pepper hair and medium brown skin, wearing a classic black tuxedo",
    lugar: "a 19th-century palatial club in central Madrid: marble staircase, tall windows, stone and gilded mouldings",
    paleta: "stone grey, champagne, warm white, soft black",
    luz: "window light in a grand interior, calm and luminous",
    album: [
      ["2:3", "she descends a white marble staircase, the long veil trailing, he waits at the bottom, symmetrical composition"],
      ["3:2", "the sheer veil lifted by a draught of air in front of a tall window, silhouettes, poetic"],
      ["2:3", "cocktail in a stone courtyard: champagne coupes, waiters in white jackets out of focus, the couple laughing with friends"],
      ["3:2", "banquet hall with long tables, white flowers in low arrangements, candlelight, crystal chandeliers, no people"],
    ],
  },
  {
    id: "constelacion", nombre: "Constelación", pareja: "Yone y Noe", sustituye_portada: "fotos/p-constelacion.avif",
    album_actual: ["fotos/bodas/constelacion-1.avif", "fotos/bodas/constelacion-2.avif", "fotos/bodas/constelacion-3.avif", "fotos/bodas/constelacion-4.avif"],
    personas: "two brides in their early thirties: Yone, from the Canary Islands, tall, short dark curly hair, warm brown skin, wearing a tailored ivory jumpsuit with a deep V; Noe, fair skin, long copper-red hair, wearing a midnight-blue velvet slip gown",
    lugar: "a rooftop terrace in central Madrid at night with the city lights and domes below",
    paleta: "midnight navy, antique gold, warm string-light amber, soft cream",
    luz: "blue hour turning into night, warm festoon bulbs, city bokeh",
    album: [
      ["3:2", "on the rooftop at blue hour, the two brides kiss with the illuminated city skyline and domes behind them"],
      ["2:3", "sparklers at midnight held by guests forming a tunnel, the brides running through, golden sparks"],
      ["3:2", "an old courtyard dinner with festoon bulbs crossing overhead, long tables, candles, navy linen"],
      ["2:3", "their hands with gold wedding bands resting on navy velvet, a single string light reflected"],
    ],
  },
  {
    id: "tinta", nombre: "Tinta", pareja: "Marta y Álvaro", sustituye_portada: "fotos/p-tinta.avif",
    album_actual: ["fotos/bodas/tinta-1.avif", "fotos/bodas/tinta-2.avif", "fotos/bodas/tinta-3.avif", "fotos/bodas/tinta-4.avif"],
    personas: "a minimalist couple in their mid-thirties: the bride has a short platinum pixie cut, wearing a white tailored trouser suit; the groom has black-rimmed glasses, short dark hair and a black slim suit with a black knit tie",
    lugar: "Madrid: the steps of a civil registry building and a classic old tavern with tiled walls and a zinc bar",
    paleta: "black and white, high-contrast monochrome, warm paper grey",
    luz: "documentary black-and-white photography, natural light, fine grain",
    album: [
      ["3:2", "black and white: the couple signing at a plain wooden table in a civil registry, two friends as witnesses, candid"],
      ["2:3", "black and white: walking down a narrow Madrid street, laughing, he holds her hand, wide documentary frame"],
      ["3:2", "black and white: long lunch in an old tavern, friends raising glasses of vermouth, motion, laughter"],
      ["2:3", "black and white: close-up of hands with simple gold bands holding a small coffee cup"],
    ],
  },
  {
    id: "registro", nombre: "Registro", pareja: "Àlex y Bruno", sustituye_portada: null,
    album_actual: ["fotos/bodas/bruma-1.avif", "fotos/bodas/bruma-2.avif", "fotos/bodas/bruma-3.avif", "fotos/bodas/bruma-4.avif"],
    personas: "two grooms in their early thirties: Àlex, Catalan, slim, light-brown hair and a light beard, wearing a sand-coloured suit with no tie; Bruno, broad-shouldered, curly black hair, olive skin, wearing a navy suit with a white shirt open at the collar",
    lugar: "Barcelona's Gothic Quarter: a medieval stone square, the town-hall stairs and a sunny terrace in El Born",
    paleta: "bright white, warm stone, one electric accent colour (lime or cobalt), crisp shadows",
    luz: "bright Mediterranean midday sun, crisp editorial light with gentle fill flash",
    album: [
      ["2:3", "coming down the stone stairs of a Gothic town hall just married, friends clapping, confetti in the air"],
      ["3:2", "vermouth in a medieval stone square: small glasses, olives, friends toasting, candid editorial"],
      ["2:3", "portrait against a warm stone wall with strong midday shadows, relaxed, one leaning on the other"],
      ["3:2", "long lunch on a sunny terrace, white tablecloth, ceramic plates, lemons and green olives, friends laughing"],
    ],
  },
  {
    id: "azulejo", nombre: "Azulejo", pareja: "Rocío y Javier", sustituye_portada: null,
    album_actual: ["fotos/bodas/tinta-1.avif", "fotos/bodas/lino-3.avif", "fotos/bodas/lino-1.avif", "fotos/bodas/lino-2.avif"],
    personas: "an Andalusian couple in their late twenties: the bride has long dark hair in a low bun with a white lace mantilla, light olive skin, wearing an off-the-shoulder ivory silk gown; the groom has short black hair, a trimmed beard, wearing a light grey suit",
    lugar: "a family house patio in Seville with blue-and-white azulejo tiles, orange trees, a marble fountain and magenta bougainvillea",
    paleta: "cobalt blue, whitewash, ochre, bougainvillea magenta, orange-tree green",
    luz: "evening light as the heat goes down, warm and soft, then lantern light",
    album: [
      ["2:3", "ceremony in the tiled patio under an orange tree, family on wooden chairs, a grandmother watching from a balcony window"],
      ["3:2", "the couple at the marble fountain surrounded by azulejo walls and bougainvillea, candid"],
      ["2:3", "dinner in an upstairs gallery with arches, white linen, blue ceramic jugs, oranges and lemons, lanterns"],
      ["3:2", "guests dancing sevillanas in the patio late at night, flamenco skirts in motion, lanterns, joy"],
    ],
  },
  {
    id: "regencia", nombre: "Alta sociedad", pareja: "Olivia y Edmundo", sustituye_portada: "tematicas/regencia/poster-v.avif",
    album_actual: [],
    personas: "a romantic couple in their late twenties in Regency-inspired wedding attire: the bride has auburn hair in a soft updo with tendrils, fair skin, wearing an empire-waist gown in pale Wedgwood blue silk with delicate embroidery and short puffed sleeves; the groom has dark wavy hair and light brown skin, wearing a midnight tailcoat with a high-collared shirt and cream waistcoat",
    lugar: "the formal gardens of a royal palace in Aranjuez with wisteria, clipped hedges, fountains and gravel paths",
    paleta: "Wedgwood blue, wisteria lilac, tea rose, cream, gilt",
    luz: "soft spring afternoon light, painterly",
    album: [
      ["3:2", "walking along a gravel path under a wisteria pergola in full bloom, palace façade in the distance"],
      ["2:3", "tea and champagne in the gardens: porcelain teacups, petit fours, a silver tray, the couple in conversation"],
      ["3:2", "gala dinner in a palace salon with gilded mirrors, candelabra and tall arrangements of wisteria and roses, no people"],
      ["2:3", "the first waltz in a ballroom, her skirt in motion, candlelight, other dancers out of focus"],
    ],
  },
  {
    id: "aire", nombre: "Aire", pareja: "Blanca y Alonso", sustituye_portada: "tematicas/aire/poster-v.avif",
    album_actual: [],
    personas: "a serene couple in their late thirties: the bride has a platinum short bob, fair skin, wearing a weightless white tulle gown with a long flowing train; the groom is of Filipino-Spanish descent, black hair swept back, wearing an ivory dinner jacket and black trousers",
    lugar: "a white palace salon in Madrid with tall windows, mirrors and polished wooden floors, curtains moving in the wind",
    paleta: "white on white, oyster, pale gold, airy light grey",
    luz: "high-key, airy, diffused window light, very soft shadows",
    album: [
      ["2:3", "the tulle train lifted by the wind in a white salon, she turns, motion, high-key"],
      ["3:2", "the couple at a tall open window, sheer white curtains billowing around them"],
      ["2:3", "a single white phalaenopsis orchid stem and a crystal glass on a white marble side table, minimal still life"],
      ["3:2", "lunch in a hall of mirrors: long white table, white flowers, glassware, reflections, no people"],
    ],
  },
  {
    id: "cuento", nombre: "Érase una vez", pareja: "Aurora y Leo", sustituye_portada: "tematicas/cuento/poster-v.avif",
    album_actual: [],
    personas: "a fairytale couple in their late twenties: the bride has long dark-blonde hair in loose waves with a delicate gold leaf tiara, light skin, wearing a ballgown of layered tulle with tiny embroidered gold stars; the groom has short brown hair, light skin, wearing a midnight-blue velvet tuxedo",
    lugar: "a romantic modernist castle on the Catalan coast (Maresme) with towers, terraced gardens and stone balustrades",
    paleta: "amethyst, midnight blue, warm gold, rose",
    luz: "blue hour with thousands of warm fairy lights, a hint of mist",
    album: [
      ["2:3", "the couple on castle steps at blue hour, fairy lights in the trees, soft mist, magical but realistic"],
      ["3:2", "cocktail in the castle gardens: lanterns hanging from trees, guests out of focus, glowing"],
      ["2:3", "close-up of the tulle skirt with tiny gold stars catching the light, her hand holding a small bouquet of blush roses"],
      ["3:2", "great hall banquet with candelabra, long tables, garlands of roses and ivy, warm candlelight, no people"],
    ],
  },
];

/** Escenas de las aperturas: primer fotograma (póster) y base para el vídeo máster. */
const APERTURAS = [
  ["sobre", "a cream cotton-paper envelope lying on natural linen, closed with a plain smooth burgundy wax seal embossed with two interlocking rings, soft window light from the left, shallow depth of field"],
  ["floracion", "extreme macro of a closed pale peony bud with dew drops, olive leaves behind, soft morning light, the bud about to open"],
  ["cielo", "flying slowly up through soft layers of clouds at dawn, grey turning to gold, sea far below"],
  ["velo", "a sheer ivory silk tulle veil hanging in the air in front of a tall window, light passing through the folds, ethereal"],
  ["constelacion", "deep navy night sky full of stars above dark silhouettes of pine trees, a few brighter stars, subtle Milky Way"],
  ["tinta", "a drop of black ink blooming in clear water against white, macro, elegant swirls, monochrome"],
  ["brasa", "a field of dry golden grasses at sunset with glowing embers of light, warm haze, terracotta sky"],
  ["bruma", "a fogged window pane with soft winter light, droplets, a blurred garden behind, intimate and quiet"],
  ["jardin", "a romantic formal garden at dawn with wisteria and roses, dew, soft focus"],
  ["lino", "close-up of natural linen fabric gently moving in a breeze, warm daylight, folds and texture"],
  ["marea", "calm turquoise Mediterranean water over white sand seen from above, gentle wave lines, sunlight caustics"],
  ["terracota", "sunlit terracotta wall with the shadow of an olive branch moving softly, warm Mediterranean afternoon"],
];

const marca = [
  // Alianzas Invitoo: anillos coherentes con el logo (una alianza lisa y otra con un brillante de talla redonda en engaste alto)
  { id: "marca-alianzas-lino", grupo: "marca", aspecto: "4:5", uso: "Alianzas Invitoo sobre lino: web, redes, bloque de regalos (sustituye fotos/alianzas.avif)", sustituye: ["fotos/alianzas.avif"], ref: ["public/marca/referencias/alianzas-dibujo.png"], prompt: "Still life: two interlocking yellow-gold wedding bands lying on natural cream linen, exactly like the reference drawing: one plain band and one band with a single round brilliant-cut diamond set high in a classic four-prong solitaire setting, the two rings overlapping; soft window light from the left, gentle shadows, macro lens, editorial jewellery photography" },
  { id: "marca-alianzas-mano", grupo: "marca", aspecto: "4:5", uso: "Alianzas en la mano de la novia (campañas)", ref: ["public/marca/referencias/alianzas-dibujo.png"], prompt: "Close-up of a bride's hand with a thin yellow-gold solitaire ring with one round brilliant diamond and a plain gold band, resting on ivory silk, natural light, editorial, no nail art" },
  { id: "marca-alianzas-terciopelo", grupo: "marca", aspecto: "1:1", uso: "Alianzas sobre terciopelo granate (fondo de RSVP / redes)", ref: ["public/marca/referencias/alianzas-dibujo.png"], prompt: "Two interlocking gold wedding rings, one with a single round brilliant diamond solitaire, lying on deep burgundy velvet (#7A1826), low-key lighting, a soft highlight on the gold, luxurious and minimal" },
  { id: "marca-lacre-alianzas", grupo: "marca", aspecto: "1:1", uso: "Lacre de cera granate con el monograma de las alianzas (aperturas, redes, póster Sobre)", ref: ["public/marca/referencias/alianzas-dibujo.png"], prompt: "Macro of a plain smooth deep burgundy wax seal on a cream cotton-paper envelope, the seal embossed only with two interlocking rings and a small diamond like the reference drawing, no letters, no text, irregular organic wax edge, soft raking window light revealing the relief" },
  { id: "marca-lacre-roto", grupo: "marca", aspecto: "4:5", uso: "Lacre partido (momento firma «el lacre se rompe»)", prompt: "A plain smooth burgundy wax seal cracked cleanly in two on an opened cream cotton envelope flap, small wax fragments, no letters, no text, soft side light, macro" },
  { id: "marca-lacre-oro", grupo: "marca", aspecto: "1:1", uso: "Lacre en oro viejo y crema (variante Velo/Aire)", prompt: "A plain smooth antique-gold wax seal with a subtle relief of two interlocking rings, no letters, no text, on a white deckled-edge cotton envelope, airy high-key light" },
  { id: "marca-sobre-algodon", grupo: "marca", aspecto: "4:5", uso: "Sobres de algodón con forro (catálogo de sobres y forros)", prompt: "Flat lay of three cream cotton-paper envelopes with deckled edges, one open showing a liner printed with a delicate olive-branch pattern, a burgundy wax seal, natural linen underneath, silk ribbon, soft daylight" },
  { id: "marca-letterpress", grupo: "marca", aspecto: "4:5", uso: "Cartulina con letterpress en relieve seco (sin texto): fondo de portadas", prompt: "Raking-light close-up of a thick white cotton card with a blind letterpress impression of a botanical border of olive leaves and small flowers, deep tactile relief, no ink, no letters, no text" },
  { id: "marca-bodegon-papeleria", grupo: "marca", aspecto: "4:5", uso: "Bodegón de papelería con lino y flores (hero de la web, Instagram)", prompt: "Editorial flat lay of wedding stationery: blank cream cotton cards and envelopes, a burgundy wax seal, silk ribbon, a sprig of olive, white garden roses and eucalyptus on natural linen, soft morning light, generous negative space, all cards blank" },
  { id: "marca-bodegon-movil", grupo: "marca", aspecto: "4:5", uso: "Bodegón papel + móvil: la invitación digital como objeto de papelería (web)", prompt: "Flat lay on natural linen: a modern smartphone lying next to a cream cotton envelope with a burgundy wax seal, olive branch and white roses; the phone screen shows a plain uniform warm-cream screen, empty, for compositing later; soft daylight" },
  { id: "marca-ramo-olivo", grupo: "marca", aspecto: "2:3", uso: "Ramo de olivo y blanco (Floración, Carta)", prompt: "A loose bridal bouquet of olive branches, white garden roses, white cosmos and dried grasses tied with cream silk ribbon, held against a soft cream background, natural light" },
  { id: "marca-ramo-peonias", grupo: "marca", aspecto: "2:3", uso: "Ramo de peonías (estilo romántico floral)", prompt: "A romantic bouquet of blush and white peonies, garden roses and sweet peas with trailing ribbon, soft pink and cream, against a plaster wall, natural window light" },
  { id: "marca-ramo-azahar", grupo: "marca", aspecto: "2:3", uso: "Ramo de azahar y limón (Azulejo)", prompt: "A small bridal bouquet of orange blossom, white jasmine and a few small green lemons with leaves, against a blue-and-white tiled wall, warm evening light" },
  { id: "marca-mesa-finca", grupo: "marca", aspecto: "3:2", uso: "Mesa montada en finca (web: servicios/colaboradores)", prompt: "A long banquet table in an olive grove at golden hour: linen tablecloth, olive branches, terracotta pots, beeswax candles, amber glassware, wooden chairs, no people" },
  { id: "marca-mesa-palacio", grupo: "marca", aspecto: "3:2", uso: "Mesa de gala en palacio (Velo, Alta sociedad)", prompt: "A gala table in a palace salon: white linen, gilded chargers, crystal, tall white flower arrangements, candelabra, mirrors and chandeliers, no people" },
  { id: "marca-lugar-masia", grupo: "lugares", aspecto: "3:2", uso: "Lugar: masía del Empordà (web colaboradores, SEO local Girona)", prompt: "An old stone masia farmhouse in the Empordà countryside, Catalonia, with cypress trees, a gravel courtyard set for a wedding cocktail, golden hour, no people" },
  { id: "marca-lugar-olivar", grupo: "lugares", aspecto: "3:2", uso: "Lugar: olivar centenario (SEO Madrid / Andalucía)", prompt: "A centuries-old olive grove with twisted trunks and red earth, rows of wooden chairs for a ceremony, golden hour, no people" },
  { id: "marca-lugar-cala", grupo: "lugares", aspecto: "3:2", uso: "Lugar: cala de Ibiza (SEO Baleares)", prompt: "A small turquoise cove in Ibiza with pines on the cliffs and a whitewashed terrace prepared for a wedding dinner at sunset, no people" },
  { id: "marca-lugar-patio-sevilla", grupo: "lugares", aspecto: "3:2", uso: "Lugar: patio sevillano (SEO Sevilla)", prompt: "A Seville courtyard with blue-and-white azulejos, an orange tree, a marble fountain and bougainvillea, lanterns lit at dusk, chairs set for a ceremony, no people" },
  { id: "marca-lugar-segovia", grupo: "lugares", aspecto: "3:2", uso: "Lugar: pinar y granito de Segovia (SEO Castilla y León)", prompt: "A pine forest clearing in the Guadarrama mountains near Segovia with granite rocks, a simple ceremony setup with wooden benches and white flowers, warm afternoon haze, no people" },
  { id: "marca-lugar-barcelona", grupo: "lugares", aspecto: "3:2", uso: "Lugar: plaza gótica de Barcelona (SEO Barcelona)", prompt: "A quiet medieval stone square in Barcelona's Gothic Quarter in soft morning light, a few café tables set with white cloths and flowers, no people, no signs" },
];

const texturas = [
  ["textura-papel-algodon", "Macro texture of handmade cream cotton paper with visible fibres and a deckled edge, even soft light, seamless"],
  ["textura-lino", "Macro texture of natural oatmeal linen fabric with slub irregular threads, even soft light, flat, seamless"],
  ["textura-acuarela", "Abstract soft watercolour wash in olive green and sand on cold-press cotton paper, lots of white space, gentle blooms"],
  ["textura-marmol", "Close-up of white Carrara marble with fine soft grey veins, matte, even light, seamless"],
  ["textura-terciopelo", "Close-up of deep burgundy velvet fabric with a soft sheen and gentle folds, low-key lighting"],
].map(([id, prompt]) => ({ id, grupo: "texturas", aspecto: "1:1", uso: "Textura fotográfica (fondos de plantillas, redes). Alternativa IA a public/marca/texturas/*", prompt, negativos: "objects, text, people" }));

const marketing = [
  { id: "mk-movil-invitada", aspecto: "4:5", uso: "Marketing: la invitación en el móvil, en manos de una invitada (home, anuncios)", prompt: "Over-the-shoulder shot of a woman in her forties in a sunlit Spanish living room holding a smartphone with both hands, smiling softly; the phone screen is plain uniform warm cream, empty, for compositing later; shallow depth of field, natural light" },
  { id: "mk-abuela", aspecto: "4:5", uso: "Marketing: la abuela abre la invitación sola («La abuela la abre sin ayuda»)", prompt: "A Spanish grandmother in her late seventies with short white hair and reading glasses, sitting in an armchair by a window with lace curtains, holding a smartphone at arm's length and smiling with emotion; the screen is plain uniform cream, empty; warm afternoon light, tender and dignified" },
  { id: "mk-tv-salon", aspecto: "16:9", uso: "Marketing: la TV del salón con las fotos de los invitados («En directo»)", prompt: "A wedding reception room at night with warm lights; a large flat TV on a stand shows a plain uniform dark screen, empty, for compositing later; guests in the foreground out of focus raising glasses; festoon lights, candles" },
  { id: "mk-invitados-qr", aspecto: "4:5", uso: "Marketing: un invitado escanea el QR de la mesa para subir fotos", prompt: "A wedding guest in his thirties holding a smartphone over a small blank cream card on a dinner table, as if scanning a code; the card is plain and blank; candlelight, glasses and flowers around" },
  { id: "mk-novios-sofa", aspecto: "3:2", uso: "Marketing: los novios miran las confirmaciones en el sofá (panel)", prompt: "A young couple at home sitting on a linen sofa, sharing a laptop and laughing, cups of coffee, plants, morning light; the laptop screen faces away from the camera" },
  { id: "mk-whatsapp", aspecto: "9:16", uso: "Reels/stories: la invitación llega por mensaje y se abre (fondo vertical)", prompt: "Vertical close-up of hands holding a smartphone above a café table with a cortado and a croissant, Spanish street café, morning light; the screen is plain uniform cream, empty" },
  { id: "mk-libro-deseos", aspecto: "4:5", uso: "Marketing: el Libro de buenos deseos impreso, abierto sobre lino", prompt: "An open A5 linen-bound book with cream pages on a wooden table, pages blank, a pressed olive leaf, a fountain pen, warm window light" },
  { id: "mk-equipo-estudio", aspecto: "3:2", uso: "Web «Qué hacemos»: mesa de estudio de diseño (sin personas reconocibles)", prompt: "A designer's desk in a bright Barcelona studio: paper swatches, envelopes, wax sticks, a laptop seen from behind, colour chips in olive, burgundy and gold, hands of a person sketching, face not visible" },
];

const directo = [
  ["brindis", "3:2", "guests at a Spanish wedding dinner raising glasses in a toast, candid smartphone-style photo, warm light"],
  ["abuelos-bailando", "2:3", "an elderly couple dancing at a wedding, smiling, candid smartphone-style photo, festoon lights"],
  ["ninos", "3:2", "two children running with paper fans across a garden at a wedding, motion, candid"],
  ["tarta", "2:3", "a simple white naked cake with figs and olive leaves on a wooden stand at a wedding, guests out of focus"],
  ["amigas", "2:3", "three friends taking a selfie at a wedding cocktail, laughing, dressed elegantly, candid"],
  ["pista", "3:2", "a crowded dance floor at night with confetti and coloured lights, motion blur, joy"],
  ["mesa-detalle", "3:2", "a wedding guest table seen from above with plates, wine glasses, flowers and hands reaching, candid"],
  ["salida", "2:3", "guests throwing petals at a couple leaving under string lights at night, seen from behind the guests"],
].map(([k, aspecto, escena]) => ({ id: `directo-${k}`, grupo: "directo", aspecto, uso: "Pantalla y pestaña «En directo» y momentos de muestra (sustituye las fotos reutilizadas de fotos/bodas en lib/momentos/muestra.ts y components/sitio/EnDirecto.tsx)", prompt: `Fictional people. ${escena}. Slightly imperfect framing like a real guest photo, natural colours`, negativos: NEG_PERSONAS }));

const web = [
  { id: "web-hero", aspecto: "3:2", uso: "Web: imagen principal (sustituye fotos/hero.avif, hoy sin uso en src)", sustituye: ["fotos/hero.avif"], prompt: "A bride and groom seen from behind walking between olive trees at golden hour, her veil catching the light, far from the camera, editorial, generous negative space on the left for headline" },
  { id: "web-corte-1", aspecto: "2:3", uso: "Web: corte editorial 1 (sustituye fotos/sitio/corte-1.avif)", sustituye: ["fotos/sitio/corte-1.avif"], prompt: "Vertical editorial detail: a cream cotton envelope with a burgundy wax seal tucked into a bouquet of white roses and olive, natural light" },
  { id: "web-corte-2", aspecto: "2:3", uso: "Web: corte editorial 2 (sustituye fotos/sitio/corte-2.avif)", sustituye: ["fotos/sitio/corte-2.avif"], prompt: "Vertical candid: a couple embracing on a Mediterranean terrace at sunset, wind in the dress, seen from a distance" },
  { id: "web-corte-3", aspecto: "3:2", uso: "Web: corte editorial 3 (sustituye fotos/sitio/corte-3.avif)", sustituye: ["fotos/sitio/corte-3.avif"], prompt: "Close-up of two hands exchanging gold wedding rings during a ceremony, soft background of white flowers" },
  { id: "web-portada", aspecto: "16:9", uso: "Web: póster del vídeo de portada (sustituye fotos/sitio/portada.avif y portada-2.avif)", sustituye: ["fotos/sitio/portada.avif", "fotos/sitio/portada-2.avif"], prompt: "Wide still life on natural linen: a cream envelope with a burgundy wax seal, a smartphone with a plain cream screen, olive branches and white roses, soft morning light, lots of negative space on the right" },
];

// ───────────────────────── composición ─────────────────────────

const encargos = [];
const sustitucion = [];

for (const p of PLANTILLAS) {
  const base = `${p.personas}. Setting: ${p.lugar}. Palette: ${p.paleta}. Light: ${p.luz}.`;
  const portada = {
    id: `${p.id}-portada`, grupo: p.id, aspecto: "2:3",
    uso: `${p.nombre} · portada de la demo (${p.pareja})${p.sustituye_portada ? ` — sustituye ${p.sustituye_portada}` : ""}. Es la referencia de la pareja para el resto.`,
    sustituye: p.sustituye_portada ? [p.sustituye_portada] : [],
    prompt: `Editorial wedding portrait, three-quarter length: ${base} They stand close, relaxed and genuinely happy, looking at each other, not at the camera.`,
    negativos: NEG_PERSONAS,
  };
  encargos.push(portada);
  p.album.forEach(([aspecto, escena], i) => {
    const conPersonas = !/no people/.test(escena);
    encargos.push({
      id: `${p.id}-album-${i + 1}`, grupo: p.id, aspecto,
      uso: `${p.nombre} · galería/álbum ${i + 1}${p.album_actual[i] ? ` — sustituye ${p.album_actual[i]}` : ""}`,
      sustituye: p.album_actual[i] ? [p.album_actual[i]] : [],
      prompt: conPersonas ? `${escena}. The same couple: ${p.personas}. Setting: ${p.lugar}. Palette: ${p.paleta}. Light: ${p.luz}.` : `${escena}. Setting: ${p.lugar}. Palette: ${p.paleta}. Light: ${p.luz}.`,
      negativos: conPersonas ? NEG_PERSONAS : NEG_OBJETOS,
      referencias: conPersonas ? [portada.id] : [],
    });
  });
  for (const x of p.extra || []) {
    encargos.push({ id: x.id, grupo: p.id, aspecto: x.aspecto, uso: x.uso, sustituye: x.sustituye, prompt: `${x.escena}. The same two people: ${p.personas.replace(/wearing[^;]*/g, "")}.`, negativos: NEG_PERSONAS, referencias: [portada.id] });
  }
}

// Pósteres/primer fotograma de las aperturas (9:16) + horizontales de las temáticas
for (const [id, escena] of APERTURAS) {
  encargos.push({
    id: `apertura-${id}`, grupo: "aperturas", aspecto: "9:16",
    uso: `Apertura «${id}»: primer fotograma del máster de vídeo y base del póster (sustituye aperturas/${id}/poster.avif y su vídeo, ver plan de animaciones)`,
    sustituye: [`aperturas/${id}/poster.avif`],
    prompt: `Cinematic vertical still: ${escena}. Calm composition with empty space in the upper third for names added later in HTML. Photographic, natural light.`,
    negativos: NEG_OBJETOS,
  });
}
for (const [tema, nombre] of [["regencia", "Alta sociedad"], ["aire", "Aire"], ["cuento", "Érase una vez"]]) {
  encargos.push({
    id: `${tema}-poster-h`, grupo: tema, aspecto: "16:9",
    uso: `${nombre} · póster horizontal del hero (sustituye tematicas/${tema}/poster-h.avif)`,
    sustituye: [`tematicas/${tema}/poster-h.avif`],
    prompt: encargos.find((e) => e.id === `${tema}-album-1`).prompt + " Wide cinematic frame, space on one side for the title.",
    negativos: NEG_PERSONAS, referencias: [`${tema}-portada`],
  });
  if (tema !== "regencia")
    encargos.push({
      id: `${tema}-apertura`, grupo: tema, aspecto: "9:16",
      uso: `${nombre} · imagen de apertura (sustituye tematicas/${tema}/apertura.avif)`,
      sustituye: [`tematicas/${tema}/apertura.avif`],
      prompt: tema === "aire"
        ? "Vertical: a long white tulle veil floating in the air in an empty white salon with tall windows, high-key, airy, poetic, no people visible"
        : "Vertical: a castle garden path at blue hour lined with thousands of warm fairy lights and blush roses, soft mist, magical but photographic, no people",
      negativos: NEG_OBJETOS,
    });
}
encargos.push(...marca.map((m) => ({ ...m, grupo: m.grupo || "marca", negativos: NEG_OBJETOS, referencias_archivos: m.ref, ref: undefined })));
encargos.push(...texturas);
encargos.push(...marketing.map((m) => ({ ...m, grupo: "marketing", negativos: NEG_PERSONAS + ", readable screen content, app interface" })));
encargos.push(...directo);
encargos.push(...web.map((m) => ({ ...m, grupo: "web", negativos: NEG_PERSONAS })));

// Nombre de salida: public/generadas/<id>.png (+ <id>-<ancho>.avif/.webp)
for (const e of encargos) {
  e.salida = `public/generadas/${e.id}.png`;
  if (/wax seal/i.test(e.prompt) && !/no letters/i.test(e.prompt)) e.prompt += " The wax seal is plain and smooth: no letters, no text, no scribbles.";
  for (const s of e.sustituye || []) sustitucion.push({ actual: `public/${s}`, nueva: `public/generadas/${e.id}-1080.avif`, encargo: e.id });
  delete e.ref;
}

/** Plan de animaciones originales de marca (no se ejecuta en el lote de imágenes). */
const animaciones = [
  { pieza: "El aro que se dibuja", tecnica: "SVG animado (stroke-dashoffset) con los trazados de SelloAlianzas", porque: "Pesa < 2 KB, se tiñe con currentColor, nítido a cualquier tamaño y respeta reduced-motion", duracion: "1,2 s, --ease-carta", estado: "Listo para montar: ALIANZAS_FINO / BRILLANTE_FINO" },
  { pieza: "El brillante que destella", tecnica: "SVG + CSS: destello de 600 ms (gradiente lineal que cruza el polígono del brillante y 4 rayos que escalan)", porque: "Microinteracción sobre el logo y el sello de confirmación; nada que descargar", duracion: "600 ms, una vez" },
  { pieza: "El lacre que se rompe", tecnica: "Vídeo corto (alfa WebM VP9 + HEVC con alfa para Safari) generado con IA a partir de marca-lacre-alianzas, o Lottie si se dibuja a mano", porque: "La rotura de cera tiene física (fragmentos, brillo) que en SVG queda pobre; el 3D de X1 cubre la versión interactiva", duracion: "1,4 s", video_prompt: "Macro shot, static camera: a burgundy wax seal embossed with two interlocking rings on a cream cotton envelope cracks cleanly in two as the flap is lifted from below, small wax fragments fall, soft window light, 24 fps, realistic, no text" },
  { pieza: "Las flores que florecen", tecnica: "SVG animado (ya existe <Florecer> de F1) para la invitación; vídeo IA solo para el máster de Floración", porque: "Las flores de línea comparten trazo con las alianzas y se tiñen con la paleta de la pareja", duracion: "1,8 s escalonado" },
  { pieza: "Logo: entrada de marca (telón)", tecnica: "Lottie exportado desde los SVG de marca (o CSS puro): aros que se dibujan → brillante encaja → palabra aparece", porque: "Un solo JSON de ~15 KB reutilizable en web, vídeo de redes y pantalla En directo", duracion: "2,4 s" },
];

const videos = APERTURAS.map(([id, escena]) => ({
  id: `video-apertura-${id}`,
  primer_fotograma: `public/generadas/apertura-${id}.png`,
  duracion: "8 s",
  formatos: ["9:16 1080×1920", "16:9 1920×1080"],
  prompt: `Slow, elegant camera move. ${escena}. ${{
    sobre: "The camera pushes in slowly; at 2 s the wax seal cracks, the flap opens and a cream card slides out towards the camera.",
    floracion: "Time-lapse: the peony bud opens fully in 6 seconds, the camera drifts between the petals towards the light.",
    cielo: "The camera rises through the clouds, they part in layers and reveal a golden sunrise over the sea.",
    velo: "The veil is lifted slowly upwards in slow motion, revealing warm light behind it.",
    constelacion: "Points of light connect with thin golden lines forming two interlocking rings, then dissolve into the sky.",
    tinta: "The ink blooms and swirls in slow motion and settles into soft calligraphic shapes, no letters.",
    brasa: "Embers drift upwards in slow motion while the sun sets over the grass.",
    bruma: "An invisible hand wipes the fog from the glass, revealing a soft winter garden.",
    jardin: "Slow dolly through wisteria and roses, petals falling.",
    lino: "The linen ripples in the wind in slow motion, light passing through.",
    marea: "Gentle waves roll in and out in slow motion, aerial view.",
    terracota: "The shadow of the olive branch sways while the light turns golden.",
  }[id]} Photorealistic, 24 fps, no text, no people unless stated, seamless last frame for a loop.`,
  motores_sugeridos: ["Veo (Gemini API, imagen→vídeo con el primer fotograma)", "Higgsfield (Kling / Seedance, imagen→vídeo)"],
  receta: "ffmpeg: ver docs/04-diseno.md §3 (≤ 2,5 MB, -movflags +faststart, póster AVIF)",
}));

const salida = {
  version: 1,
  generado: new Date().toISOString().slice(0, 10),
  reglas: [
    "Personas ficticias: nunca famosos ni gente real reconocible.",
    "Sin logos, sin marcas y sin texto incrustado: los nombres van en HTML.",
    "Fotografía editorial de boda con luz natural; paleta de cada plantilla.",
    "La misma pareja en toda su plantilla: la portada es la referencia (Gemini y FLUX.2 klein la usan).",
    "Lacres: «plain smooth wax seal, no letters, no text» (FLUX dibuja garabatos si no).",
    "Todas las imágenes generadas se marcan como IA en el catálogo; las demos lo indican en la web.",
  ],
  campos: "id · grupo · uso · aspecto · prompt (inglés) · negativos · referencias (ids que se generan antes) · referencias_archivos (rutas) · sustituye (imagen actual) · salida",
  encargos,
  sustitucion,
  animaciones,
  videos,
};
fs.writeFileSync(path.join(DIR, "encargos.json"), JSON.stringify(salida, null, 2));
const grupos = encargos.reduce((a, e) => ((a[e.grupo] = (a[e.grupo] || 0) + 1), a), {});
console.log(`✓ ${encargos.length} encargos · ${sustitucion.length} sustituciones · ${videos.length} vídeos`, grupos);

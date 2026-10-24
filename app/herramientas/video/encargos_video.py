#!/usr/bin/env python3
"""Invitoo · V1 · genera app/herramientas/imagenes/encargos-video.json.

Un encargo por estilo (28 plantillas + la marca para la web/TV). Cada uno:
  · fotograma: prompt FLUX.2 klein 4B para el primer fotograma (vertical y horizontal);
  · movimiento: prompt de Wan 2.2 TI2V 5B (imagen→vídeo) para la vía A;
  · receta_b: cámara y capas de la vía B (ffmpeg/numpy 2.5D, herramientas/video/cine.py);
  · papel: color al que funde el final de la apertura (el papel de la invitación).
Uso: python3 herramientas/video/encargos_video.py
"""
import json, pathlib

SUFIJO = ("Photorealistic cinematic film still, 35mm, shallow depth of field, soft natural light, "
          "delicate film grain, romantic and elegant wedding mood, a calm uncluttered area in the centre of the frame. "
          "An empty scene: no people, no person, no hands, no text, no logos, no letters, no numbers, no watermark.")
MOV = ("Slow cinematic camera move, smooth and steady, gentle natural motion, soft light, "
       "photorealistic, elegant, no people, no text.")
NEG = ("people, person, human, face, hands, body, bride, groom, text, letters, words, logo, watermark, "
       "subtitles, fast motion, shaky camera, flicker, distortion, blurry, low quality, cartoon")

E = [
 # ─────────────── las 9 de la casa
 ("carta","casa","#f6f0e4","Sobre crema con lacre dorado sobre lino",
  "a cream cotton-paper envelope lying on natural linen, closed with a smooth gold wax seal, a small sprig of dried olive leaves beside it, soft morning window light from the left, dust motes in the light",
  "the camera pushes in very slowly towards the wax seal, dust motes drift in the window light, a soft light leak warms the frame",
  {"camara":"push","capas":["polvo","fuga"],"tono":"calido"}),
 ("sobre","casa","#f6f1e9","Lacre granate y velas sobre nogal",
  "a sealed ivory envelope with a smooth deep burgundy wax seal on a dark walnut desk, two lit candles softly out of focus in the background with warm golden bokeh, evening",
  "candle flames flicker gently, the warm bokeh shimmers, the camera glides slowly forward towards the wax seal",
  {"camara":"push","capas":["bokeh","fuga"],"tono":"calido"}),
 ("floracion","casa","#f1f2e6","Peonías y olivo al amanecer",
  "pale blush peonies in full bloom and silvery olive branches in a sunlit spring garden at sunrise, dew on the petals, soft golden backlight, airy and bright",
  "the petals sway gently in a light breeze, a few petals drift through the air, sunlight flickers through the leaves, slow push-in",
  {"camara":"push","capas":["petalos","bokeh","fuga"],"tono":"fresco"}),
 ("mar","casa","#edf3f4","Mar en calma al amanecer entre nubes",
  "a calm Mediterranean sea at sunrise seen from a high cliff, soft pastel clouds, a thin golden horizon line across the middle, gentle sun glitter on the water",
  "the camera glides slowly forward above the calm sea, soft clouds drift, the sun glitter sparkles on the gentle waves",
  {"camara":"rise","capas":["destellos","fuga"],"tono":"fresco"}),
 ("velo","casa","#eeeae3","Tul de seda a contraluz",
  "a sheer ivory silk tulle curtain backlit by soft daylight in an elegant stone room, delicate folds, warm neutral tones, minimal",
  "the sheer silk fabric drifts and billows slowly in a gentle breeze, light glows through the folds",
  {"camara":"pan-r","capas":["fuga","polvo"],"tono":"neutro"}),
 ("constelacion","casa","#0e1428","Alianzas de oro sobre terciopelo de noche",
  "two plain smooth gold wedding bands, one with a single small diamond, resting on deep midnight-blue velvet, surrounded by tiny sparkling star-like bokeh lights, dark and luminous",
  "the tiny star lights twinkle softly, the camera orbits very slowly around the two gold rings, the diamond catches a glint of light",
  {"camara":"orbit","capas":["estrellas","bokeh"],"tono":"noche"}),
 ("tinta","casa","#f7f7f4","Gota de tinta que florece en agua",
  "a single drop of black ink blooming into soft swirling clouds in clear water against a pure white background, elegant monochrome, high key",
  "the black ink slowly blooms and swirls in the clear water like silk, delicate tendrils unfold",
  {"camara":"push","capas":["tinta"],"tono":"mono"}),
 ("registro","casa","#ffffff","Alianzas y pluma sobre mármol blanco",
  "two plain smooth gold wedding bands, one with a single small diamond, on a white marble desk beside a black fountain pen and a small bouquet of white flowers, crisp modern city daylight with soft shadows of window blinds",
  "the soft shadows of the window blinds slide slowly across the marble, the camera pushes in gently towards the rings",
  {"camara":"push","capas":["fuga"],"tono":"neutro"}),
 ("azulejo","casa","#fbf8f2","Patio encalado con azulejos y buganvilla",
  "a sunlit whitewashed Andalusian patio with cobalt blue and white hand-painted tiles, magenta bougainvillea and a small stone fountain, bright summer light and deep shadows",
  "bougainvillea leaves sway in a warm breeze, the water in the fountain ripples and sparkles, slow push-in",
  {"camara":"push","capas":["destellos","petalos"],"tono":"calido"}),
 # ─────────────── las 19 temáticas
 ("regencia","tematica","#f2f4f6","Glicinias en un jardín inglés",
  "cascading lilac wisteria over a pale stone balustrade in a romantic English palace garden, soft pastel morning light, a misty lawn and topiary behind",
  "the wisteria blossoms sway gently in the breeze, a few petals fall, soft light, slow push-in",
  {"camara":"push","capas":["petalos","bokeh"],"tono":"pastel"}),
 ("aire","tematica","#faf9f6","Galería blanca de palacio con cortinas",
  "an empty minimalist white palace gallery with tall arched windows, sheer white curtains and a polished pale marble floor, soft golden morning light streaming in",
  "the sheer white curtains drift slowly in a soft breeze, the golden light shifts on the marble floor, slow dolly forward",
  {"camara":"push","capas":["polvo","fuga"],"tono":"neutro"}),
 ("cuento","tematica","#1d1030","Bosque nevado con castillo al anochecer",
  "an enchanted snowy forest at blue dusk with a distant fairytale castle with warm lit windows, violet sky, magical sparkling light in the air",
  "snow falls slowly, magical golden sparkles float through the air, the camera glides forward through the forest",
  {"camara":"push","capas":["destellos","polvo"],"tono":"pastel"}),
 ("blason","tematica","#f2e8d5","Castillo en la colina con niebla dorada",
  "a medieval stone castle on a hill at golden hour, morning mist in the valley, soft warm light, distant mountains",
  "the morning mist drifts slowly through the valley, clouds move gently, slow push-in towards the castle",
  {"camara":"push","capas":["niebla","fuga"],"tono":"calido"}),
 ("memorias","tematica","#efe4cf","Cartas antiguas y rosas secas, luz de tarde",
  "a bundle of old blank cream letters tied with a faded silk ribbon, dried roses and an old brass key on a wooden table, warm late afternoon sunlight, nostalgic sepia",
  "dust motes float in the warm sunbeam, the light flickers softly like an old film, slow push-in",
  {"camara":"push","capas":["polvo","super8"],"tono":"sepia"}),
 ("pasaporte","tematica","#f3eadb","Ventanilla de avión sobre nubes al atardecer",
  "the view through an airplane window above a sea of soft clouds at golden sunset, the wing tip glowing, warm sky",
  "the clouds drift slowly past below the wing, the golden light shifts softly, gentle motion",
  {"camara":"pan-l","capas":["fuga"],"tono":"calido"}),
 ("orilla","tematica","#f7f4ee","Orilla turquesa en una cala, vista cenital",
  "aerial top-down view of a quiet Mediterranean cove, gentle turquoise waves washing onto smooth pale sand, bright summer day",
  "gentle turquoise waves wash slowly onto the sand and retreat, foam patterns move, very slow drift",
  {"camara":"push","capas":["destellos"],"tono":"fresco"}),
 ("pinar","tematica","#ece4d3","Pinar con niebla y luciérnagas al anochecer",
  "a quiet pine forest at dusk with ferns and moss, soft mist between the trunks, warm last light rays, tiny glowing fireflies",
  "fireflies glow and drift slowly, the mist moves between the pines, light rays shimmer, slow dolly forward",
  {"camara":"push","capas":["luciernagas","niebla"],"tono":"bosque"}),
 ("orbita","tematica","#0b0f24","Vía Láctea sobre paisaje volcánico",
  "the Milky Way arching over a volcanic mountain landscape at night, a deep violet and indigo starry sky, faint glow on the horizon, clear and serene",
  "the stars twinkle and the sky rotates very slowly like a time-lapse, a faint shooting star, slow push-in",
  {"camara":"rise","capas":["estrellas"],"tono":"noche"}),
 ("brazada","tematica","#f2fafb","Luz bailando en el fondo de una piscina",
  "underwater view of a turquoise swimming pool, dancing sunlight caustics on the pale tiled floor, light rays through the clear water, small bubbles",
  "the sunlight caustics ripple and dance across the pool floor, light rays shimmer, tiny bubbles rise slowly",
  {"camara":"push","capas":["burbujas","causticas"],"tono":"cian"}),
 ("fuego","tematica","#f8eee3","Seda roja que gira con brasas",
  "flowing deep red silk fabric swirling in the air in a dark room, warm golden embers and sparks floating, rich velvet light",
  "the red silk swirls and flows slowly like a dancing skirt, golden embers float upwards",
  {"camara":"orbit","capas":["chispas","bokeh"],"tono":"rojo"}),
 ("neon","tematica","#0a0910","Azotea de noche con lluvia y neón rosa",
  "an empty rooftop terrace at night after the rain, wet reflections, pink and violet neon bokeh of the city skyline, elegant and moody",
  "the neon city lights shimmer in the wet reflections, light rain falls, slow dolly forward",
  {"camara":"push","capas":["lluvia","bokeh"],"tono":"neon"}),
 ("vinilo","tematica","#111011","Disco de vinilo girando con luz roja",
  "close-up of a black vinyl record spinning on a vintage turntable, the tonearm resting on the groove, warm red and amber light, dark background, blank label",
  "the vinyl record spins steadily, light glints across the grooves, slow push-in",
  {"camara":"push","capas":["bokeh","polvo"],"tono":"rojo"}),
 ("festival","tematica","#f4efe4","Guirnaldas de luces y confeti al atardecer",
  "festoon string lights over an empty summer meadow at golden sunset, warm haze, a few colourful confetti pieces floating in the air, distant hills",
  "confetti drifts slowly through the warm air, the string lights glow and sway, golden lens flare",
  {"camara":"pan-r","capas":["confeti","fuga"],"tono":"calido"}),
 ("lupulo","tematica","#f2e8d5","Cerveza ámbar con burbujas y cobre",
  "a glass of amber craft beer with rising bubbles and a creamy head on a wooden bar, copper brewing tanks softly out of focus behind, warm light, fresh green hop cones",
  "fine bubbles rise slowly through the amber beer, warm light glows on the copper, slow push-in",
  {"camara":"push","capas":["burbujas","bokeh"],"tono":"ambar"}),
 ("estadio","tematica","#f3f1e7","Estadio vacío de noche con focos",
  "an empty football stadium at night, bright floodlights glowing through a light mist, lush green pitch with white lines, empty seats, no signs, no advertising",
  "the floodlights flare softly, mist drifts through the light beams, the camera rises slowly over the pitch",
  {"camara":"rise","capas":["bokeh","fuga"],"tono":"calido"}),
 ("meta","tematica","#f5f5f1","Sendero de montaña al amanecer",
  "an empty mountain trail winding along a ridge at sunrise, golden light, low clouds in the valleys, wild grass",
  "the camera moves slowly forward along the trail, low clouds drift in the valleys, the sun rises",
  {"camara":"push","capas":["fuga","polvo"],"tono":"calido"}),
 ("riviera","tematica","#f3ece1","Carretera de costa en la Riviera",
  "an empty winding coastal road along the cliffs of the French Riviera at golden hour, deep blue sea, cypress and pine trees, elegant villa in the distance",
  "the camera glides slowly along the coastal road, the sea sparkles, soft golden light",
  {"camara":"pan-l","capas":["destellos","fuga"],"tono":"calido"}),
 ("bachata","tematica","#1b1324","Velas y pétalos bajo la luna",
  "lit candles and scattered rose petals on a terrace table at night, a full moon over a calm sea, soft violet and warm amber light, a classical guitar resting in soft focus",
  "the candle flames flicker gently, the moonlight shimmers on the sea, slow push-in",
  {"camara":"push","capas":["bokeh","fuga"],"tono":"violeta"}),
 # ─────────────── la web y la TV
 ("invitoo","sitio","#f6f1e9","Alianzas Invitoo sobre seda crema",
  "two plain smooth gold wedding bands interlocked, one with a single small diamond, resting on cream silk with soft folds, warm golden bokeh, luxurious and minimal",
  "the camera orbits very slowly around the interlocked gold rings, the diamond sparkles, warm bokeh shimmers",
  {"camara":"orbit","capas":["bokeh","destellos"],"tono":"calido"}),
]

def salidas(i, tipo):
    s = {
        "apertura": {
            "vertical": [f"public/aperturas/{i}/vertical.mp4", f"public/aperturas/{i}/vertical.webm"],
            "horizontal": [f"public/aperturas/{i}/horizontal.mp4", f"public/aperturas/{i}/horizontal.webm"],
            "poster": f"public/aperturas/{i}/poster.avif",
            "posterHorizontal": f"public/aperturas/{i}/poster-h.avif",
        }
    }
    if tipo == "tematica":
        s["cabecera"] = {
            "vertical": [f"public/tematicas/{i}/hero-v.mp4", f"public/tematicas/{i}/hero-v.webm"],
            "horizontal": [f"public/tematicas/{i}/hero-h.mp4", f"public/tematicas/{i}/hero-h.webm"],
            "poster": f"public/tematicas/{i}/poster-v.avif",
            "posterHorizontal": f"public/tematicas/{i}/poster-h.avif",
            "posterApertura": f"public/tematicas/{i}/apertura.avif",
        }
    return s

out = {
    "version": 1,
    "autor": "V1 (vídeo), 24-10-2026",
    "reglas": [
        "Sin personas: ni novios, ni manos, ni siluetas. Sin texto, logos, letras ni números.",
        "Anillos como el logo de Invitoo: alianzas lisas, una con un brillante pequeño.",
        "Apertura: 6,5 s, termina con 0,6 s de fundido luminoso al color `papel` (CONTRATO.md).",
        "Cabecera: bucle limpio de 6 s, sin fundidos.",
        "Vertical 720×1280 y horizontal 1280×720, 24 fps, H.264 (MP4) + VP9 (WebM), vertical ≤ 1,5 MB.",
    ],
    "fotograma_sufijo": SUFIJO,
    "fotograma_vertical": "vertical portrait composition, the subject in the lower two thirds",
    "fotograma_horizontal": "wide landscape composition, the subject off-centre",
    "movimiento_sufijo": MOV,
    "movimiento_negativo": NEG,
    "encargos": [
        {"id": i, "tipo": t, "papel": p, "escena": es,
         "fotograma": f, "movimiento": m, "receta_b": b, "semilla": 1000 + k * 7,
         "salidas": salidas(i, t)}
        for k, (i, t, p, es, f, m, b) in enumerate(E)
    ],
}
# Vía B de hoy (24-10): imagen ya generada y revisada (sin personas) de imagenes-ia/.
_fb = pathlib.Path(__file__).resolve().parent / "fuentes-b.json"
if _fb.exists():
    fb = json.loads(_fb.read_text(encoding="utf8"))
    for e in out["encargos"]:
        if e["id"] in fb:
            e["fuente_b"] = fb[e["id"]]
        e["estado"] = {"via": "B", "fotograma": "imagenes-ia (FLUX.2 klein, revisada)",
                       "pendiente_pc": "fotograma propio (fotogramas.py) y prueba de Wan 2.2 (wan_i2v.py)"}
dst = pathlib.Path(__file__).resolve().parents[1] / "imagenes" / "encargos-video.json"
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
print(dst, len(out["encargos"]), "encargos")

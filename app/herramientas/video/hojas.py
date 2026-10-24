#!/usr/bin/env python3
"""Invitoo · V1 · hojas de contacto: 3 cuadros por clip (0 s, 3,25 s y 6,25 s de la
apertura, con el destello ya empezando) y uno del bucle, vertical y horizontal.

  python3 hojas.py <trabajo>/muestras <qa/v4/v1>
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
try:
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    FP = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
except OSError:
    F = FP = ImageFont.load_default()
ids = sorted({p.name.split("-")[0] for p in src.glob("*-ap-0000.png")})
resumen = []
for i in ids:
    filas = []
    for o in "vh":
        fs = [src / f"{i}-{o}-ap-{n}.png" for n in ("0000", "0078", "0150")] + [src / f"{i}-{o}-bu-0072.png"]
        fs = [f for f in fs if f.exists()]
        if not fs:
            continue
        ims = [Image.open(f).convert("RGB") for f in fs]
        alto = 400
        ims = [im.resize((round(im.width * alto / im.height), alto)) for im in ims]
        fila = Image.new("RGB", (sum(im.width for im in ims) + 10 * len(ims), alto + 34), "white")
        d = ImageDraw.Draw(fila)
        x = 0
        etiquetas = ["ap. 0 s", "ap. 3,25 s", "ap. 6,25 s", "bucle 3 s"]
        for im, e in zip(ims, etiquetas):
            fila.paste(im, (x, 34)); d.text((x + 4, 8), f"{i} {o} · {e}", fill="black", font=FP)
            x += im.width + 10
        filas.append(fila)
    if not filas:
        continue
    W = max(f.width for f in filas)
    hoja = Image.new("RGB", (W, sum(f.height for f in filas) + 10), "white")
    y = 0
    for f in filas:
        hoja.paste(f, (0, y)); y += f.height + 10
    hoja.save(dst / f"hoja-{i}.jpg", quality=84)
    resumen.append(hoja)
# Una hoja general con el cuadro central vertical de cada estilo.
mini = [(i, Image.open(src / f"{i}-v-ap-0078.png").convert("RGB").resize((180, 320))) for i in ids if (src / f"{i}-v-ap-0078.png").exists()]
if mini:
    cols = 10
    filas = (len(mini) + cols - 1) // cols
    g = Image.new("RGB", (cols * 190, filas * 350), "white")
    d = ImageDraw.Draw(g)
    for k, (i, im) in enumerate(mini):
        x, y = (k % cols) * 190, (k // cols) * 350
        g.paste(im, (x, y + 26)); d.text((x + 2, y + 2), i, fill="black", font=F)
    g.save(dst / "hoja-todas.jpg", quality=86)
print(len(ids), "estilos")

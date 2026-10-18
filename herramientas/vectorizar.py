"""
Vectoriza un PNG de una tinta a SVG.

No hay potrace ni Inkscape en esta máquina, así que se hace a mano:
marching squares sobre la imagen binarizada para sacar los contornos,
Ramer-Douglas-Peucker para quitar los puntos que no aportan, y salida
como un único <path> con fill-rule evenodd (los agujeros de la O y de
los aros salen solos).
"""

import sys
import numpy as np
from PIL import Image

# ---------------------------------------------------------------- binarizar

def mascara(ruta, escala=3, umbral=140):
    im = Image.open(ruta).convert("RGBA")
    fondo = Image.new("RGBA", im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(fondo, im).convert("L")
    if escala != 1:
        im = im.resize((im.width * escala, im.height * escala), Image.LANCZOS)
    a = np.array(im)
    m = (a < umbral).astype(np.uint8)
    # borde de 1 px a cero: así ningún contorno toca el límite del lienzo
    return np.pad(m, 1, constant_values=0)


# ------------------------------------------------------- marching squares

CASOS = {
    1: [("L", "B")], 2: [("B", "R")], 3: [("L", "R")], 4: [("T", "R")],
    5: [("T", "L"), ("B", "R")], 6: [("T", "B")], 7: [("L", "T")],
    8: [("T", "L")], 9: [("T", "B")], 10: [("T", "R"), ("L", "B")],
    11: [("T", "R")], 12: [("L", "R")], 13: [("B", "R")], 14: [("L", "B")],
}


def contornos(m):
    h, w = m.shape
    tl, tr = m[:-1, :-1], m[:-1, 1:]
    bl, br = m[1:, :-1], m[1:, 1:]
    idx = (tl << 3) | (tr << 2) | (br << 1) | bl

    segmentos = []
    ys, xs = np.nonzero((idx > 0) & (idx < 15))
    for y, x in zip(ys.tolist(), xs.tolist()):
        for a, b in CASOS[int(idx[y, x])]:
            segmentos.append((punto(a, x, y), punto(b, x, y)))

    # enlazar segmentos en bucles cerrados
    vecinos = {}
    for p, q in segmentos:
        vecinos.setdefault(p, []).append(q)
        vecinos.setdefault(q, []).append(p)

    vistos = set()
    bucles = []
    for inicio in vecinos:
        if inicio in vistos:
            continue
        bucle, actual, previo = [], inicio, None
        while actual is not None and actual not in vistos:
            vistos.add(actual)
            bucle.append(actual)
            siguiente = None
            for cand in vecinos.get(actual, ()):
                if cand != previo and cand not in vistos:
                    siguiente = cand
                    break
            previo, actual = actual, siguiente
        if len(bucle) >= 8:
            bucles.append(bucle)
    return bucles


def punto(lado, x, y):
    if lado == "T":
        return (x + 0.5, float(y))
    if lado == "B":
        return (x + 0.5, y + 1.0)
    if lado == "L":
        return (float(x), y + 0.5)
    return (x + 1.0, y + 0.5)


# ------------------------------------------------------------------- RDP

def simplificar(puntos, eps):
    if len(puntos) < 3:
        return puntos
    p = np.asarray(puntos, dtype=float)
    guardar = np.zeros(len(p), dtype=bool)
    guardar[0] = guardar[-1] = True
    pila = [(0, len(p) - 1)]
    while pila:
        i, j = pila.pop()
        if j <= i + 1:
            continue
        a, b = p[i], p[j]
        ab = b - a
        norma = np.hypot(*ab)
        seg = p[i + 1 : j]
        if norma < 1e-9:
            d = np.hypot(*(seg - a).T)
        else:
            d = np.abs(np.cross(np.broadcast_to(ab, seg.shape), seg - a)) / norma
        k = int(np.argmax(d))
        if d[k] > eps:
            guardar[i + 1 + k] = True
            pila.append((i, i + 1 + k))
            pila.append((i + 1 + k, j))
    return [tuple(v) for v in p[guardar]]


# ------------------------------------------------------------------- SVG

def a_svg(bucles, ancho, alto, escala, eps, decimales=1):
    partes = []
    for bucle in bucles:
        pts = simplificar(bucle + [bucle[0]], eps)[:-1]
        if len(pts) < 3:
            continue
        d = []
        for i, (x, y) in enumerate(pts):
            # se quita el pad de 1 px y se devuelve a escala original
            cx = round((x - 1) / escala, decimales)
            cy = round((y - 1) / escala, decimales)
            d.append(f"{'M' if i == 0 else 'L'}{cx} {cy}")
        partes.append("".join(d) + "Z")
    return partes, ancho, alto


def main(entrada, salida, escala=3, eps=0.9, umbral=140):
    im = Image.open(entrada)
    w, h = im.size
    m = mascara(entrada, escala, umbral)
    bucles = contornos(m)
    partes, w, h = a_svg(bucles, w, h, escala, eps)
    d = "".join(partes)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'fill="currentColor" fill-rule="evenodd">'
        f'<path d="{d}"/></svg>'
    )
    with open(salida, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"{salida}: {len(bucles)} contornos, {len(svg)} bytes")


if __name__ == "__main__":
    main(
        sys.argv[1],
        sys.argv[2],
        escala=int(sys.argv[3]) if len(sys.argv) > 3 else 3,
        eps=float(sys.argv[4]) if len(sys.argv) > 4 else 0.9,
    )

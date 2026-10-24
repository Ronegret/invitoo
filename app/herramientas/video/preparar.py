#!/usr/bin/env python3
"""Invitoo · V1 · prepara los fotogramas de la vía B.

Toma la imagen de cada estilo (fuentes-b.json: imágenes ya generadas por
FLUX, revisadas una a una: sin personas), la amplía ×4 con Real-ESRGAN
General x4v3 (ONNX, BSD-3-Clause), la reduce a ×2 (más limpia que un ×2
directo) y la deja en <destino>/<id>.png. Si existe el fotograma nuevo del
PC (fotogramas/<id>-v.png / -h.png, de fotogramas.py), se usa ese en su lugar.

  python3 preparar.py <carpeta imagenes-ia> <destino> [--solo a,b] [--rapido: sin ESRGAN]
"""
import json, os, pathlib, sys
import numpy as np
import cv2
import onnxruntime as ort

AQUI = pathlib.Path(__file__).resolve().parent
MODELO = str(pathlib.Path(os.environ.get("INVITOO_MODELOS", pathlib.Path.home() / "modelos")) / "esrgan/real_esrgan_general_x4v3-onnx-float/real_esrgan_general_x4v3.onnx")
T, SOL = 128, 16  # tesela y solape


def ampliar(img):
    ses = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
    h, w = img.shape[:2]
    x = img[..., ::-1].astype(np.float32) / 255
    paso = T - 2 * SOL
    ph, pw = (-(h - 2 * SOL) % paso) + 2 * SOL, (-(w - 2 * SOL) % paso) + 2 * SOL
    xp = np.pad(x, ((SOL, ph), (SOL, pw), (0, 0)), mode="reflect")
    out = np.zeros(((xp.shape[0]) * 4, (xp.shape[1]) * 4, 3), np.float32)
    for y0 in range(0, xp.shape[0] - T + 1, paso):
        for x0 in range(0, xp.shape[1] - T + 1, paso):
            t = xp[y0:y0 + T, x0:x0 + T].transpose(2, 0, 1)[None]
            r = ses.run(None, {"image": t})[0][0].transpose(1, 2, 0)
            out[(y0 + SOL) * 4:(y0 + T - SOL) * 4, (x0 + SOL) * 4:(x0 + T - SOL) * 4] = r[SOL * 4:(T - SOL) * 4, SOL * 4:(T - SOL) * 4]
    out = out[SOL * 4:SOL * 4 + h * 4, SOL * 4:SOL * 4 + w * 4]
    return (np.clip(out[..., ::-1], 0, 1) * 255 + .5).astype(np.uint8)


def limpiar(id_, img, nombre=""):
    """Retoques puntuales: en `mar` (apertura-cielo) hay dos aviones en las nubes."""
    if id_ == "mar-cielo":  # (descartado: los «aviones» eran personas volando)
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = g.shape
        m = np.zeros_like(g)
        zona = (slice(int(h * .6), int(h * .78)), slice(0, w))
        sub = g[zona]
        oscuro = (sub < np.percentile(sub, 1.2)).astype(np.uint8) * 255
        m[zona] = oscuro
        m = cv2.dilate(m, np.ones((9, 9), np.uint8), iterations=2)
        img = cv2.inpaint(img, m, 9, cv2.INPAINT_TELEA)
    if nombre == "apertura-marea.jpg":
        # apertura-marea: hay un bañista (mancha oscura) en el agua y una pareja en la
        # arena (abajo, fuera del encuadre). Se borra todo lo oscuro respecto al agua.
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        fondo = cv2.medianBlur(g.astype(np.uint8), 31).astype(np.float32)
        m = ((fondo - g) > 38).astype(np.uint8) * 255
        m[int(g.shape[0] * .8):] = 255  # la arena de abajo, entera
        m = cv2.dilate(m, np.ones((7, 7), np.uint8), iterations=2)
        img = cv2.inpaint(img, m, 7, cv2.INPAINT_TELEA)
    return img


def main():
    raiz, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    solo = set(sys.argv[sys.argv.index("--solo") + 1].split(",")) if "--solo" in sys.argv else None
    dst.mkdir(parents=True, exist_ok=True)
    fuentes = json.load(open(AQUI / "fuentes-b.json", encoding="utf8"))
    for id_, f in fuentes.items():
        if solo and id_ not in solo:
            continue
        out = dst / f"{id_}.png"
        if out.exists():
            continue
        img = cv2.imread(str(raiz / f["imagen"]), cv2.IMREAD_COLOR)
        img = limpiar(id_, img, pathlib.Path(f["imagen"]).name)
        if "--rapido" in sys.argv:
            # Sin ESRGAN (CPU lenta): Lanczos ×2 y máscara de enfoque suave.
            a = cv2.resize(img, (img.shape[1] * 2, img.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
            b = cv2.GaussianBlur(a, (0, 0), 2.0)
            a = cv2.addWeighted(a, 1.45, b, -0.45, 0)
        else:
            a = ampliar(img)
            a = cv2.resize(a, (img.shape[1] * 2, img.shape[0] * 2), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(out), a)
        print("OK", id_, a.shape, flush=True)


if __name__ == "__main__":
    main()

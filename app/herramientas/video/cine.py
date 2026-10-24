#!/usr/bin/env python3
"""Invitoo · V1 · cine.py — vídeo cinematográfico a partir de un fotograma (vía B)
o acabado de un clip generado (vía A).

  python3 cine.py --id mar --orientacion v --base fotogramas/mar-v.png --salida trabajo/mar-v
  python3 cine.py --id tinta --orientacion v --base wan/tinta-v.mp4 --salida trabajo/tinta-v

Vía B (fotograma): profundidad con Depth Anything V2 Small (ONNX, Apache-2.0) y
cámara 2.5D por píxel (dolly, paneo, subida, órbita) con parallax real: lo
cercano se mueve más que lo lejano. Encima, capas procedurales (bokeh, polvo,
pétalos, nieve, estrellas, luciérnagas, chispas, burbujas, lluvia, confeti,
cáusticas, niebla, fugas de luz, destellos, Super 8), gradación suave, viñeta
y grano de película temporal.

Vía A (vídeo): el clip de Wan 2.2 se reescala, se gradúa y recibe las mismas
capas (más ligeras) y el mismo final.

Salida en <salida>/: apertura/%04d.png (6,5 s, termina con 0,6 s de destello
que funde al color `papel`) y bucle/%04d.png (6 s, bucle limpio por fundido
cruzado de 1 s). Codificar con codificar.sh.
"""
import argparse, json, math, os, pathlib, sys
import numpy as np
import cv2

FPS = 24
T_APERTURA = 6.5
T_BUCLE = 6.0
T_CRUCE = 1.0
T_FINAL = 0.6
N_TOTAL = int(round((T_BUCLE + T_CRUCE) * FPS))  # 168: lo que se renderiza
N_AP = int(round(T_APERTURA * FPS))               # 156
N_BU = int(round(T_BUCLE * FPS))                  # 144
N_CR = int(round(T_CRUCE * FPS))                  # 24
N_FIN = int(round(T_FINAL * FPS))                 # 14

AQUI = pathlib.Path(__file__).resolve().parent
MODELO = str(pathlib.Path(os.environ.get("INVITOO_MODELOS", pathlib.Path.home() / "modelos")) / "da2s.onnx")


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0


# ───────────────────────────────────────────── profundidad
def profundidad(img):
    """0 = lejos, 1 = cerca. img float32 RGB 0..1."""
    import onnxruntime as ort
    h, w = img.shape[:2]
    s = 518
    ih, iw = (s, int(round(s * w / h / 14)) * 14) if h > w else (int(round(s * h / w / 14)) * 14, s)
    x = cv2.resize(img, (iw, ih), interpolation=cv2.INTER_AREA)
    x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    ses = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
    d = ses.run(None, {ses.get_inputs()[0].name: x})[0][0]
    d = cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC)
    lo, hi = np.percentile(d, 2), np.percentile(d, 98)
    d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
    # Suave: sin bordes duros no hay desgarros en la reproyección.
    d = cv2.GaussianBlur(d, (0, 0), max(w, h) / 160)
    return d.astype(np.float32)


# ───────────────────────────────────────────── cámara 2.5D
def suave(t):
    return t * t * (3 - 2 * t)


def camara(tipo, t):
    """t en 0..1 sobre N_TOTAL. Devuelve (zoom, dx, dy, par) — par = fuerza del parallax."""
    u = t  # movimiento continuo y lento (el bucle se cierra por fundido)
    if tipo == "push":
        return 1.0 + 0.085 * u, 0.0, -0.006 * u, 1.0
    if tipo == "pull":
        return 1.085 - 0.085 * u, 0.0, 0.0, 1.0
    if tipo == "pan-l":
        return 1.07 + 0.02 * u, 0.035 * (u - 0.5), 0.0, 1.0
    if tipo == "pan-r":
        return 1.07 + 0.02 * u, -0.035 * (u - 0.5), 0.0, 1.0
    if tipo == "rise":
        return 1.07 + 0.04 * u, 0.0, 0.03 * (u - 0.5), 1.0
    if tipo == "orbit":
        return 1.08 + 0.03 * u, 0.03 * math.sin((u - 0.5) * math.pi * 0.9), 0.0, 1.2
    return 1.0 + 0.06 * u, 0.0, 0.0, 1.0


class Reproyector:
    def __init__(self, img, dep, W, H, foco=(0.5, 0.5), zoom=1.0):
        self.img, self.dep = img, dep
        self.W, self.H = W, H
        sh, sw = img.shape[:2]
        # Encaje "cover" del fotograma en la salida (× zoom de encuadre).
        self.base = max(W / sw, H / sh) * zoom
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.nx = (xx - W / 2) / W  # -0.5..0.5
        self.ny = (yy - H / 2) / H
        self.sw, self.sh = sw, sh
        # Centro del encuadre en el fotograma (foco), sin salirse del borde
        # (con un 12 % de margen para la cámara).
        mw, mh = W / self.base / 2 * 0.88, H / self.base / 2 * 0.88
        self.cx = float(np.clip(foco[0] * sw, mw, sw - mw)) if sw > 2 * mw else sw / 2
        self.cy = float(np.clip(foco[1] * sh, mh, sh - mh)) if sh > 2 * mh else sh / 2
        # Profundidad muestreada en el mismo encuadre de reposo.
        mx0 = (self.nx * W / self.base) + self.cx
        my0 = (self.ny * H / self.base) + self.cy
        self.depo = cv2.remap(dep, mx0.astype(np.float32), my0.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def cuadro(self, zoom, dx, dy, par):
        d = self.depo
        # Lo cercano (d→1) amplía y se desplaza más: parallax.
        z = zoom * (1 + (zoom - 1) * 1.6 * par * (d - 0.35))
        ox = dx * par * (0.25 + 1.1 * d)
        oy = dy * par * (0.25 + 1.1 * d)
        s = self.base * z
        mx = (self.nx * self.W / s) + self.cx - ox * self.W / self.base
        my = (self.ny * self.H / s) + self.cy - oy * self.H / self.base
        return cv2.remap(self.img, mx.astype(np.float32), my.astype(np.float32),
                         cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def desenfocar(x, sigma):
    """Desenfoque gaussiano; con sigma grande se hace a media o cuarta resolución (mismo aspecto, mucho más rápido)."""
    if sigma < 2.5:
        return cv2.GaussianBlur(x, (0, 0), sigma)
    k = 4 if sigma >= 8 else 2
    h, w = x.shape[:2]
    p = cv2.resize(x, (w // k, h // k), interpolation=cv2.INTER_AREA)
    p = cv2.GaussianBlur(p, (0, 0), sigma / k)
    return cv2.resize(p, (w, h), interpolation=cv2.INTER_LINEAR)


# ───────────────────────────────────────────── capas
class Capas:
    def __init__(self, nombres, W, H, tono, rng, img_ref, ligero=False):
        self.n = set(nombres)
        self.W, self.H, self.tono, self.rng = W, H, tono, rng
        self.k = 0.6 if ligero else 1.0
        S = min(W, H)
        self.S = S
        r = rng
        # Partículas comunes: posiciones 0..1, velocidades, tamaños, fases.
        def nube(n, vx, vy, tam):
            return dict(x=r.random(n), y=r.random(n), vx=vx(n), vy=vy(n), s=tam(n), f=r.random(n) * 6.28)
        self.p = {}
        if "bokeh" in self.n:
            self.p["bokeh"] = nube(26, lambda n: r.normal(0, .004, n), lambda n: r.normal(-.006, .004, n), lambda n: r.uniform(.03, .09, n) * S)
        if "polvo" in self.n:
            self.p["polvo"] = nube(140, lambda n: r.normal(.004, .006, n), lambda n: r.normal(-.004, .005, n), lambda n: r.uniform(.6, 2.2, n))
        if "petalos" in self.n:
            self.p["petalos"] = nube(16, lambda n: r.uniform(.02, .06, n), lambda n: r.uniform(.05, .1, n), lambda n: r.uniform(.012, .026, n) * S)
        if "nieve" in self.n:
            self.p["nieve"] = nube(260, lambda n: r.normal(.004, .006, n), lambda n: r.uniform(.03, .08, n), lambda n: r.uniform(.8, 3.2, n))
        if "estrellas" in self.n:
            self.p["estrellas"] = nube(90, lambda n: np.zeros(n), lambda n: np.zeros(n), lambda n: r.uniform(.8, 2.4, n))
        if "luciernagas" in self.n:
            self.p["luciernagas"] = nube(38, lambda n: r.normal(0, .01, n), lambda n: r.normal(-.004, .008, n), lambda n: r.uniform(1.5, 3.5, n))
        if "chispas" in self.n:
            self.p["chispas"] = nube(70, lambda n: r.normal(.005, .01, n), lambda n: r.uniform(-.14, -.06, n), lambda n: r.uniform(.8, 2.4, n))
        if "burbujas" in self.n:
            self.p["burbujas"] = nube(60, lambda n: r.normal(0, .004, n), lambda n: r.uniform(-.12, -.05, n), lambda n: r.uniform(1.5, 5, n))
        if "lluvia" in self.n:
            self.p["lluvia"] = nube(160, lambda n: np.full(n, .03), lambda n: r.uniform(.9, 1.3, n), lambda n: r.uniform(.5, 1.2, n))
        if "confeti" in self.n:
            self.p["confeti"] = nube(48, lambda n: r.normal(.01, .01, n), lambda n: r.uniform(.04, .08, n), lambda n: r.uniform(.006, .011, n) * S)
            self.p["confeti"]["c"] = r.choice([0, 1, 2, 3, 4], 48)
        # Colores por tono.
        self.calido = {"calido": (1.0, .86, .62), "sepia": (1.0, .84, .6), "ambar": (1.0, .78, .45),
                       "rojo": (1.0, .62, .38), "noche": (.85, .88, 1.0), "violeta": (.92, .8, 1.0),
                       "neon": (1.0, .55, .85), "fresco": (1.0, .95, .85), "pastel": (1.0, .92, .95),
                       "cian": (.85, 1.0, 1.0), "bosque": (1.0, .9, .6), "verde": (.95, 1.0, .9),
                       "mono": (1.0, 1.0, 1.0), "neutro": (1.0, .95, .88)}.get(tono, (1.0, .92, .8))
        # Destellos: puntos brillantes del propio fotograma.
        if "destellos" in self.n:
            g = cv2.resize(cv2.cvtColor((img_ref * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY), (W, H)).astype(np.float32) / 255
            ys, xs = np.where(g > np.percentile(g, 99.3))
            idx = r.choice(len(xs), min(40, len(xs)), replace=False) if len(xs) else []
            self.glints = [(xs[i], ys[i], r.random() * 6.28, r.uniform(.6, 1.4)) for i in idx]

    # Helpers de dibujo sobre un lienzo de luz (aditivo).
    def _puntos(self, luz, xs, ys, rad, col, alpha):
        for x, y, rr, a in zip(xs, ys, rad, alpha):
            if a <= 0.01:
                continue
            cv2.circle(luz, (int(x * 16), int(y * 16)), max(1, int(rr * 16)), tuple(float(c * a) for c in col), -1, cv2.LINE_AA, 4)

    def aplicar(self, f, i, n, prof=None):
        W, H, S = self.W, self.H, self.S
        t = i / FPS
        k = self.k
        luz = np.zeros_like(f)
        col = np.array(self.calido, np.float32)

        def mov(p):
            x = (p["x"] + p["vx"] * t) % 1.0
            y = (p["y"] + p["vy"] * t) % 1.0
            return x, y

        if "bokeh" in self.p:
            p = self.p["bokeh"]
            x, y = mov(p)
            x = x + 0.01 * np.sin(t * 0.7 + p["f"])
            capa = np.zeros_like(f)
            a = (0.10 + 0.06 * np.sin(t * 1.3 + p["f"])) * k
            self._puntos(capa, x * W, y * H, p["s"], col, a)
            capa = desenfocar(capa, S / 180)
            luz += capa
        if "polvo" in self.p:
            p = self.p["polvo"]
            x, y = mov(p)
            x = x + 0.004 * np.sin(t * 1.7 + p["f"] * 3)
            a = (0.35 + 0.35 * np.sin(t * 2.1 + p["f"])) * k
            capa = np.zeros_like(f)
            self._puntos(capa, x * W, y * H, p["s"], col, a)
            luz += cv2.GaussianBlur(capa, (0, 0), 0.8)
        if "nieve" in self.p:
            p = self.p["nieve"]
            x, y = mov(p)
            x = x + 0.01 * np.sin(t * 1.1 + p["f"])
            capa = np.zeros_like(f)
            self._puntos(capa, x * W, y * H, p["s"], (1, 1, 1), 0.55 * k * np.ones_like(x))
            luz += cv2.GaussianBlur(capa, (0, 0), 1.0)
        if "estrellas" in self.p:
            p = self.p["estrellas"]
            a = np.clip(np.sin(t * 2.6 + p["f"] * 5) * 0.5 + 0.2, 0, 1) * 0.9 * k
            capa = np.zeros_like(f)
            yy = p["y"] * 0.7  # cielo: arriba
            self._puntos(capa, p["x"] * W, yy * H, p["s"] * 0.7, (1, 1, 1), a)
            capa = cv2.GaussianBlur(capa, (0, 0), 0.7) + desenfocar(capa, 4) * 0.8
            luz += capa
        if "luciernagas" in self.p:
            p = self.p["luciernagas"]
            x, y = mov(p)
            x = x + 0.015 * np.sin(t * 0.9 + p["f"] * 2)
            y = 0.35 + (y * 0.65)
            a = np.clip(np.sin(t * 1.8 + p["f"] * 4), 0, 1) ** 2 * k
            capa = np.zeros_like(f)
            self._puntos(capa, x * W, y * H, p["s"], (1.0, .9, .45), a)
            luz += cv2.GaussianBlur(capa, (0, 0), 1.2) + desenfocar(capa, 7) * 1.6
        if "chispas" in self.p:
            p = self.p["chispas"]
            x, y = mov(p)
            x = x + 0.01 * np.sin(t * 3 + p["f"] * 2)
            a = (0.5 + 0.5 * np.sin(t * 5 + p["f"] * 7)) * k
            capa = np.zeros_like(f)
            self._puntos(capa, x * W, y * H, p["s"], (1.0, .62, .25), a)
            luz += cv2.GaussianBlur(capa, (0, 0), 1.0) + desenfocar(capa, 5) * 1.2
        if "burbujas" in self.p:
            p = self.p["burbujas"]
            x, y = mov(p)
            x = x + 0.006 * np.sin(t * 4 + p["f"] * 3)
            capa = np.zeros_like(f)
            for xx, yy, rr in zip(x * W, y * H, p["s"]):
                cv2.circle(capa, (int(xx * 16), int(yy * 16)), int(rr * 16), (0.5 * k, 0.5 * k, 0.5 * k), 1, cv2.LINE_AA, 4)
                cv2.circle(capa, (int((xx - rr * .35) * 16), int((yy - rr * .35) * 16)), max(1, int(rr * 4)), (0.7 * k,) * 3, -1, cv2.LINE_AA, 4)
            luz += cv2.GaussianBlur(capa, (0, 0), 0.7)
        if "lluvia" in self.p:
            p = self.p["lluvia"]
            x, y = mov(p)
            capa = np.zeros_like(f)
            for xx, yy, ss in zip(x * W, y * H, p["s"]):
                L = S * 0.03 * ss
                cv2.line(capa, (int(xx), int(yy)), (int(xx - L * .03), int(yy - L)), (0.22 * k,) * 3, 1, cv2.LINE_AA)
            luz += cv2.GaussianBlur(capa, (0, 0), 0.6)
        if "petalos" in self.p or "confeti" in self.p:
            capa = np.zeros_like(f)
            mascara = np.zeros(f.shape[:2], np.float32)
            if "petalos" in self.p:
                p = self.p["petalos"]
                x, y = mov(p)
                x = x + 0.03 * np.sin(t * 0.9 + p["f"])
                pc = {"pastel": (.86, .74, .92), "calido": (.98, .62, .72), "fresco": (.98, .86, .88)}.get(self.tono, (.97, .84, .86))
                for xx, yy, ss, ff in zip(x * W, y * H, p["s"], p["f"]):
                    ang = (t * 60 + ff * 57) % 360
                    sq = 0.35 + 0.3 * abs(math.sin(t * 1.5 + ff))
                    cv2.ellipse(capa, (int(xx * 16), int(yy * 16)), (int(ss * 16), int(ss * sq * 16)), ang, 0, 360, pc, -1, cv2.LINE_AA, 4)
                    cv2.ellipse(mascara, (int(xx * 16), int(yy * 16)), (int(ss * 16), int(ss * sq * 16)), ang, 0, 360, 0.85, -1, cv2.LINE_AA, 4)
            if "confeti" in self.p:
                p = self.p["confeti"]
                x, y = mov(p)
                x = x + 0.02 * np.sin(t * 1.4 + p["f"])
                pal = [(.95, .78, .35), (.92, .45, .52), (.98, .95, .9), (.55, .72, .9), (.95, .6, .35)]
                for xx, yy, ss, ff, c in zip(x * W, y * H, p["s"], p["f"], p["c"]):
                    ang = (t * 140 + ff * 57) % 360
                    sq = 0.15 + 0.5 * abs(math.sin(t * 3 + ff))
                    box = cv2.boxPoints(((float(xx), float(yy)), (float(ss), float(ss * sq * 1.6)), float(ang)))
                    cv2.fillConvexPoly(capa, box.astype(np.int32), pal[c], cv2.LINE_AA)
                    cv2.fillConvexPoly(mascara, box.astype(np.int32), 0.9, cv2.LINE_AA)
            # Desenfoque de movimiento ligero y mezcla normal (no aditiva).
            capa = cv2.GaussianBlur(capa, (0, 0), 0.9)
            mascara = cv2.GaussianBlur(mascara, (0, 0), 0.9)[..., None] * k
            f = f * (1 - mascara) + capa * mascara
        if "causticas" in self.n:
            yy, xx = np.mgrid[0:H:4, 0:W:4].astype(np.float32)
            u, v = xx / S * 9, yy / S * 9
            c = 0
            for a, b, ph in ((1.0, .7, 0), (-.6, 1.1, 2), (.4, -1.0, 4)):
                c = c + np.sin(u * a + v * b + t * 1.4 + ph + np.sin(v * .8 - t + ph) * 1.5)
            c = np.clip(1 - np.abs(c) / 1.2, 0, 1) ** 4
            c = cv2.resize(c, (W, H), interpolation=cv2.INTER_CUBIC)
            c = cv2.GaussianBlur(c, (0, 0), 1.5)
            peso = 0.25 * k
            if prof is not None:
                peso = peso * (0.4 + 0.6 * (1 - prof))
            luz += (c * peso)[..., None] * np.array([.8, 1.0, 1.0], np.float32)
        if "niebla" in self.n:
            if not hasattr(self, "_ruido"):
                r = self.rng
                g = r.random((H // 32 + 3, W // 32 + 3)).astype(np.float32)
                g2 = r.random((H // 64 + 3, W // 64 + 3)).astype(np.float32)
                self._ruido = (cv2.resize(g, (W * 2, H), interpolation=cv2.INTER_CUBIC) * .5 +
                               cv2.resize(g2, (W * 2, H), interpolation=cv2.INTER_CUBIC) * .5)
                self._ruido = cv2.GaussianBlur(self._ruido, (0, 0), S / 25)
            off = int(t * W * 0.02) % W
            nb = self._ruido[:, off:off + W]
            nb = np.clip((nb - 0.45) * 2.5, 0, 1)
            peso = 0.22 * k
            if prof is not None:
                peso = peso * (1 - prof) ** 1.5
            m = (nb * peso)[..., None]
            f = f * (1 - m) + np.array(col, np.float32) * 0.92 * m
        if "fuga" in self.n:
            # Fuga de luz: dos manchas cálidas grandes que cruzan despacio.
            yy, xx = np.mgrid[0:H:8, 0:W:8].astype(np.float32)
            xx, yy = xx / W, yy / H
            cx = -0.2 + 1.4 * ((t / (N_TOTAL / FPS)) % 1.0)
            g1 = np.exp(-(((xx - cx) / 0.35) ** 2 + ((yy - 0.15) / 0.5) ** 2))
            g2 = np.exp(-(((xx - 1.1 + cx * 0.4) / 0.25) ** 2 + ((yy - 0.9) / 0.3) ** 2))
            g = cv2.resize(g1 * 0.16 + g2 * 0.08, (W, H), interpolation=cv2.INTER_CUBIC) * k
            fc = np.array([1.0, .62, .32], np.float32) if self.tono not in ("noche", "cian", "mono", "neon", "violeta") else np.array([.7, .6, 1.0], np.float32)
            if self.tono == "mono":
                fc = np.array([1.0, 1.0, 1.0], np.float32)
            luz += g[..., None] * fc
        if "destellos" in self.n and getattr(self, "glints", None):
            capa = np.zeros_like(f)
            for gx, gy, ph, sc in self.glints:
                a = max(0.0, math.sin(t * 1.7 + ph)) ** 6 * k
                if a < 0.02:
                    continue
                L = int(S * 0.018 * sc)
                for ang in (0, 90):
                    rad = math.radians(ang + 20)
                    dx, dy = int(L * math.cos(rad)), int(L * math.sin(rad))
                    cv2.line(capa, (int(gx - dx), int(gy - dy)), (int(gx + dx), int(gy + dy)), (a, a, a * .95), 1, cv2.LINE_AA)
                cv2.circle(capa, (int(gx), int(gy)), 2, (a,) * 3, -1, cv2.LINE_AA)
            luz += cv2.GaussianBlur(capa, (0, 0), 0.8) + desenfocar(capa, 3) * 0.8
        # Luz aditiva tipo "screen".
        f = 1 - (1 - f) * (1 - np.clip(luz, 0, 1))
        if "super8" in self.n:
            fl = 1 + 0.025 * math.sin(t * 23) + 0.02 * self.rng.normal()
            f = f * fl
        return f


# ───────────────────────────────────────────── gradación
TONOS = {
    # (multiplicador RGB de luces, sombras levantadas RGB, saturación)
    "calido": ((1.03, 1.0, .95), (.035, .025, .02), .95),
    "sepia": ((1.04, .99, .9), (.05, .035, .02), .8),
    "ambar": ((1.04, .99, .9), (.03, .02, .01), 1.0),
    "rojo": ((1.03, .98, .95), (.03, .01, .015), 1.0),
    "noche": ((.97, .99, 1.04), (.01, .015, .04), .95),
    "violeta": ((1.0, .97, 1.04), (.025, .01, .04), .95),
    "neon": ((1.02, .97, 1.03), (.02, .005, .03), 1.05),
    "fresco": ((1.0, 1.0, 1.0), (.025, .03, .035), .95),
    "pastel": ((1.0, .99, 1.01), (.05, .05, .06), .88),
    "cian": ((.98, 1.0, 1.01), (.01, .03, .035), 1.0),
    "bosque": ((1.02, 1.0, .94), (.02, .03, .02), .92),
    "verde": ((1.0, 1.01, .98), (.015, .025, .02), .97),
    "mono": ((1.0, 1.0, 1.0), (.03, .03, .03), .0),
    "neutro": ((1.01, 1.0, .98), (.03, .028, .025), .9),
}


_GRANO = {}


def gradar(f, tono, vin, grano_rng, fuerza_grano=0.018):
    mul, lev, sat = TONOS.get(tono, TONOS["neutro"])
    f = f * np.array(mul, np.float32)
    f = f + np.array(lev, np.float32) * (1 - f)
    g = f.mean(axis=2, keepdims=True)
    f = g + (f - g) * sat
    # Curva en S suave.
    f = np.clip(f, 0, 1)
    f = f + 0.06 * (f - 0.5) * (1 - np.abs(2 * f - 1))
    f = f * vin
    # Grano temporal (luminancia), más en medios tonos.
    cache = _GRANO.setdefault(f.shape[:2], [])
    if len(cache) < 12:
        g0 = grano_rng.normal(0, 1, f.shape[:2]).astype(np.float32)
        cache.append(cv2.GaussianBlur(g0, (0, 0), 0.6))
        gr = cache[-1]
    else:
        gr = cache[int(grano_rng.integers(0, 12))]
    peso = fuerza_grano * (1 - np.abs(2 * f.mean(axis=2) - 1) * 0.6)
    f = f + (gr * peso)[..., None]
    return np.clip(f, 0, 1)


def viñeta(W, H, fuerza=0.22):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.8 + ((yy - H / 2) / (H / 2)) ** 2 * 0.8)
    return (1 - fuerza * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)


def destello_final(f, j, papel):
    """j: 0..1 a lo largo de los últimos 0,6 s. Bloom que sube y funde al papel."""
    e = suave(j)
    blur = desenfocar(f, 18 + 40 * e)
    lum = 1 - (1 - f) * (1 - blur * (0.5 * e))
    expo = lum + (1 - lum) * 0.55 * e * e  # sobreexposición suave
    a = e ** 1.6
    return expo * (1 - a) + papel[None, None, :] * a


# ───────────────────────────────────────────── principal
def leer_base(ruta, W, H):
    ruta = str(ruta)
    if ruta.lower().endswith((".mp4", ".webm", ".mov", ".mkv")):
        cap = cv2.VideoCapture(ruta)
        cuadros = []
        while True:
            ok, fr = cap.read()
            if not ok:
                break
            cuadros.append(fr)
        return "video", cuadros
    im = cv2.imread(ruta, cv2.IMREAD_COLOR)
    return "imagen", im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--orientacion", choices=["v", "h"], required=True)
    ap.add_argument("--base", required=True)
    ap.add_argument("--salida", required=True)
    ap.add_argument("--encargos", default=str(AQUI.parent / "imagenes" / "encargos-video.json"))
    ap.add_argument("--muestra", action="store_true", help="solo 3 cuadros, para probar")
    a = ap.parse_args()
    enc = {e["id"]: e for e in json.load(open(a.encargos, encoding="utf8"))["encargos"]}[a.id]
    rb = enc["receta_b"]
    papel = hexrgb(enc["papel"])[::-1]  # BGR, como OpenCV
    W, H = (720, 1280) if a.orientacion == "v" else (1280, 720)
    rng = np.random.default_rng(enc["semilla"])
    tipo, base = leer_base(a.base, W, H)
    sal = pathlib.Path(a.salida)
    (sal / "apertura").mkdir(parents=True, exist_ok=True)
    (sal / "bucle").mkdir(parents=True, exist_ok=True)

    if tipo == "imagen":
        img = base.astype(np.float32) / 255
        dep = profundidad(img[..., ::-1].copy())
        foco = (0.5, 0.5)
        try:
            fb = json.load(open(AQUI / "fuentes-b.json", encoding="utf8")).get(a.id, {})
            if pathlib.Path(a.base).stem != a.id:
                fb = {}  # fotograma propio del estilo (<id>-v/-h.png): sin recortes de fuentes-b
            foco = tuple(fb.get("encuadre", {}).get(a.orientacion, foco))
            zoom_enc = float(fb.get("encuadre", {}).get("zoom_" + a.orientacion, 1.0))
        except FileNotFoundError:
            zoom_enc = 1.0
        rep = Reproyector(img, dep, W, H, foco, zoom_enc)
        ref = img[..., ::-1]
        prof_o = rep.depo
        capas = Capas(rb["capas"], W, H, rb["tono"], np.random.default_rng(enc["semilla"] + 1), ref)
        def cuadro(i):
            z, dx, dy, par = camara(rb["camara"], i / (N_TOTAL - 1))
            return rep.cuadro(z, dx, dy, par)
    else:
        # Vía A: el clip ya se mueve. Se reescala (cover) y se alarga si hace falta
        # con un ralentí ligero (interpolación por mezcla) hasta N_TOTAL cuadros.
        src = base
        sh, sw = src[0].shape[:2]
        s = max(W / sw, H / sh)
        def cover(fr):
            r = cv2.resize(fr, (int(round(sw * s)), int(round(sh * s))), interpolation=cv2.INTER_LANCZOS4)
            y0, x0 = (r.shape[0] - H) // 2, (r.shape[1] - W) // 2
            return r[y0:y0 + H, x0:x0 + W].astype(np.float32) / 255
        cuadros = [cover(fr) for fr in src]
        # Nitidez suave tras el reescalado.
        def nitido(f):
            b = cv2.GaussianBlur(f, (0, 0), 1.2)
            return np.clip(f + 0.35 * (f - b), 0, 1)
        cuadros = [nitido(f) for f in cuadros]
        nsrc = len(cuadros)
        ref = cuadros[0][..., ::-1]
        prof_o = None
        capas = Capas(rb["capas"], W, H, rb["tono"], np.random.default_rng(enc["semilla"] + 1), ref, ligero=True)
        def cuadro(i):
            p = i * (nsrc - 1) / (N_TOTAL - 1)
            i0 = int(math.floor(p)); i1 = min(i0 + 1, nsrc - 1); w = p - i0
            return cuadros[i0] * (1 - w) + cuadros[i1] * w

    vin = viñeta(W, H, 0.24 if enc["papel"] and hexrgb(enc["papel"]).mean() < 0.3 else 0.18)
    grng = np.random.default_rng(7)
    indices = [0, N_TOTAL // 2, N_TOTAL - 1] if a.muestra else range(N_TOTAL)
    final = {}
    for i in indices:
        f = cuadro(i)
        f = capas.aplicar(f[..., ::-1].copy(), i, N_TOTAL, prof_o)[..., ::-1]  # capas en RGB
        f = gradar(f, rb["tono"], vin, grng)
        final[i] = (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8)  # en uint8: 168 cuadros caben en memoria
        if a.muestra:
            cv2.imwrite(str(sal / f"muestra-{i:04d}.png"), (f * 255 + .5).astype(np.uint8))
    if a.muestra:
        return
    # Apertura: 0..N_AP-1, con el destello en los últimos N_FIN.
    for i in range(N_AP):
        f = final[i].astype(np.float32) / 255
        j = i - (N_AP - N_FIN)
        if j >= 0:
            f = destello_final(f, (j + 1) / N_FIN, papel)
        cv2.imwrite(str(sal / "apertura" / f"{i:04d}.png"), (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 1])
    # Bucle: N_BU cuadros; los primeros N_CR mezclan el final (N_BU..N_TOTAL) con el principio.
    for i in range(N_BU):
        f = final[i].astype(np.float32) / 255
        if i < N_CR:
            w = suave(i / N_CR)
            f = final[i + N_BU].astype(np.float32) / 255 * (1 - w) + f * w
        cv2.imwrite(str(sal / "bucle" / f"{i:04d}.png"), (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 1])
    print("OK", a.id, a.orientacion, tipo, flush=True)


if __name__ == "__main__":
    main()

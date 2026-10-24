"""Texturas procedurales de marca (sin IA), periódicas (se repiten sin costura).
papel de algodón, lino, terciopelo y mármol suave a 2048 px + teselas de 512 px para CSS."""
import numpy as np
from PIL import Image
N = 2048
rng = np.random.default_rng(20261024)
OUT = '/home/claude/web/app/public/marca/texturas'

def ruido(n, beta, rng, aniso=(1, 1)):
    """Ruido 1/f^beta periódico (filtrado en Fourier)."""
    w = rng.standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None] * aniso[1]; fx = np.fft.fftfreq(n)[None, :] * aniso[0]
    f = np.sqrt(fx * fx + fy * fy); f[0, 0] = 1
    F = np.fft.fft2(w) / f ** beta; F[0, 0] = 0
    r = np.real(np.fft.ifft2(F)); r -= r.mean(); return r / r.std()

def banda(n, lo, hi, rng, aniso=(1, 1)):
    w = rng.standard_normal((n, n))
    fy = np.fft.fftfreq(n)[:, None] * aniso[1]; fx = np.fft.fftfreq(n)[None, :] * aniso[0]
    f = np.sqrt(fx * fx + fy * fy)
    m = np.exp(-((np.log(f + 1e-9) - np.log((lo * hi) ** .5)) ** 2) / (2 * (np.log(hi / lo) / 2) ** 2))
    r = np.real(np.fft.ifft2(np.fft.fft2(w) * m)); r -= r.mean(); return r / r.std()

def color(base, h, k):
    base = np.array([int(base[i:i + 2], 16) for i in (1, 3, 5)], float)
    img = base[None, None, :] * (1 + k * h[..., None])
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

def guardar(nombre, img):
    img.save(f'{OUT}/{nombre}.webp', quality=82, method=6)
    img.save(f'{OUT}/{nombre}.avif', quality=60)
    img.resize((1024, 1024), Image.LANCZOS).save(f'{OUT}/{nombre}-1024.webp', quality=85, method=6)  # periódica: se repite sin costura

# 1. Papel de algodón: nubes suaves + fibras cortas en todas direcciones + grano fino
nubes = ruido(N, 1.6, rng)
grano = banda(N, 0.15, 0.45, rng)
fib = np.zeros((N, N))
for ang in np.linspace(0, np.pi, 6, endpoint=False):
    fib += np.abs(banda(N, 0.02, 0.09, rng, aniso=(1 + 6 * abs(np.cos(ang)), 1 + 6 * abs(np.sin(ang)))))
fib = (fib - fib.mean()) / fib.std()
h = 0.55 * nubes + 0.25 * grano + 0.35 * np.clip(fib, 0, None)
guardar('papel-algodon', color('#F6F1E9', h / h.std(), 0.018))

# 2. Lino: hilos de urdimbre y trama superpuestos, con grosor irregular (nudos) a lo largo de cada hilo
n_hilos = 340
x = np.arange(N) / N
jit_v = ruido(N, 2.2, rng) * 0.5; jit_h = ruido(N, 2.2, rng) * 0.5
fv = np.cos(2 * np.pi * (n_hilos * x[None, :] + jit_v))          # hilos verticales
fh = np.cos(2 * np.pi * (n_hilos * x[:, None] + jit_h))          # hilos horizontales
nudo_v = banda(N, 0.004, 0.03, rng, aniso=(40, 1))   # varía a lo largo de y, constante en x por hilo
nudo_h = banda(N, 0.004, 0.03, rng, aniso=(1, 40))
hv = (0.5 + 0.5 * fv) ** 1.6 * (1 + 0.8 * nudo_v)
hh = (0.5 + 0.5 * fh) ** 1.6 * (1 + 0.8 * nudo_h)
h = hv + hh + 0.35 * ruido(N, 1.5, rng) + 0.12 * banda(N, 0.2, 0.5, rng)
h -= h.mean()
guardar('lino', color('#EBE3D6', h / h.std(), 0.045))

# 3. Terciopelo granate: brillo direccional muy suave
h = 0.8 * ruido(N, 2.4, rng) + 0.2 * banda(N, 0.25, 0.5, rng)
guardar('terciopelo-granate', color('#7A1826', h / h.std(), 0.09))

# 4. Mármol claro: vetas finas por turbulencia de baja frecuencia
t = ruido(N, 2.3, rng)
yy = np.arange(N)[:, None] / N; xx = np.arange(N)[None, :] / N
vetas = np.abs(np.sin(np.pi * (2 * xx + 1 * yy) + 2.2 * t))
h = -1.0 * (1 - vetas) ** 18 - 0.35 * (1 - vetas) ** 3 + 0.25 * ruido(N, 1.8, rng)
guardar('marmol', color('#F3F0EA', h / h.std(), 0.03))

# 5. Grano para superponer (escala de grises con alfa, mezcla multiply/overlay)
g = banda(512, 0.12, 0.5, np.random.default_rng(7))
a = np.clip(128 + 30 * g, 0, 255).astype(np.uint8)
Image.fromarray(a).save(f'{OUT}/grano-512.webp', quality=70)
print('ok')

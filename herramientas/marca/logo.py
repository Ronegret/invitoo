"""
Invitoo · construcción del logotipo vectorial redibujado.

Fuente: marca-origen/insta invitoo/logo largo 4.png (3240 px).
- Letras orgánicas (N, V, T y la caligrafía) -> potrace + ajuste Bézier (Schneider) + ajuste a guías.
- I, I -> rectángulos exactos.
- Alianzas -> circunferencias perfectas ajustadas por mínimos cuadrados, doble trazo,
  entrelazado calculado analíticamente (arcos SVG, sin polígonos).
- Brillante -> líneas con grosor y uniones a inglete, unidas como polígono limpio (shapely).
Unidades: píxeles del recorte del PNG original (altura de mayúscula = 173,57).
"""
import numpy as np, json, math, sys, os
from shapely.geometry import LineString, box, Polygon, MultiPolygon
from shapely.ops import unary_union
sys.path.insert(0, os.path.dirname(__file__))
from letras import letra, to_d

TOP, BASE = 60.96, 234.53
W = 5.0                                   # grosor del trazo de las alianzas
CY = 152.2
L = dict(c=(695.86, CY), r=(70.38, 86.88))  # aro izquierdo (con el brillante)
R = dict(c=(820.10, CY), r=(76.88, 94.88))  # aro derecho

def f(v, nd=2):
    s = f'{round(v, nd):.{nd}f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

class T:
    """Transformación afín simple: escala uniforme + traslación."""
    def __init__(self, s=1, dx=0, dy=0, nd=2): self.s, self.dx, self.dy, self.nd = s, dx, dy, nd
    def p(self, x, y): return (x * self.s + self.dx, y * self.s + self.dy)
    def pt(self, x, y):
        a, b = self.p(x, y); return f'{f(a, self.nd)} {f(b, self.nd)}'
    def r(self, v): return f(v * self.s, self.nd)

# ---------- alianzas ----------
def anillo(t, c, r1, r2):
    """Corona circular r1<r2 (agujero con sentido contrario: vale con nonzero)."""
    cx, cy = c
    return (f'M{t.pt(cx + r2, cy)}A{t.r(r2)} {t.r(r2)} 0 1 1 {t.pt(cx - r2, cy)}A{t.r(r2)} {t.r(r2)} 0 1 1 {t.pt(cx + r2, cy)}Z'
            f'M{t.pt(cx + r1, cy)}A{t.r(r1)} {t.r(r1)} 0 1 0 {t.pt(cx - r1, cy)}A{t.r(r1)} {t.r(r1)} 0 1 0 {t.pt(cx + r1, cy)}Z')

def inter(c1, r1, c2, r2, lado):
    """Intersección de dos circunferencias; lado=+1 -> la de y mayor (abajo)."""
    (x1, y1), (x2, y2) = c1, c2
    d = math.hypot(x2 - x1, y2 - y1)
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d); h = math.sqrt(max(r1 * r1 - a * a, 0))
    xm, ym = x1 + a * (x2 - x1) / d, y1 + a * (y2 - y1) / d
    ps = [(xm + h * (y2 - y1) / d, ym - h * (x2 - x1) / d), (xm - h * (y2 - y1) / d, ym + h * (x2 - x1) / d)]
    return max(ps, key=lambda p: p[1] * lado)

def ang(c, p): return math.atan2(p[1] - c[1], p[0] - c[0])

def arco(t, c, r, p_ini, p_fin, horario):
    """Arco de c,r desde p_ini a p_fin. horario=True -> sentido de ángulo creciente (y hacia abajo)."""
    a0, a1 = ang(c, p_ini), ang(c, p_fin)
    da = (a1 - a0) % (2 * math.pi) if horario else (a0 - a1) % (2 * math.pi)
    large = 1 if da > math.pi else 0
    sweep = 1 if horario else 0
    return f'A{t.r(r)} {t.r(r)} 0 {large} {sweep} {t.pt(*p_fin)}'

def linea_cortada(t, cu, ru, w, co, b1, b2, lado):
    """Línea (corona ru±w/2 centrada en cu) interrumpida donde pasa por la banda b1..b2 del otro aro (centro co)."""
    ro, ri = ru + w / 2, ru - w / 2
    A = inter(cu, ro, co, b2, lado); B = inter(cu, ro, co, b1, lado)
    C = inter(cu, ri, co, b1, lado); D = inter(cu, ri, co, b2, lado)
    # el hueco es el arco corto A-B; recorremos el largo de B a A por fuera
    aA, aB = ang(cu, A), ang(cu, B)
    corto_horario = ((aB - aA) % (2 * math.pi)) < math.pi  # de A a B en sentido creciente es corto
    # vamos de B a A por el lado largo: si A->B corto es horario, B->A largo también es horario
    hor = corto_horario
    d = f'M{t.pt(*B)}' + arco(t, cu, ro, B, A, hor)
    d += arco(t, co, b2, A, D, not hor if False else _dir(co, b2, A, D))
    d += arco(t, cu, ri, D, C, not hor)
    d += arco(t, co, b1, C, B, _dir(co, b1, C, B)) + 'Z'
    return d

def _dir(c, r, p, q):
    """Sentido del arco corto de p a q sobre c,r."""
    return ((ang(c, q) - ang(c, p)) % (2 * math.pi)) < math.pi

def alianzas(t, w=W, simple=False, hueco=0.0):
    """Las dos alianzas entrelazadas. Arriba manda el aro izquierdo; abajo, el derecho."""
    out = []
    if not simple:
        bR = (R['r'][0] + w / 2, R['r'][1] - w / 2)  # interior de la banda del aro derecho
        bL = (L['r'][0] + w / 2, L['r'][1] - w / 2)
        for ru in L['r']:   # el izquierdo pasa por debajo en el cruce inferior
            out.append(linea_cortada(t, L['c'], ru, w, R['c'], *bR, +1))
        for ru in R['r']:   # el derecho pasa por debajo en el cruce superior
            out.append(linea_cortada(t, R['c'], ru, w, L['c'], *bL, -1))
    else:
        # versión óptica para tamaños pequeños: cada alianza es una banda maciza
        Lr = (L['r'][0] - w / 2, L['r'][1] + w / 2); Rr = (R['r'][0] - w / 2, R['r'][1] + w / 2)
        mid = lambda rr: ((rr[0] + rr[1]) / 2, rr[1] - rr[0])
        rl, wl = mid(Lr); rr_, wr = mid(Rr)
        out.append(linea_cortada(t, L['c'], rl, wl, R['c'], Rr[0] - hueco, Rr[1] + hueco, +1))
        out.append(linea_cortada(t, R['c'], rr_, wr, L['c'], Lr[0] - hueco, Lr[1] + hueco, -1))
    return out

# ---------- brillantes ----------
def poligono_d(t, geom):
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    d = ''
    for p in polys:
        p = Polygon(p.exterior.coords, [i.coords for i in p.interiors])
        from shapely.geometry.polygon import orient
        p = orient(p.simplify(0.02), 1.0)
        for k, ring in enumerate([p.exterior] + list(p.interiors)):
            cs = list(ring.coords)[:-1]
            d += 'M' + 'L'.join(t.pt(*c) for c in cs) + 'Z'
    return d

def brillante_logo(w=5.1, corte=68.3):
    cx = L['c'][0]
    TL, TR = (675.94, 32.95), (2 * cx - 675.94, 32.95)
    GL, GR = (663.78, 42.85), (2 * cx - 663.78, 42.85)
    G1, G1b = (680.6, 42.85), (2 * cx - 680.6, 42.85)
    Ct, Tip = (cx, 32.95), (cx, 68.9)
    lineas = [[TL, TR, GR, Tip, GL, TL], [GL, GR], [Ct, Tip], [TL, G1, Ct, G1b, TR], [G1, Tip], [G1b, Tip]]
    g = unary_union([LineString(l).buffer(w / 2, cap_style='flat', join_style='mitre', mitre_limit=6) for l in lineas])
    # cerrar bien el contorno exterior (inglete en las esquinas)
    g = unary_union([g, Polygon([TL, TR, GR, Tip, GL]).exterior.buffer(w / 2, join_style='mitre', mitre_limit=6)])
    from shapely.geometry import Point
    # el engaste termina justo en el canto interior del aro (sin taco rectangular)
    return g.intersection(box(0, 30.4, 2000, corte + 3)).difference(Point(L['c']).buffer(L['r'][1] - W / 2, quad_segs=512))

def brillante_sello(w=2.7):
    cx = 249.45
    TL, TR = (231.6, 13.4), (2 * cx - 231.6, 13.4)
    GL, GR = (219.9, 27.6), (2 * cx - 219.9, 27.6)
    G1, G1b = (238.4, 27.6), (2 * cx - 238.4, 27.6)
    Ct, Tip = (cx, 13.4), (cx, 59.0)
    lineas = [[GL, GR], [TL, G1, Ct, G1b, TR], [G1, Tip], [G1b, Tip]]
    g = unary_union([LineString(l).buffer(w / 2, cap_style='flat', join_style='mitre', mitre_limit=5) for l in lineas]
                    + [Polygon([TL, TR, GR, Tip, GL]).exterior.buffer(w / 2, join_style='mitre', mitre_limit=5)])
    return g.intersection(box(0, 13.4 - w / 2, 500, 61.5))

# ---------- letras ----------
XS = {'N': (103.42, 225.67), 'V': (), 'T': (479.84, 602.97, 528.75, 554.14)}
GLIFOS = {k: letra(k, XS[k], err=0.3) for k in 'NVT'}
SCRIPT = letra('script', (), err=0.3)
I1 = (40.15, 65.40); I2 = (423.55, 448.75)

def segs_d(t, segs):
    def pt(p): return t.pt(p[0], p[1])
    first = segs[0][1] if segs[0][0] == 'L' else segs[0][1][0]
    out = ['M' + pt(first)]
    for s in segs:
        if s[0] == 'L': out.append('L' + pt(s[2]))
        else: P = s[1]; out.append('C' + pt(P[1]) + ' ' + pt(P[2]) + ' ' + pt(P[3]))
    return ''.join(out) + 'Z'

def rect_d(t, x0, y0, x1, y1):
    return f'M{t.pt(x0, y0)}L{t.pt(x1, y0)}L{t.pt(x1, y1)}L{t.pt(x0, y1)}Z'

def letras_d(t, glifos=('I1', 'N', 'V', 'I2', 'T'), mover=None):
    """mover: dict glifo -> T propia (para recolocar en el sello)."""
    d = ''
    for g in glifos:
        tt = (mover or {}).get(g, t)
        if g == 'I1': d += rect_d(tt, I1[0], TOP, I1[1], BASE)
        elif g == 'I2': d += rect_d(tt, I2[0], TOP, I2[1], BASE)
        else:
            for segs in GLIFOS[g]: d += segs_d(tt, segs)
    return d

def bbox_glifo(g):
    if g == 'I1': return (I1[0], TOP, I1[1], BASE)
    if g == 'I2': return (I2[0], TOP, I2[1], BASE)
    pts = []
    for segs in GLIFOS[g]:
        for s in segs:
            pts += [s[1], s[2]] if s[0] == 'L' else list(s[1])
    a = np.array(pts); return (a[:, 0].min(), a[:, 1].min(), a[:, 0].max(), a[:, 1].max())

# ---------- piezas ----------
def svg(vb, cuerpo, titulo=None, extra=''):
    t = f'<title>{titulo}</title>' if titulo else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="currentColor"{extra}>{t}{cuerpo}</svg>\n'

def pieza_palabra(color='currentColor', titulo='Invitoo'):
    x0, y0 = 40.15, 30.4
    t = T(1, -x0, -y0, 1)
    d1 = letras_d(t)
    d2 = ''.join(alianzas(t))
    d3 = poligono_d(t, brillante_logo())
    w, h = 917.48 - x0, 249.63 - y0
    cuerpo = f'<path d="{d1}"/><path d="{d2}"/><path d="{d3}"/>'
    return svg(f'0 0 {f(w,1)} {f(h,1)}', cuerpo, titulo).replace('fill="currentColor"', f'fill="{color}"'), (w, h)

def pieza_lockup(color='currentColor', titulo='Invitoo · Invitaciones digitales'):
    # caligrafía: misma posición relativa que en el original
    xs = []; ys = []
    for segs in SCRIPT:
        for s in segs:
            for p in ([s[1], s[2]] if s[0] == 'L' else list(s[1])): xs.append(p[0]); ys.append(p[1])
    x0, y0 = 40.15, 30.4
    x1, y1 = max(917.48, max(xs)), max(ys)
    t = T(1, -x0, -y0, 1)
    d1 = letras_d(t); d2 = ''.join(alianzas(t)); d3 = poligono_d(t, brillante_logo())
    d4 = ''.join(segs_d(t, s) for s in SCRIPT)
    cuerpo = f'<path d="{d1}"/><path d="{d2}"/><path d="{d3}"/><path fill-rule="evenodd" d="{d4}"/>'
    return svg(f'0 0 {f(x1-x0,1)} {f(y1-y0+0.6,1)}', cuerpo, titulo).replace('fill="currentColor"', f'fill="{color}"', 1)

def pieza_aros(color='currentColor', titulo='Invitoo', simple=False, w=W, hueco=0.0, pad=0.0):
    x0, y0 = L['c'][0] - L['r'][1] - W / 2 - pad, 30.4 - pad
    x1, y1 = R['c'][0] + R['r'][1] + W / 2 + pad, R['c'][1] + R['r'][1] + W / 2 + pad
    t = T(1, -x0, -y0, 2)
    d2 = ''.join(alianzas(t, w=w, simple=simple, hueco=hueco)); d3 = poligono_d(t, brillante_logo())
    cuerpo = f'<path d="{d2}"/><path d="{d3}"/>'
    return svg(f'0 0 {f(x1-x0,1)} {f(y1-y0,1)}', cuerpo, titulo).replace('fill="currentColor"', f'fill="{color}"'), (x0, y0, x1 - x0, y1 - y0)

# --- sello: medidas tomadas de logo/logo invitoo.png (500 px) ---
SELLO_C = (249.42, 274.2)
SELLO_BB = {  # caja (x0,y0,x1,y1) subpíxel de cada letra en el sello
    'I1': (186.64, 90.0, 203.68, 207.6), 'N': (229.48, 89.3, 312.4, 208.6),
    'V': (184.4, 212.9, 275.4, 329.5), 'I2': (293.7, 212.9, 310.44, 328.6),
    'T': (118.0, 331.6, 190.3, 433.0)}
SELLO_O = [((244.40, 382.0), (40.31, 52.165), (24.51, 50.91)), ((340.40, 382.0), (40.31, 52.165), (24.51, 50.91))]

def elipse(t, c, rx, ry, inv=False):
    cx, cy = c; s = 0 if inv else 1
    return (f'M{t.pt(cx + rx, cy)}A{t.r(rx)} {t.r(ry)} 0 1 {s} {t.pt(cx - rx, cy)}'
            f'A{t.r(rx)} {t.r(ry)} 0 1 {s} {t.pt(cx + rx, cy)}Z')

def pieza_sello(color='currentColor', titulo='Invitoo'):
    t = T(1, 0, 0, 2)
    mover = {}
    for g, (a, b, c, d) in SELLO_BB.items():
        gx0, gy0, gx1, gy1 = bbox_glifo(g)
        s = (d - b) / (BASE - TOP)          # escala por la altura de mayúscula
        cxs, cxg = (a + c) / 2, (gx0 + gx1) / 2
        mover[g] = T(s, cxs - cxg * s, b - TOP * s, 2)
    d1 = letras_d(t, ('I1', 'N', 'V', 'I2', 'T'), mover)
    for c, (rx, ry), (rx2, ry2) in SELLO_O:
        d1 += elipse(t, c, rx, ry) + elipse(t, c, rx2, ry2, inv=True)
    cx, cy = SELLO_C
    d2 = anillo(t, SELLO_C, 211.2, 213.2) + anillo(t, SELLO_C, 201.7, 203.7)
    d3 = poligono_d(t, brillante_sello())
    cuerpo = f'<path d="{d1}"/><path d="{d2}"/><path d="{d3}"/>'
    return svg('0 0 500 500', cuerpo, titulo).replace('fill="currentColor"', f'fill="{color}"')

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/web/qa/v3/m1/trabajo/piezas'
    os.makedirs(out, exist_ok=True)
    p, wh = pieza_palabra(); open(f'{out}/palabra.svg', 'w').write(p); print('palabra', wh, len(p))
    p = pieza_lockup(); open(f'{out}/lockup.svg', 'w').write(p); print('lockup', len(p))
    p, bb = pieza_aros(); open(f'{out}/aros.svg', 'w').write(p); print('aros', bb, len(p))
    p = pieza_sello(); open(f'{out}/sello.svg', 'w').write(p); print('sello', len(p))

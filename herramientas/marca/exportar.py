"""Exporta todas las piezas de marca a app/public/marca y los iconos de la app."""
import os, sys, re, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import logo
from logo import T, f, alianzas, poligono_d, brillante_logo, L, R, W, svg

APP = '/home/claude/web/app'
M = f'{APP}/public/marca'
TMP = os.environ.get('TMPDIR', '/tmp') + '/invitoo-marca'; os.makedirs(TMP, exist_ok=True)
COLORES = {'tinta': '#12100E', 'papel': '#FAF8F5', 'oro': '#B08D57', 'granate': '#8C1D2C'}
os.makedirs(f'{M}/variantes', exist_ok=True)

def guarda(ruta, txt):
    open(ruta, 'w').write(txt); return len(txt.encode())

def aros_simple_d(t, hueco=7.0):
    return ''.join(alianzas(t, simple=True, hueco=hueco)) , poligono_d(t, brillante_logo(w=6.5))

def caja_aros(pad=0):
    x0, y0 = L['c'][0] - L['r'][1] - W / 2 - pad, 30.4 - pad
    x1, y1 = R['c'][0] + R['r'][1] + W / 2 + pad, R['c'][1] + R['r'][1] + W / 2 + pad
    return x0, y0, x1, y1

def aros_simple_svg(color='currentColor'):
    x0, y0, x1, y1 = caja_aros()
    t = T(1, -x0, -y0, 1)
    a, b = aros_simple_d(t)
    return svg(f'0 0 {f(x1-x0,1)} {f(y1-y0,1)}', f'<path d="{a}"/><path d="{b}"/>', 'Invitoo').replace('fill="currentColor"', f'fill="{color}"')

def icono_svg(fondo='#8C1D2C', tinta='#FAF8F5', lado=512, radio=0.22, margen=0.16, redondo=True, simple=True):
    """Icono cuadrado: monograma centrado sobre una loseta."""
    x0, y0, x1, y1 = caja_aros()
    w, h = x1 - x0, y1 - y0
    util = lado * (1 - 2 * margen)
    s = util / max(w, h)
    dx = (lado - w * s) / 2 - x0 * s
    dy = (lado - h * s) / 2 - y0 * s + lado * 0.012
    t = T(s, dx, dy, 1)
    if simple: a, b = aros_simple_d(t)
    else: a, b = ''.join(alianzas(t)), poligono_d(t, brillante_logo())
    rr = f' rx="{f(lado*radio,1)}"' if redondo else ''
    fondo_el = f'<rect width="{lado}" height="{lado}"{rr} fill="{fondo}"/>' if fondo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}">{fondo_el}'
            f'<g fill="{tinta}"><path d="{a}"/><path d="{b}"/></g></svg>\n')

def relieve_svg():
    """Para X1: monograma negro sobre transparente, viewBox cuadrado, sin texto (mapa de alturas del lacre)."""
    x0, y0, x1, y1 = caja_aros()
    w, h = x1 - x0, y1 - y0; lado = max(w, h) * 1.12
    t = T(1, -x0 + (lado - w) / 2, -y0 + (lado - h) / 2, 2)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(lado,1)} {f(lado,1)}" fill="#000">'
            f'<path d="{"".join(alianzas(t))}"/><path d="{poligono_d(t, brillante_logo())}"/></svg>\n')

if __name__ == '__main__':
    pesos = {}
    p, _ = logo.pieza_palabra(); pesos['palabra.svg'] = guarda(f'{M}/palabra.svg', p)
    pesos['lockup.svg'] = guarda(f'{M}/lockup.svg', logo.pieza_lockup())
    p, _ = logo.pieza_aros(); pesos['aros.svg'] = guarda(f'{M}/aros.svg', p)
    pesos['sello.svg'] = guarda(f'{M}/sello.svg', logo.pieza_sello())
    pesos['aros-simple.svg'] = guarda(f'{M}/aros-simple.svg', aros_simple_svg())
    pesos['alianzas-relieve.svg'] = guarda(f'{M}/alianzas-relieve.svg', relieve_svg())
    for nombre, col in COLORES.items():
        p, _ = logo.pieza_palabra(col); guarda(f'{M}/variantes/palabra-{nombre}.svg', p)
        guarda(f'{M}/variantes/lockup-{nombre}.svg', logo.pieza_lockup(col))
        p, _ = logo.pieza_aros(col); guarda(f'{M}/variantes/aros-{nombre}.svg', p)
        guarda(f'{M}/variantes/sello-{nombre}.svg', logo.pieza_sello(col))
        guarda(f'{M}/variantes/aros-simple-{nombre}.svg', aros_simple_svg(col))
    # iconos
    guarda(f'{APP}/src/app/icon.svg', icono_svg(lado=64, margen=0.13))
    guarda(f'{M}/icono.svg', icono_svg())
    guarda(TMP+'/_ic_full.svg', icono_svg(radio=0, redondo=False))             # apple/pwa (sin esquinas: el SO las redondea)
    guarda(TMP+'/_ic_mask.svg', icono_svg(radio=0, redondo=False, margen=0.24))  # maskable: zona segura 80 %
    guarda(TMP+'/_ic_fav.svg', icono_svg(lado=64, margen=0.10))
    for k, v in pesos.items(): print(f'{k:24s} {v:6d} B')

"""Genera los trazados de SelloAlianzas.tsx en su viewBox histórico de 300 × 212."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from logo import T, alianzas, poligono_d, brillante_logo
from exportar import caja_aros
x0, y0, x1, y1 = caja_aros()
w, h = x1 - x0, y1 - y0
s = min(300 / w, 212 / h)
t = T(s, -x0 * s + (300 - w * s) / 2, -y0 * s + (212 - h * s) / 2, 1)
fino = ''.join(alianzas(t)); bri = poligono_d(t, brillante_logo())
grueso = ''.join(alianzas(t, simple=True, hueco=7.0)); bri2 = poligono_d(t, brillante_logo(w=6.5))
# centro de giro: entre los dos aros
from logo import L, R
cx = ((L['c'][0] + R['c'][0]) / 2) * s + t.dx; cy = L['c'][1] * s + t.dy
print(f'FINO={fino!r}\nBRI={bri!r}\nGRUESO={grueso!r}\nBRI2={bri2!r}\nCX={cx:.1f}\nCY={cy:.1f}')
import json; json.dump(dict(fino=fino, bri=bri, grueso=grueso, bri2=bri2, cx=round(cx,1), cy=round(cy,1)), open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'sello_tsx.json'),'w'))

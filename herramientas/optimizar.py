"""
Compacta el `d` de un SVG trazado: coordenadas relativas, una decimal,
corrección de deriva y sin separadores de más. Un `l` relativo son 2–4
caracteres frente a los 11–13 de un `L` absoluto, y comprime mucho mejor.
"""
import re, sys

def num(v):
    s = f"{v:.1f}".rstrip("0").rstrip(".")
    if s in ("", "-0", "-"): s = "0"
    return s

def compactar(d):
    fuera = []
    for sub in d.split("Z"):
        pts = [(float(a), float(b)) for a, b in
               re.findall(r"[ML](-?[\d.]+) (-?[\d.]+)", sub)]
        if len(pts) < 3:
            continue
        x0, y0 = pts[0]
        trozo = ["M" + num(x0) + "," + num(y0)]
        # cx/cy siguen la posición REAL tras redondear, para que el error
        # no se vaya acumulando a lo largo del contorno
        cx, cy = float(num(x0)), float(num(y0))
        ultimo = None
        for x, y in pts[1:]:
            dx, dy = x - cx, y - cy
            sdx, sdy = num(dx), num(dy)
            if sdx == "0" and sdy == "0":
                continue
            if sdy == "0":
                cmd, arg = "h", sdx
            elif sdx == "0":
                cmd, arg = "v", sdy
            else:
                cmd, arg = "l", sdx + "," + sdy
            pieza = arg if cmd == ultimo else cmd + arg
            # separador obligatorio si el token anterior acaba en dígito o
            # punto y éste empieza por dígito o punto: "h0.6" + "0.3" sería
            # ambiguo de leer (y algunos parsers lo rechazan).
            if trozo and trozo[-1][-1] in "0123456789." and pieza[0] in "0123456789.":
                trozo.append(" ")
            trozo.append(pieza)
            ultimo = cmd
            cx += float(sdx); cy += float(sdy)
        fuera.append("".join(trozo) + "Z")
    # un espacio solo donde hace falta separar dos números
    return "".join(fuera).replace("Z", "Z")

ent, sal = sys.argv[1], sys.argv[2]
svg = open(ent, encoding="utf-8").read()
d = re.search(r'd="([^"]+)"', svg).group(1)
nd = compactar(d)
# separar argumentos consecutivos del mismo comando: "1.2,3h4" está bien,
# pero "0.5,10.5,2" necesita el espacio implícito de la coma; ya lo lleva.
svg = svg.replace(d, nd)
open(sal, "w", encoding="utf-8").write(svg)
print(f"{sal}: {len(svg)} bytes")

"""Lacre de cera vectorial: borde irregular (Catmull-Rom -> Bézier), volumen con degradados, sello prensado."""
import math, numpy as np, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
def borde(seed=7, n=28, r=100, amp=0.06):
    rng = np.random.default_rng(seed)
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False) + rng.uniform(-0.06, 0.06, n)
    rad = r * (1 + amp * rng.standard_normal(n) * 0.6 + 0.03 * np.sin(3 * ang + 1))
    P = np.c_[np.cos(ang) * rad, np.sin(ang) * rad]
    d = f'M{P[0,0]:.1f} {P[0,1]:.1f}'
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d += f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    return d + 'Z'
if __name__ == '__main__':
    print(json.dumps({'borde': borde(), 'gota': borde(seed=11, n=9, r=12, amp=0.2)}))

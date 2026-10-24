import numpy as np
from bezier import bez
def sample_path(p, step=0.25):
    """Muestrea densamente un trazado de potrace -> lista de (puntos, es_esquina)"""
    cur=np.array(p['start']); pts=[cur]; corner=[False]
    for s in p['segs']:
        if s[0]=='C':
            c=np.array(s[1]); e=np.array(s[2])
            for a,b in ((cur,c),(c,e)):
                n=max(2,int(np.hypot(*(b-a))/step))
                for t in np.linspace(0,1,n)[1:]:
                    pts.append(a+(b-a)*t); corner.append(False)
            # la esquina está en c
            k=len(pts)-1-(n-1); corner[k]=True
            cur=e
        else:
            P=np.array([cur,s[1],s[2],s[3]])
            L=sum(np.hypot(*(P[i+1]-P[i])) for i in range(3))
            n=max(3,int(L/step))
            for q in bez(P,np.linspace(0,1,n)[1:]): pts.append(q); corner.append(False)
            cur=np.array(s[3])
    return np.array(pts[:-1]),np.array(corner[:-1])

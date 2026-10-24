"""Ajuste de curvas Bézier cúbicas (algoritmo de Schneider, Graphics Gems I) y utilidades."""
import numpy as np

def bez(P,t):
    t=np.asarray(t)[:,None]; mt=1-t
    return mt**3*P[0]+3*mt**2*t*P[1]+3*mt*t**2*P[2]+t**3*P[3]
def bez1(P,t):
    t=np.asarray(t)[:,None]; mt=1-t
    return 3*mt**2*(P[1]-P[0])+6*mt*t*(P[2]-P[1])+3*t**2*(P[3]-P[2])
def bez2(P,t):
    t=np.asarray(t)[:,None]
    return 6*(1-t)*(P[2]-2*P[1]+P[0])+6*t*(P[3]-2*P[2]+P[1])

def chord_param(pts):
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]
    return d/d[-1] if d[-1]>0 else d

def gen_bez(pts,u,t1,t2):
    p0,p3=pts[0],pts[-1]
    A1=u[:,None]*0+t1*(3*(1-u)**2*u)[:,None]
    A2=t2*(3*(1-u)*u**2)[:,None]
    C=np.zeros((2,2)); X=np.zeros(2)
    C[0,0]=(A1*A1).sum(); C[0,1]=C[1,0]=(A1*A2).sum(); C[1,1]=(A2*A2).sum()
    tmp=pts-bez(np.array([p0,p0,p3,p3]),u)
    X[0]=(A1*tmp).sum(); X[1]=(A2*tmp).sum()
    det=C[0,0]*C[1,1]-C[0,1]*C[1,0]
    seg=np.hypot(*(p3-p0))
    if abs(det)>1e-12:
        a1=(X[0]*C[1,1]-X[1]*C[0,1])/det; a2=(C[0,0]*X[1]-C[1,0]*X[0])/det
    else: a1=a2=seg/3
    eps=1e-6*seg
    if a1<eps or a2<eps: a1=a2=seg/3
    return np.array([p0,p0+t1*a1,p3+t2*a2,p3])

def reparam(P,pts,u):
    d=bez(P,u)-pts; d1=bez1(P,u); d2=bez2(P,u)
    num=(d*d1).sum(1); den=(d1*d1+d*d2).sum(1)
    with np.errstate(divide='ignore',invalid='ignore'):
        nu=np.where(np.abs(den)>1e-12,u-num/den,u)
    return np.clip(nu,0,1)

def max_err(P,pts,u):
    e=np.hypot(*(bez(P,u)-pts).T); i=int(np.argmax(e)); return e[i],i

def unit(v):
    n=np.hypot(*v); return v/n if n>0 else v

def fit(pts,err,t1=None,t2=None,depth=0):
    pts=np.asarray(pts,float)
    if t1 is None: t1=unit(pts[min(3,len(pts)-1)]-pts[0])
    if t2 is None: t2=unit(pts[max(-4,-len(pts))]-pts[-1])
    if len(pts)==2:
        d=np.hypot(*(pts[1]-pts[0]))/3
        return [np.array([pts[0],pts[0]+t1*d,pts[1]+t2*d,pts[1]])]
    u=chord_param(pts)
    P=gen_bez(pts,u,t1,t2); e,i=max_err(P,pts,u)
    if e<err: return [P]
    if e<err*6:
        for _ in range(12):
            u=reparam(P,pts,u); P=gen_bez(pts,u,t1,t2); e,i=max_err(P,pts,u)
            if e<err: return [P]
    i=max(1,min(len(pts)-2,i))
    tc=unit(pts[i-1]-pts[i+1]) if 0<i<len(pts)-1 else unit(pts[i-1]-pts[i])
    if depth>40: return [P]
    return fit(pts[:i+1],err,t1,tc,depth+1)+fit(pts[i:],err,-tc,t2,depth+1)

def is_line(P,tol=0.08):
    a,b=P[0],P[3]; L=np.hypot(*(b-a))
    if L<1e-9: return True
    n=np.array([-(b-a)[1],(b-a)[0]])/L
    return abs(((P[1]-a)*n).sum())<tol and abs(((P[2]-a)*n).sum())<tol

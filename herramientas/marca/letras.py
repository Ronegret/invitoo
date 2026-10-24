import numpy as np, json
from bezier import fit, is_line, unit
from potrace_util import sample_path
TR=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'trazos.json')))

def corners_of(pts, win=2.0, ang=38):
    n=len(pts); d=np.r_[0,np.cumsum(np.hypot(*np.diff(np.vstack([pts,pts[:1]]),axis=0).T))]
    total=d[-1]; step=total/n
    k=max(2,int(win/step))
    a=np.zeros(n)
    for i in range(n):
        v1=pts[i]-pts[(i-k)%n]; v2=pts[(i+k)%n]-pts[i]
        c=np.dot(unit(v1),unit(v2)); a[i]=np.degrees(np.arccos(np.clip(c,-1,1)))
    cs=[]
    for i in range(n):
        if a[i]>ang and a[i]==max(a[(i+j)%n] for j in range(-k,k+1)):
            if not cs or i-cs[-1]>k: cs.append(i)
    return cs

def snap(pts, xs, ys, tol=0.9):
    pts=pts.copy()
    for x in xs: pts[np.abs(pts[:,0]-x)<tol,0]=x
    for y in ys: pts[np.abs(pts[:,1]-y)<tol,1]=y
    return pts

def fit_closed(pts, err=0.3, xs=(), ys=(), extra_corners=()):
    pts=snap(pts,xs,ys)
    cs=corners_of(pts)
    n=len(pts)
    if not cs: cs=[0]
    segs=[]
    for j,c0 in enumerate(cs):
        c1=cs[(j+1)%len(cs)]
        run=pts[c0:c1+1] if c1>c0 else np.vstack([pts[c0:],pts[:c1+1]])
        if len(run)<2: continue
        # tramo recto?
        a,b=run[0],run[-1]; L=np.hypot(*(b-a))
        if L>1:
            nrm=np.array([-(b-a)[1],(b-a)[0]])/L
            if np.abs((run-a)@nrm).max()<err*0.8:
                segs.append(('L',a,b)); continue
        for P in fit(run,err):
            segs.append(('L',P[0],P[3]) if is_line(P) else ('C',P))
    return segs

def to_d(segs, f=lambda p:p, nd=1):
    def r(v): 
        s=f'{round(v,nd):.{nd}f}'.rstrip('0').rstrip('.'); return '0' if s in('-0','') else s
    def pt(p): q=f(p); return f'{r(q[0])} {r(q[1])}'
    out=[]
    first=segs[0][1] if segs[0][0]=='L' else segs[0][1][0]
    out.append('M'+pt(first))
    for s in segs:
        if s[0]=='L': out.append('L'+pt(s[2]))
        else: P=s[1]; out.append('C'+pt(P[1])+' '+pt(P[2])+' '+pt(P[3]))
    return ''.join(out)+'Z'

TOP,BASE=60.96,234.53
def letra(nombre, xs=(), err=0.3):
    res=[]
    for p in TR[nombre]:
        pts,_=sample_path(p,0.25)
        segs=fit_closed(pts,err,xs,(TOP,BASE))
        res.append(segs)
    return res

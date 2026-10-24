"""Trazado Bézier (potrace) de las letras orgánicas del logotipo, desde el PNG de 3240 px."""
import numpy as np, cv2, json, sys, potrace
from PIL import Image
SRC='/home/claude/web/marca-origen/insta invitoo/logo largo 4.png'
X0,Y0=1150,350
im=np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
c=im[Y0:740,X0:2100]
lum=0.299*c[...,0]+0.587*c[...,1]+0.114*c[...,2]
bg=cv2.GaussianBlur(cv2.dilate(lum, np.ones((31,31),np.uint8)),(0,0),15)
def alpha(ink): return np.clip((bg-lum)/(bg-ink),0,1)
aw=alpha(79.0); asc=alpha(124.0)
m=((bg-lum)>45).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(m,8)
word=np.zeros(lab.shape,bool); scr=np.zeros(lab.shape,bool)
for i in range(1,n):
    if st[i,4]<15: continue
    px=c[lab==i]
    if (px[:,2]-px[:,1]).mean()<3: word|=lab==i
    else: scr|=lab==i
# máscara dilatada para no perder el antialias del borde
def region(mask): return cv2.dilate(mask.astype(np.uint8),np.ones((5,5),np.uint8))>0
S=8
def trace(A, mask, box, alphamax=1.15, opttol=2.5, thr=0.5, close=0):
    x0,y0,x1,y1=box
    sub=(A*region(mask))[y0:y1,x0:x1]
    if close: sub=cv2.morphologyEx(sub,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(close,close)))
    up=cv2.resize(sub,None,fx=S,fy=S,interpolation=cv2.INTER_CUBIC)
    up=cv2.GaussianBlur(up,(0,0),S*0.4)
    bm=potrace.Bitmap(up<=thr)
    pl=bm.trace(turdsize=S*S*4,alphamax=alphamax,opticurve=True,opttolerance=opttol)
    out=[]
    for curve in pl:
        segs=[]
        sp=curve.start_point
        start=((sp.x/S)+x0,(sp.y/S)+y0)
        for s in curve.segments:
            if s.is_corner:
                segs.append(('C',(s.c.x/S+x0,s.c.y/S+y0),(s.end_point.x/S+x0,s.end_point.y/S+y0)))
            else:
                segs.append(('B',(s.c1.x/S+x0,s.c1.y/S+y0),(s.c2.x/S+x0,s.c2.y/S+y0),(s.end_point.x/S+x0,s.end_point.y/S+y0)))
        out.append({'start':start,'segs':segs})
    return out
res={}
res['N']=trace(aw,word,(95,50,235,245))
res['V']=trace(aw,word,(250,50,400,245))
res['T']=trace(aw,word,(470,50,606,245))
res['script']=trace(asc,scr,(120,240,840,390),alphamax=1.1,opttol=1.5,thr=0.42,close=3)
json.dump(res,open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'trazos.json'),'w'))
print({k:(len(v),sum(len(p['segs']) for p in v)) for k,v in res.items()})

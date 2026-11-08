# Knit-style "HO HO HOLA" ugly sweater chest panel: 4 colors only (Printful knitwear max), stitch grid.
import sys
from PIL import Image, ImageDraw, ImageFont
OUT=sys.argv[1]
W,H=180,150                      # stitches
RED,WHITE,GREEN,GOLD=(170,30,40),(245,241,232),(31,94,58),(232,184,72)
g=Image.new('RGB',(W,H),RED); d=ImageDraw.Draw(g)
def band(y0,c1,c2):
    for x in range(W):
        for k in range(6):
            if abs((x%12)-6)==k or abs((x%12)-6)==k-1: g.putpixel((x,y0+k),c1)
    d.line([(0,y0-1),(W,y0-1)],fill=c2); d.line([(0,y0+6),(W,y0+6)],fill=c2)
def flake(cx,cy,c):
    for i in range(-3,4):
        g.putpixel((cx+i,cy),c); g.putpixel((cx,cy+i),c)
        if abs(i)<=2: g.putpixel((cx+i,cy+i),c); g.putpixel((cx+i,cy-i),c)
def tree(cx,cy,c,t):
    for r in range(8):
        for x in range(cx-r//1,cx+r+1):
            if 0<=x<W: g.putpixel((x,cy+r),c)
    for y in range(cy+8,cy+10): g.putpixel((cx,y),t)
    g.putpixel((cx,cy-1),GOLD)
band(6,WHITE,GOLD); band(H-13,WHITE,GOLD)
for x in range(12,W,26): flake(x,24,WHITE)
for x in range(12,W,26): tree(x,H-34,GREEN,WHITE)
def text(s,y,size):
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',size)
    m=Image.new('L',(W,size+6),0); md=ImageDraw.Draw(m)
    w=md.textlength(s,font=f); md.text(((W-w)/2,0),s,font=f,fill=255)
    m=m.point(lambda v:255 if v>110 else 0)
    # 1-stitch green outline then white letters
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            g.paste(GREEN,(dx,y+dy),m)
    g.paste(WHITE,(0,y),m)
text('HO HO',38,30); text('¡HOLA!',74,30)
g.save(f'{OUT}/ugly-sweater_ho-ho-hola_STITCH-GRID_180x150.png')
big=g.resize((W*20,H*20),Image.NEAREST); big.save(f'{OUT}/ugly-sweater_ho-ho-hola_3600x3000.png',dpi=(300,300))
print('colors used:',len(g.getcolors()))

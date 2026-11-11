# Per-size Printful knitwear files for the "HO HO ¡HOLA!" sweater. Exactly 4 Printful yarn colors.
import sys,json
from PIL import Image, ImageDraw, ImageFont
OUT=sys.argv[1]
RED,WHITE,GREEN,GOLD=(0xd5,0x22,0x13),(0xfd,0xfa,0xfa),(0x24,0x3f,0x33),(0xdd,0xa0,0x32)
SIZES={'S':(446,570),'M':(400,622),'L':(451,634),'XL':(460,648),'2XL':(483,667),'3XL':(511,675)}
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def front(W,H):
    g=Image.new('RGB',(W,H),RED); px=g.load()
    def band(y0):
        for x in range(W):
            for y in range(y0,y0+6):
                if abs((x%12)-6) in (y-y0,y-y0-1): px[x,y]=WHITE
        for x in range(W): px[x,y0-2]=GOLD; px[x,y0+7]=GOLD
    def flake(cx,cy):
        for i in range(-3,4):
            for (a,b) in ((cx+i,cy),(cx,cy+i)) : px[a,b]=WHITE
            if abs(i)<=2: px[cx+i,cy+i]=WHITE; px[cx+i,cy-i]=WHITE
    def tree(cx,cy):
        for r in range(8):
            for x in range(cx-r,cx+r+1):
                if 0<=x<W: px[x,cy+r]=GREEN
        px[cx,cy+8]=WHITE; px[cx,cy+9]=WHITE; px[cx,cy-1]=GOLD
    top=int(H*0.36); tw=int(W*0.52)
    band(top)
    for x in range(10,W-6,24): flake(x,top+18)
    def text(s,y,maxw):
        size=10
        while True:
            f=ImageFont.truetype(FONT,size+1)
            if ImageDraw.Draw(Image.new('L',(1,1))).textlength(s,font=f)>maxw: break
            size+=1
        f=ImageFont.truetype(FONT,size); m=Image.new('L',(W,size+8),0); d=ImageDraw.Draw(m)
        w=d.textlength(s,font=f); d.text(((W-w)/2,0),s,font=f,fill=255); m=m.point(lambda v:255 if v>110 else 0)
        for dx in (-1,0,1):
            for dy in (-1,0,1): g.paste(GREEN,(dx,y+dy),m)
        g.paste(WHITE,(0,y),m); return size
    s1=text('HO HO',top+32,tw)
    s2=text('¡HOLA!',top+32+int(s1*1.15),tw)
    ty=top+32+int(s1*1.15)+int(s2*1.15)+6
    for x in range(12,W-8,26): tree(x,ty)
    band(ty+16)
    assert len(g.getcolors())==4, g.getcolors()
    return g
for s,(W,H) in SIZES.items():
    front(W,H).save(f'{OUT}/ho-ho-hola_front_{s}.png')
    Image.new('RGB',(W,H),RED).save(f'{OUT}/solid-chili_{s}.png')
print('ok')

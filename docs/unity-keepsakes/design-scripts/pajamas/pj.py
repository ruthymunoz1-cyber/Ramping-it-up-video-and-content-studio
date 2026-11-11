import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
FONTS='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@700;800&family=Fredoka:wght@700&display=swap" rel="stylesheet">'
HAT='''<svg viewBox="0 0 200 150" width="{w}"><path d="M30 120 Q60 20 150 25 Q185 30 178 75 Q160 50 120 60 Q80 75 70 120 Z" fill="{hat}"/>
<rect x="15" y="112" width="130" height="30" rx="15" fill="{fur}"/><circle cx="178" cy="80" r="17" fill="{fur}"/></svg>'''
def design(W,H,role,sub,txt,acc,hat,fur,scale=1.0,bg='transparent',top=None):
    s=lambda v:int(v*scale)
    return f'''<html><head>{FONTS}<style>html,body{{margin:0;background:transparent}}.c{{width:{W}px;height:{H}px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:{'flex-start' if top is not None else 'center'};text-align:center;overflow:hidden}}</style></head><body><div class="c">
<div style="height:{top or 0}px"></div>{HAT.format(w=s(420),hat=hat,fur=fur)}
<div style="font-family:'Great Vibes';font-size:{s(420)}px;line-height:.9;color:{txt};margin-top:{s(-40)}px">{role}</div>
<div style="font-family:Fredoka;font-weight:700;font-size:{s(330)}px;line-height:1;letter-spacing:{s(20)}px;color:{txt}">{sub}</div>
<div style="font-family:Montserrat;font-weight:800;font-size:{s(70)}px;letter-spacing:{s(18)}px;color:{acc};margin-top:{s(40)}px">FELIZ NAVIDAD · 2026</div></div></body></html>'''
ON={'white':dict(txt='#b3202a',acc='#1f5e3a',hat='#b3202a',fur='#e9e2d0'),'red':dict(txt='#ffffff',acc='#f4d35e',hat='#1f5e3a',fur='#ffffff')}
J={}
roles=[('mama','Mamá','CLAUS'),('papa','Papá','CLAUS'),('abuela','Abuela','CLAUS'),('abuelo','Abuelo','CLAUS')]
for k,r,sb in roles:
    for c,p in ON.items(): J[f'adult_{k}_{c}']=(1800,2400,design(1800,2400,r,sb,scale=1.0,top=150,**p))
for k,r,sb in [('duendecito','Duendecito','LITTLE ELF'),('duendecita','Duendecita','LITTLE ELF')]:
    for c,p in ON.items(): J[f'youth_{k}_{c}']=(1500,1800,design(1500,1800,r,sb,scale=.72,top=100,**p))
J['baby_bebe_white']=(1050,1200,design(1050,1200,'Bebé','CLAUS',scale=.55,top=60,**ON['white']))
J['bandana_perrito']=(4650,2475,design(4650,2475,'Perrito','CLAUS',scale=1.15,bg='#b3202a',top=40,**ON['red']))
for k,(w,h,html) in J.items(): open(f'{OUT}/html/{k}.html','w').write(html)
json.dump({k:[w,h] for k,(w,h,_) in J.items()},open(f'{OUT}/jobs.json','w'))

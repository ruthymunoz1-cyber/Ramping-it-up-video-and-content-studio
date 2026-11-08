import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
FONTS='<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,500&family=Montserrat:wght@500&family=Noto+Serif+SC:wght@600&family=Noto+Serif+JP:wght@600&family=Noto+Serif+KR:wght@600&family=Noto+Naskh+Arabic:wght@600&family=Noto+Serif+Devanagari:wght@600&display=swap" rel="stylesheet">'
STACK="'Playfair Display','Noto Serif SC','Noto Serif JP','Noto Serif KR','Noto Naskh Arabic','Noto Serif Devanagari',serif"
BOKEH="radial-gradient(circle at 18% 22%,#ffffff99 0 26px,transparent 28px),radial-gradient(circle at 80% 18%,#ffffff77 0 40px,transparent 42px),radial-gradient(circle at 85% 75%,#ffffff88 0 22px,transparent 24px),radial-gradient(circle at 12% 80%,#ffffff66 0 34px,transparent 36px),radial-gradient(circle at 50% 8%,#ffffff55 0 18px,transparent 20px),radial-gradient(circle at 30% 92%,#ffffff55 0 20px,transparent 22px)"
DOTS="radial-gradient(#ffffff55 6px,transparent 7px)"
RAINBOW="conic-gradient(#ff6b6b,#ffb347,#ffe66d,#7bd389,#4fc3f7,#9575cd,#f06292,#ff6b6b)"
C={ # name: (group, background, ring(css bg for ring), text, accent, overlay)
 'navy-gold':('Christmas','radial-gradient(circle at 50% 40%,#16405a,#0b2233)','#d9b56b','#f3e6c4','#e8c77d',DOTS),
 'cranberry-gold':('Christmas','radial-gradient(circle at 50% 40%,#9c1f33,#580d19)','#d9b56b','#f8e8c8','#e8c77d',DOTS),
 'evergreen-gold':('Christmas','radial-gradient(circle at 50% 40%,#21603f,#0e3121)','#d9b56b','#f3e6c4','#e8c77d',DOTS),
 'snow-silver':('Christmas','radial-gradient(circle at 50% 40%,#ffffff,#dde6ee)','#8e9cab','#24384c','#8e9cab',"radial-gradient(#9fb3c655 6px,transparent 7px)"),
 'cream-classic':('Christmas','#f7f1e5','#2f5d3a','#8c1d2b','#2f5d3a',None),
 'blush-rosegold':('Modern','radial-gradient(circle at 50% 40%,#fae6e1,#ecbdb3)','#b76e5d','#5e2a26','#b76e5d',BOKEH),
 'pastel-iridescent':('Rainbow & fun','radial-gradient(circle at 50% 45%,#ffffffcc,#ffffff00 60%),linear-gradient(135deg,#ffc8dd,#ffdfba,#fff5ba,#c1f0d6,#bde0fe,#d7c6f5)','#ffffff','#3d2352','#7a4fa3',BOKEH),
 'bold-rainbow':('Rainbow & fun','radial-gradient(circle at 50% 50%,#ffffffd9 0 900px,#ffffff00 1150px),linear-gradient(160deg,#ff5f6d,#ffa64d,#ffd84d,#5fd38d,#3fa9f5,#8e6cf0)','#ffffff','#2b1847','#6a3fa0',BOKEH),
 'frosted-ice':('Rainbow & fun','radial-gradient(circle at 50% 40%,#f4fbff,#bfe3f5 70%,#9dd0ec)','#ffffff','#1d4e6e','#4a90b8',BOKEH),
 'midnight-holo':('Rainbow & fun','radial-gradient(circle at 30% 30%,#3b2a6b,#1b1638 55%,#0d2b3a)',RAINBOW,'#f4ecff','#c9b6ff',DOTS),
 'CLEAR-ACRYLIC-gold':('Clear acrylic','transparent','#c99a3c','#6e4f16','#c99a3c',None),
 'CLEAR-ACRYLIC-rainbow':('Clear acrylic','transparent',RAINBOW,'#5b2a86','#9575cd',None),
}
S=[('外婆 &amp; 我','我们的第一个圣诞节'),('Mi Abuelita','Feliz Navidad'),('우리 가족','메리 크리스마스'),('عائلتنا','عيد ميلاد مجيد'),
   ('हमारा परिवार','क्रिसमस की शुभकामनाएँ'),('Notre Famille','Joyeux Noël'),('Gia Đình Mình','Giáng Sinh An Lành'),('私たちの家族','メリークリスマス'),
   ('Unsere Familie','Frohe Weihnachten'),('Pamilya Namin','Maligayang Pasko'),('Наша семья','С Рождеством'),('Nossa Família','Feliz Natal')]
def page(name,sample):
    g,bg,ring,txt,acc,ov=C[name]
    l1,l2=sample if sample else ('','')
    shadow=''
    frost='<div class="frost"></div>' if name.startswith('CLEAR') else ''
    return f'''<html><head>{FONTS}<style>html,body{{margin:0;background:transparent}}
.c{{width:3000px;height:3000px;background:{bg};position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:{txt};{shadow}}}
.ov{{position:absolute;inset:0;background-image:{ov or 'none'};background-size:{'260px 260px' if ov in (DOTS,) or (ov and ov.startswith('radial-gradient(#9f')) else 'auto'};opacity:.45}}
.ring{{position:absolute;inset:330px;border-radius:50%;background:{ring};-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 16px),#000 calc(100% - 15px))}}
.ring2{{position:absolute;inset:395px;border-radius:50%;background:{ring};opacity:.55;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px))}}
.frost{{position:absolute;inset:420px;border-radius:50%;background:radial-gradient(circle,#ffffffeb 0 60%,#ffffffb0 100%)}}
.star{{font-size:150px;color:{acc};position:absolute;top:470px;width:100%}}
.yr{{font-family:Montserrat;font-size:110px;letter-spacing:22px;color:{acc};position:absolute;bottom:500px;width:100%}}
.l1,.l2{{position:relative}}
.l1{{font-family:{STACK};font-weight:600;font-size:250px;line-height:1.25;max-width:1900px}}
.l2{{font-family:{STACK};font-style:italic;font-weight:500;font-size:140px;margin-top:40px;opacity:.9;max-width:1900px}}
</style></head><body><div class="c"><div class="ov"></div><div class="ring"></div><div class="ring2"></div>{frost}<div class="star">✦</div>
<div class="l1">{l1}</div><div class="l2">{l2}</div><div class="yr">2026</div></div></body></html>'''
jobs=[]
for i,n in enumerate(C):
    open(f'{OUT}/html/BASE_{n}.html','w').write(page(n,None)); jobs.append(('BASE_'+n,n))
    open(f'{OUT}/html/SAMPLE_{n}.html','w').write(page(n,S[i])); jobs.append(('SAMPLE_'+n,n))
json.dump(jobs,open(OUT+'/jobs.json','w'))

# Batch 5: kids bilingual placemats, "Mis Colores" board book, faith keepsake ornaments (bautizo, comunión, XV años),
# pet memorial ornament, "No Sabo Kid" tee. Faith items: no humor; owner approves.
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True); J=[]
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Montserrat:wght@500;700;800&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">'
def page(name,w,h,body,transparent=False):
    open(f'{OUT}/html/{name}.html','w').write(f'<html><head>{F}<style>html,body{{margin:0;width:{w//2}px;height:{h//2}px;overflow:hidden;background:transparent}}*{{box-sizing:border-box}}</style></head><body><div style="position:relative;width:{w}px;height:{h}px;zoom:.5">{body}</div></body></html>')
    J.append(dict(name=name,w=w,h=h,transparent=transparent))
COL=[('Rojo','Red','#e23b3b'),('Azul','Blue','#2f6fd6'),('Amarillo','Yellow','#f5c518'),('Verde','Green','#2fa84f'),('Anaranjado','Orange','#f28a1d'),
     ('Morado','Purple','#8a4fc7'),('Rosado','Pink','#f27fb2'),('Marrón','Brown','#8b5a2b'),('Negro','Black','#222222'),('Blanco','White','#ffffff')]
# ---- Placemats (Printful 1400, 2925x2325) ----
PW,PH=2925,2325
cells=''.join(f'<div style="display:flex;flex-direction:column;align-items:center"><div style="width:400px;height:400px;border-radius:50%;background:{c};border:10px solid #2b2b2b22"></div><div style="font-family:Fredoka;font-weight:700;font-size:120px;color:#2b2b2b;margin-top:24px">{es}</div><div style="font-family:Fredoka;font-weight:500;font-size:72px;color:#777">{en}</div></div>' for es,en,c in COL)
page('mat_colores',PW,PH,f'''<div style="position:absolute;inset:0;background:#fff8ec"></div><div style="position:absolute;inset:70px;border:14px dashed #f2b84b;border-radius:60px"></div>
<div style="position:absolute;top:150px;left:0;right:0;text-align:center;font-family:Fredoka;font-weight:700;font-size:170px;color:#2f6fd6">Los Colores <span style="color:#f28a1d">·</span> <span style="color:#e23b3b">Colors</span></div>
<div style="position:absolute;left:200px;right:200px;top:520px;display:grid;grid-template-columns:repeat(5,1fr);row-gap:110px">{cells}</div>''')
NUM=[('uno','one'),('dos','two'),('tres','three'),('cuatro','four'),('cinco','five'),('seis','six'),('siete','seven'),('ocho','eight'),('nueve','nine'),('diez','ten')]
dots=lambda n,c:''.join(f'<span style="display:inline-block;width:44px;height:44px;border-radius:50%;background:{c};margin:5px"></span>' for _ in range(n))
ncells=''.join(f'<div style="display:flex;flex-direction:column;align-items:center;text-align:center"><div style="font-family:Fredoka;font-weight:700;font-size:300px;line-height:1;color:{COL[i][2] if i not in (2,9) else "#e0a800" if i==2 else "#2b2b2b"}">{i+1}</div><div style="width:300px;min-height:120px;margin:10px 0">{dots(i+1,COL[i][2] if i!=9 else "#2b2b2b")}</div><div style="font-family:Fredoka;font-weight:700;font-size:110px;color:#2b2b2b">{es}</div><div style="font-family:Fredoka;font-weight:500;font-size:66px;color:#777">{en}</div></div>' for i,(es,en) in enumerate(NUM))
page('mat_numeros',PW,PH,f'''<div style="position:absolute;inset:0;background:#f1f8ff"></div><div style="position:absolute;inset:70px;border:14px dashed #7fb2f0;border-radius:60px"></div>
<div style="position:absolute;top:150px;left:0;right:0;text-align:center;font-family:Fredoka;font-weight:700;font-size:170px;color:#2fa84f">Los Números <span style="color:#f5c518">·</span> <span style="color:#8a4fc7">Numbers</span></div>
<div style="position:absolute;left:200px;right:200px;top:460px;display:grid;grid-template-columns:repeat(5,1fr);row-gap:70px">{ncells}</div>''')
# ---- Board book (Printful 1556): cover 3863x1875 (back|spine|front), spreads 3675x1875 (left|right page) ----
BW,BH=3863,1875; SW,SH=3675,1875
page('book_cover',BW,BH,f'''<div style="position:absolute;inset:0;background:#fff8ec"></div>
<div style="position:absolute;left:0;width:{BW//2-60}px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center">
<div style="font-family:Fredoka;font-weight:600;font-size:130px;color:#555;line-height:1.3">¡Aprendemos juntos!<br><span style="color:#999">Learning together!</span></div>
<div style="font-family:Montserrat;font-weight:700;font-size:56px;letter-spacing:10px;color:#bbb;margin-top:100px">UNITY KEEPSAKES</div></div>
<div style="position:absolute;right:0;width:{BW//2-60}px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center">
<div style="display:flex;gap:26px;margin-bottom:60px">{''.join(f'<span style="width:110px;height:110px;border-radius:50%;background:{c}"></span>' for _,_,c in COL[:6])}</div>
<div style="font-family:Fredoka;font-weight:700;font-size:250px;line-height:1;color:#2f6fd6">Mis Colores</div>
<div style="font-family:Fredoka;font-weight:600;font-size:150px;color:#f28a1d;margin-top:30px">My Colors</div>
<div style="font-family:Fredoka;font-weight:500;font-size:62px;color:#777;margin-top:50px">Español · English</div></div>''')
for i,(es,en,c) in enumerate(COL):
    tc='#2b2b2b' if es in ('Amarillo','Blanco') else '#ffffff'
    bord='border:12px solid #ddd;' if es=='Blanco' else ''
    page(f'book_spread{i+1}',SW,SH,f'''<div style="position:absolute;left:0;top:0;bottom:0;width:{SW//2}px;background:{c};{bord}display:flex;align-items:center;justify-content:center;flex-direction:column">
<div style="font-family:Fredoka;font-weight:700;font-size:300px;color:{tc}">{es}</div><div style="font-family:Fredoka;font-weight:600;font-size:120px;color:{tc};opacity:.85">{en}</div></div>
<div style="position:absolute;right:0;top:0;bottom:0;width:{SW//2}px;background:#fff8ec;display:flex;align-items:center;justify-content:center;flex-direction:column">
<div style="width:820px;height:820px;border-radius:50%;background:{c};{'border:16px solid #ddd' if es=='Blanco' else ''}"></div>
<div style="font-family:Fredoka;font-weight:600;font-size:96px;color:#555;margin-top:60px">¿Qué es {es.lower()}? · What is {en.lower()}?</div></div>''')
# ---- Ornaments: circle 954x954 (Printful 881 v22782), heart 978x972 (v22783) ----
OW=954
def orn(name,bg,inner,w=OW,h=OW): page(name,w,h,f'<div style="position:absolute;inset:0;background:{bg}"></div><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">{inner}</div>')
gold='#c9a227'
orn('orn_bautizo','radial-gradient(circle,#ffffff 0%,#eaf2fb 100%)',f'''<div style="font-size:120px;color:{gold};line-height:1">✝</div>
<div style="font-family:'Great Vibes';font-size:124px;line-height:1.15;color:#1f3a5f;margin-top:10px">Mi Bautizo</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:58px;color:#555">My Baptism</div>
<div style="width:220px;height:4px;background:{gold};margin:26px 0"></div>
<div style="font-family:Montserrat;font-weight:700;font-size:34px;letter-spacing:6px;color:#1f3a5f">BENDECIDO · BLESSED</div>''')
orn('orn_bautiza','radial-gradient(circle,#ffffff 0%,#fbecef 100%)',f'''<div style="font-size:120px;color:{gold};line-height:1">✝</div>
<div style="font-family:'Great Vibes';font-size:124px;line-height:1.15;color:#7a2e4a;margin-top:10px">Mi Bautizo</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:58px;color:#555">My Baptism</div>
<div style="width:220px;height:4px;background:{gold};margin:26px 0"></div>
<div style="font-family:Montserrat;font-weight:700;font-size:34px;letter-spacing:6px;color:#7a2e4a">BENDECIDA · BLESSED</div>''')
orn('orn_comunion','radial-gradient(circle,#ffffff 0%,#f6f0e0 100%)',f'''<div style="width:150px;height:150px;border-radius:50%;border:8px solid {gold};display:flex;align-items:center;justify-content:center;font-size:84px;color:{gold}">✝</div>
<div style="font-family:'Great Vibes';font-size:104px;line-height:1.05;color:#3b2f1a;margin-top:20px">Mi Primera<br>Comunión</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:54px;color:#555;margin-top:8px">My First Communion</div>''')
orn('orn_xv','radial-gradient(circle,#ffffff 0%,#f7e3ef 100%)',f'''<div style="font-family:'Playfair Display';font-weight:700;font-size:220px;line-height:1;color:{gold}">XV</div>
<div style="font-family:'Great Vibes';font-size:104px;line-height:1.1;color:#7a2e4a">Mis Quince Años</div>
<div style="font-family:Montserrat;font-weight:700;font-size:32px;letter-spacing:6px;color:#7a2e4a;margin-top:16px">MY QUINCEAÑERA</div>''')
paw='''<svg width="190" height="180" viewBox="0 0 100 95"><g fill="#7a5c45"><ellipse cx="50" cy="66" rx="24" ry="20"/><ellipse cx="20" cy="38" rx="10" ry="13"/><ellipse cx="40" cy="22" rx="10" ry="13"/><ellipse cx="60" cy="22" rx="10" ry="13"/><ellipse cx="80" cy="38" rx="10" ry="13"/></g></svg>'''
orn('orn_pet','radial-gradient(circle,#ffffff 0%,#f3ebe2 100%)',f'''<div style="margin-top:60px">{paw}</div>
<div style="font-family:'Great Vibes';font-size:96px;line-height:1.05;color:#5a4030;margin-top:14px">Siempre en<br>mi corazón</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:46px;color:#777;margin-top:6px">Forever in my heart</div>''',978,972)
# ---- No Sabo Kid tee (Bella+Canvas 3001, 1800x2400, transparent) ----
for mode in ('light','dark'):
    t1='#1f2a44' if mode=='light' else '#ffffff'; acc='#e23b3b' if mode=='light' else '#f5c518'
    page(f'tee_nosabo_{mode}',1800,2400,f'''<div style="position:absolute;left:0;right:0;top:260px;text-align:center">
<div style="font-family:Fredoka;font-weight:700;font-size:400px;line-height:.95;color:{t1}">NO SABO</div>
<div style="font-family:Fredoka;font-weight:700;font-size:400px;line-height:.95;color:{acc}">KID</div>
<div style="font-family:'Great Vibes';font-size:250px;line-height:1.3;color:{t1};margin-top:30px">pero entiendo todo</div>
<div style="font-family:Montserrat;font-weight:700;font-size:78px;letter-spacing:6px;color:{t1};opacity:.85;margin-top:10px">(BUT I UNDERSTAND EVERYTHING)</div></div>''',transparent=True)
json.dump(J,open(OUT+'/jobs.json','w')); print(len(J),'pages')

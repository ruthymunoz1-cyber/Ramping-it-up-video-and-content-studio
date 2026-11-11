# Batch 3: funny bilingual Christmas sweatshirts, Baby's First Christmas, Spanglish tees, wedding line.
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,700;1,500&family=Montserrat:wght@600;800&family=Fredoka:wght@600;700&family=Oswald:wght@700&display=swap" rel="stylesheet">'
def pg(w,h,body,bg='transparent',align='flex-start',pad=0):
    return (w,h,bg=='transparent',f'<html><head>{F}<style>html,body{{margin:0;background:transparent}}div[style*="Great Vibes"]{{line-height:1.3!important;margin-top:36px!important;margin-bottom:14px!important}}.c{{width:{w}px;height:{h}px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:{align};text-align:center;overflow:hidden;box-sizing:border-box;padding-top:{pad}px}}</style></head><body><div class="c">{body}</div></body></html>')
J={}
def dual(name,fn,light,dark,w=1800,h=2400,pad=160):
    J[name+'_light']=pg(w,h,fn(*light),pad=pad); J[name+'_dark']=pg(w,h,fn(*dark),pad=pad)
# --- Funny bilingual Christmas sweatshirts (secular) ---
hola=lambda t,a: f'''<div style="font-size:90px;color:{a};letter-spacing:34px">❄ ✦ ❄ ✦ ❄</div>
<div style="font-family:Fredoka;font-weight:700;font-size:400px;line-height:.95;color:{t};margin-top:40px">HO HO<br>¡HOLA!</div>
<div style="font-family:Montserrat;font-weight:800;font-size:84px;letter-spacing:22px;color:{a};margin-top:50px">FELIZ NAVIDAD</div>
<div style="font-size:90px;color:{a};letter-spacing:34px;margin-top:40px">✦ ❄ ✦ ❄ ✦</div>'''
J['sweat_ho-ho-hola']=pg(1800,2400,hola('#ffffff','#f4d35e'),pad=160)
J['youth_ho-ho-hola']=pg(1500,1800,f'<div style="zoom:.78">{hola("#ffffff","#f4d35e")}</div>',pad=110)
tam=lambda t,a: f'''<div style="font-family:Montserrat;font-weight:800;font-size:96px;letter-spacing:26px;color:{a}">IT'S</div>
<div style="font-family:'Great Vibes';font-size:380px;line-height:1;color:{t}">Tamale</div>
<div style="font-family:Oswald;font-weight:700;font-size:300px;letter-spacing:20px;line-height:1;color:{t}">SEASON</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:110px;color:{a};margin-top:50px">es temporada de tamales</div>
<div style="font-size:90px;color:{a};letter-spacing:34px;margin-top:40px">✦ ✦ ✦</div>'''
J['sweat_tamale-season']=pg(1800,2400,tam('#ffffff','#f4d35e'),pad=200)
# --- Baby's First Christmas ---
J['baby_first-christmas']=pg(1050,1200,'''<div style="font-family:'Great Vibes';font-size:170px;line-height:1;color:#b3202a">Mi Primera</div>
<div style="font-family:Fredoka;font-weight:700;font-size:170px;line-height:1;color:#b3202a;letter-spacing:6px">NAVIDAD</div>
<div style="font-family:Montserrat;font-weight:800;font-size:46px;letter-spacing:10px;color:#1f5e3a;margin-top:30px">BABY'S FIRST CHRISTMAS</div>
<div style="font-family:Montserrat;font-weight:800;font-size:60px;letter-spacing:16px;color:#1f5e3a;margin-top:16px">✦ 2026 ✦</div>''',pad=120)
def orn(w,h,top,script,big,small,bg,txt,acc,heart=False):
    s=1.15 if heart else 1.4
    return pg(w,h,f'''<div style="zoom:{s};display:flex;flex-direction:column;align-items:center">
<div style="font-size:70px;color:{acc}">✦</div>
<div style="font-family:Montserrat;font-weight:600;font-size:52px;letter-spacing:12px;color:{acc};margin-top:10px">{top}</div>
<div style="font-family:'Great Vibes';font-size:{'170' if len(script)>9 else '210'}px;line-height:1.05;color:{txt}">{script}</div>
<div style="font-family:'Playfair Display';font-weight:700;font-size:130px;line-height:1;color:{txt};letter-spacing:4px">{big}</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:62px;color:{acc};margin-top:20px">{small}</div>
<div style="font-family:Montserrat;font-weight:600;font-size:52px;letter-spacing:14px;color:{acc};margin-top:14px">2026</div></div>''',bg=bg,align='center',pad=0 if not heart else 0)
for shape,(w,h) in {'circle':(954*2,954*2),'heart':(978*2,972*2)}.items():
    hz=shape=='heart'
    J[f'orn_baby-first-christmas_{shape}']=pg(*([w,h]),'')  # placeholder replaced below
    J[f'orn_baby-first-christmas_{shape}']=orn(w,h,'MI PRIMERA','Navidad','BABY','First Christmas','radial-gradient(circle at 50% 40%,#c8303d,#7d1420)','#ffffff','#f4d35e',hz)
    J[f'orn_married-christmas_{shape}']=orn(w,h,'NUESTRA PRIMERA','Navidad','CASADOS','Our First Christmas Married','radial-gradient(circle at 50% 40%,#16405a,#0b2233)','#f3e6c4','#d9b56b',hz)
# --- Spanglish tees ---
fl=lambda t,a: f'''<div style="font-family:Montserrat;font-weight:800;font-size:110px;letter-spacing:30px;color:{a}">FLUENT IN</div>
<div style="font-family:'Great Vibes';font-size:350px;line-height:1.05;color:{t}">Spanglish</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:100px;color:{a};margin-top:30px">bilingual · bilingüe · both</div>'''
dual('tee_fluent-spanglish',fl,('#1f3550','#c0392b'),('#ffffff','#f4b942'))
ah=lambda t,a: f'''<div style="font-family:'Playfair Display';font-weight:700;font-size:260px;color:{t}">ahorita</div>
<div style="font-family:Montserrat;font-weight:600;font-size:70px;letter-spacing:10px;color:{a}">/ a·o·ˈri·ta / &nbsp; (adv.)</div>
<div style="width:1300px;text-align:left;font-family:'Playfair Display';font-size:96px;line-height:1.45;color:{t};margin-top:60px">1. right now<br>2. in a little bit<br>3. sometime between<br>&nbsp;&nbsp;&nbsp;&nbsp;now and never</div>'''
dual('tee_ahorita',ah,('#1f3550','#c0392b'),('#ffffff','#f4b942'))
hs=lambda t,a: f'''<div style="font-family:Oswald;font-weight:700;font-size:330px;line-height:1;letter-spacing:10px;color:{t}">HABLO</div>
<div style="font-family:'Great Vibes';font-size:380px;line-height:1;color:{a}">Spanglish</div>
<div style="font-family:Montserrat;font-weight:800;font-size:80px;letter-spacing:18px;color:{t};margin-top:50px">PREGÚNTAME ANYTHING</div>'''
dual('tee_hablo-spanglish',hs,('#1f3550','#c0392b'),('#ffffff','#f4b942'))
# --- Wedding ---
nov=lambda t,a: f'''<div style="font-family:'Great Vibes';font-size:520px;line-height:1;color:{t}">Novia</div>
<div style="width:900px;height:6px;background:{a};margin:40px 0"></div>
<div style="font-family:Montserrat;font-weight:600;font-size:110px;letter-spacing:50px;color:{a}">BRIDE</div>'''
dual('sweat_novia',nov,('#1b1b1b','#c99a3c'),('#ffffff','#e2c275'),pad=260)
sq=lambda t,a: f'''<div style="font-family:Montserrat;font-weight:600;font-size:100px;letter-spacing:40px;color:{a}">LAS DAMAS</div>
<div style="font-family:'Great Vibes';font-size:270px;line-height:1.05;color:{t}">Bride Squad</div>
<div style="font-size:90px;color:{a};letter-spacing:30px;margin-top:30px">✦ ✦ ✦</div>'''
dual('tee_bride-squad',sq,('#1b1b1b','#c99a3c'),('#ffffff','#e2c275'),pad=260)
def mug(es,en):
    one=f'''<div style="width:1000px;display:flex;flex-direction:column;align-items:center"><div style="font-family:'Great Vibes';font-size:330px;line-height:1;color:#1b1b1b">{es}</div>
<div style="font-family:Montserrat;font-weight:600;font-size:80px;letter-spacing:30px;color:#c99a3c;margin-top:20px">{en}</div></div>'''
    return pg(2700,1050,one+one,bg='#ffffff',align='center')
for k,(es,en) in {'mug_sr-mr':('Sr.','MR.'),'mug_sra-mrs':('Sra.','MRS.')}.items():
    w,h,tr,html=mug(es,en); J[k]=(w,h,tr,html.replace('flex-direction:column;align-items:center;justify-content:center','flex-direction:row;align-items:center;justify-content:space-around'))
for k,(w,h,tr,html) in J.items(): open(f'{OUT}/html/{k}.html','w').write(html)
json.dump({k:[w,h,tr] for k,(w,h,tr,_) in J.items()},open(f'{OUT}/jobs.json','w'))
print(len(J))

# Batch 2 designs: drinkware wraps (two-up), apparel fronts (transparent). Rendered with Playwright.
import os,sys,json,subprocess
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
FONTS='<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,500&family=Great+Vibes&family=Montserrat:wght@500;700;800&family=Oswald:wght@600;700&family=Fredoka:wght@600;700&display=swap" rel="stylesheet">'
CHUTE='''<svg viewBox="0 0 200 190" width="{w}"><g fill="none" stroke="{c}" stroke-width="5" stroke-linecap="round">
<path d="M10 70 Q100 -25 190 70" fill="{c}" stroke="none"/>
<path d="M10 70 Q32 58 55 70 Q77 58 100 70 Q122 58 145 70 Q167 58 190 70" fill="{bg}" stroke="none"/>
<line x1="10" y1="70" x2="100" y2="150"/><line x1="55" y1="70" x2="100" y2="150"/><line x1="145" y1="70" x2="100" y2="150"/><line x1="190" y1="70" x2="100" y2="150"/></g>
<circle cx="100" cy="150" r="8" fill="{c}"/><path d="M92 158 h16 l-3 22 h-10z" fill="{c}"/></svg>'''
def page(w,h,body,bg='transparent',css=''):
    return f'<html><head>{FONTS}<style>html,body{{margin:0;background:transparent}}.c{{width:{w}px;height:{h}px;background:{bg};display:flex;align-items:center;justify-content:space-around;text-align:center;overflow:hidden}}.p{{display:flex;flex-direction:column;align-items:center;justify-content:center}}{css}</style></head><body><div class="c">{body}</div></body></html>'
def mug(inner,bg='#ffffff',css=''):   # 2700x1050 wrap, design shown on both sides
    return page(2700,1050,f'<div class="p" style="width:900px;zoom:1.4">{inner}</div><div class="p" style="width:900px;zoom:1.4">{inner}</div>',bg,css)
D={}
# 1 But first, café
D['mug_but-first-cafe']=('mug',mug('''<div style="font-family:Montserrat;font-weight:700;font-size:70px;letter-spacing:14px;color:#8a5a3c">BUT FIRST,</div>
<div style="font-family:'Great Vibes';font-size:300px;line-height:1;color:#3b2417">café</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:62px;color:#8a5a3c;margin-top:10px">pero primero, café ☕</div>'''))
# 2 Coffee & prayer
D['mug_coffee-and-prayer']=('mug',mug('''<div style="font-family:Montserrat;font-weight:700;font-size:60px;letter-spacing:12px;color:#1f3550">POWERED BY</div>
<div style="font-family:'Playfair Display';font-weight:700;font-size:150px;line-height:1.05;color:#1f3550">Coffee<br><span style="font-family:'Great Vibes';font-weight:400;color:#c99a3c">&amp;</span> Prayer</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:58px;color:#c99a3c;margin-top:16px">café y oración</div>'''))
# 3 Phil 4:13 bilingual (KJV + RV1909)
D['mug_phil-4-13']=('mug',mug('''<div style="font-family:'Playfair Display';font-weight:700;font-size:88px;line-height:1.15;color:#1f3550">I can do all things<br>through Christ which<br>strengtheneth me.</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:62px;line-height:1.25;color:#a8323e;margin-top:30px">Todo lo puedo en Cristo<br>que me fortalece.</div>
<div style="font-family:Montserrat;font-weight:700;font-size:34px;letter-spacing:6px;color:#c99a3c;margin-top:26px">PHILIPPIANS · FILIPENSES 4:13</div>'''))
# 4 Golf
D['mug_golf-forecast']=('mug',mug('''<div style="font-family:Montserrat;font-weight:800;font-size:64px;letter-spacing:12px;color:#2f5d3a">WEEKEND FORECAST</div>
<div style="font-family:Oswald;font-weight:700;font-size:240px;line-height:1;color:#2f5d3a">GOLF</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:70px;color:#6b8f3a">with a chance of coffee ⛳</div>'''))
# 5 Airborne mug (black bg)
air_inner=lambda c,a,bg: f'''{CHUTE.format(w=330,c=a,bg=bg)}
<div style="font-family:Oswald;font-weight:700;font-size:96px;letter-spacing:6px;color:{c};line-height:1.05;margin-top:10px">ONCE AIRBORNE,<br>ALWAYS AIRBORNE</div>
<div style="font-family:Montserrat;font-weight:700;font-size:46px;letter-spacing:14px;color:{a};margin-top:22px">VETERAN · PROUD TO HAVE SERVED</div>'''
D['mug_airborne']=('mug',mug(air_inner('#ffffff','#d4b15f','#111111').replace('width="330"','width="230"').replace('font-size:96px','font-size:84px').replace('font-size:46px;letter-spacing:14px','font-size:30px;letter-spacing:8px'),bg='#111111'))
# 6 Veterans 250 mug
vet_inner='''<div style="font-family:Montserrat;font-weight:800;font-size:56px;letter-spacing:14px;color:#a8323e">1776 ★ 2026</div>
<div style="font-family:Oswald;font-weight:700;font-size:150px;line-height:1.02;color:#1f3550">250 YEARS<br>OF FREEDOM</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:66px;color:#a8323e;margin-top:14px">Thank you, Veterans</div>'''
D['mug_veterans-250']=('mug',mug(vet_inner))
# Apparel (1800x2400 @2x → 3600x4800), transparent
def tee(inner,css=''): return page(1800,2400,f'<div class="p" style="width:1700px;margin-top:-600px">{inner}</div>','transparent',css)
D['tee_airborne']=('tee',tee(air_inner('#ffffff','#d4b15f','#1b1b1b').replace('width="330"','width="560"').replace('font-size:96px','font-size:150px').replace('font-size:46px','font-size:62px')))
D['tee_faith-over-fear_light']=('tee',tee('''<div style="font-family:Oswald;font-weight:700;font-size:300px;line-height:.95;color:#1f3550">FAITH<br><span style="font-family:'Great Vibes';font-weight:400;font-size:200px;color:#c0392b">over</span><br>FEAR</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:110px;color:#c0392b;margin-top:40px">fe sobre el miedo</div>'''))
D['tee_faith-over-fear_dark']=('tee',D['tee_faith-over-fear_light'][1].replace('#1f3550','#ffffff').replace('#c0392b','#f4b942'))
# Church ugly sweater (printed sweatshirt front)
D['sweatshirt_reason-for-season']=('tee',tee('''<div style="font-size:90px;color:#ffffff;letter-spacing:30px">❄ ✦ ❄ ✦ ❄ ✦ ❄</div>
<div style="font-family:Fredoka;font-weight:700;font-size:200px;line-height:1;color:#ffffff;margin-top:30px">JESUS IS<br>THE REASON<br>FOR THE SEASON</div>
<div style="font-family:Fredoka;font-weight:600;font-size:92px;color:#f4d35e;margin-top:40px">Jesús es la razón de esta temporada</div>
<div style="font-size:90px;color:#ffffff;letter-spacing:30px;margin-top:30px">🎄 ✦ ★ ✦ 🎄</div>'''))
jobs=[]
for k,(kind,html) in D.items():
    open(f'{OUT}/html/{k}.html','w').write(html); jobs.append(k)
json.dump(jobs,open(f'{OUT}/jobs.json','w'))

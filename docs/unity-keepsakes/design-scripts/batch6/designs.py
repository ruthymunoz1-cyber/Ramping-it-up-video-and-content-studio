# Batch 6 sample: two-sided prayer card (front design + back verse). Verses: KJV and RV1909 (public domain).
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True); J=[]
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Montserrat:wght@500;700&display=swap" rel="stylesheet">'
W,H=1800,1200
def page(name,body):
    open(f'{OUT}/html/{name}.html','w').write(f'<html><head>{F}<style>html,body{{margin:0;width:{W//2}px;height:{H//2}px;overflow:hidden}}*{{box-sizing:border-box}}</style></head><body><div style="position:relative;width:{W}px;height:{H}px;zoom:.5">{body}</div></body></html>')
    J.append(dict(name=name,w=W,h=H))
page('prayer_front_bendecido',f'''<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,#24456b 0%,#13243a 80%)"></div>
<div style="position:absolute;inset:60px;border:4px solid #c9a227;border-radius:24px"></div>
<div style="position:absolute;left:0;right:0;top:150px;text-align:center;color:#f4ecd8">
<div style="font-family:Montserrat;font-weight:700;font-size:44px;letter-spacing:18px;color:#c9a227">BENDECIDO · BLESSED</div>
<div style="font-family:'Great Vibes';font-size:230px;line-height:1.2;margin-top:50px">Que Dios te bendiga</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:70px;margin-top:20px;color:#e9dcc0">May God bless you</div>
<div style="font-size:70px;color:#c9a227;margin-top:40px">✝</div></div>''')
verse_kjv='The LORD is my shepherd; I shall not want.'
verse_rv='Jehová es mi pastor; nada me faltará.'
page('prayer_back_salmo23',f'''<div style="position:absolute;inset:0;background:#fbf7ef"></div>
<div style="position:absolute;inset:60px;border:4px solid #c9a227;border-radius:24px"></div>
<div style="position:absolute;left:150px;right:150px;top:170px;text-align:center;color:#1f3a5f">
<div style="font-family:'Playfair Display';font-style:italic;font-size:80px;line-height:1.3">“{verse_rv}”</div>
<div style="font-family:Montserrat;font-weight:700;font-size:38px;letter-spacing:10px;color:#9a7a20;margin-top:30px">SALMOS 23:1 · RV 1909</div>
<div style="width:200px;height:4px;background:#c9a227;margin:50px auto"></div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:60px;line-height:1.3;color:#555">“{verse_kjv}”</div>
<div style="font-family:Montserrat;font-weight:700;font-size:34px;letter-spacing:10px;color:#777;margin-top:30px">PSALM 23:1 · KJV</div></div>
<div style="position:absolute;left:0;right:0;bottom:100px;text-align:center;font-family:Montserrat;font-size:30px;letter-spacing:8px;color:#999">UNITY KEEPSAKES · UNITYKEEPSAKES.COM</div>''')
json.dump(J,open(OUT+'/jobs.json','w')); print(len(J))

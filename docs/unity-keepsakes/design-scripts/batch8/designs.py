# Batch 8: postcard-size verse cards (1800x1200 front/back). Verses: KJV + RV1909 (public domain).
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True); J=[]
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">'
W,H=1800,1200
def page(name,body):
    open(f'{OUT}/html/{name}.html','w').write(f'<html><head>{F}<style>html,body{{margin:0;width:{W//2}px;height:{H//2}px;overflow:hidden}}*{{box-sizing:border-box}}</style></head><body><div style="position:relative;width:{W}px;height:{H}px;zoom:.5">{body}</div></body></html>')
    J.append(dict(name=name,w=W,h=H))
def back(name,ref_rv,txt_rv,ref_kjv,txt_kjv,c):
    page(name,f'''<div style="position:absolute;inset:0;background:#fbf7ef"></div>
<div style="position:absolute;inset:60px;border:4px solid {c};border-radius:24px"></div>
<div style="position:absolute;left:150px;right:150px;top:150px;text-align:center;color:#1f2a44">
<div style="font-family:'Playfair Display';font-style:italic;font-size:74px;line-height:1.3">“{txt_rv}”</div>
<div style="font-family:Montserrat;font-weight:700;font-size:36px;letter-spacing:10px;color:{c};margin-top:26px">{ref_rv} · RV 1909</div>
<div style="width:200px;height:4px;background:{c};margin:46px auto"></div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:56px;line-height:1.3;color:#555">“{txt_kjv}”</div>
<div style="font-family:Montserrat;font-weight:700;font-size:32px;letter-spacing:10px;color:#777;margin-top:26px">{ref_kjv} · KJV</div></div>
<div style="position:absolute;left:0;right:0;bottom:95px;text-align:center;font-family:Montserrat;font-size:28px;letter-spacing:8px;color:#999">UNITY KEEPSAKES · UNITYKEEPSAKES.COM</div>''')
# 1) Spanish: Salmos 46:10
page('card_es_front',f'''<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#2a4a73,#13243a 80%)"></div>
<div style="position:absolute;inset:60px;border:4px solid #c9a227;border-radius:24px"></div>
<div style="position:absolute;left:0;right:0;top:200px;text-align:center;color:#f4ecd8">
<div style="font-family:Montserrat;font-weight:700;font-size:40px;letter-spacing:16px;color:#c9a227">TARJETA DE FE</div>
<div style="font-family:'Great Vibes';font-size:250px;line-height:1.2;margin-top:40px">Estad quietos</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:72px;margin-top:20px;color:#e9dcc0">y conoced que yo soy Dios</div></div>''')
back('card_es_back','Salmos 46:10','Estad quietos, y conoced que yo soy Dios; ensalzado seré entre las naciones, ensalzado seré en la tierra.','Psalm 46:10','Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.','#c9a227')
# 2) English: Psalm 91:1
page('card_en_front',f'''<div style="position:absolute;inset:0;background:#fbf7ef"></div>
<div style="position:absolute;inset:60px;border:4px solid #1f3a5f;border-radius:24px"></div>
<div style="position:absolute;left:0;right:0;top:230px;text-align:center;color:#1f3a5f">
<div style="font-family:Montserrat;font-weight:700;font-size:40px;letter-spacing:16px;color:#9a7a20">PRAYER CARD</div>
<div style="font-family:'Playfair Display';font-weight:700;font-size:200px;line-height:1.1;margin-top:40px">Abide in Him</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:72px;margin-top:20px;color:#555">shelter · strength · rest</div></div>''')
back('card_en_back','Salmo 91:1','El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.','Psalm 91:1','He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.','#1f3a5f')
# 3) Veteran: Joshua 1:9
page('card_vet_front',f'''<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,#2b3442,#121823 85%)"></div>
<div style="position:absolute;inset:60px;border:4px solid #c9a227;border-radius:24px"></div>
<div style="position:absolute;left:0;right:0;top:180px;text-align:center;color:#f4ecd8">
<div style="font-family:Montserrat;font-weight:700;font-size:40px;letter-spacing:16px;color:#c9a227">SERVED · SERVING</div>
<div style="font-family:'Playfair Display';font-weight:700;font-size:170px;line-height:1.1;margin-top:40px">Be Strong</div>
<div style="font-family:'Playfair Display';font-weight:700;font-size:170px;line-height:1.1;color:#40cdc8">and Courageous</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:64px;margin-top:30px;color:#e9dcc0">Fuerte y valiente</div></div>''')
back('card_vet_back','Josué 1:9','Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en dondequiera que vayas.','Joshua 1:9','Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.','#c9a227')
json.dump(J,open(OUT+'/jobs.json','w')); print(len(J))

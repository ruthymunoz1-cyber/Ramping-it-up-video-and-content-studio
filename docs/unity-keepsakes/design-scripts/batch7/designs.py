# Batch 7 sample tees (1800x2400, transparent). Layout rules: see .claude/skills/unity-keepsakes-shirt-design/SKILL.md
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True); J=[]
F='<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Great+Vibes&family=Playfair+Display:ital,wght@1,500&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">'
TOP=520  # safe zone starts below the collar (see skill)
def tee(name,main,sub,sub2,c1,c2):
    body=f'''<div style="position:absolute;left:0;right:0;top:{TOP}px;bottom:300px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 160px">
<div style="font-family:Fredoka;font-weight:700;font-size:200px;line-height:1.05;color:{c1}">{main}</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:88px;line-height:1.3;color:{c2};margin-top:60px">{sub}</div>
<div style="font-family:Montserrat;font-weight:600;font-size:52px;letter-spacing:6px;color:{c2};opacity:.85;margin-top:30px">{sub2}</div></div>'''
    open(f'{OUT}/html/{name}.html','w').write(f'<html><head>{F}<style>html,body{{margin:0;width:900px;height:1200px;overflow:hidden;background:transparent}}*{{box-sizing:border-box}}</style></head><body><div style="position:relative;width:1800px;height:2400px;zoom:.5">{body}</div></body></html>')
    J.append(dict(name=name,w=1800,h=2400,transparent=True))
tee('mami_dinner','Mami, ¿qué hay<br>de cenar?','Mami, what’s for dinner?','FAMILY · FAMILIA','#1f2a44','#8c1c2c')
tee('tia_approved','Tía Approved','Aunt Approved','TÍA · AUNT','#1f2a44','#8c1c2c')
tee('cafecito_club','Cafecito Club','Coffee Crew · Club del café','BREW · BOND · REPEAT','#14532d','#9a5b13')
tee('feliz_mi_gente','Feliz Navidad,<br>mi gente','Merry Christmas, my people','HOLIDAY · NAVIDAD','#8c1c2c','#1f3a5f')
tee('raised_two','Raised in<br>Two Languages','Criado en dos idiomas','BILINGUAL · BILINGÜE','#1f2a44','#14532d')
json.dump(J,open(OUT+'/jobs.json','w')); print(len(J))

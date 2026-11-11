# Country humor tees: everyday greetings/slang + country name in flag colors. Light & dark versions.
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@1,500&family=Montserrat:wght@800&family=Fredoka:wght@700&family=Oswald:wght@700&display=swap" rel="stylesheet">'
C={ # key: (big, script/sub, country, c1, c2, c3)
 'dr':('KLK','¿Qué lo que?','REPÚBLICA DOMINICANA','#002D62','#CE1126','#002D62'),
 'cuba':('¿Qué bolá,','asere?','CUBA','#002A8F','#CF142B','#002A8F'),
 'pr':('¡WEPA!','Boricua de pura cepa','PUERTO RICO','#ED0000','#0050F0','#ED0000'),
 'venezuela':('¿Qué más,','chamo?','VENEZUELA','#00247D','#CF142B','#E8B400'),
 'mexico':('¡No manches!','¡Qué padre!','MÉXICO','#006847','#CE1126','#006847'),
 'colombia':('¿Qué más,','parce?','COLOMBIA','#003893','#CE1126','#E8B400'),
}
def html(big,sub,country,c1,c2,c3,dark):
    t1='#ffffff' if dark else c1; t2=c2 if not dark else ('#f4b942' if c2 in('#002D62','#002A8F','#003893','#00247D','#006847') else '#ff8a8a')
    t2= c2 if not dark else '#f4b942'
    bar=f'<div style="display:flex;gap:16px;margin:50px 0 30px"><span style="width:180px;height:18px;background:{c1 if not dark else "#ffffff"};border-radius:9px"></span><span style="width:180px;height:18px;background:{c3 if c3!=c1 else "#ffffff" if dark else "#dddddd"};border-radius:9px"></span><span style="width:180px;height:18px;background:{c2};border-radius:9px"></span></div>'
    bigsize=360 if len(big)<=7 else 250
    return f'''<html><head>{F}<style>html,body{{margin:0;background:transparent}}.c{{width:1800px;height:2400px;display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:200px;box-sizing:border-box}}</style></head><body><div class="c">
<div style="font-family:Fredoka;font-weight:700;font-size:{bigsize}px;line-height:1.05;color:{t1}">{big}</div>
<div style="font-family:'Great Vibes';font-size:230px;line-height:1.3;margin-top:20px;color:{t2}">{sub}</div>
{bar}
<div style="font-family:Montserrat;font-weight:800;font-size:{'84' if len(country)<12 else '64'}px;letter-spacing:20px;color:{t1}">{country}</div></div></body></html>'''
J={}
for k,v in C.items():
    for dark in (False,True):
        n=f'tee_{k}_{"dark" if dark else "light"}'; open(f'{OUT}/html/{n}.html','w').write(html(*v,dark)); J[n]=1
json.dump(list(J),open(OUT+'/jobs.json','w'))

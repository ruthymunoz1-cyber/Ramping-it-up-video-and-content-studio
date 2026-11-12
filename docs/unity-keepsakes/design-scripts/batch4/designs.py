# Batch 4: 2027 bilingual verse calendar, bilingual cards (Christmas + godparent), recipe towels.
# Faith rule: scripture items never mix with humor/coffee. KJV + Reina-Valera 1909 (public domain).
import os,sys,json
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True); J=[]
F='<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Montserrat:wght@500;700;800&family=Fredoka:wght@600&display=swap" rel="stylesheet">'
def page(name,w,h,body,css='',transparent=False,full=False):
    W,H=w//2,h//2
    if full: body=f'<div style="position:relative;width:{w}px;height:{h}px;zoom:.5">{body}</div>'
    open(f'{OUT}/html/{name}.html','w').write(f'<html><head>{F}<style>html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}*{{box-sizing:border-box}}{css}</style></head><body>{body}</body></html>')
    J.append(dict(name=name,w=w,h=h,transparent=transparent))

# ---------- CALENDAR (Printful 1643, 3772x5250; date grid covers bottom ~52%) ----------
CW,CH=3772,5250
M=[('january','Enero','January','#1f3a5f','#c9a227','They are new every morning: great is thy faithfulness.','Nuevas son cada mañana; grande es tu fidelidad.','Lamentations 3:23','Lamentaciones 3:23'),
 ('february','Febrero','February','#8c2f39','#d9a5a0','And now abideth faith, hope, charity, these three; but the greatest of these is charity.','Y ahora permanecen la fe, la esperanza, y la caridad, estas tres: empero la mayor de ellas es la caridad.','1 Corinthians 13:13','1 Corintios 13:13'),
 ('march','Marzo','March','#3f6b4f','#b7c9a8','I will praise thee; for I am fearfully and wonderfully made.','Te alabaré; porque formidables, maravillosas son tus obras.','Psalm 139:14','Salmos 139:14'),
 ('april','Abril','April','#6b4c8a','#d8c7e6','He is not here: for he is risen, as he said.','No está aquí; porque ha resucitado, como dijo.','Matthew 28:6','Mateo 28:6'),
 ('may','Mayo','May','#a0456b','#f0c9d6','Strength and honour are her clothing; and she shall rejoice in time to come.','Fortaleza y honor son su vestidura; y en el día postrero reirá.','Proverbs 31:25','Proverbios 31:25'),
 ('june','Junio','June','#2d5d7b','#a9cbe0','Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee.','Esfuérzate y sé valiente: no temas ni desmayes, porque Jehová tu Dios será contigo.','Joshua 1:9','Josué 1:9'),
 ('july','Julio','July','#7a1f2b','#f2d0a4','Stand fast therefore in the liberty wherewith Christ hath made us free.','Estad, pues, firmes en la libertad con que Cristo nos hizo libres.','Galatians 5:1','Gálatas 5:1'),
 ('august','Agosto','August','#b5652b','#f3d9b1','They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.','Los que esperan a Jehová tendrán nuevas fuerzas; levantarán las alas como águilas.','Isaiah 40:31','Isaías 40:31'),
 ('september','Septiembre','September','#4a5d23','#d6dcae','If any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.','Si alguno está en Cristo, nueva criatura es: las cosas viejas pasaron; he aquí todas son hechas nuevas.','2 Corinthians 5:17','2 Corintios 5:17'),
 ('october','Octubre','October','#8a4b14','#e8c27a','God is our refuge and strength, a very present help in trouble.','Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.','Psalm 46:1','Salmos 46:1'),
 ('november','Noviembre','November','#6e3b1f','#e3b98a','In every thing give thanks: for this is the will of God in Christ Jesus concerning you.','Dad gracias en todo; porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.','1 Thessalonians 5:18','1 Tesalonicenses 5:18'),
 ('december','Diciembre','December','#14532d','#c9a227','For unto you is born this day in the city of David a Saviour, which is Christ the Lord.','Que os ha nacido hoy, en la ciudad de David, un Salvador, que es Cristo el Señor.','Luke 2:11','Lucas 2:11')]
for key,es,en,c,soft,kjv,rv,ren,res in M:
    n=len(kjv)+len(rv); fs=120 if n<130 else 104 if n<190 else 90
    page(f'cal_{key}',CW,CH,f'''<div style="position:absolute;inset:0;background:linear-gradient(180deg,{soft}55 0%,#fbf7ef 40%,#fbf7ef 100%)"></div>
<div style="position:absolute;left:10%;right:10%;top:7.5%;height:41%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
<div style="font-family:Montserrat;font-weight:700;letter-spacing:16px;font-size:58px;color:{c}">{es.upper()} · {en.upper()}</div>
<div style="width:220px;height:4px;background:{soft};margin:34px 0"></div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:{fs}px;line-height:1.28;color:#222">“{kjv}”</div>
<div style="font-family:Montserrat;font-weight:500;font-size:44px;letter-spacing:5px;color:{c};margin-top:18px">{ren.upper()} · KJV</div>
<div style="font-family:'Playfair Display';font-size:{fs}px;line-height:1.28;color:{c};margin-top:46px">“{rv}”</div>
<div style="font-family:Montserrat;font-weight:500;font-size:44px;letter-spacing:5px;color:#555;margin-top:18px">{res.upper()} · RV 1909</div></div>''')
page('cal_cover',CW,CH,'''<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,#24456b 0%,#13243a 75%)"></div>
<div style="position:absolute;left:9%;right:9%;top:10%;bottom:10%;border:5px solid #c9a227;border-radius:18px"></div>
<div style="position:absolute;left:12%;right:12%;top:18%;text-align:center;color:#f4ecd8">
<div style="font-family:Montserrat;font-weight:700;letter-spacing:22px;font-size:52px;color:#c9a227">2027</div>
<div style="font-family:'Great Vibes';font-size:250px;line-height:1.25;margin-top:70px">Palabra Viva</div>
<div style="font-family:'Playfair Display';font-size:110px;letter-spacing:6px;margin-top:10px">LIVING WORD</div>
<div style="width:300px;height:5px;background:#c9a227;margin:90px auto"></div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:68px;line-height:1.4">Un versículo para cada mes<br>A verse for every month</div>
<div style="font-family:Montserrat;font-weight:500;font-size:40px;letter-spacing:8px;margin-top:120px;color:#c9a227">KJV · REINA-VALERA 1909</div></div>''')

# ---------- GREETING CARDS 5x7 (Printful 568 v14458, each panel 2146x1546 landscape) ----------
GW,GH=2146,1546
def card(key,front,inside,back='Unity Keepsakes · unitykeepsakes.com'):
    page(f'card_{key}_front',GW,GH,front,full=True)
    page(f'card_{key}_inside',GW,GH,f'<div style="position:absolute;inset:0;background:#fffdf8;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12%">{inside}</div>',full=True)
    page(f'card_{key}_back',GW,GH,f'<div style="position:absolute;inset:0;background:#fffdf8;display:flex;align-items:flex-end;justify-content:center;padding-bottom:90px;font-family:Montserrat;font-weight:500;font-size:30px;letter-spacing:5px;color:#888">{back.upper()}</div>',full=True)
IN=lambda es,en,c='#7a1f2b':f'<div><div style="font-family:\'Playfair Display\';font-size:84px;line-height:1.35;color:{c}">{es}</div><div style="font-family:\'Playfair Display\';font-style:italic;font-size:66px;line-height:1.35;color:#444;margin-top:40px">{en}</div></div>'
card('feliz',f'''<div style="position:absolute;inset:0;background:#8c1c2c"></div><div style="position:absolute;inset:70px;border:6px solid #e6c36a;border-radius:14px"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fbf3e4">
<div style="font-size:110px;color:#e6c36a">✦</div><div style="font-family:'Great Vibes';font-size:330px;line-height:1.25">Feliz Navidad</div>
<div style="font-family:Montserrat;font-weight:700;font-size:70px;letter-spacing:24px;margin-top:10px;color:#e6c36a">MERRY CHRISTMAS</div></div>''',
 IN('Con mucho cariño,<br>de nuestra familia a la tuya.','With love,<br>from our family to yours.'))
card('prospero',f'''<div style="position:absolute;inset:0;background:#14532d"></div><div style="position:absolute;inset:70px;border:6px solid #e6c36a;border-radius:14px"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fbf3e4">
<div style="font-family:'Great Vibes';font-size:280px;line-height:1.25">Feliz Navidad</div><div style="font-family:'Playfair Display';font-size:110px;margin:0 0 40px">y Próspero Año Nuevo</div>
<div style="width:200px;height:3px;background:#e6c36a;margin-bottom:30px"></div>
<div style="font-family:Montserrat;font-weight:700;font-size:52px;letter-spacing:10px;color:#e6c36a">MERRY CHRISTMAS &amp; HAPPY NEW YEAR</div></div>''',
 IN('Que el nuevo año llene tu hogar<br>de salud, amor y alegría.','May the new year fill your home<br>with health, love and joy.','#14532d'))
card('gloria',f'''<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#2a4a73,#13243a 80%)"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#f4ecd8;padding:0 10%">
<div style="font-size:150px;color:#e6c36a;line-height:1">★</div>
<div style="font-family:'Playfair Display';font-size:120px;line-height:1.25;margin-top:30px">Gloria en las alturas a Dios,<br>y en la tierra paz.</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:84px;line-height:1.3;margin-top:40px;color:#e6c36a">Glory to God in the highest,<br>and on earth peace.</div>
<div style="font-family:Montserrat;font-weight:500;font-size:40px;letter-spacing:8px;margin-top:50px">LUCAS 2:14 · LUKE 2:14</div></div>''',
 IN('Que la paz de Cristo<br>llene tu hogar esta Navidad.','May the peace of Christ<br>fill your home this Christmas.','#1f3a5f'))
for k,es,en in [('padrino','¿Quieres ser mi Padrino?','Will you be my Godfather?'),('madrina','¿Quieres ser mi Madrina?','Will you be my Godmother?'),('padrinos','¿Quieren ser mis Padrinos?','Will you be my Godparents?')]:
    yo='Ustedes' if k=='padrinos' else 'Tú'
    card(k,f'''<div style="position:absolute;inset:0;background:#f7f1e6"></div><div style="position:absolute;inset:70px;border:5px solid #c9a227;border-radius:14px"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
<div style="font-size:110px;color:#c9a227">✝</div>
<div style="font-family:'Great Vibes';font-size:230px;line-height:1.25;color:#1f3a5f;margin-top:10px">{es}</div>
<div style="width:200px;height:3px;background:#c9a227;margin:24px 0 30px"></div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:92px;color:#555">{en}</div></div>''',
     IN(f'{yo} {"son" if k=="padrinos" else "eres"} parte de mi historia.<br>Me encantaría que me acompañ{"en" if k=="padrinos" else "es"}<br>en mi camino de fe.',
        'You are part of my story.<br>I would love for you to walk with me<br>on my journey of faith.','#1f3a5f'))

# ---------- RECIPE TOWELS (Printful 883, 5693x9154 portrait) ----------
TW,TH=5693,9154
def towel(key,title_es,title_en,flag,ingr,steps,c):
    li=''.join(f'<div style="margin:34px 0"><span style="font-family:\'Playfair Display\';font-weight:700">{a}</span><br><span style="font-family:\'Playfair Display\';font-style:italic;color:#666;font-size:.85em">{b}</span></div>' for a,b in ingr)
    st=''.join(f'<div style="margin:44px 0;display:flex;gap:60px;align-items:flex-start"><div style="font-family:\'Great Vibes\';font-size:300px;line-height:.75;color:{c};min-width:150px">{i+1}</div><div><span style="font-family:\'Playfair Display\'">{a}</span><br><span style="font-family:\'Playfair Display\';font-style:italic;color:#666;font-size:.85em">{b}</span></div></div>' for i,(a,b) in enumerate(steps))
    H2=lambda t:f'<div style="font-family:Montserrat;font-weight:800;letter-spacing:18px;font-size:120px;color:{c};text-align:center">{t}</div>'
    page(f'towel_{key}',TW,TH,f'''<div style="position:absolute;inset:0;background:#fbf7ef"></div><div style="position:absolute;inset:140px;border:10px solid {c};border-radius:40px"></div>
<div style="position:absolute;left:330px;right:330px;top:330px;bottom:330px;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch">
<div style="text-align:center"><div style="font-family:Montserrat;font-weight:700;letter-spacing:34px;font-size:150px;color:{c}">LA RECETA DE ABUELA</div>
<div style="font-family:'Great Vibes';font-size:1000px;line-height:1.1;color:#2b2b2b">{title_es}</div>
<div style="font-family:'Playfair Display';font-style:italic;font-size:210px;color:#666">{title_en} · {flag}</div></div>
<div style="width:700px;height:10px;background:{c};align-self:center"></div>
<div>{H2('INGREDIENTES · INGREDIENTS')}<div style="font-size:178px;line-height:1.18;text-align:center;margin-top:30px">{li}</div></div>
<div>{H2('PREPARACIÓN · DIRECTIONS')}<div style="font-size:160px;line-height:1.2;margin-top:30px">{st}</div></div>
<div style="text-align:center;font-family:'Great Vibes';font-size:360px;line-height:1;color:{c}">¡Buen provecho!</div></div>''',full=True)
towel('coquito','Coquito','Coconut Eggnog','Puerto Rico',
 [('1 lata de crema de coco (15 oz)','1 can cream of coconut (15 oz)'),('1 lata de leche evaporada (12 oz)','1 can evaporated milk (12 oz)'),('1 lata de leche condensada (14 oz)','1 can sweetened condensed milk (14 oz)'),('1 taza de ron blanco (opcional)','1 cup white rum (optional)'),('1 cdta. de vainilla · ½ cdta. de canela','1 tsp vanilla · ½ tsp cinnamon'),('Una pizca de nuez moscada','A pinch of nutmeg')],
 [('Licúa todo hasta que esté bien suave.','Blend everything until smooth.'),('Refrigera por lo menos 2 horas.','Chill for at least 2 hours.'),('Agita bien y sirve con canela por encima.','Shake well and serve with cinnamon on top.')],'#8c1c2c')
towel('flan','Flan','Classic Caramel Flan','Hecho con amor',
 [('1 taza de azúcar (para el caramelo)','1 cup sugar (for the caramel)'),('5 huevos','5 eggs'),('1 lata de leche condensada (14 oz)','1 can sweetened condensed milk (14 oz)'),('1 lata de leche evaporada (12 oz)','1 can evaporated milk (12 oz)'),('1 cdta. de vainilla','1 tsp vanilla')],
 [('Derrite el azúcar hasta dorar y cubre el molde.','Melt the sugar until golden; coat the pan.'),('Licúa los huevos, las leches y la vainilla; vierte en el molde.','Blend eggs, milks and vanilla; pour into the pan.'),('Hornea a baño María a 350°F por 60 min. Enfría y voltea.','Bake in a water bath at 350°F for 60 min. Chill and flip.')],'#9a5b13')
json.dump(J,open(OUT+'/jobs.json','w'))
print(len(J),'pages')

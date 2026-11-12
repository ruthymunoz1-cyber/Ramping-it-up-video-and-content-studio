# Build specs (Shopify variants + Printful link files + mockups) for batch 4: calendar, cards, towels.
import json,subprocess,time,sys
H,OUT=sys.argv[1:3]
RAW=f"https://raw.githubusercontent.com/ruthymunoz1-cyber/Ramping-it-up-video-and-content-studio/{H}/docs/unity-keepsakes/print-files/batch4"
def api(m,p,b=None):
    while True:
        c=['curl','-sS','--max-time','90','-X',m,'https://api.printful.com'+p,'-H','Content-Type: application/json']
        if b: c+=['-d',json.dumps(b)]
        r=json.loads(subprocess.run(c,capture_output=True,text=True).stdout)
        if r.get('code')==429: time.sleep(35); continue
        return r
def mock(pid,vid,files,area):
    fl=[dict(placement=pl,image_url=u,position=dict(area_width=area[0],area_height=area[1],width=area[0],height=area[1],top=0,left=0)) for pl,u in files]
    r=api('POST',f'/mockup-generator/create-task/{pid}',dict(variant_ids=[vid],format='jpg',files=fl))
    k=r['result']['task_key']
    for _ in range(40):
        time.sleep(8); r=api('GET',f'/mockup-generator/task?task_key={k}')['result']
        if r['status']!='pending': break
    urls=[]
    for m in r.get('mockups',[]):
        urls.append(m['mockup_url']); urls+= [e['url'] for e in m.get('extra',[])][:2]
    time.sleep(5); return urls
P=[]
# Calendar
MS=['cover','january','february','march','april','may','june','july','august','september','october','november','december']
cf=[{"type":pl,"url":f"{RAW}/cal_{pl}.png"} for pl in MS]
imgs=mock(1643,52307,[(pl,f"{RAW}/cal_{pl}.png") for pl in ['cover','january','may','december']],(3772,5250))
P.append(dict(key='CAL27',title='"Palabra Viva · Living Word" 2027 Bilingual Scripture Wall Calendar (KJV + Reina-Valera 1909)',type='Calendar',
 tags=['bible verse calendar','2027 calendar','spanish bible calendar','christian gift','Faith · Fe'],
 desc='<p>A verse for every month, in English and Spanish. <em>Un versículo para cada mes.</em></p><p>Each month pairs a beloved verse from the King James Version with the Reina-Valera 1909, including Proverbs 31:25 for May and Luke 2:11 for December.</p><ul><li>12 months + cover, 2027, weeks start on Sunday</li><li>Paper pages bound with a silver-color metal wire</li><li>Large 11″×17″ or standard 8.26″×11.69″</li></ul>',
 options=['Size'],variants=[dict(price='34.99',sku='UK-CAL27-11X17',optionValues=[{'optionName':'Size','name':'11″×17″'}]),dict(price='26.99',sku='UK-CAL27-A4',optionValues=[{'optionName':'Size','name':'8.26″×11.69″'}])],
 images=[{'url':u,'altText':'Palabra Viva 2027 bilingual scripture calendar'} for u in imgs[:6]],
 link={'UK-CAL27-11X17':dict(variant_id=52307,files=cf),'UK-CAL27-A4':dict(variant_id=52309,files=cf)}))
# Cards (5x7 v14458)
def cardfiles(k): return [{"type":"front","url":f"{RAW}/card_{k}_front.png"},{"type":"inside2","url":f"{RAW}/card_{k}_inside.png"},{"type":"back","url":f"{RAW}/card_{k}_back.png"}]
def cardprod(key,title,opt,designs,desc,tags):
    vs=[];link={};im=[]
    for k,name in designs:
        sku=f'UK-{key}-{k.upper()}'
        vs.append(dict(price='8.99',sku=sku,optionValues=[{'optionName':opt,'name':name}])); link[sku]=dict(variant_id=14458,files=cardfiles(k))
        im+= [{'url':u,'altText':f'{title} – {name}'} for u in mock(568,14458,[('front',f"{RAW}/card_{k}_front.png"),('inside2',f"{RAW}/card_{k}_inside.png")],(2146,1546))[:2]]
    P.append(dict(key=key,title=title,type='Greeting Card',tags=tags,desc=desc,options=[opt],variants=vs,images=im,link=link))
cardprod('CARD-XMAS','Bilingual Christmas Card · Feliz Navidad · Merry Christmas','Design',[('feliz','Feliz Navidad'),('prospero','Feliz Navidad y Próspero Año Nuevo')],
 '<p>A Christmas card that speaks both languages of your family. 🎄 Printed message inside in Spanish and English.</p><ul><li>5″×7″ folded card with envelope</li><li>Premium matte paper</li></ul>',['spanish christmas card','feliz navidad card','bilingual card','Bilingual Christmas'])
cardprod('CARD-GLORIA','"Gloria en las Alturas" Bilingual Christmas Card · Luke 2:14','Design',[('gloria','Gloria en las alturas')],
 '<p><em>Gloria en las alturas a Dios, y en la tierra paz.</em><br>Glory to God in the highest, and on earth peace. (Luke 2:14)</p><p>Inside: “Que la paz de Cristo llene tu hogar esta Navidad · May the peace of Christ fill your home this Christmas.”</p><ul><li>5″×7″ folded card with envelope</li></ul>',['christian christmas card','spanish christian card','luke 2:14','Faith · Fe'])
cardprod('CARD-GODPARENT','Bilingual Godparent Proposal Card · ¿Quieres ser mi Padrino / Madrina?','Design',[('padrino','¿Quieres ser mi Padrino?'),('madrina','¿Quieres ser mi Madrina?'),('padrinos','¿Quieren ser mis Padrinos?')],
 '<p>Ask them in the most special way. ✝️ A bilingual card for asking your Padrino, Madrina or Padrinos to walk with your child on their journey of faith.</p><ul><li>5″×7″ folded card with envelope</li><li>Message inside in Spanish and English</li></ul>',['godparent proposal','padrinos','bautizo','baptism','Faith · Fe'])
# Towels (883 v22792)
vs=[];link={};im=[]
for k,name in [('coquito','Coquito'),('flan','Flan')]:
    sku=f'UK-TOWEL-{k.upper()}'; u=f"{RAW}/towel_{k}.png"
    vs.append(dict(price='24.99',sku=sku,optionValues=[{'optionName':'Recipe','name':name}])); link[sku]=dict(variant_id=22792,files=[{"type":"front","url":u}])
    im+= [{'url':x,'altText':f'La Receta de Abuela {name} kitchen towel'} for x in mock(883,22792,[('front',u)],(5693,9154))[:2]]
P.append(dict(key='TOWEL-RECETA',title='"La Receta de Abuela" Bilingual Recipe Kitchen Towel · Coquito or Flan',type='Kitchen Towel',
 tags=['coquito','flan','abuela gift','spanish kitchen towel','heritage gift'],
 desc='<p>Abuela’s recipe, in both languages. 💛 Every ingredient and step printed in Spanish and English: a gift for the family cook, a new home, or anyone who grew up with these flavors.</p><ul><li>28″×16″ hand towel</li><li>Choose Coquito or Flan</li></ul>',
 options=['Recipe'],variants=vs,images=im,link=link))
json.dump(P,open(OUT,'w'),ensure_ascii=False)
print([(p['key'],len(p['variants']),len(p['images'])) for p in P])

# Builds product specs (Shopify variants + Printful catalog mapping + mockups) for batch 2 + pajama collection.
import json,subprocess,time,sys
H=sys.argv[1]; OUT=sys.argv[2]
RAW=f'https://raw.githubusercontent.com/ruthymunoz1-cyber/Ramping-it-up-video-and-content-studio/{H}/docs/unity-keepsakes/print-files'
def api(m,p,b=None):
    while True:
        c=['curl','-sS','--max-time','90','-X',m,'https://api.printful.com'+p,'-H','Content-Type: application/json']
        if b: c+=['-d',json.dumps(b)]
        r=json.loads(subprocess.run(c,capture_output=True,text=True).stdout)
        if r.get('code')==429: time.sleep(30); continue
        return r
CAT={}
def var(pid,color,size):
    if pid not in CAT: CAT[pid]=api('GET',f'/products/{pid}')['result']['variants']
    for v in CAT[pid]:
        if (color is None or v['color']==color) and (size is None or v['size']==size): return v['id']
    raise Exception(f'no variant {pid} {color} {size}')
def mock(pid,vid,placement,url,area):
    w,h=area
    r=api('POST',f'/mockup-generator/create-task/{pid}',{"variant_ids":[vid],"format":"jpg","files":[{"placement":placement,"image_url":url,"position":{"area_width":w,"area_height":h,"width":w,"height":h,"top":0,"left":0}}]})
    k=r['result']['task_key']
    for _ in range(60):
        time.sleep(5); t=api('GET',f'/mockup-generator/task?task_key={k}')['result']
        if t['status']=='completed': return t['mockups'][0]['mockup_url']
        if t['status']=='failed': raise Exception(t)
P=[]
DRINK={'mug11':(19,'White','11 oz','11 oz Mug','21.99',(2700,1050)),'mug15':(19,'White','15 oz','15 oz Mug','24.99',(2700,1140)),
       'tumW':(742,'White','20 oz','20 oz To-Go Tumbler','39.99',(3017,1200)),'tumB':(742,'Black','20 oz','20 oz To-Go Tumbler','39.99',(3017,1200))}
def drink(key,title,file,styles,desc,tags,coll):
    url=f'{RAW}/batch2/{file}'; variants=[];imgs=[];link={}
    for s in styles:
        pid,col,size,label,price,area=DRINK[s]; vid=var(pid,col,size)
        sku=f'UK-{key}-{s.upper()}'
        variants.append({"price":price,"sku":sku,"optionValues":[{"optionName":"Style","name":label}]})
        link[sku]={"variant_id":vid,"files":[{"type":"default","url":url}]}
        if s!='mug15': imgs.append({"url":mock(pid,vid,'default',url,area),"altText":f"{title} – {label}"})
    P.append(dict(key=key,title=title,type='Drinkware',desc=desc,tags=tags+[coll],options=["Style"],variants=variants,images=imgs,link=link))
APP={3001:71,3501:356,'3501Y':511,18000:145,'100B':308}
def apparel(key,title,ptype,model,colors,sizes,files,prices,desc,tags,coll,extra_opt=None):
    pid=APP[model]; variants=[];imgs=[];link={}; area=(1800,2400) if model in (3001,3501,18000) else ((1500,1800) if model=='3501Y' else (1050,1200))
    opts=([extra_opt[0]] if extra_opt else [])+["Color","Size"]
    for ev in (extra_opt[1] if extra_opt else [None]):
        for col in colors:
            url=f"{RAW}/{files(ev,col)}"
            for sz in sizes:
                vid=var(pid,col,sz); sku=f"UK-{key}-{(ev or '').upper()+'-' if ev else ''}{col.upper().replace(' ','')}-{sz.upper()}"
                ov=([{"optionName":extra_opt[0],"name":ev}] if ev else [])+[{"optionName":"Color","name":col},{"optionName":"Size","name":sz}]
                variants.append({"price":prices.get(sz,prices['*']),"sku":sku,"optionValues":ov})
                link[sku]={"variant_id":vid,"files":[{"type":"front","url":url}]}
            mid=var(pid,col,sizes[min(1,len(sizes)-1)])
            imgs.append({"url":mock(pid,mid,'front',url,area),"altText":f"{title} – {(ev+' / ') if ev else ''}{col}"})
    P.append(dict(key=key,title=title,type=ptype,desc=desc,tags=tags+[coll],options=opts,variants=variants,images=imgs,link=link))
TEE_P={'*':'29.99','2XL':'31.99','3XL':'33.99','4XL':'35.99'}; TEE_S=['S','M','L','XL','2XL','3XL','4XL']
LS_P={'*':'34.99','2XL':'36.99'}; LS_S=['S','M','L','XL','2XL']
SW_P={'*':'44.99','2XL':'46.99','3XL':'48.99'}; SW_S=['S','M','L','XL','2XL','3XL']
step=sys.argv[3] if len(sys.argv)>3 else 'all'
if step in('all','drink'):
    drink('CAFE','"But First, Café" Mug & To-Go Tumbler – Pero Primero, Café','mug_but-first-cafe.png',['mug11','mug15','tumW'],
      '<p><strong>But first, café. / Pero primero, café.</strong> ☕ For the bilingual coffee lover who doesn\'t talk before the first cup.</p><ul><li>Choose an 11 oz or 15 oz glossy ceramic mug, or a 20 oz insulated to-go tumbler with straw</li><li>Design printed on both sides</li><li>Mugs are dishwasher &amp; microwave safe; tumbler: hand wash</li></ul>',['coffee mug','spanish coffee mug','bilingual gift','cafe mug','to-go tumbler'],'Coffee & To-Go')
    drink('PHIL413','Philippians 4:13 Bilingual Mug & Tumbler – KJV & Reina-Valera','mug_phil-4-13.png',['mug11','mug15','tumW'],
      '<p><em>"I can do all things through Christ which strengtheneth me."</em><br><em>"Todo lo puedo en Cristo que me fortalece."</em><br>Philippians · Filipenses 4:13</p><p>Scripture in English (KJV) and Spanish (Reina-Valera 1909), a daily reminder of His strength.</p><ul><li>11 oz or 15 oz glossy ceramic mug, or 20 oz insulated to-go tumbler</li><li>Verse printed on both sides</li></ul>',['bible verse mug','philippians 4 13','christian gift','spanish bible verse','faith mug'],'Faith · Fe')
    drink('GOLF','"Weekend Forecast: Golf" Mug & To-Go Tumbler','mug_golf-forecast.png',['mug11','mug15','tumW'],
      '<p><strong>Weekend forecast: GOLF, with a chance of coffee.</strong> ⛳ The perfect gift for the golfer in the family, for Father\'s Day, birthdays and Christmas.</p><ul><li>11 oz or 15 oz glossy ceramic mug, or 20 oz insulated to-go tumbler</li><li>Design printed on both sides</li></ul>',['golf mug','golfer gift','golf dad','funny golf'],'Sports & Golf')
    drink('USA250','"250 Years of Freedom" Veterans Mug & Tumbler – 1776 ★ 2026','mug_veterans-250.png',['mug11','mug15','tumW'],
      '<p><strong>1776 ★ 2026 · 250 Years of Freedom · Thank you, Veterans.</strong> 🇺🇸 A keepsake for the nation\'s 250th year, honoring those who served.</p><ul><li>11 oz or 15 oz glossy ceramic mug, or 20 oz insulated to-go tumbler</li><li>Design printed on both sides</li></ul>',['veterans gift','250th anniversary','1776 2026','patriotic mug','thank you veterans'],'Veterans & Military')
    drink('AIRBORNE','"Once Airborne, Always Airborne" Veteran Mug & Tumbler','mug_airborne.png',['mug11','tumB'],
      '<p><strong>Once Airborne, Always Airborne. Veteran · Proud to have served.</strong> 🪂 For the paratroopers and the Airborne family.</p><ul><li>11 oz glossy ceramic mug (black wrap) or 20 oz black insulated to-go tumbler</li><li>Design printed on both sides</li></ul><p><small>Not affiliated with or endorsed by the U.S. Army or Department of Defense.</small></p>',['airborne','paratrooper gift','airborne veteran','military mug','veteran gift'],'Veterans & Military')
if step in('all','apparel'):
    apparel('AIRBORNE-TEE','"Once Airborne, Always Airborne" Veteran T-Shirt','T-Shirt',3001,['Black','Military Green','Navy'],TEE_S,lambda e,c:'batch2/tee_airborne.png',TEE_P,
      '<p><strong>Once Airborne, Always Airborne. Veteran · Proud to have served.</strong> 🪂 Original parachute design for paratroopers and the Airborne community.</p><ul><li>Bella+Canvas 3001 unisex tee, soft and lightweight</li></ul><p><small>Not affiliated with or endorsed by the U.S. Army or Department of Defense.</small></p>',['airborne shirt','paratrooper','airborne veteran','veteran shirt'],'Veterans & Military')
    apparel('FAITH-TEE','"Faith over Fear / Fe sobre el Miedo" Bilingual Christian T-Shirt','T-Shirt',3001,['White','Natural','Navy','Black'],TEE_S,lambda e,c:'batch2/tee_faith-over-fear_'+('light' if c in('White','Natural') else 'dark')+'.png',TEE_P,
      '<p><strong>Faith over Fear. Fe sobre el miedo.</strong></p><p>A simple, bold reminder, in English and Spanish.</p><ul><li>Bella+Canvas 3001 unisex tee, soft and lightweight</li></ul>',['christian shirt','faith over fear','spanish christian shirt','bilingual faith'],'Faith · Fe')
    apparel('REASON-SWEAT','"Jesus Is the Reason for the Season" Bilingual Christmas Sweatshirt','Sweatshirt',18000,['Red','Forest Green','Navy'],SW_S,lambda e,c:'batch2/sweatshirt_reason-for-season.png',SW_P,
      '<p><strong>Jesus is the reason for the season.</strong><br><em>Jesús es la razón de esta temporada.</em> 🎄</p><p>A festive Christmas sweatshirt for church gatherings, family celebrations and the whole season.</p><ul><li>Gildan 18000 unisex crewneck sweatshirt, cozy cotton-poly blend</li></ul>',['christmas sweatshirt','jesus is the reason for the season','church christmas','christian christmas'],'Faith · Fe')
if step in('all','pj'):
    PJD=lambda who:f'<p>Matching family Christmas shirts, bilingual and full of cheer! 🎅 Mix and match the whole family: Mamá, Papá, Abuela, Abuelo, the little duendecitos, Bebé, and even the Perrito.</p><p>Pair with your favorite plaid pajama pants for the family photo or the Christmas pajama party.</p><ul><li>{who}</li></ul>'
    for k,r in [('MAMA','Mamá'),('PAPA','Papá'),('ABUELA','Abuela'),('ABUELO','Abuelo')]:
        apparel(f'PJ-{k}',f'"{r} Claus" Matching Family Christmas Long-Sleeve Shirt','Long Sleeve Shirt',3501,['White','Red'],LS_S,lambda e,c,k=k:f'pajamas/adult_{k.lower()}_{c.lower()}.png',LS_P,PJD('Bella+Canvas 3501 unisex long-sleeve tee, soft and comfy'),['matching family christmas shirts','christmas pajamas','family christmas','mama claus' if k=='MAMA' else f'{r.lower()} claus'],'Family Christmas Pajamas')
    apparel('PJ-KIDS','"Duendecito / Duendecita – Little Elf" Kids Matching Christmas Shirt','Long Sleeve Shirt','3501Y',['White','Red'],['S','M','L'],lambda e,c:f'pajamas/youth_{e.lower()}_{c.lower()}.png',{'*':'29.99'},PJD('Bella+Canvas 3501Y youth long-sleeve tee (youth S, M, L)'),['kids christmas shirt','matching family christmas','little elf','duendecito'],'Family Christmas Pajamas',extra_opt=('Style',['Duendecito','Duendecita']))
    apparel('PJ-BEBE','"Bebé Claus" Matching Family Christmas Baby Bodysuit','Baby Bodysuit','100B',['White'],['3-6m','6-12m','12-18m'],lambda e,c:'pajamas/baby_bebe_white.png',{'*':'24.99'},PJD('Bella+Canvas 100B baby short-sleeve one-piece'),['baby christmas outfit','bebe claus','matching family christmas','first christmas baby'],'Family Christmas Pajamas')
    # pet bandana
    url=f'{RAW}/pajamas/bandana_perrito.png'; vs=[];link={}
    for sz in ['S','M','L','XL']:
        vid=var(902,None,sz); sku=f'UK-PJ-PERRITO-{sz}'
        vs.append({"price":"29.99","sku":sku,"optionValues":[{"optionName":"Size","name":sz}]}); link[sku]={"variant_id":vid,"files":[{"type":"front","url":url}]}
    img=mock(902,var(902,None,'M'),'front',url,(4650,2475))
    P.append(dict(key='PJ-PERRITO',title='"Perrito Claus" Matching Family Christmas Dog Bandana',type='Pet Bandana',desc=PJD('Sublimated pet bandana collar (sizes S–XL); the whole family matches, even the dog! 🐶'),tags=['dog christmas bandana','matching family christmas','perrito claus','Family Christmas Pajamas'],options=["Size"],variants=vs,images=[{"url":img,"altText":"Perrito Claus dog bandana"}],link=link))
json.dump(P,open(OUT,'w'),indent=1,ensure_ascii=False); print('built',[p['key'] for p in P])

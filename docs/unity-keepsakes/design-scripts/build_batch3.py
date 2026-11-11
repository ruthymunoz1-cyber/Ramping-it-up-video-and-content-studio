# Build Shopify specs + Printful mockups for batch 3. Usage: build_batch3.py <commit> <out.json>
import json,subprocess,time,sys
H,OUT=sys.argv[1:3]
RAW=f'https://raw.githubusercontent.com/ruthymunoz1-cyber/Ramping-it-up-video-and-content-studio/{H}/docs/unity-keepsakes/print-files'
def api(m,p,b=None):
    while True:
        c=['curl','-sS','--max-time','90','-X',m,'https://api.printful.com'+p,'-H','Content-Type: application/json']
        if b: c+=['-d',json.dumps(b)]
        try: r=json.loads(subprocess.run(c,capture_output=True,text=True).stdout)
        except Exception: time.sleep(10); continue
        if r.get('code')==429: time.sleep(35); continue
        return r
CAT={}
def var(pid,color,size):
    if pid not in CAT: CAT[pid]=api('GET',f'/products/{pid}')['result']['variants']
    for v in CAT[pid]:
        if (color is None or v['color']==color) and (size is None or v['size']==size): return v['id']
    raise Exception(f'no variant {pid} {color} {size}')
def mock(pid,vids,placement,urlfor,area):
    w,h=area; out={}
    groups={}
    for v in vids: groups.setdefault(urlfor[v],[]).append(v)
    for url,vs in groups.items():
        r=api('POST',f'/mockup-generator/create-task/{pid}',{"variant_ids":vs,"format":"jpg","files":[{"placement":placement,"image_url":url,"position":{"area_width":w,"area_height":h,"width":w,"height":h,"top":0,"left":0}}]})
        k=r['result']['task_key']
        for _ in range(60):
            time.sleep(5); t=api('GET',f'/mockup-generator/task?task_key={k}')['result']
            if t['status'] in('completed','failed'): break
        for m in t.get('mockups',[]):
            for v in m['variant_ids']: out[v]=m['mockup_url']
    return out
P=[]
def apparel(key,title,ptype,pid,area,colors,sizes,filefor,prices,desc,tags,extra=None):
    variants=[];link={};rep={};urlfor={}
    opts=([extra[0]] if extra else [])+(["Color"] if len(colors)>1 or True else [])+["Size"]
    for ev in (extra[1] if extra else [None]):
        for col in colors:
            url=f"{RAW}/{filefor(ev,col)}"
            for sz in sizes:
                vid=var(pid,col,sz); sku=f"UK-{key}-{(ev.upper().replace(' ','')+'-') if ev else ''}{col.upper().replace(' ','')}-{sz.upper()}"
                ov=([{"optionName":extra[0],"name":ev}] if ev else [])+[{"optionName":"Color","name":col},{"optionName":"Size","name":sz}]
                variants.append({"price":prices.get(sz,prices['*']),"sku":sku,"optionValues":ov})
                link[sku]={"variant_id":vid,"files":[{"type":"front","url":url}]}
            r=var(pid,col,sizes[min(1,len(sizes)-1)]); rep[(ev,col)]=r; urlfor[r]=url
    mk=mock(pid,list(rep.values()),'front',urlfor,area)
    imgs=[{"url":mk[v],"altText":f"{title} – {(ev+' / ') if ev else ''}{c}"} for (ev,c),v in rep.items() if v in mk]
    P.append(dict(key=key,title=title,type=ptype,desc=desc,tags=tags,options=opts,variants=variants,images=imgs,link=link))
def simple(key,title,ptype,pid,placement,area,options,rows,desc,tags):
    # rows: list of (optionValues list, price, catalog variant id, file)
    variants=[];link={};urlfor={};rep=[]
    for ov,price,vid,f in rows:
        sku='UK-'+key+'-'+'-'.join(o[1].upper().replace(' ','').replace('.','').replace('/','') for o in ov)
        variants.append({"price":price,"sku":sku,"optionValues":[{"optionName":a,"name":b} for a,b in ov]})
        link[sku]={"variant_id":vid,"files":[{"type":placement,"url":f"{RAW}/{f}"}]}
        if vid not in urlfor: urlfor[vid]=f"{RAW}/{f}"; rep.append((ov,vid))
        elif urlfor[vid]!=f"{RAW}/{f}": pass
    # mock one per distinct (vid,file)
    imgs=[];seen=set()
    for ov,price,vid,f in rows:
        if (vid,f) in seen: continue
        seen.add((vid,f)); m=mock(pid,[vid],placement,{vid:f"{RAW}/{f}"},area)
        if vid in m: imgs.append({"url":m[vid],"altText":title+' – '+' / '.join(b for a,b in ov)})
    P.append(dict(key=key,title=title,type=ptype,desc=desc,tags=tags,options=options,variants=variants,images=imgs,link=link))
TEE_P={'*':'29.99','2XL':'31.99','3XL':'33.99','4XL':'35.99'}; TEE_S=['S','M','L','XL','2XL','3XL','4XL']
SW_P={'*':'44.99','2XL':'46.99','3XL':'48.99'}; SW_S=['S','M','L','XL','2XL','3XL']
LD=lambda base: (lambda e,c: f"batch3/{base}_{'light' if c in ('White','Natural') else 'dark'}.png")
step=sys.argv[3] if len(sys.argv)>3 else 'all'
if step in ('all','a'):
    apparel('HOLA-SWEAT','"Ho Ho ¡Hola!" Funny Bilingual Christmas Sweatshirt','Sweatshirt',145,(1800,2400),['Red','Forest Green','Navy'],SW_S,lambda e,c:'batch3/sweat_ho-ho-hola.png',SW_P,
      '<p><strong>Ho Ho ¡Hola! · Feliz Navidad</strong> 🎄 The bilingual Christmas sweatshirt for the family party, the office contest, or anyone who says Merry Christmas in two languages.</p><ul><li>Gildan 18000 unisex crewneck sweatshirt, cozy cotton-poly blend</li><li>Unisex sizing S–3XL</li></ul>',['ugly christmas sweater','funny christmas sweatshirt','spanish christmas','ho ho hola','Funny Christmas'])
    apparel('HOLA-YOUTH','"Ho Ho ¡Hola!" Kids Christmas Sweatshirt','Sweatshirt',677,(1500,1800),['Red','Navy','Black'],['XS','S','M','L','XL'],lambda e,c:'batch3/youth_ho-ho-hola.png',{'*':'36.99'},
      '<p><strong>Ho Ho ¡Hola!</strong> 🎄 The kids\' version, to match Mamá and Papá at the Christmas party.</p><ul><li>Gildan 18000B youth crewneck sweatshirt (youth XS–XL)</li></ul>',['kids christmas sweatshirt','matching family christmas','ho ho hola','Funny Christmas','Family Christmas Pajamas'])
    apparel('TAMALE-SWEAT','"It\'s Tamale Season" Bilingual Christmas Sweatshirt','Sweatshirt',145,(1800,2400),['Red','Forest Green','Black'],SW_S,lambda e,c:'batch3/sweat_tamale-season.png',SW_P,
      '<p><strong>It\'s Tamale Season · es temporada de tamales</strong> 🫔 For everyone whose Christmas starts with the tamalada.</p><ul><li>Gildan 18000 unisex crewneck sweatshirt</li><li>Unisex sizing S–3XL</li></ul>',['tamale season','tamales','funny christmas sweatshirt','mexican christmas','Funny Christmas'])
if step in ('all','b'):
    for k,t,base in [('FLUENT','"Fluent in Spanglish" Bilingual T-Shirt','tee_fluent-spanglish'),('AHORITA','"Ahorita" Definition Funny Spanglish T-Shirt','tee_ahorita'),('HABLO','"Hablo Spanglish" Funny Bilingual T-Shirt','tee_hablo-spanglish')]:
        apparel(k+'-TEE',t,'T-Shirt',71,(1800,2400),['White','Natural','Navy','Black'],TEE_S,LD(base),TEE_P,
          '<p>For the ones who switch languages mid-sentence. 😄 A fun gift for bilingual friends, teachers and language lovers.</p><ul><li>Bella+Canvas 3001 unisex tee, soft and lightweight</li><li>Unisex sizing S–4XL</li></ul>',['spanglish shirt','bilingual shirt','funny spanish shirt','latina shirt','Spanglish'])
    apparel('NOVIA-SWEAT','"Novia · Bride" Bilingual Bride Sweatshirt','Sweatshirt',145,(1800,2400),['White','Black'],SW_S,LD('sweat_novia'),SW_P,
      '<p><strong>Novia · Bride</strong> 💍 For getting ready, the bridal shower and the honeymoon.</p><ul><li>Gildan 18000 unisex crewneck sweatshirt</li><li>Unisex sizing S–3XL</li></ul>',['bride sweatshirt','novia','bridal shower gift','wedding','Weddings'])
    apparel('SQUAD-TEE','"Las Damas · Bride Squad" Bilingual Bridesmaid T-Shirt','T-Shirt',71,(1800,2400),['White','Black'],TEE_S,LD('tee_bride-squad'),TEE_P,
      '<p><strong>Las Damas · Bride Squad</strong> 💐 Matching shirts for the bridesmaids. Pair with the Novia sweatshirt for the bride.</p><ul><li>Bella+Canvas 3001 unisex tee</li><li>Unisex sizing S–4XL</li></ul>',['bride squad','bridesmaid shirt','bachelorette','damas','Weddings'])
if step in ('all','c'):
    simple('BABYXMAS','"Mi Primera Navidad – Baby\'s First Christmas" Baby Bodysuit','Baby Bodysuit',308,'front',(1050,1200),['Size'],
      [([('Size',s)],'24.99',var(308,'White',s),'batch3/baby_first-christmas.png') for s in ['3-6m','6-12m','12-18m']],
      '<p><strong>Mi Primera Navidad · Baby\'s First Christmas 2026</strong> 🎄 A bilingual keepsake for baby\'s very first Christmas.</p><ul><li>Bella+Canvas 100B baby short-sleeve one-piece, white</li></ul>',['baby first christmas','mi primera navidad','baby christmas outfit','Baby','Family Christmas Pajamas'])
    for k,t,base,tg in [('ORN-BABY','"Mi Primera Navidad – Baby\'s First Christmas" Ornament 2026','orn_baby-first-christmas',['baby first christmas ornament','mi primera navidad','new baby gift','Baby']),
                        ('ORN-MARRIED','"Nuestra Primera Navidad Casados – Our First Christmas Married" Ornament 2026','orn_married-christmas',['first christmas married','newlywed ornament','wedding gift','Weddings'])]:
        simple(k,t,'Ornament',881,'front',(954,954),['Shape'],
          [([('Shape','Circle')],'24.99',22782,f'batch3/{base}_circle.png'),([('Shape','Heart')],'24.99',22783,f'batch3/{base}_heart.png')],
          '<p>A bilingual Christmas keepsake, dated 2026. 🎄</p><ul><li>Glossy ceramic ornament, circle or heart (about 3″)</li><li>Gold string for hanging</li></ul>',tg+['Ornaments'])
    rows=[]
    for who,f in [('Sr. / Mr.','batch3/mug_sr-mr.png'),('Sra. / Mrs.','batch3/mug_sra-mrs.png')]:
        rows.append(([('Style',who),('Size','11 oz')],'21.99',1320,f)); rows.append(([('Style',who),('Size','15 oz')],'24.99',4830,f))
    simple('MRMRS','"Sr. & Sra. – Mr. & Mrs." Bilingual Wedding Mug','Drinkware',19,'default',(2700,1050),['Style','Size'],rows,
      '<p><strong>Sr. &amp; Sra. · Mr. &amp; Mrs.</strong> 💍 A bilingual wedding and anniversary gift. Order one of each for the happy couple.</p><ul><li>Glossy ceramic mug, 11 oz or 15 oz</li><li>Printed on both sides; dishwasher &amp; microwave safe</li></ul>',['mr and mrs mug','sr y sra','wedding gift','newlywed gift','Weddings'])
    apparel('ADORE-SWEAT','"O Come, Let Us Adore Him · Venid, Adoremos" Christmas Sweatshirt','Sweatshirt',145,(1800,2400),['Navy','Maroon','Forest Green'],SW_S[:5],lambda e,c:'batch2/sweatshirt_adore-classic.png',SW_P,
      '<p><em>O come, let us adore Him · Venid, adoremos</em><br>Christ the Lord · Cristo el Señor ✦</p><p>A classic, reverent Christmas sweatshirt in English and Spanish.</p><ul><li>Gildan 18000 unisex crewneck sweatshirt</li><li>Unisex sizing S–3XL</li></ul>',['christian christmas sweatshirt','o come let us adore him','church christmas','Faith · Fe'])
if step=='d':
    for k,name,cty in [('dr','KLK ¿Qué lo que?','República Dominicana'),('cuba','¿Qué Bolá, Asere?','Cuba'),('pr','¡Wepa! Boricua de Pura Cepa','Puerto Rico'),('venezuela','¿Qué Más, Chamo?','Venezuela'),('mexico','¡No Manches! ¡Qué Padre!','México'),('colombia','¿Qué Más, Parce?','Colombia')]:
        apparel('PRIDE-'+k.upper(),f'"{name}" {cty} Pride T-Shirt','T-Shirt',71,(1800,2400),['White','Natural','Navy','Black'],TEE_S,LD(f'countries/tee_{k}').__class__(lambda e,c,k=k: f"countries/tee_{k}_{'light' if c in ('White','Natural') else 'dark'}.png"),TEE_P,
          f'<p><strong>{name}</strong> · {cty} 💛 Wear your roots with pride, with the everyday greeting everyone back home knows.</p><ul><li>Bella+Canvas 3001 unisex tee, soft and lightweight</li><li>Unisex sizing S–4XL</li></ul>',[f'{cty.lower()} shirt','latino pride','heritage shirt','Orgullo · Heritage Pride'])
json.dump(P,open(OUT,'w'),indent=1,ensure_ascii=False); print('built',[p['key'] for p in P])

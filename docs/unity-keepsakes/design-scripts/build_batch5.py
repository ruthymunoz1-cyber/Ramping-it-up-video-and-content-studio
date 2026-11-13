# Batch 5 specs. Usage: build_batch5.py <commit> <out.json>   (reuses helpers from build_batch3.py)
import sys,os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_batch3.py')).read().split("step=sys.argv")[0])
B='batch5'
simple('MAT-KIDS','Bilingual Kids Placemat · Los Colores / Los Números · Spanish & English','Placemat',1400,'front',(2925,2325),['Design'],
 [([('Design','Los Colores · Colors')],'29.99',26727,f'{B}/mat_colores.png'),([('Design','Los Números · Numbers')],'29.99',26727,f'{B}/mat_numeros.png')],
 '<p>Learn at the table! 🍽️ Colors and numbers 1–10 in Spanish and English, perfect for bilingual homes, abuela’s house and dual-language classrooms.</p><ul><li>18″×14″ cotton placemat</li><li>Machine washable</li></ul>',['bilingual kids','learn spanish','kids placemat','spanish for kids','Bilingual Kids'])
simple('ORN-SACRAMENT','Bilingual Sacrament Keepsake Ornament · Mi Bautizo · Mi Primera Comunión','Ornament',881,'front',(954,954),['Design'],
 [([('Design','Mi Bautizo · Bendecido')],'24.99',22782,f'{B}/orn_bautizo.png'),([('Design','Mi Bautizo · Bendecida')],'24.99',22782,f'{B}/orn_bautiza.png'),([('Design','Mi Primera Comunión')],'24.99',22782,f'{B}/orn_comunion.png')],
 '<p>A keepsake for a holy day. ✝️ <em>Mi Bautizo · My Baptism</em> (Bendecido or Bendecida) and <em>Mi Primera Comunión · My First Communion</em>, in Spanish and English: a gift from Padrinos to treasure for years.</p><ul><li>Glossy round ceramic ornament with gold ribbon</li></ul>',['baptism ornament','bautizo','first communion','padrinos gift','Faith · Fe'])
simple('ORN-XV','"Mis Quince Años" Bilingual Quinceañera Keepsake Ornament','Ornament',881,'front',(954,954),['Design'],
 [([('Design','Mis Quince Años')],'24.99',22782,f'{B}/orn_xv.png')],
 '<p>👑 <em>Mis Quince Años · My Quinceañera.</em> A keepsake for the quinceañera, her court or her padrinos.</p><ul><li>Glossy round ceramic ornament with gold ribbon</li></ul>',['quinceanera gift','xv años','quince','Heritage'])
simple('ORN-PET','"Siempre en mi corazón" Pet Memorial Ornament · Forever in my heart','Ornament',881,'front',(978,972),['Shape'],
 [([('Shape','Heart')],'24.99',22783,f'{B}/orn_pet.png')],
 '<p>🐾 <em>Siempre en mi corazón · Forever in my heart.</em> A gentle bilingual keepsake to remember a beloved pet.</p><ul><li>Glossy heart-shaped ceramic ornament with gold ribbon</li></ul>',['pet memorial','pet loss gift','dog memorial','cat memorial','Pets · Mascotas'])
apparel('NOSABO-TEE','"No Sabo Kid · pero entiendo todo" Funny Spanglish T-Shirt','T-Shirt',71,(1800,2400),['White','Natural','Navy','Black'],TEE_S,
 lambda e,c: f"{B}/tee_nosabo_{'light' if c in ('White','Natural') else 'dark'}.png",TEE_P,
 '<p><strong>NO SABO KID</strong> · <em>pero entiendo todo</em> (but I understand everything) 😄 For every second-gen kid who understands every word abuela says.</p><ul><li>Bella+Canvas 3001 unisex tee</li><li>Unisex sizing S–4XL</li></ul>',['no sabo kid','spanglish shirt','funny spanish shirt','latino humor','Spanglish Humor'])
# Board book: cover + 10 spreads
files=[{"type":"cover","url":f"{RAW}/{B}/book_cover.png"}]+[{"type":f"spread_{i}","url":f"{RAW}/{B}/book_spread{i}.png"} for i in range(1,11)]
pos=lambda w,h:{"area_width":w,"area_height":h,"width":w,"height":h,"top":0,"left":0}
r=api('POST','/mockup-generator/create-task/1556',{"variant_ids":[49335],"format":"jpg","files":[{"placement":"cover","image_url":files[0]['url'],"position":pos(3863,1875)},{"placement":"spread_1","image_url":files[1]['url'],"position":pos(3675,1875)},{"placement":"spread_3","image_url":files[3]['url'],"position":pos(3675,1875)}]})
k=r['result']['task_key']
for _ in range(60):
    time.sleep(6); t=api('GET',f'/mockup-generator/task?task_key={k}')['result']
    if t['status'] in('completed','failed'): break
imgs=[]
for m in t.get('mockups',[]):
    imgs.append({"url":m['mockup_url'],"altText":'Mis Colores bilingual board book'})
    imgs+=[{"url":e['url'],"altText":'Mis Colores bilingual board book'} for e in m.get('extra',[])[:1]]
P.append(dict(key='BOOK-COLORES',title='"Mis Colores · My Colors" Bilingual Baby Board Book · Spanish & English',type='Board Book',
 tags=['bilingual baby book','spanish board book','baby shower gift','learn spanish','Bilingual Kids'],
 desc='<p>Baby’s first colors in two languages. 📚 Ten bright colors (rojo, azul, amarillo and more), each on its own spread with the word in Spanish and English.</p><ul><li>6″×6″ sturdy board book, 20 pages</li><li>Rounded corners, made for little hands</li><li>A perfect baby shower or bautizo gift</li></ul>',
 options=['Language'],variants=[{"price":"34.99","sku":"UK-BOOK-COLORES","optionValues":[{"optionName":"Language","name":"Español · English"}]}],images=imgs[:5],
 link={"UK-BOOK-COLORES":{"variant_id":49335,"files":files}}))
json.dump(P,open(OUT,'w'),ensure_ascii=False)
print([(p['key'],len(p['variants']),len(p['images'])) for p in P])

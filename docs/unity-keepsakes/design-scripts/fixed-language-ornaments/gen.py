import os,sys
OUT=sys.argv[1]; os.makedirs(OUT+'/html',exist_ok=True)
FONTS='<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Great+Vibes&family=Montserrat:wght@500&family=Noto+Serif+SC:wght@600;900&family=Noto+Serif+TC:wght@600;900&display=swap" rel="stylesheet">'
def first(script,l1,l2,names=None,blank=False,css=''):
    mid=''
    if names is not None or blank:
        nm = '' if blank else names
        body=f'''<div class="star">✦</div>
<div class="big" style="font-size:155px;letter-spacing:4px">{script.upper()} {l1}<br>{l2}</div>
<div class="en">Our First Christmas</div>
<div class="script" style="font-size:300px;margin-top:40px;min-height:300px">{nm}</div>
<div class="small">2026</div>'''
    else:
        body=f'''<div class="star">✦</div><div class="script">{script}</div>
<div class="big">{l1}<br>{l2}</div><div class="en">Our First Christmas</div><div class="small">2026</div>'''
    return f'''<html><head>{FONTS}<style>body{{margin:0}}
.c{{width:3000px;height:3000px;background:radial-gradient(circle at 50% 40%,#16405a,#0b2233);position:relative;overflow:hidden;font-family:'Playfair Display';color:#f3e6c4;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}}
.ring{{position:absolute;inset:330px;border:14px solid #d9b56b;border-radius:50%}}.ring2{{position:absolute;inset:390px;border:4px solid #d9b56b88;border-radius:50%}}
.script{{font-family:'Great Vibes';font-size:330px;color:#e8c77d;line-height:1}}
.big{{font-size:260px;font-weight:600;letter-spacing:6px;line-height:1.05}}
.small{{font-family:'Montserrat';font-size:110px;letter-spacing:22px;color:#d9b56b;margin-top:40px}}
.en{{font-style:italic;font-size:140px;color:#f3e6c4cc;margin-top:30px}}.star{{font-size:150px;color:#e8c77d;margin-bottom:20px}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(#ffffff55 6px,transparent 7px);background-size:260px 260px;opacity:.35}}
{css}</style></head><body><div class="c"><div class="dots"></div><div class="ring"></div><div class="ring2"></div>{body}</div></body></html>'''
def fam(greet,fam_line,css=''):
    return f'''<html><head>{FONTS}<style>body{{margin:0}}
.c{{width:3000px;height:3000px;background:#f7f1e5;position:relative;overflow:hidden;font-family:'Playfair Display';color:#8c1d2b;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}}
.ring{{position:absolute;inset:330px;border:12px solid #2f5d3a;border-radius:50%}}
.script{{font-family:'Great Vibes';font-size:310px;line-height:1.1;color:#8c1d2b}}
.div{{display:flex;align-items:center;gap:40px;margin:30px 0;color:#2f5d3a;font-size:110px}}.div span{{display:block;width:420px;height:8px;background:#2f5d3a}}
.en{{font-family:'Montserrat';font-size:130px;letter-spacing:20px;color:#2f5d3a}}
.fam{{font-style:italic;font-size:150px;margin-top:70px;color:#8c1d2b;min-height:200px}}.holly{{font-size:160px;margin-bottom:30px;color:#2f5d3a}}
{css}</style></head><body><div class="c"><div class="ring"></div><div class="holly">✦</div>
<div class="script">{greet}</div><div class="div"><span></span>✦<span></span></div>
<div class="en">MERRY CHRISTMAS</div><div class="fam">{fam_line}</div></div></body></html>'''
CF=lambda f: """.script{font-family:'XX';font-weight:600;font-size:200px;letter-spacing:30px;margin-bottom:30px}.big{font-family:'XX';font-weight:900;font-size:280px;letter-spacing:40px;line-height:1.2}""".replace('XX',f)
CA=lambda f: """.script{font-family:'XX';font-weight:900;font-size:300px;letter-spacing:40px}.fam{font-family:'XX';font-style:normal;font-weight:600;letter-spacing:20px}""".replace('XX',f)
D={
 'first-christmas_spanish':first('Nuestra','PRIMERA','NAVIDAD'),
 'first-christmas_french':first('Notre','PREMIER','NOËL'),
 'first-christmas_portuguese':first('Nosso','PRIMEIRO','NATAL'),
 'first-christmas_italian':first('Il Nostro','PRIMO','NATALE'),
 'family_spanish':fam('Feliz Navidad','La Familia · 2026'),
 'family_french':fam('Joyeux Noël','La Famille · 2026'),
 'family_portuguese':fam('Feliz Natal','A Família · 2026'),
 'family_italian':fam('Buon Natale','La Famiglia · 2026'),
 'PERSONALIZED_first-christmas_spanish_SAMPLE':first('Nuestra','PRIMERA','NAVIDAD',names='Ana &amp; Luis'),
 'PERSONALIZED_first-christmas_spanish_BLANK-BASE':first('Nuestra','PRIMERA','NAVIDAD',blank=True),
 'PERSONALIZED_family_spanish_SAMPLE':fam('Feliz Navidad','Familia García · 2026'),
 'PERSONALIZED_family_spanish_BLANK-BASE':fam('Feliz Navidad',''),
}
D={
 'first-christmas_chinese-simplified':first('我们的','第一个','圣诞节',css=CF('Noto Serif SC')),
 'first-christmas_chinese-traditional':first('我們的','第一個','聖誕節',css=CF('Noto Serif TC')),
 'family_chinese-simplified':fam('圣诞快乐','阖家欢乐 · 2026',css=CA('Noto Serif SC')),
 'family_chinese-traditional':fam('聖誕快樂','闔家歡樂 · 2026',css=CA('Noto Serif TC')),
} if len(sys.argv)>2 else D
for k,v in D.items(): open(f'{OUT}/html/{k}.html','w').write(v)
print(' '.join(D))

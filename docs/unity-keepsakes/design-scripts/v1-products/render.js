const {chromium}=require('playwright');const fs=require('fs');const [src,out,scale,transparent,txt,acc]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();let h=fs.readFileSync(src,'utf8');if(txt)h=h.replace('TXT',txt).replace('ACC',acc);
const tmp=out+'.tmp.html';fs.writeFileSync(tmp,h);
const p=await b.newPage({viewport:{width:4000,height:4800},deviceScaleFactor:+scale});await p.goto('file://'+tmp);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1000);
await (await p.$('.c')).screenshot({path:out,omitBackground:transparent==='1'});fs.unlinkSync(tmp);await b.close()})();

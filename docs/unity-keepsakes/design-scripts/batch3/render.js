const {chromium}=require('playwright');const fs=require('fs');const dir=process.argv[2];const jobs=JSON.parse(fs.readFileSync(dir+'/jobs.json'));
(async()=>{const b=await chromium.launch();
for(const [k,[w,h,tr]] of Object.entries(jobs)){const sc=(k.startsWith('mug')||k.startsWith('orn'))?1:2;
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:sc});await p.goto('file://'+dir+'/html/'+k+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
await (await p.$('.c')).screenshot({path:dir+'/'+k+'.png',omitBackground:tr});await p.close();}
await b.close()})();

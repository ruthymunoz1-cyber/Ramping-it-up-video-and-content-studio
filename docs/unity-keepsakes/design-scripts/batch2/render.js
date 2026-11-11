const {chromium}=require('playwright');const fs=require('fs');const dir=process.argv[2];const jobs=JSON.parse(fs.readFileSync(dir+'/jobs.json'));
(async()=>{const b=await chromium.launch();
for(const k of jobs){const tee=!k.startsWith('mug');const p=await b.newPage({viewport:{width:2800,height:2500},deviceScaleFactor:tee?2:1});
await p.goto('file://'+dir+'/html/'+k+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
await (await p.$('.c')).screenshot({path:dir+'/'+k+'.png',omitBackground:tee});await p.close();}
await b.close()})();

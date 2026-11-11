const {chromium}=require('playwright');const fs=require('fs');const dir=process.argv[2];const jobs=JSON.parse(fs.readFileSync(dir+'/jobs.json'));
(async()=>{const b=await chromium.launch();for(const k of jobs){const p=await b.newPage({viewport:{width:1800,height:2400},deviceScaleFactor:2});
await p.goto('file://'+dir+'/html/'+k+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await (await p.$('.c')).screenshot({path:dir+'/'+k+'.png',omitBackground:true});await p.close();}await b.close()})();

// jobs.json: [{name, w, h}] ; renders html/<name>.html at w x h (viewport w/2, scale 2)
const {chromium}=require('playwright');const fs=require('fs');const dir=process.argv[2];const jobs=JSON.parse(fs.readFileSync(dir+'/jobs.json'));
(async()=>{const b=await chromium.launch();for(const j of jobs){const p=await b.newPage({viewport:{width:Math.round(j.w/2),height:Math.round(j.h/2)},deviceScaleFactor:2});
await p.goto('file://'+dir+'/html/'+j.name+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
await p.screenshot({path:dir+'/'+j.name+'.png',clip:{x:0,y:0,width:Math.round(j.w/2),height:Math.round(j.h/2)},omitBackground:!!j.transparent});await p.close();}await b.close()})();

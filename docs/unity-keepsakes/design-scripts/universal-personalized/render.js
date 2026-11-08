const {chromium}=require('playwright');const fs=require('fs');const dir=process.argv[2];const jobs=JSON.parse(fs.readFileSync(dir+'/jobs.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:3000,height:3000}});
for(const [f,n] of jobs){await p.goto('file://'+dir+'/html/'+f+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);
await p.screenshot({path:dir+'/'+f+'.png',omitBackground:n.startsWith('CLEAR')});}
await b.close()})();

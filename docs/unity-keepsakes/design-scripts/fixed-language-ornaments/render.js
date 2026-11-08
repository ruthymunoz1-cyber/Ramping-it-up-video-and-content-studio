const {chromium}=require('playwright');const [dir,...names]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:3000,height:3000}});
for(const n of names){await p.goto('file://'+dir+'/html/'+n+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);await p.screenshot({path:dir+'/'+n+'.png'});}
await b.close()})();

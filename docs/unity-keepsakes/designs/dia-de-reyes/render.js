const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(dir, 'cards.html'));
  for (const id of ['c1', 'c2', 'c3']) { await p.locator('#' + id).screenshot({ path: path.join(dir, id + '.png') }); }
  await b.close();
  console.log('done');
})();

// P0 capture: records the original's rendered DOM, computed style of key nodes and fonts per route.
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2] || 'https://predicting.top';
const out = process.argv[3] || 'reference/dom';
const routes = JSON.parse(fs.readFileSync('evals/routes.json','utf8'));
fs.mkdirSync(out,{recursive:true});
const b = await chromium.launch();
for (const [vp,w,h] of [['d',1440,900],['m',390,844]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h}, colorScheme:'dark'});
  const p = await ctx.newPage();
  for (const r of routes) {
    try { await p.goto(base+r.path,{waitUntil:'networkidle',timeout:45000}); } catch { console.log('timeout',r.name); }
    await p.waitForTimeout(2500);
    const html = await p.evaluate(() => document.querySelector('#root')?.outerHTML || document.body.outerHTML);
    fs.writeFileSync(`${out}/${r.name}_${vp}.html`, html);
    if (vp==='d') {
      const meta = await p.evaluate(() => ({
        title: document.title,
        fonts: [...document.fonts].filter(f=>f.status==='loaded').map(f=>`${f.family} ${f.weight} ${f.style}`),
        bodyFont: getComputedStyle(document.body).fontFamily,
        links: [...document.querySelectorAll('link[rel=stylesheet],link[rel=preconnect],link[rel=preload]')].map(l=>l.outerHTML),
        htmlClass: document.documentElement.className,
      }));
      fs.writeFileSync(`${out}/${r.name}_meta.json`, JSON.stringify(meta,null,1));
    }
    console.log(r.name, vp, html.length);
  }
  await ctx.close();
}
await b.close();

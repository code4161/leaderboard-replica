// Live smoke: loads the deployed site in a real browser with no interception, so the replica's own API serves the data.
//   node evals/live_smoke.mjs https://<replica>
import { chromium } from 'playwright'; import fs from 'node:fs';
const base = process.argv[2]; const b = await chromium.launch(); const results = [];
const pages = [['/', 'tbody tr', 20], ['/polymarket', 'tbody tr', 20], ['/kalshi', 'tbody tr', 20], ['/account/Mitchieboi', '.recharts-surface', 1], ['/account/0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1', '.recharts-surface', 1], ['/battle', '.recharts-surface', 1], ['/api-docs', 'h1,h2', 2], ['/submit', 'form input', 2], ['/terms', 'h1,h2', 2]];
for (const [path, sel, min] of pages) {
  const p = await b.newPage(); const errors = []; const failed = [];
  p.on('pageerror', (e) => errors.push(String(e))); p.on('response', (r) => { if (r.url().startsWith(base + '/api/') && r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(base, '')}`); });
  await p.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  const n = await p.locator(sel).count(); const ok = n >= min && errors.length === 0 && failed.length === 0;
  results.push({ path, ok, count: n, errors, failed: failed.slice(0, 5) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${path} ${sel} x${n}${errors.length ? ' errors ' + errors[0] : ''}${failed.length ? ' api ' + failed.slice(0, 3).join(', ') : ''}`);
  await p.close();
}
await b.close(); const pass = results.every((r) => r.ok);
fs.writeFileSync('evals/out/live_smoke.json', JSON.stringify({ at: new Date().toISOString(), base, pass, results }, null, 1));
console.log(`LIVE SMOKE: ${pass ? 'PASS' : 'FAIL'}`); process.exit(pass ? 0 : 1);

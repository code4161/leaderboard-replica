// Differential parity eval: the original and the replica run the same scenario on the same recorded data.
// Three detectors per scenario and viewport: DOM structure, computed style and geometry, pixels.
//   node evals/parity.mjs [--only home,kalshi] [--vp d|m] [--selftest]
import fs from 'node:fs'; import { chromium } from 'playwright'; import { diffArrays } from 'diff';
import pixelmatch from 'pixelmatch'; import { PNG } from 'pngjs';
import { ORIGINAL, REPLICA, OUT, openSite, settle, runSteps, domLines, styleProbe } from './lib.mjs';

const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const T = JSON.parse(fs.readFileSync('evals/thresholds.json', 'utf8'));
const VPS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };
const only = arg('--only')?.split(','); const vpOnly = arg('--vp'); const selftest = process.argv.includes('--selftest');
let scenarios = JSON.parse(fs.readFileSync('evals/scenarios.json', 'utf8'));
if (fs.existsSync('evals/scenarios')) for (const f of fs.readdirSync('evals/scenarios').filter((f) => f.endsWith('.json')).sort()) scenarios.push(...JSON.parse(fs.readFileSync('evals/scenarios/' + f, 'utf8')));
if (only) scenarios = scenarios.filter((s) => only.includes(s.name));
fs.mkdirSync(`${OUT}/diff`, { recursive: true });

async function observe(browser, origin, sc, vp, plant) {
  const { ctx, page, errors } = await openSite(browser, origin, VPS[vp], { theme: sc.theme || 'dark' });
  let failure = null;
  try {
    await page.goto(origin + sc.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page); await runSteps(page, sc.steps);
    if (plant) await page.evaluate(plant);
  } catch (e) { failure = String(e).split('\n')[0]; }
  const obs = { dom: await domLines(page).catch(() => []), style: await styleProbe(page).catch(() => []), png: await page.screenshot({ fullPage: false }), errors, failure, url: page.url().replace(origin, '') , title: await page.title() };
  await ctx.close(); return obs;
}

function compare(a, b, tag) {
  const parts = diffArrays(a.dom, b.dom); let same = 0; const out = [];
  for (const p of parts) { if (!p.added && !p.removed) same += p.count; else for (const l of p.value) out.push((p.removed ? '- ' : '+ ') + l); }
  const domSim = same / Math.max(a.dom.length, b.dom.length, 1);
  fs.writeFileSync(`${OUT}/diff/${tag}.dom.diff`, `# - original   + replica   (${out.length} differing lines of ${a.dom.length}/${b.dom.length})\n` + out.join('\n'));
  const sb = new Map(b.style.map((s) => [s.key, s])); const sd = [];
  for (const s of a.style) { const o = sb.get(s.key); if (!o) { sd.push(`${s.key}: missing in replica`); continue; }
    const bad = Object.keys(s).filter((k) => k !== 'key' && (typeof s[k] === 'number' ? Math.abs(s[k] - o[k]) > 1 : s[k] !== o[k]));
    if (bad.length) sd.push(`${s.key}: ` + bad.map((k) => `${k} ${s[k]} -> ${o[k]}`).join('; ')); }
  const styleRatio = sd.length / Math.max(a.style.length, 1);
  fs.writeFileSync(`${OUT}/diff/${tag}.style.diff`, `# original -> replica (${sd.length} of ${a.style.length} probes differ)\n` + sd.join('\n'));
  const A = PNG.sync.read(a.png), B = PNG.sync.read(b.png); let pix = 1;
  if (A.width === B.width && A.height === B.height) { const D = new PNG({ width: A.width, height: A.height }); pix = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.1 }) / (A.width * A.height); fs.writeFileSync(`${OUT}/diff/${tag}.diff.png`, PNG.sync.write(D)); }
  fs.writeFileSync(`${OUT}/diff/${tag}.original.png`, a.png); fs.writeFileSync(`${OUT}/diff/${tag}.replica.png`, b.png);
  const checks = { dom: domSim >= T.dom_min_similarity, style: styleRatio <= T.style_max_mismatch_ratio, pixel: pix <= T.pixel_max_diff_ratio, errors: b.errors.length <= T.replica_console_errors_max, ran: !b.failure, url: a.url === b.url };
  return { tag, domSim: +domSim.toFixed(4), styleRatio: +styleRatio.toFixed(4), pixel: +pix.toFixed(4), replicaErrors: b.errors.slice(0, 3), failure: b.failure, originalFailure: a.failure, checks, pass: Object.values(checks).every(Boolean) };
}

const browser = await chromium.launch(); const results = [];
if (selftest) {
  // A detector that cannot fail proves nothing. Noise floor: original against itself must pass.
  // Planted defects: a recoloured title, a 3px nudge and a removed row must each be caught.
  const sc = scenarios.find((s) => s.name === 'home') || scenarios[0];
  const base = await observe(browser, ORIGINAL, sc, 'd'); const again = await observe(browser, ORIGINAL, sc, 'd');
  const floor = compare(base, again, 'selftest_floor');
  const plants = { recolour: () => { document.querySelector('h1').style.color = 'rgb(255,0,0)'; }, nudge: () => { document.querySelector('table,main,section,div div').style.marginLeft = '3px'; }, removed: () => { document.querySelector('tbody tr, li, section')?.remove(); } };
  const caught = {};
  for (const [n, f] of Object.entries(plants)) { const r = compare(base, await observe(browser, ORIGINAL, sc, 'd', f), 'selftest_' + n); caught[n] = { dom: !r.checks.dom || r.domSim < 1, style: r.styleRatio > 0, pixel: r.pixel > 0, failedGate: !r.pass, domSim: r.domSim, styleRatio: r.styleRatio, pixelRatio: r.pixel }; }
  const ok = floor.pass && Object.values(caught).every((c) => c.failedGate) && caught.recolour.style && caught.recolour.pixel && caught.nudge.style && caught.removed.dom;
  fs.writeFileSync(`${OUT}/selftest.json`, JSON.stringify({ at: new Date().toISOString(), floor, caught, ok }, null, 1));
  console.log(JSON.stringify({ floor: { domSim: floor.domSim, styleRatio: floor.styleRatio, pixel: floor.pixel, pass: floor.pass }, caught, ok }, null, 1));
  await browser.close(); process.exit(ok ? 0 : 1);
}
for (const sc of scenarios) for (const vp of Object.keys(VPS)) {
  if (vpOnly && vp !== vpOnly) continue; if (sc.viewports && !sc.viewports.includes(vp)) continue;
  const [a, b] = await Promise.all([observe(browser, ORIGINAL, sc, vp), observe(browser, REPLICA, sc, vp)]);
  const r = compare(a, b, `${sc.name}_${vp}`); results.push(r);
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.tag.padEnd(28)} dom ${r.domSim} style ${r.styleRatio} pixel ${r.pixel}${r.failure ? ' step-failure: ' + r.failure : ''}${r.replicaErrors.length ? ' errors: ' + r.replicaErrors[0].slice(0, 90) : ''}${r.originalFailure ? ' ORIGINAL-FAILED: ' + r.originalFailure : ''}`);
}
await browser.close();
const pass = results.length > 0 && results.every((r) => r.pass);
if (!only && !vpOnly) fs.writeFileSync(`${OUT}/parity.json`, JSON.stringify({ at: new Date().toISOString(), original: ORIGINAL, replica: REPLICA, thresholds: T, pass, results }, null, 1));
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} scenarios pass. Diffs: ${OUT}/diff/<scenario>_<vp>.{dom,style}.diff`);
process.exit(pass ? 0 : 1);

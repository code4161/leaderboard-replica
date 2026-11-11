// API contract eval: the replica's API must answer like the original's on every documented route.
// Compares status, content type and the JSON shape (keys and value types, arrays by their first element), not values, since data moves.
//   node evals/api_contract.mjs --base https://<replica>
import fs from 'node:fs';
const base = process.argv[process.argv.indexOf('--base') + 1]; const ORIGINAL = process.env.ORIGINAL || 'https://predicting.top';
const W = '0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1';
const GET = ['leaderboard', 'leaderboard?period=1d', 'leaderboard?period=all', 'leaderboard?period=bogus', 'embed/leaderboard', 'kalshi-leaderboard?period=30d&limit=5', 'daily-profit', 'm/insights?period=24h&limit=3', `trader/${W}`, 'trader/Mitchieboi', 'trader/this-user-does-not-exist-zz9', `trader/${W}/positions?limit=3`, `trader/${W}/trades?limit=3`, 'kalshi/aenews/categories', 'battle/comparison'];
const shape = (x, d = 0) => Array.isArray(x) ? [x.length ? shape(x[0], d + 1) : 'empty'] : x && typeof x === 'object' ? (d > 4 ? 'object' : Object.fromEntries(Object.keys(x).sort().map((k) => [k, shape(x[k], d + 1)]))) : x === null ? 'null' : typeof x;
// A field that is null for one trader and a string for the next is one shape, so null matches any type.
const same = (a, b) => a === 'null' || b === 'null' || a === 'empty' || b === 'empty' ? true : typeof a !== typeof b ? false : Array.isArray(a) ? Array.isArray(b) && same(a[0], b[0]) : typeof a === 'object' ? JSON.stringify(Object.keys(a)) === JSON.stringify(Object.keys(b)) && Object.keys(a).every((k) => same(a[k], b[k])) : a === b;
const get = async (o, p, init) => { for (let attempt = 0; ; attempt++) { try { return await once(o, p, init); } catch (e) { if (attempt === 1) return { status: 0, type: 'unreachable: ' + e.name, json: null, cache: null }; } } };
const once = async (o, p, init) => { const r = await fetch(`${o}/api/${p}`, { ...init, headers: { 'user-agent': 'Mozilla/5.0 replica-evals', ...(init?.headers || {}) }, signal: AbortSignal.timeout(40000) }); const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not json */ } return { status: r.status, type: (r.headers.get('content-type') || '').split(';')[0], json, cache: r.headers.get('cache-control') }; };
const results = [];
for (const p of GET) {
  const [a, b] = await Promise.all([get(ORIGINAL, p), get(base, p)]);
  const ok = a.status === b.status && a.type === b.type && same(shape(a.json), shape(b.json));
  results.push({ route: 'GET ' + p, ok, original: a.status, replica: b.status }); console.log(`${ok ? 'PASS' : 'FAIL'} GET ${p}  ${a.status}/${b.status}${a.status === 0 ? ' original ' + a.type : ''}${b.status === 0 ? ' replica ' + b.type : ''}`);
}
// Replica-only rules: unknown and traversal paths are refused, writes are answered locally, reads are cached at the edge.
const checks = [
  ['GET unknown route is 404', async () => (await get(base, 'admin/users')).status === 404],
  ['GET path traversal is 404', async () => (await get(base, 'trader/..%2F..%2Fetc')).status === 404],
  ['POST submissions answered locally', async () => { const r = await get(base, 'submissions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); return r.status === 200 && r.json?.replica === true; }],
  ['unknown query parameter is 400', async () => (await get(base, 'leaderboard?cachebust=1')).status === 400],
  ['dot segment is 404', async () => (await get(base, 'kalshi/./history')).status === 404],
  ['nosniff on API responses', async () => (await fetch(base + '/api/daily-profit')).headers.get('x-content-type-options') === 'nosniff'],
  ['DELETE is 405', async () => (await get(base, 'leaderboard', { method: 'DELETE' })).status === 405],
  // The host consumes the s-maxage directive and strips it from what a visitor sees, so the proof of caching is a second request served from the edge.
  ['read route is served from the edge cache on a repeat request', async () => { await fetch(base + '/api/daily-profit'); const r = await fetch(base + '/api/daily-profit'); return /HIT|STALE/.test(r.headers.get('x-vercel-cache') || '') || /s-maxage=\d+/.test(r.headers.get('cache-control') || ''); }],
  ['noindex header on pages', async () => /noindex/.test((await fetch(base + '/')).headers.get('x-robots-tag') || '')],
];
for (const [name, f] of checks) { let ok = false; try { ok = await f(); } catch { ok = false; } results.push({ route: name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); }
const pass = results.every((r) => r.ok); fs.mkdirSync('evals/out', { recursive: true });
fs.writeFileSync('evals/out/api_contract.json', JSON.stringify({ at: new Date().toISOString(), base, pass, results }, null, 1));
console.log(`\nAPI CONTRACT: ${pass ? 'PASS' : 'FAIL'} ${results.filter((r) => r.ok).length}/${results.length}`); process.exit(pass ? 0 : 1);

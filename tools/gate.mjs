// P3 gate. Runs every deterministic check in order on the production build and records the result for the exact tree.
//   node tools/gate.mjs [--skip-selftest]
import { spawn, spawnSync } from 'node:child_process'; import fs from 'node:fs'; import { treeHash } from './treehash.mjs';
const steps = []; const t0 = Date.now();
function run(name, cmd, args, opts = {}) {
  const s = Date.now(); const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
  const out = ((r.stdout || '') + (r.stderr || '')).trim(); const ok = r.status === 0;
  steps.push({ name, ok, seconds: +((Date.now() - s) / 1000).toFixed(1), tail: out.split('\n').slice(-12).join('\n') });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) console.log(out.split('\n').slice(-40).join('\n'));
  return ok;
}
const tree = treeHash(); let ok = true;
ok = run('typecheck', 'npx', ['tsc', '--noEmit'], { cwd: 'app' }) && ok;
ok = run('lint', 'npx', ['eslint', 'src', 'api', '--max-warnings', '0'], { cwd: 'app' }) && ok;
ok = run('unit', 'npx', ['vitest', 'run'], { cwd: 'app' }) && ok;
const built = run('build', 'npx', ['vite', 'build'], { cwd: 'app' }); ok = built && ok;
if (built) {
  const srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: 'app', stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 3000));
  try {
    if (!process.argv.includes('--skip-selftest')) ok = run('parity self-test (planted defects must fail)', 'node', ['evals/parity.mjs', '--selftest']) && ok;
    ok = run('parity (all scenarios, both viewports, production build)', 'node', ['evals/parity.mjs'], { env: { ...process.env, REPLICA: 'http://localhost:4173' } }) && ok;
    // The parity run recorded every API call both sites made; the production allowlist must admit each one.
    ok = run('record API calls seen in parity', 'node', ['tools/recorded_calls.mjs']) && ok;
    ok = run('production allowlist admits every recorded call', 'npx', ['vitest', 'run', 'api/allowlist.fixtures.test.ts'], { cwd: 'app' }) && ok;
  } finally { srv.kill(); }
}
const parity = fs.existsSync('evals/out/parity.json') ? JSON.parse(fs.readFileSync('evals/out/parity.json', 'utf8')) : null;
fs.mkdirSync('evals/out', { recursive: true });
fs.writeFileSync('evals/out/gate.json', JSON.stringify({ at: new Date().toISOString(), tree, pass: ok && tree === treeHash(), seconds: +((Date.now() - t0) / 1000).toFixed(0), scenarios: parity ? `${parity.results.filter((r) => r.pass).length}/${parity.results.length}` : null, steps }, null, 1));
console.log(`\nGATE: ${ok ? 'PASS' : 'FAIL'} tree ${tree}`); process.exit(ok ? 0 : 1);

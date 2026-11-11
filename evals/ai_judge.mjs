// AI eval: a blind vision judge. It gets two unlabelled screenshots of the same page in random order and a rubric,
// and must list every visible difference. It is never told which is the original or what was built.
// Control: one pair carries a planted defect (from the parity self-test). A judge that calls that pair identical is not judging,
// and the whole run is void.
//   node evals/ai_judge.mjs [--only home_d,kalshi_d] [--model sonnet]
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const DIFF = path.resolve('evals/out/diff'); const model = arg('--model', 'sonnet');
const only = arg('--only', '')?.split(',').filter(Boolean);
let tags = fs.readdirSync(DIFF).filter((f) => f.endsWith('.original.png') && !f.startsWith('selftest')).map((f) => f.replace('.original.png', ''));
if (only.length) tags = tags.filter((t) => only.includes(t));
const RUBRIC = `You are comparing two screenshots of the same web page, image A and image B. Read both files, then compare them region by region: header, controls, table or main content, each row's alignment, fonts and weights, colours, spacing, icons and images, charts, footer.
List every visible difference. For each give the region, what differs, and a severity: "major" (missing, extra or wrong content or component; layout shift a user would notice), "minor" (a few pixels of spacing, a slight colour or weight difference), "none" is not a severity: if you see no difference, return an empty list.
Do not guess at differences you cannot see. Reply with JSON only: {"differences":[{"region":"","what":"","severity":"major|minor"}],"identical":true|false}`;
function judge(a, b) {
  const env = { ...process.env }; delete env.ANTHROPIC_API_KEY;
  const r = spawnSync('claude', ['-p', `${RUBRIC}\n\nImage A: ${a}\nImage B: ${b}`, '--model', model, '--allowedTools', 'Read', '--output-format', 'json'], { encoding: 'utf8', env, cwd: DIFF, timeout: 240000 });
  try { const text = JSON.parse(r.stdout).result; return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { return { error: (r.stderr || r.stdout || 'no output').slice(0, 300) }; }
}
const results = [];
const control = judge(path.join(DIFF, 'selftest_removed.original.png'), path.join(DIFF, 'selftest_removed.replica.png'));
const controlCaught = !control.error && control.identical === false && (control.differences || []).length > 0;
console.log(`${controlCaught ? 'PASS' : 'FAIL'} control (planted defect must be reported): ${JSON.stringify(control).slice(0, 200)}`);
for (const t of tags) {
  const flip = Math.random() < 0.5; const o = path.join(DIFF, `${t}.original.png`), r = path.join(DIFF, `${t}.replica.png`);
  const v = judge(flip ? r : o, flip ? o : r); const major = (v.differences || []).filter((d) => d.severity === 'major');
  const ok = !v.error && major.length === 0; results.push({ tag: t, order: flip ? 'A=replica' : 'A=original', ok, verdict: v });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${t}: ${v.error ? 'error ' + v.error : `${(v.differences || []).length} differences, ${major.length} major`}`);
}
const pass = controlCaught && results.every((r) => r.ok);
fs.writeFileSync('evals/out/ai_judge.json', JSON.stringify({ at: new Date().toISOString(), model, controlCaught, control, pass, results }, null, 1));
console.log(`\nAI JUDGE: ${pass ? 'PASS' : controlCaught ? 'FAIL' : 'VOID (control not caught)'}`); process.exit(pass ? 0 : 1);

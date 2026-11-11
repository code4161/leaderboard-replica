// Content hash of everything that decides what ships and how it is judged. The gate records it; deploy compares it.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOTS = ['app/src', 'app/api', 'app/public', 'app/index.html', 'app/package.json', 'app/package-lock.json', 'app/vercel.json', 'app/tailwind.config.ts', 'app/vite.config.ts', 'app/tsconfig.json', 'evals/parity.mjs', 'evals/lib.mjs', 'evals/thresholds.json', 'evals/scenarios.json', 'evals/scenarios'];
export function treeHash() {
  const h = crypto.createHash('sha256');
  const add = (p) => { if (!fs.existsSync(p)) return; const st = fs.statSync(p);
    if (st.isDirectory()) for (const f of fs.readdirSync(p).sort()) add(path.join(p, f)); else { h.update(p); h.update(fs.readFileSync(p)); } };
  ROOTS.forEach(add); return h.digest('hex').slice(0, 16);
}
if (import.meta.url === `file://${process.argv[1]}`) console.log(treeHash());

// Writes the list of API calls recorded during parity (those the original answered) for the allowlist test.
import fs from 'node:fs';
const dir = 'evals/out/fixtures';
const calls = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')))
  .filter((m) => m.key.startsWith('api /api/') && m.status < 400).map((m) => m.key.slice('api /api/'.length));
const out = [...new Set(calls)].sort();
fs.writeFileSync('evals/recorded-api-calls.json', JSON.stringify(out, null, 1));
console.log(`${out.length} recorded API calls`);

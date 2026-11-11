// P6 record. Merges the per-page defect files into one numbered log and renders docs/BUG_LOG.md.
// Entries that describe the same defect seen from two pages are listed once (DUPLICATES names the copy that is dropped).
import fs from 'node:fs';
const read = (f) => fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)) : [];
const own = read('docs/bugs.jsonl'); const by = Object.fromEntries(own.map((b) => [b.id, b]));
const pages = [...read('docs/bugs/kalshi-battle.jsonl'), ...read('docs/bugs/leaderboard.jsonl'), ...read('docs/bugs/trader-profile.jsonl'), ...read('docs/bugs/static-pages.jsonl'), ...read('docs/bugs/review.jsonl')];
const page = Object.fromEntries(pages.map((b) => [b.id, b]));
const DUPLICATES = { L01: 'K01', K03: 'B04', T01: 'B04', S01: 'B05', S02: 'B04', S03: 'B03', S04: 'B06' };
const ORDER = [['Building the harness and the scaffold', ['B01', 'B02']], ['Building the pages', ['K01', 'B04', 'B03', 'B05', 'B06', 'K02', 'T02', 'T03', 'L02', 'L03', 'B07', 'B08']], ['Review', ['B09', 'B10', 'R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07']], ['Deploy', ['B11']]];
const all = { ...page, ...by }; const listed = new Set(ORDER.flatMap(([, ids]) => ids));
const missing = Object.keys(all).filter((id) => !listed.has(id) && !DUPLICATES[id]);
if (missing.length) { console.error('unplaced defects: ' + missing.join(', ')); process.exit(1); }
const clean = (s) => s.replace(/`/g, '').replace(/[–—]/g, ',').replace(/\s+/g, ' ').trim();
let n = 0; let md = '# Bug log\n\nEvery defect below happened during this build and was caught by the check named with it. The numbers quoted are the values the check printed. Scores are from the parity eval: DOM is the share of matching page elements (1 is identical), style is the share of probed elements whose computed style or position differs (0 is identical), pixels is the share of differing screenshot pixels.\n';
for (const [stage, ids] of ORDER) {
  md += `\n## ${stage}\n`;
  for (const id of ids) { const b = all[id]; if (!b) { console.error('missing ' + id); process.exit(1); } n++;
    md += `\n### ${n}. ${clean(b.where)}\n\n**What was wrong.** ${clean(b.bug)}\n\n**How it was caught.** ${clean(b.caught_by)}\n\n**Fix.** ${clean(b.fix)}\n`; }
}
fs.writeFileSync('docs/BUG_LOG.md', md); console.log(`${n} defects rendered`);

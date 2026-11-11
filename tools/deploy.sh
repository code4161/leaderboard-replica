#!/usr/bin/env bash
# P5 deploy. Refuses unless the gate passed for exactly this tree, then deploys and checks the live site.
set -euo pipefail
cd "$(dirname "$0")/.."
tree=$(node tools/treehash.mjs)
node -e '
const g = JSON.parse(require("fs").readFileSync("evals/out/gate.json", "utf8"));
if (!g.pass) { console.error("deploy refused: the last gate failed"); process.exit(1); }
if (g.tree !== process.argv[1]) { console.error(`deploy refused: gate passed for tree ${g.tree}, the tree is now ${process.argv[1]}. Run npm run gate.`); process.exit(1); }
console.log(`gate ${g.tree} passed at ${g.at} (${g.scenarios} scenarios)`);' "$tree"
cd app
url=$(npx vercel deploy --prod --yes 2>/dev/null | tail -1)
echo "deployed: $url"
cd ..
live="${LIVE_URL:-$url}"
node evals/api_contract.mjs --base "$live"
REPLICA="$live" node evals/parity.mjs --only home,kalshi,terms,acct_poly --vp d
node -e 'require("fs").writeFileSync("evals/out/deploy.json", JSON.stringify({at:new Date().toISOString(), tree:process.argv[1], url:process.argv[2], live:process.argv[3]},null,1))' "$tree" "$url" "$live"
echo "LIVE CHECKS: PASS $live"

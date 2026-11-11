# P5 deploy

Enter: P3 passed for the current tree and P4 is closed.
Do: `tools/deploy.sh`. It refuses if evals/out/gate.json did not pass or was made for a different tree. After deploying it runs evals/api_contract.mjs against the live URL (every documented route compared with the original by status, content type and JSON shape, plus the replica's own rules: unknown and traversal paths refused, writes answered locally, edge cache set, noindex header) and parity on four pages of the live site.
Exit gate: `LIVE CHECKS: PASS <url>` and evals/out/deploy.json.

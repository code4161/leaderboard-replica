# P6 record

Enter: P5 closed.
Do: merge per-page defect files (docs/bugs/*.jsonl) into docs/bugs.jsonl; `node tools/render_docs.mjs` writes docs/BUG_LOG.md and the results table in docs/EVALS_PLAN.md from evals/out. Commit.
Exit gate: every defect a check caught during the work is in the log with the check that caught it and the value it reported.

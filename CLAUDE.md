# CLAUDE.md: leaderboard replica workspace

A working replica of a public prediction-market leaderboard site, built as a hiring assignment. The original is the specification: what it renders and how it behaves is the requirement, and the evals measure the replica against it.

This file is orchestration only: the order of the stages, the gate that closes each, and the file that owns its rules. Rules live in the files named below, never here.

## The pipeline

Every change runs these stages in order. Open the stage's file before doing the stage. A stage is closed by its gate, a command with an exit code, never by reading the page and judging it.

| stage | file | exit gate |
|---|---|---|
| P0 capture | pipeline/P0-capture.md | `npm run capture` writes reference/dom, reference/screens, reference/api for every route in evals/routes.json |
| P1 spec | pipeline/P1-spec.md | the page has a scenario in evals/scenarios.json for its default state and each interactive state |
| P2 build | pipeline/P2-build.md | `node evals/parity.mjs --only <scenarios>` passes for the page, both viewports |
| P3 gate | pipeline/P3-gate.md | `npm run gate` prints GATE: PASS and writes evals/out/gate.json for the current tree |
| P4 review | pipeline/P4-review.md | blind judge and code review findings closed or logged; gate again |
| P5 deploy | pipeline/P5-deploy.md | `tools/deploy.sh` (refuses without a passing gate for the tree); live checks pass against the deployed URL |
| P6 record | pipeline/P6-record.md | docs/bugs.jsonl has every defect a gate caught; docs rendered |

## Where every rule lives

| kind of rule | file |
|---|---|
| standing rules for any edit | .claude/rules/replica.md |
| how to rebuild a page from the capture | .claude/skills/rebuild-page/SKILL.md |
| how to read a failing parity diff | .claude/skills/parity-debug/SKILL.md |
| how to log a caught defect | .claude/skills/bug-log/SKILL.md |
| what the hooks refuse | tools/guard.py (wired in .claude/settings.json) |
| thresholds and declared waivers | evals/thresholds.json, docs/EVALS_PLAN.md |

## Layout

app/ is the product (Vite, React, TypeScript, Tailwind; api/ holds the server function). evals/ holds the harness and scenarios. reference/ holds the capture of the original. tools/ holds deterministic scripts. docs/ holds the evals plan, the bug log and the workflow write-up.

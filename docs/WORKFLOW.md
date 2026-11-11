# Workflow and skills

How this replica was built with AI, and what in the repository makes that way of working repeatable.

## The principle

The agent never decides that its own work is done. A command with an exit code decides. Every rule that matters is a file the agent loads, a check that fails, or a hook that refuses, so it holds in the next session without anyone remembering it.

## The stages

CLAUDE.md lists seven stages. Each has its own file under pipeline, and each closes on a command, never on a reading of the page.

| stage | what happens | what closes it |
|---|---|---|
| Capture | A script records the original: rendered page structure at two widths per route, screenshots, API response samples | Every route has its capture files |
| Spec | Each page's states are listed from its code and capture, one scenario per state | A scenario exists for the default state and each interactive state |
| Build | The page is rebuilt from the capture until its scenarios pass | Parity passes for the page at both widths; type check and lint clean |
| Gate | Type check, lint, unit tests, production build, parity self-test, parity on every scenario, allowlist check | The gate prints a pass and records it against a hash of the code |
| Review | A vision judge and a code reviewer, neither told what to expect | Every finding fixed or closed with evidence; gate again |
| Deploy | One script deploys and checks the live site | The script refuses code whose hash has no passing gate; live checks pass |
| Record | Every defect a check caught goes into the bug log | The log renders with no unplaced entry |

## What ran, in order

1. **The harness came first.** The parity eval, its thresholds and its self-test existed before any page did. The first parity run was against empty pages and failed, which is the point: every page was then built towards a failing check.
2. **Shared base, then parallel builders.** One session wrote the app shell, design tokens, API layer and shared components. Four agents then built the page groups in parallel (leaderboard, trader profile, Kalshi and battle, static pages). Each got a short brief naming its page and the skill file to follow, owned its own files, and wrote its scenarios and its defects into its own files so that parallel work could not collide.
3. **Builders reported failures, not success.** Two of the four came back with every scenario failing, traced the cause to shared files they were told not to edit (two library versions and a harness bug), and proved it on a private dev server. Those reports are entries 4 and 5 of the bug log.
4. **Gate on the production build.** 242 runs, about 21 minutes.
5. **Independent review.** The vision judge compared 12 unlabelled screenshot pairs. A code reviewer was given the code and no description. It returned 15 findings. Each was checked against the original's code first: 11 were fixed with tests, and 4 were kept because the original behaves the same way, with the matching expression quoted.
6. **Gate again on the changed code, then deploy.** The deploy script ran the live API contract, live parity and a live browser load of every route.

## What is in the repository

| piece | where | what it does |
|---|---|---|
| Orchestration | CLAUDE.md (AGENTS.md points to it) | Stage order, the gate for each stage, and which file owns which rule. It holds no rules itself |
| Standing rules | .claude/rules/replica.md | Ten rules, among them: the original is the spec, a threshold is never loosened to pass, the replica never writes to the original |
| Skills | .claude/skills | rebuild-page (how to rebuild a page from the capture), parity-debug (how to read a failing result, in order), bug-log (how to record a caught defect) |
| Hook | .claude/settings.json and tools/guard.py | Refuses a deploy outside the deploy script, copying the original's code into the app, and any edit to the thresholds file |
| Gate | tools/gate.mjs | Runs every deterministic check and records the result against a hash of the code and the evals |
| Deploy | tools/deploy.sh, tools/live_checks.sh | Refuses a tree without a passing gate; checks the live site |
| Evals | evals | Parity harness, 127 scenarios, API contract, vision judge, live browser check, saved results |
| CI | .github/workflows/ci.yml | Runs the gate on every push |

## Tools

- **Claude Code** as the agent, with subagents for parallel builds and for the blind review.
- **Project instructions, rules, skills and hooks** as listed above.
- **memgit** (my own open-source memory for coding agents, served over MCP): searched before the first file was read, and lessons from this build were saved to it for later sessions.
- **Playwright** for capture, for the side-by-side parity runs and for the live checks; **pixelmatch** for screenshots.
- **Vitest, TypeScript in strict mode, ESLint with zero warnings allowed.**
- **The Claude command line as a vision judge**, run headless with a rubric and a control pair.
- **GitHub Actions and Vercel.**

## Why it is fast

The four page groups were built at the same time, and none of them needed a person to look at a page: the parity diff told each builder which element, which style property or which pixel region was wrong. The slow part of AI-assisted work is checking the output. Here the checking is a command.

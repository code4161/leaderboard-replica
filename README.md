# Leaderboard replica

A working replica of a public prediction-market leaderboard site, built with AI as a hiring assignment. It is not affiliated with the original, carries a no-index header, and says so on every page.

**Live:** https://leaderboard-replica.vercel.app

## What is here

| path | contents |
|---|---|
| app | The site: Vite, React, TypeScript, Tailwind. app/api holds the server function that serves read routes from the original's public API behind an allowlist and a cache, and answers form posts locally |
| evals | The parity harness, 127 scenarios, the API contract check, the vision judge, the live browser check, and the saved results of the last run |
| docs | [Evals plan](docs/EVALS_PLAN.md), [bug log](docs/BUG_LOG.md), [workflow and skills](docs/WORKFLOW.md) |
| pipeline | The seven stages of the build, each with the command that closes it |
| CLAUDE.md and .claude | Instructions, standing rules, skills and the hook the agent works under |
| tools | Capture, gate, guard and deploy scripts |
| reference | The capture of the original: screenshots, rendered page structure, API samples |

## Result

On the last gate run, all **242** scenario runs (127 scenarios at two screen widths) matched the original exactly in page structure and computed style, with pixel differences under 0.05%. **194** unit tests pass. The deployed site passes **24 of 24** API contract checks against the original.

## Run it

    npm ci && (cd app && npm ci) && npx playwright install chromium
    (cd app && npm run dev)        # the site on localhost:5173
    npm run gate                   # every check, on the production build

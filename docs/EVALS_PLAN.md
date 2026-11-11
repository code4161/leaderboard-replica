# Evals plan

How the replica was verified against the original, what each check proves, and the results of the last run.

## The idea

The original site is the specification. Every check answers one question: given the same data, does the replica render and behave as the original does? Both sites are loaded side by side in the same browser, fed the same recorded network responses, and compared. A difference is then a difference in the code, never in the data.

## The checks

| check | what it compares | pass rule |
|---|---|---|
| Page structure | Every element of the rendered page on both sites: tag, classes, the attributes a user or a test can observe, and text | **Identical** (score 1) |
| Style and position | Computed style and box position of up to 400 probed elements per page (every element with a test id, headings, buttons, table headers, footer links) | **No probe differs** (score 0) |
| Pixels | Screenshot of the original against screenshot of the replica | At most **0.05%** of pixels differ |
| Behaviour | The same scripted steps (click, type, hover, scroll) run on both sites, then the three comparisons above run on the resulting state | Same rules |
| Console | Errors thrown by the replica while a scenario runs | **None** |
| API contract | Each documented API route on the deployed replica against the original: status, content type and the shape of the JSON | Same on every route |
| API rules of the replica | Unknown paths and parameters refused, form posts answered locally and never forwarded, responses cached at the edge, no-index header present | All hold |
| Unit tests | Formatting, sorting, filtering, calendar maths, form validation, URL safety, the API function | All pass |
| AI judge | A vision model compares unlabelled screenshot pairs in random order and lists every visible difference | No major difference |
| Code review | A reader given only the code, with no description of what it should do, looks for correctness and security defects | Every finding fixed or shown to match the original |

Each page is checked at two widths, 1440 and 390 pixels, in dark and light themes where the page has a toggle.

## Checking the checks

A check that cannot fail proves nothing, so each detector is tested before its result is trusted.

The parity eval has a self-test that runs on every gate. It compares the original against itself, which must score a perfect match (measured: structure 1, style 0, pixels 0). It then plants three defects on the original (the page title recoloured, the table moved 3 pixels, one row removed) and requires the gate to fail on each. The first version of the thresholds let the recoloured title through; the self-test is what showed it (bug log, entry 1).

The AI judge has a control pair with a planted defect. If the judge calls that pair identical, the whole run is void. On the last run it reported the missing row by name.

The allowlist test fails on an empty list instead of skipping, after the review found that its first version could never fail on a clean checkout (bug log, entry 15).

## Scenarios

**127 scenarios** cover the eight routes. Each interactive state has its own scenario.

| page | scenarios | examples |
|---|---|---|
| Leaderboard and Polymarket leaderboard | 50 | each period, each platform filter, search by name and by wallet, empty search, each sort in both directions, the three optional columns, show more, light theme |
| Trader profile | 26 | traders on one platform, both, several wallets, Hyperliquid; calendar open, monthly view, earliest month; chart hover; each share card and range; trader not found |
| Kalshi leaderboard and battle | 22 | each period, non-sports filter, search, show more, link through to a profile, chart tooltip |
| API docs, submit form, terms | 29 | copy buttons, each validation message, a successful submission, scroll positions, light theme |

At two widths this gives **242 runs** (12 scenarios apply to desktop only, where the original hides the control on phones).

## Results of the last run

Gate run of 2026-11-11 20:26 UTC on the production build, tree 63775aa6e1475aab. The raw results are in evals/results.

| check | result |
|---|---|
| Type check, lint with zero warnings | Pass |
| Unit tests | **194** pass |
| Parity self-test | Pass: original against itself identical; all 3 planted defects failed the gate |
| Parity, all scenarios, both widths | **242 of 242** pass. Structure 1 and style 0 on every run |
| Production allowlist against recorded API calls | Pass: all **629** calls admitted |
| AI judge (12 pairs and the control) | Pass: control defect reported; 0 differences on 12 pairs |
| Code review | 15 findings: 11 fixed, 4 match the original and were kept |
| Live API contract, https://leaderboard-replica.vercel.app | **24 of 24** pass |
| Live parity on 4 pages of the deployed site | **4 of 4** pass |
| Live browser load of all 9 routes, no interception | **9 of 9** pass, no errors, no failed API call |

## Declared differences

Two things differ from the original on purpose, and the harness treats both the same way on both sites.

1. The replica shows one line saying it is a hiring-assignment replica and is not affiliated with the original. The harness hides that line before comparing.
2. One trader's avatar is an animated image, which shows a different frame at each screenshot on both sites. The harness serves a still image in its place to both.

The replica also leaves out the original's analytics calls and its search-engine tags, and sends a no-index header, so that it is never mistaken for the original or indexed beside it.

## What the parity checks do not cover

States that need a failing server (loading skeletons, the refresh warning, error messages of the submit form) cannot be produced from recorded responses. They were built from the original's code and are covered by unit tests and by manual probes with intercepted responses, not by parity scenarios. One profile variant (a trader with no wallet and no Kalshi account) does not occur among the 576 traders in the recorded data, so its chart is unverified against the original.

## How to run

    npm ci && (cd app && npm ci) && npx playwright install chromium
    npm run gate                                   # every deterministic check, on the production build
    node evals/ai_judge.mjs                        # the vision judge, after a gate run
    tools/live_checks.sh https://leaderboard-replica.vercel.app

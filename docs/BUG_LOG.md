# Bug log

Every defect below happened during this build and was caught by the check named with it. The numbers quoted are the values the check printed. Scores are from the parity eval: DOM is the share of matching page elements (1 is identical), style is the share of probed elements whose computed style or position differs (0 is identical), pixels is the share of differing screenshot pixels.

## Building the harness and the scaffold

### 1. evals/thresholds.json

**What was wrong.** The first parity thresholds (DOM 0.99, style 2%, pixels 1%) let a planted defect through: the page title recoloured to red scored DOM 0.9986, style 0.34%, pixels 0.07% and the gate passed.

**How it was caught.** parity --selftest, which plants three defects on the original and requires the gate to fail on each

**Fix.** Measured the noise floor (original against itself: DOM 1, style 0, pixels 0) and set thresholds to DOM 1, style 0, pixels 0.05%. The self-test now requires every planted defect to fail the gate.

### 2. app/package.json (scaffold)

**What was wrong.** The scaffold command installed dev dependencies with output sent to /dev/null. npm had failed with ERESOLVE (typescript 7.0.2 against typescript-eslint's peer range below 6.1), so no compiler, bundler or linter was installed, and the script went on to report success.

**How it was caught.** The first parity run against the dev server: page.goto failed with ERR_CONNECTION_REFUSED and the scenario scored DOM 0, which the gate treats as a failure, not as a skipped check

**Fix.** Pinned typescript to 6.0 inside the linter's supported range; install output is no longer discarded.

## Building the pages

### 3. app/src/pages/kalshi-leaderboard.tsx (base styles)

**What was wrong.** Period, Non-sports and Show more buttons drew a 1px border the original does not draw, and th cells and the theme button had the wrong border colour. The original's stylesheet carries site-wide element rules (button{border:none}, th,td{border:none}, button:hover,a:hover{background:transparent!important}, table{table-layout:fixed}) that src/index.css does not have. Measured on kalshi_d: 17 of 18 style probes differed (style 0.9444), e.g. button borderTopWidth 0px -> 1px, w 49 -> 51, h 28 -> 30, th borderTopColor rgb(237, 237, 237) -> rgb(46, 46, 46); pixel 0.0011 on desktop and 0.1062 on mobile.

**How it was caught.** parity style probe and pixel diff on kalshi_d and kalshi_m (evals/out/diff/kalshi_d.style.diff)

**Fix.** Wrote the missing element rules in app/src/pages/kalshi-leaderboard/site-base.css, imported by both pages. Style 0 and pixel 0 on the next run. The rules are site-wide and belong in src/index.css; they sit in the page folder until merged.

### 4. app/package.json

**What was wrong.** The scaffold installed the newest lucide-react (1.72) and recharts (3.10.1). The original runs lucide-react 0.453.0 and recharts 3.7.0: the moon icon's path differs, and the newer chart library names its layers, wraps each line in an extra group and drops a tooltip transition (battle_d: DOM 0.8595, 31 differing lines).

**How it was caught.** Parity DOM diff on the theme toggle and on every chart; confirmed by rerunning the scenarios against the older versions

**Fix.** Pinned both libraries to the versions the original's bundle contains.

### 5. evals/lib.mjs

**What was wrong.** The harness hid the replica notice with CSS for the pixel check but still walked it in the DOM check, so every scenario carried one extra line and none could reach the required DOM score of 1 (kalshi_d: 0.9974 with style 0 and pixels 0).

**How it was caught.** The page builder's parity runs: 44 of 44 scenarios failed with an identical one-line DOM difference, the notice itself

**Fix.** The DOM walk skips the notice element, matching the declared waiver.

### 6. app/vite.config.ts

**What was wrong.** The dev proxy was keyed on the prefix /api, which also matches the page route /api-docs, so the dev server returned the original's HTML for that page instead of the replica (apidocs_d: DOM 0, style 1, pixels 0.131).

**How it was caught.** Parity on the api-docs scenarios: 48 DOM lines against 224 and every click step timing out

**Fix.** The proxy key is anchored to /api/ so only API calls are forwarded.

### 7. app/vite.config.ts

**What was wrong.** In dev and preview the proxy forwarded every method upstream, so submitting the replica's form outside the harness would have posted a real entry to the original's server. Only the production function answered writes locally.

**How it was caught.** A builder reading the config while writing the submit scenarios; no check covered it because the harness intercepts POST before the dev server sees it

**Fix.** The dev proxy answers every non-GET request locally. A check was added: a POST to the running dev server must come back marked as answered by the replica.

### 8. evals/scenarios/kalshi-battle.json

**What was wrong.** Scenarios that click a period or Non-sports were observed before the new request finished, because the harness waits for network idle only once per page. kb_kalshi_period_7d_d scored dom 0.0726 with 771 original lines against 60 replica lines (replica still on Loading), and kb_kalshi_period_1m_d compared two loading states (59/60 lines) and so checked no rows at all. kb_kalshi_profile_link caught the original in mid navigation, with the leaderboard still in the DOM under display: none !important (773 lines).

**How it was caught.** parity DOM diff line counts on the first run of the kb_ scenarios

**Fix.** Each click that starts a request is followed by a hover on thead th, which waits until the table is rendered again; the two navigation scenarios wait 2500 ms. On the next run all period and filter scenarios compared 771 to 773 lines on both sides.

### 9. evals/scenarios/trader-profile.json (tp_kalshi_calendar_earliest)

**What was wrong.** The scenario clicked Previous month 13 times, but the Kalshi history for this trader starts in May 2026, so the button is disabled after 6 clicks and the 7th click timed out on the original as well as the replica.

**How it was caught.** parity printed ORIGINAL-FAILED: TimeoutError: locator.click: Timeout 8000ms exceeded for tp_kalshi_calendar_earliest on both viewports

**Fix.** Read the first history timestamp from the API (2026-05-05) and set the scenario to 6 clicks, which lands on the earliest month with its before-tracking cells and the disabled button.

### 10. app/src/pages/trader-profile/links.ts (page-local largeAvatar)

**What was wrong.** A trader whose picture is hosted by the API itself has pfp https://predicting.top/api/wallet-avatar/<wallet>. The page-local avatar helper only rewrote X image URLs, so the replica rendered the absolute upstream URL (the browser fetched the picture from the original's host, past the replica's own API layer) where the original renders the same-origin path /api/wallet-avatar/<wallet>.

**How it was caught.** parity DOM diff on tp_hyperliquid_unnamed, both viewports: img src /api/wallet-avatar/0xd3a8... on the original, https://predicting.top/api/wallet-avatar/0xd3a8... on the replica

**Fix.** Dropped the page-local copy and used largeAvatar from app/src/lib/avatar.ts, which maps the API's own absolute URLs to same-origin paths. The scenario stays as the check.

### 11. app/src/pages/leaderboard/table.tsx (ROI column)

**What was wrong.** The ROI cell tested roi != null, so a trader whose roi is an explicit null got a dash. The original tests roi !== undefined and renders null as +0.0%. The recorded data has roi absent on 188 of 576 traders and never null, so no scenario could show it.

**How it was caught.** by eye, comparing the cell against the original's chunk before the first gate run

**Fix.** Moved the rule into roiText() in app/src/lib/format.ts; format.test.ts now asserts undefined gives a dash and null gives +0.0%.

### 12. app/src/pages/leaderboard/referral.ts (useReferral)

**What was wrong.** The referral effect posted /api/referral/visit every time it ran. React StrictMode runs an effect twice on mount in development, so a visit with ?ref= would have been registered twice.

**How it was caught.** by eye, reading the hook against the original's run-once guard before the first gate run

**Fix.** Landing logic moved to registerLanding() with a per-page-load visitSent flag; referral.test.ts asserts one POST across two calls, and a browser probe of /?ref=alice on the dev server (all /api calls intercepted) counted one visit POST.

### 13. evals/lib.mjs

**What was wrong.** The pixel check was not repeatable on one page: polymarket_d scored 0.0005 (pass) and 0.0006 (fail) on consecutive runs with DOM and style equal. One trader's avatar is an animated GIF (96 frames), so each screenshot caught a different frame on both sites.

**How it was caught.** Three reruns of the same scenario giving different results; sampling the image five times through the harness showed its hash changing on both sites

**Fix.** The harness serves both sites a single still pixel in place of any animated GIF (declared waiver W2).

### 14. evals/lib.mjs

**What was wrong.** On the first run of a scenario, the two sites asked for the same new image at the same moment and the harness fetched it twice; one site could paint before its copy arrived and show a blank avatar. A second run passed.

**How it was caught.** A dozen scenarios failing on pixels in a first full run and passing unchanged on rerun

**Fix.** The harness shares the in-flight request between the two sites, so both get the same response at the same time.

## Review

### 15. app/api/proxy.ts and its tests

**What was wrong.** The API layer forwarded any query string upstream (each new parameter value was a new cache entry and a new upstream request), forwarded the visitor's Accept header while caching on the URL alone, passed any upstream content type through, and admitted single-dot path segments that URL building then folded away (kalshi/./history was fetched as kalshi/history). The handler itself had no test, and the allowlist coverage test read a git-ignored folder and skipped when it was empty, so in CI it could never fail.

**How it was caught.** An independent code review by a reader given only the code, findings 3, 4, 5 and 9, each confirmed by reading

**Fix.** Each route lists its own query parameters and anything else is a 400 before upstream is called; the Accept header is fixed; only JSON and image responses under a size cap are served; dot segments are refused; ten handler tests run against a stubbed upstream; the coverage test reads a committed list the gate regenerates and fails on an empty list.

### 16. app/api/proxy.ts

**What was wrong.** While hardening the allowlist, the pattern for a name was changed to forbid a leading dot. Two real Kalshi usernames in the recorded data start with a dot (.KJ. and .bananafish), so their avatars would have returned 404 in production.

**How it was caught.** The allowlist coverage test, on its first run against the 629 recorded API calls: it listed the two refused paths

**Fix.** Names may start with a dot; a segment that is only dots is still refused by the segment check.

### 17. app/src/pages/leaderboard/table.tsx, trader-profile.tsx, kalshi-leaderboard.tsx, trader-profile/links.ts

**What was wrong.** Profile URLs from the API (polymarket_profile, hyperliquid_profile, myriad_profile, kalshi_profile, kalshi_url) went into href and window.open with no scheme check, so a javascript: or data: value would have been used as a link; 3 of the 4 window.open calls in the leaderboard table passed no noopener.

**How it was caught.** independent code review, finding 1; confirmed by reading the 4 window.open calls and 6 href sites, and against the original (leaderboard-CSYA1tNl.js opens e.polymarket_profile, e.hyperliquid_profile and e.myriad_profile with window.open(s,"_blank") and no check)

**Fix.** Added safeExternalUrl and openExternal in app/src/lib/safe-url.ts (http or https only; window.open always gets noopener,noreferrer) and profileLinks() in trader-profile/links.ts; every site uses them. safe-url.test.ts covers javascript:, data:, protocol-relative, relative and malformed input; links.test.ts asserts the hrefs for valid profiles are unchanged.

### 18. app/src/pages/trader-profile/links.ts (twitterUrl)

**What was wrong.** The profile's X link returned any value starting with "http" as the href ("httpx://evil.example" and "https://evil.example/a" both passed), while the leaderboard used a strict builder.

**How it was caught.** independent code review, finding 2; confirmed by reading links.ts:52 against filter-sort.ts:104-119 (the original's profile chunk has the same loose rule: Qe=e=>e.startsWith("http")?e:...)

**Fix.** Moved the strict builder to app/src/lib/twitter.ts; filter-sort.ts and trader-profile/links.ts both re-export it, and the profile shows the X link only when it returns a URL. twitter.test.ts asserts both pages use the same function and lists the refused inputs.

### 19. app/src/pages/leaderboard/referral.ts, app/src/components/theme-toggle.tsx, app/src/App.tsx

**What was wrong.** localStorage and sessionStorage were touched inside effects with no try (referral.ts:59,101-102,120 and theme-toggle.tsx:12). With storage blocked the access throws, and with no error boundary anywhere the whole app unmounted.

**How it was caught.** independent code review, finding 6; confirmed by reading the effects and App.tsx (no boundary). The original has the same unguarded calls in index-IhZl9oLY.js and no boundary.

**Fix.** Added app/src/lib/storage.ts (safeStore: a read answers null and a write is dropped when storage throws) and used it in both places; added components/error-boundary.tsx around the routes in App.tsx, cleared on route change. storage.test.ts and error-boundary.test.ts cover both; the 36 parity runs show the fallback does not appear.

### 20. app/src/pages/trader-profile/share-cards.tsx

**What was wrong.** The share image fetch never looked at the response status or type, so an error body would be saved, copied or shared as a .png; download had no catch; the object URL was revoked on the line after click().

**How it was caught.** independent code review, finding 8; confirmed by reading share-cards.tsx:10,24-30. The original (trader-profile-Dw7uEvrL.js, function Me) does the same and shows no failure message.

**Fix.** Added trader-profile/share-image.ts: shareImage() rejects unless the response is ok and image/png, saveBlob() revokes the object URL after 10 s; download catches and saves nothing. share-image.test.ts covers 404, 500, a JSON body with 200, a network failure and the delayed revoke.

### 21. app/src/pages/trader-profile/data.ts, app/src/pages/leaderboard/filter-sort.ts, table.tsx, trader-profile.tsx

**What was wrong.** The trader id from the route went into /api/trader/<id> and /api/kalshi/<id>/history unencoded, and ids from the API into /account/<id> hrefs unencoded, so an id holding / ? or # changed the path that was requested.

**How it was caught.** independent code review, finding 11; confirmed by reading data.ts:71,108 and filter-sort.ts:123-125. The original does not encode /api/trader/${t} either, with no scenario depending on it: 0 of 576 captured wallets and usernames and 0 of 1,000 Kalshi usernames are changed by encodeURIComponent.

**Fix.** encodeURIComponent on the id at each site (traderUrl, historyUrlFor, accountHref, the wallet lines and the Kalshi mark). data.test.ts asserts the scenario ids give byte-identical paths and that ../ ? # stay inside the segment.

### 22. app/src/pages/leaderboard/types.ts

**What was wrong.** The leaderboard response was parsed with a schema over the whole list, so one trader with a field of the wrong type rejected all 576 rows and the query retried 3 times; the original has no schema (queryFn returns r.json()) and renders every row it can.

**How it was caught.** independent code review, finding 7; confirmed by reading types.ts:20-43 against leaderboard-CSYA1tNl.js. The first-load failure display was checked and already matches the original ("0 of 0 traders", the yellow notice only under xe&&g).

**Fix.** Rows are parsed one at a time (parseTraders): a wrong-typed optional field reads as absent, and a row is dropped only when stats.pnl is not a number; a body with no list gives an empty list. filter-sort.test.ts covers each case; the captured and live lists parse to 576 of 576 and 578 of 578 rows with 0 field differences.

### 23. app/src/pages/trader-profile/data.ts (smart score)

**What was wrong.** The profile's smart score schema required all 7 fields non-null and dropped the card if any one was null; the original prints score and tier as sent and computes the three percentages with arithmetic that takes a null ((null*100).toFixed(0) is "0").

**How it was caught.** independent code review, finding 15; confirmed against trader-profile-Dw7uEvrL.js: r.smart_score.winRate*100, maxDrawdownPercent*100 and rSquared*100 accept null, while sharpeRatio.toFixed(2) and profitFactor.toFixed(2) throw on one.

**Fix.** tier, score, winRate, maxDrawdownPercent and rSquared may be null and the card still shows (percent() in format.ts reproduces the arithmetic); sharpeRatio and profitFactor stay required, where the original throws. data.test.ts covers each field.

## Deploy

### 24. evals/api_contract.mjs and tools/deploy.sh

**What was wrong.** Two defects in the deploy checks, both seen on the first live deploy. The cache check looked for an s-maxage directive in the response header, which the host consumes and strips, so it failed on a site whose cache was working (second request: x-vercel-cache HIT, age 18). And the deploy script took the last line of the deploy command's output as the URL; the command printed JSON, so the recorded URL was a closing brace.

**How it was caught.** The live API contract run printed FAIL 23/24 on the cache check, and the deploy script printed deployed: }

**Fix.** The cache check makes two requests and requires the second to be served from the edge cache. The script extracts the deployment URL by pattern and stops if there is none.

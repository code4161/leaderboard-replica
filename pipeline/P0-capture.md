# P0 capture

Enter: a route list in evals/routes.json.
Do: `npm run capture` (tools/capture.mjs) records the original's rendered DOM at 1440 and 390 wide per route into reference/dom. Response samples for each API route go in reference/api. The original's bundle is kept in reference/original-bundle for reading and is git-ignored.
Exit gate: every route has `<name>_d.html`, `<name>_m.html` and `<name>_meta.json`.

# P3 gate

Enter: every page's P2 gate passed on the dev server.
Do: `npm run gate` (tools/gate.mjs). In order: type check, lint with zero warnings, unit tests, production build, then on the built site: the parity self-test (three planted defects must each fail the gate, and the original against itself must pass) and parity for every scenario on both viewports.
Exit gate: `GATE: PASS` and evals/out/gate.json carrying the tree hash. Any edit to app/ or evals/ changes the hash and voids the gate.

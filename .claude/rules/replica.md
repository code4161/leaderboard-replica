# Standing rules

1. The original is the spec. A difference from it is a defect unless it is a declared waiver in docs/EVALS_PLAN.md. Never change a threshold or add a waiver to make a gate pass; fix the page.
2. Write the replica's code. Reading the original's rendered DOM, stylesheet and bundle to learn what it does is the method. Copying files from reference/original-bundle into app/ is refused by the guard.
3. A page is done when its parity scenarios pass on both viewports, never when it looks right.
4. Every interactive state gets a scenario: a filter, a sort, a tab, an expanded row, a dialog, an empty result, an error.
5. The replica never writes to the original. POST routes are answered locally (app/api/proxy.ts). Read routes go through the allowlist there; add a route to the allowlist with a unit test.
6. A defect that a gate, a test, a type check or a review caught is logged in docs/bugs.jsonl the moment it is fixed, with what caught it. Defects are never invented for the log.
7. No rule, lesson or checklist goes into an agent prompt. A brief names the task and the stage file.
8. Types are strict: no `any`, no non-null assertion on API data, API responses parsed at the boundary.
9. Deploy only through tools/deploy.sh. It refuses a tree without a passing gate.
10. The site carries a noindex header and a visible replica notice. Do not remove either.

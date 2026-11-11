---
name: parity-debug
description: Read a failing parity result and find the cause. Use when evals/parity.mjs prints FAIL for a scenario.
---

# Debug a parity failure

The harness feeds the original and the replica the same recorded responses (evals/out/fixtures), so a difference is in the code.

Read in this order, and fix in this order:
1. `step-failure` or `errors` on the result line: the replica threw or a step's target is missing. Fix first; the other numbers mean nothing until it runs.
2. evals/out/diff/<tag>.dom.diff: `-` lines are the original, `+` the replica. Fix structure, classes, attributes and text until it is empty. A wrong number format or a wrong sort shows up here as text differences in row order.
3. evals/out/diff/<tag>.style.diff: computed style and box geometry per probed element. With the DOM equal, a difference here is a missing token, a Tailwind class that did not compile (check the content globs and arbitrary values), or a base style.
4. evals/out/diff/<tag>.diff.png beside .original.png and .replica.png: what is left is images, SVG or canvas.

If the ORIGINAL fails a step, the scenario is wrong, not the replica. If a difference is in recorded data, delete evals/out/fixtures and rerun; never hand-edit a fixture.

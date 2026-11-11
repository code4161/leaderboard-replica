---
name: rebuild-page
description: Rebuild one page of the replica from the captured original until its parity scenarios pass. Use when building or changing any page under app/src/pages.
---

# Rebuild a page

Inputs for page `<name>`: reference/dom/<name>_d.html and <name>_m.html (rendered DOM, both viewports), reference/screens/orig_<name>_*.png, reference/api/*.json (response samples), and the page's chunk in reference/original-bundle/ (minified; read it for behaviour: state, sort and filter logic, number and date formats, query URLs, conditional branches).

1. Outline. `node tools/skeleton.mjs reference/dom/<name>_d.html 2` prints the DOM with repeated siblings collapsed. Read the mobile capture too; some nodes differ by viewport only through classes, some are rendered conditionally.
2. Behaviour. From the chunk, list every piece of state, every query, every branch (loading, empty, error, per-platform variants) and every format function. Check formats against real values in the capture, including negatives, zero, thousands and millions.
3. Scenarios. Add one scenario per interactive state to evals/scenarios.json (steps use data-testid where the original has one).
4. Build in app/src/pages/<name>.tsx with page-local parts in app/src/pages/<name>/. Keep class strings and data-testid attributes as the original renders them. Use the shared pieces in app/src/components and app/src/lib; do not edit shared files another page owns, propose the change in your report.
5. Gate. Start `npm run preview` in app/ after `npm run build`, then `node evals/parity.mjs --only <scenarios>`. Read evals/out/diff/<scenario>_<vp>.dom.diff and .style.diff, fix, repeat until PASS on both viewports. See the parity-debug skill.
6. Log each real defect the gate, the type check or a test caught (bug-log skill).

Done means: parity PASS for every scenario of the page, `npm run typecheck` and `npm run lint` clean in app/.

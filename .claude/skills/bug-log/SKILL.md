---
name: bug-log
description: Record a defect that a gate, test, type check or review caught in AI-written code. Use the moment such a defect is fixed.
---

# Log a caught defect

Append one JSON line to docs/bugs.jsonl:

    {"id":"B<nn>","at":"<date>","where":"<file or page>","bug":"<what was wrong, with the measured value>","caught_by":"<the check that failed and how it showed it>","fix":"<what changed>"}

Rules: only defects that happened; the value the check reported goes in the entry; a defect found by eye is logged with `caught_by` saying so, and gets a scenario or test so a check catches it next time. `node tools/render_docs.mjs` rebuilds docs/BUG_LOG.md.

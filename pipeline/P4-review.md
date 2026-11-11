# P4 review

Enter: P3 passed.
Do, each by a reader that did not write the code and is not told what to expect:
1. `node evals/ai_judge.mjs`: a vision model compares unlabelled screenshot pairs in random order against a rubric. Its control pair carries a planted defect; if the judge misses it the run is void.
2. A code review agent is given the diff only (no summary of intent) and asked for correctness bugs.
3. Read every finding against the code. A real one is fixed, logged in docs/bugs.jsonl, and given a scenario or test so a deterministic check catches it next time. A false one is closed with the reason.
Exit gate: no open finding; P3 again on the changed tree.

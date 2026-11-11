#!/usr/bin/env python3
"""PreToolUse hook. Refuses the actions the standing rules forbid, so a rule holds without anyone remembering it."""
import json, re, sys

def refuse(msg):
    print(f"guard: {msg}", file=sys.stderr); sys.exit(2)

try:
    ev = json.load(sys.stdin)
except Exception:
    sys.exit(0)
tool = ev.get("tool_name", ""); inp = ev.get("tool_input", {}) or {}
if tool == "Bash":
    cmd = inp.get("command", "")
    if re.search(r"\bvercel\b[^|;&]*(--prod|\bdeploy\b)", cmd) and "tools/deploy.sh" not in cmd:
        refuse("deploy only through tools/deploy.sh; it refuses a tree without a passing gate (rule 9).")
    if re.search(r"\b(cp|mv|rsync|ln)\b[^|;&]*reference/original-bundle[^|;&]*\bapp/", cmd):
        refuse("the original's bundle is for reading; write the replica's code (rule 2).")
    if re.search(r"\bgit\s+add\b[^|;&]*(original-bundle|\s-f\b|--force)", cmd):
        refuse("reference/original-bundle stays out of the repository.")
    if re.search(r"(>|\btee\b|\bsed\b[^|;&]*-i)[^|;&]*evals/thresholds\.json", cmd):
        refuse("thresholds are not changed to make a gate pass (rule 1). The owner edits evals/thresholds.json by hand.")
elif tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
    path = inp.get("file_path", "")
    if path.endswith("evals/thresholds.json"):
        refuse("thresholds are not changed to make a gate pass (rule 1). The owner edits evals/thresholds.json by hand.")
    if "/app/" in path and "original-bundle" in (inp.get("content", "") or "")[:0]:
        pass
sys.exit(0)

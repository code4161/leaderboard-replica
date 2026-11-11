import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matchRead, readQuery } from "./proxy";

// The dev server forwards every GET, so a route missing from the production allowlist is invisible to the parity run.
// The gate writes every API call the two sites made during parity to evals/recorded-api-calls.json, which is committed,
// and each call the original answered must be admitted here, path and query. An empty list is a failure, not a skip.
const calls = JSON.parse(readFileSync(join(import.meta.dirname, "../../evals/recorded-api-calls.json"), "utf8")) as string[];

describe("production allowlist covers every recorded API call", () => {
  it("has recorded calls to check", () => {
    expect(calls.length).toBeGreaterThan(20);
  });
  it("admits every recorded path and query", () => {
    const refused = calls.filter((c) => {
      const [path, search = ""] = c.split("?");
      const rule = matchRead(decodeURIComponent(path));
      return !rule || !readQuery(rule, Object.fromEntries(new URLSearchParams(search)));
    });
    expect(refused).toEqual([]);
  });
});

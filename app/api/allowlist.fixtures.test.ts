import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matchRead } from "./proxy";

// The dev server forwards every GET, so a route missing from the production allowlist is invisible to the parity run.
// The harness records every API call both sites make; each recorded call that the original answered must be admitted here.
const dir = join(import.meta.dirname, "../../evals/out/fixtures");

describe("production allowlist covers every recorded API call", () => {
  const calls = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as { key: string; status: number })
        .filter((m) => m.key.startsWith("api /api/") && m.status < 400).map((m) => m.key.slice("api /api/".length).split("?")[0])
    : [];
  const paths = [...new Set(calls)];
  it.skipIf(paths.length === 0)(`admits all ${paths.length} recorded paths`, () => {
    const refused = paths.filter((p) => !matchRead(decodeURIComponent(p)));
    expect(refused).toEqual([]);
  });
});

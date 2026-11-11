import { describe, expect, it } from "vitest";
import { safeStore } from "./storage";

describe("safeStore", () => {
  it("reads and writes through to the storage area", () => {
    const data = new Map<string, string>();
    const area = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) } as Storage;
    const store = safeStore(() => area);
    store.setItem("theme", "light");
    expect(store.getItem("theme")).toBe("light");
    expect(store.getItem("missing")).toBeNull();
  });
  it("answers null and drops the write when reaching the storage area throws", () => {
    const store = safeStore(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    expect(store.getItem("theme")).toBeNull();
    expect(() => store.setItem("theme", "light")).not.toThrow();
  });
  it("drops the write when the quota is exceeded", () => {
    const area = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      },
    } as unknown as Storage;
    expect(() => safeStore(() => area).setItem("k", "v")).not.toThrow();
  });
});

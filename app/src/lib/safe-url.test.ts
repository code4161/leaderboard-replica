import { describe, expect, it } from "vitest";
import { openExternal, safeExternalUrl } from "./safe-url";

describe("safeExternalUrl", () => {
  it("returns an http or https URL unchanged", () => {
    for (const ok of [
      "https://polymarket.com/profile/0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1?via=unbroken0x",
      "https://kalshi.com/ideas/profiles/aenews",
      "http://example.com/a b?q=1#h",
      "HTTPS://EXAMPLE.COM/",
    ]) {
      expect(safeExternalUrl(ok)).toBe(ok);
    }
  });
  it("refuses script, data and other schemes", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "java\nscript:alert(1)",
      "javascript://example.com/%0aalert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "blob:https://example.com/1",
      "file:///etc/passwd",
      "ftp://example.com/",
      "mailto:a@example.com",
    ]) {
      expect(safeExternalUrl(bad)).toBeUndefined();
    }
  });
  it("refuses protocol-relative, relative and malformed values", () => {
    for (const bad of ["//evil.example/x", "/account/abc", "kalshi.com/ideas", "not a url", "https://", "http://[bad", "", null, undefined]) {
      expect(safeExternalUrl(bad)).toBeUndefined();
    }
  });
});

describe("openExternal", () => {
  it("opens a safe URL in a new tab with noopener and noreferrer", () => {
    const calls: unknown[][] = [];
    const opener = { open: (...args: unknown[]) => (calls.push(args), null) };
    expect(openExternal("https://myriad.markets/profile/x", opener)).toBe(true);
    expect(calls).toEqual([["https://myriad.markets/profile/x", "_blank", "noopener,noreferrer"]]);
  });
  it("opens nothing for an unsafe URL", () => {
    const calls: unknown[][] = [];
    const opener = { open: (...args: unknown[]) => (calls.push(args), null) };
    expect(openExternal("javascript:alert(1)", opener)).toBe(false);
    expect(openExternal("//evil.example", opener)).toBe(false);
    expect(calls).toEqual([]);
  });
});

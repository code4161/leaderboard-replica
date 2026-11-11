import { describe, expect, it } from "vitest";
import { daysAgo, displayName, formatChange, formatPnl, formatRoi, formatUpdated, formatWinRate, isWallet, parseJoinDate, roiText } from "./format";

describe("formatPnl", () => {
  it("shows cents and thousands separators in full", () => {
    expect(formatPnl(108594.5412).full).toBe("+$108,594.54");
    expect(formatPnl(0).full).toBe("+$0.00");
    expect(formatPnl(4.999).full).toBe("+$5.00");
  });
  it("puts the minus of a loss after the dollar sign, as the original does", () => {
    expect(formatPnl(-1234.5).full).toBe("$-1,234.50");
    expect(formatPnl(-2_500_000).compact).toBe("$-2.5M");
    expect(formatPnl(-250_000).compact).toBe("$-250k");
  });
  it("shortens from 100k up and keeps the full form below", () => {
    expect(formatPnl(99_999.99).compact).toBe("+$99,999.99");
    expect(formatPnl(100_000).compact).toBe("+$100k");
    expect(formatPnl(108_594.54).compact).toBe("+$109k");
    expect(formatPnl(999_999).compact).toBe("+$1000k");
    expect(formatPnl(1_000_000).compact).toBe("+$1.0M");
    expect(formatPnl(12_345_678).compact).toBe("+$12.3M");
  });
});

describe("formatChange", () => {
  it("rounds to dollars, thousands and millions with the sign in front", () => {
    expect(formatChange(47836)).toBe("+$48K");
    expect(formatChange(-47836)).toBe("-$48K");
    expect(formatChange(999.4)).toBe("+$999");
    expect(formatChange(1000)).toBe("+$1K");
    expect(formatChange(-1_250_000)).toBe("-$1.3M");
    expect(formatChange(0)).toBe("+$0");
    expect(formatChange(-0.4)).toBe("-$0");
  });
});

describe("formatRoi and formatWinRate", () => {
  it("gives one decimal under ten percent and none from ten", () => {
    expect(formatRoi(0.0512)).toBe("+5.1%");
    expect(formatRoi(-0.0512)).toBe("-5.1%");
    expect(formatRoi(0.1)).toBe("+10%");
    expect(formatRoi(2.345)).toBe("+235%");
    expect(formatRoi(-0.5)).toBe("-50%");
    expect(formatRoi(0)).toBe("+0.0%");
  });
  it("shows a dash only when the API sent no ROI, and zero for an explicit null", () => {
    expect(roiText(undefined)).toBeNull();
    expect(roiText(null)).toBe("+0.0%");
    expect(roiText(-0.25)).toBe("-25%");
  });
  it("rounds the win rate to a whole percentage", () => {
    expect(formatWinRate(0.47)).toBe("47%");
    expect(formatWinRate(1)).toBe("100%");
  });
});

describe("join dates", () => {
  const now = new Date("2026-11-12T12:00:00Z");
  it("reads a month and year as the first of that month, local time", () => {
    const d = parseJoinDate("Oct 2025");
    expect(d && [d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2025, 9, 1]);
  });
  it("reads ISO dates and timestamps", () => {
    expect(parseJoinDate("2024-11-01")?.toISOString()).toBe("2024-11-01T00:00:00.000Z");
    expect(parseJoinDate("2024-01-13T23:31:49.73Z")?.getUTCDate()).toBe(13);
  });
  it("returns null for nothing or nonsense", () => {
    expect(parseJoinDate(null)).toBeNull();
    expect(parseJoinDate("")).toBeNull();
    expect(parseJoinDate("soon")).toBeNull();
    expect(parseJoinDate("Foo 2025")).toBeNull();
  });
  it("counts whole days", () => {
    expect(daysAgo("2026-11-12T01:00:00Z", now)).toEqual({ short: "0d", long: "today" });
    expect(daysAgo("2026-11-11T11:00:00Z", now)).toEqual({ short: "1d", long: "1 day ago" });
    expect(daysAgo("2024-01-13T23:31:49.73Z", now).short).toBe("1033d");
    expect(daysAgo(undefined, now)).toEqual({ short: "–", long: "–" });
    expect(daysAgo("garbage", now).short).toBe("–");
  });
});

describe("formatUpdated", () => {
  it("formats month, day and time", () => {
    expect(formatUpdated("2026-11-11T18:31:59.798Z", "en-US", "UTC")).toBe("Nov 11, 6:31 PM");
    expect(formatUpdated("2026-11-12T00:07:00Z", "en-US", "UTC")).toBe("Nov 12, 12:07 AM");
  });
  it("is null without a usable timestamp", () => {
    expect(formatUpdated(null)).toBeNull();
    expect(formatUpdated("not a date")).toBeNull();
  });
});

describe("names", () => {
  const wallet = "0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1";
  it("shortens a name that is a wallet address", () => {
    expect(isWallet(wallet)).toBe(true);
    expect(displayName(wallet)).toBe("0x44c1…ebc1");
  });
  it("leaves other names alone and names the nameless", () => {
    expect(isWallet("0x44c1")).toBe(false);
    expect(displayName("aenews")).toBe("aenews");
    expect(displayName("")).toBe("Unknown Trader");
  });
});

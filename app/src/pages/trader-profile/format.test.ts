import { describe, expect, it } from "vitest";
import { categoryPnl, chartPnl, dayPnl, joinDate, monthPnl, overviewPnl, platformLabel, shareAmount, sharePlatform, shortWallet, titlePnl, upDown, wholeDollars } from "./format";

describe("money formats", () => {
  it("title: two decimals in millions, one in thousands, raw sign below zero", () => {
    expect(titlePnl(4921688.31)).toBe("+$4.92M");
    expect(titlePnl(531575.98)).toBe("+$531.6K");
    expect(titlePnl(0)).toBe("+$0");
    expect(titlePnl(-950)).toBe("$-950");
    expect(titlePnl(-2_500_000)).toBe("$-2.50M");
  });
  it("chart axis: one decimal in millions, whole thousands, sign before the dollar", () => {
    expect(chartPnl(5_400_000)).toBe("+$5.4M");
    expect(chartPnl(-1_250_000)).toBe("-$1.3M");
    expect(chartPnl(292090)).toBe("+$292K");
    expect(chartPnl(-999)).toBe("-$999");
    expect(chartPnl(0)).toBe("+$0");
  });
  it("overview axis keeps the raw sign", () => {
    expect(overviewPnl(1500)).toBe("+$2K");
    expect(overviewPnl(-1400)).toBe("$-1K");
  });
  it("category: values from the capture", () => {
    expect(categoryPnl(1227652.8)).toBe("+$1.23M");
    expect(categoryPnl(402986.62)).toBe("+$403.0K");
    expect(categoryPnl(-10220.636)).toBe("-$10.2K");
    expect(categoryPnl(18.2)).toBe("+$18");
    expect(categoryPnl(-165.81)).toBe("-$166");
  });
  it("share amount drops the decimal from 100K up", () => {
    expect(shareAmount(4921688)).toBe("$4.92M");
    expect(shareAmount(292090)).toBe("$292K");
    expect(shareAmount(12345)).toBe("$12.3K");
    expect(shareAmount(-950.4)).toBe("$950");
    expect(upDown(-12345)).toBe("down $12.3K");
    expect(upDown(0)).toBe("up $0");
  });
  it("calendar formats", () => {
    expect(wholeDollars(1111158.6)).toBe("+$1,111,159");
    expect(wholeDollars(-33.4)).toBe("-$33");
    expect(dayPnl(799300)).toBe("+$799.3K");
    expect(dayPnl(-13100)).toBe("-$13.1K");
    expect(dayPnl(0)).toBe("+$0");
    expect(dayPnl(999.6)).toBe("+$1000");
    expect(monthPnl(1_111_159)).toBe("+$1.11M");
    expect(monthPnl(-12_345)).toBe("-$12.35K");
    expect(monthPnl(12)).toBe("+$12");
  });
});

describe("labels", () => {
  it("shortens a wallet and leaves a short name", () => {
    expect(shortWallet("0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1")).toBe("0x44c1...ebc1");
    expect(shortWallet("Mitchieboi")).toBe("Mitchieboi");
  });
  it("join date accepts month-year text and ISO dates", () => {
    expect(joinDate("Oct 2025")).toBe("Oct 2025");
    expect(joinDate("OCTOBER 2025")).toBe("Oct 2025");
    expect(joinDate("2024-01-13T23:31:49.73Z")).toBe("Jan 2024");
    expect(joinDate("some time ago")).toBe("some time ago");
  });
  it("platform names", () => {
    expect(platformLabel("both")).toBe("Polymarket & Kalshi");
    expect(platformLabel("polymarket")).toBe("Polymarket");
    expect(platformLabel(null)).toBe("Polymarket");
    expect(sharePlatform("both")).toBe("Polymarket and Kalshi");
    expect(sharePlatform("myriad")).toBe("Polymarket");
  });
});

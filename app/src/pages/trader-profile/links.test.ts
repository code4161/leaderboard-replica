import { describe, expect, it } from "vitest";
import { polymarketProfile, profileLinks, twitterHandle, twitterUrl, withKalshiReferral, withVia } from "./links";

describe("referral links", () => {
  it("builds the Polymarket link from the wallet when there is one", () => {
    expect(polymarketProfile("0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1", "https://polymarket.com/@someone")).toBe("https://polymarket.com/profile/0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1?via=unbroken0x");
    expect(polymarketProfile(null, "https://www.polymarket.com/@SomeOne?via=other")).toBe("https://polymarket.com/@someone?via=unbroken0x");
    expect(polymarketProfile(null, "")).toBeNull();
  });
  it("tags a URL that does not parse", () => {
    expect(withVia("/profile/x?a=1#top")).toBe("/profile/x?a=1&via=unbroken0x#top");
    expect(withVia("https://polymarket.com")).toBe("https://polymarket.com/?via=unbroken0x");
  });
  it("adds the Kalshi referral", () => {
    expect(withKalshiReferral("https://kalshi.com/ideas/profiles/aenews")).toBe("https://kalshi.com/ideas/profiles/aenews?referral=predictingtop");
    expect(withKalshiReferral("https://kalshi.com")).toBe("https://kalshi.com/?referral=predictingtop");
  });
});

describe("X links", () => {
  it("accepts a URL, a handle and an @handle", () => {
    expect(twitterUrl("https://x.com/aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl("@aenews")).toBe("https://x.com/aenews");
    expect(twitterHandle("https://twitter.com/Mitchieboi__?s=20")).toBe("Mitchieboi__");
    expect(twitterHandle("aenews")).toBe("aenews");
  });
});

describe("profile hrefs", () => {
  const WALLET = "0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1";
  const POLY_HOME = "https://polymarket.com/?via=unbroken0x";
  const KALSHI_HOME = "https://kalshi.com/?referral=predictingtop";
  it("builds the same links as before for stored http(s) profiles", () => {
    expect(profileLinks({ platform: "both", wallet: WALLET, polymarket_profile: `https://polymarket.com/profile/${WALLET}?via=unbroken0x`, kalshi_profile: "https://kalshi.com/ideas/profiles/aenews" })).toEqual({
      polymarket: `https://polymarket.com/profile/${WALLET}?via=unbroken0x`,
      kalshi: "https://kalshi.com/ideas/profiles/aenews?referral=predictingtop",
      hyperliquid: undefined,
    });
    expect(profileLinks({ platform: "kalshi", wallet: null, polymarket_profile: "", kalshi_profile: "https://kalshi.com/ideas/profiles/Mitchieboi" })).toEqual({
      polymarket: POLY_HOME,
      kalshi: "https://kalshi.com/ideas/profiles/Mitchieboi?referral=predictingtop",
      hyperliquid: undefined,
    });
    const hl = profileLinks({ platform: "hyperliquid", wallet: WALLET, polymarket_profile: "https://polymarket.com/@someone", hyperliquid_profile: "https://app.hyperliquid.xyz/x" });
    expect(hl.polymarket).toBe("https://polymarket.com/@someone");
    expect(hl.hyperliquid).toBe("https://app.hyperliquid.xyz/x");
    expect(hl.kalshi).toBe(KALSHI_HOME);
  });
  it("never passes on a stored URL that is not http(s)", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "//evil.example/x", "/profile/x", "not a url"]) {
      const links = profileLinks({ platform: "both", wallet: null, polymarket_profile: bad, kalshi_profile: bad, hyperliquid_profile: bad });
      expect(links).toEqual({ polymarket: POLY_HOME, kalshi: KALSHI_HOME, hyperliquid: undefined });
      expect(profileLinks({ platform: "hyperliquid", wallet: null, polymarket_profile: bad }).polymarket).toBe(POLY_HOME);
    }
  });
});

describe("X links on the profile", () => {
  it("gives no link for a value that merely starts with http or is not on X", () => {
    for (const bad of ["httpx://evil.example", "https://evil.example/aenews", "http://x.com/aenews", "javascript:alert(1)"]) expect(twitterUrl(bad)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { polymarketProfile, twitterHandle, twitterUrl, withKalshiReferral, withVia } from "./links";

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

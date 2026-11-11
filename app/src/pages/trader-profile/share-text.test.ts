import { describe, expect, it } from "vitest";
import { retryNetworkOnly } from "./data";
import { chartShareText, comboShareText, postOnXUrl } from "./share-cards";

describe("share text", () => {
  it("combo card names the month and the all-time figure when there is one", () => {
    expect(comboShareText("aenews", "November", "both", 4921688.31)).toBe("aenews's November on Polymarket and Kalshi, up $4.92M all-time");
    expect(comboShareText("x", "May", "kalshi", undefined)).toBe("x's May on Kalshi");
  });
  it("chart card words each range", () => {
    expect(chartShareText("aenews", "all", "both", 4921688.31)).toBe("aenews is up $4.92M all-time on Polymarket and Kalshi");
    expect(chartShareText("m", "30d", "kalshi", -292090)).toBe("m is down $292K over the last 30 days on Kalshi");
    expect(chartShareText("m", "7d", "polymarket", 12)).toBe("m is up $12 over the last 7 days on Polymarket");
    expect(chartShareText("m", "7d", "polymarket", undefined)).toBe("m's 7-day P&L on Polymarket");
  });
  it("post link carries the text, a blank line and the profile URL", () => {
    expect(postOnXUrl("a & b", "https://predicting.top/account/x")).toBe("https://x.com/intent/post?text=a%20%26%20b%0A%0Ahttps%3A%2F%2Fpredicting.top%2Faccount%2Fx");
  });
});

describe("retryNetworkOnly", () => {
  it("retries a network-shaped failure twice and nothing else", () => {
    expect(retryNetworkOnly(0, new Error("Failed to fetch history"))).toBe(true);
    expect(retryNetworkOnly(2, new Error("Failed to fetch history"))).toBe(false);
    expect(retryNetworkOnly(0, new Error("Trader not found"))).toBe(false);
    expect(retryNetworkOnly(0, new TypeError("x"))).toBe(true);
    expect(retryNetworkOnly(0, "nope")).toBe(false);
  });
});

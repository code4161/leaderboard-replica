import { describe, expect, it } from "vitest";
import { twitterUrl as leaderboardTwitterUrl } from "@/pages/leaderboard/filter-sort";
import { twitterUrl as profileTwitterUrl } from "@/pages/trader-profile/links";
import { twitterUrl } from "./twitter";

describe("twitterUrl", () => {
  it("is the one builder the leaderboard and the profile both use", () => {
    expect(leaderboardTwitterUrl).toBe(twitterUrl);
    expect(profileTwitterUrl).toBe(twitterUrl);
  });
  it("accepts https links to X and Twitter, bare host paths and handles", () => {
    expect(twitterUrl("https://x.com/aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl("https://twitter.com/Mitchieboi__?s=20")).toBe("https://twitter.com/Mitchieboi__?s=20");
    expect(twitterUrl(" https://www.x.com/a ")).toBe("https://www.x.com/a");
    expect(twitterUrl("twitter.com/aenews")).toBe("https://twitter.com/aenews");
    expect(twitterUrl("@aenews")).toBe("https://x.com/aenews");
    expect(twitterUrl("aenews")).toBe("https://x.com/aenews");
  });
  it("refuses a value that only starts with http, another host, another scheme and a non-handle", () => {
    for (const bad of [
      "httpx://x.com/a",
      "http-evil",
      "http://x.com/a",
      "https://evil.example/x.com/a",
      "https://x.com.evil.example/a",
      "https://x.com@evil.example/a",
      "https://x.com/javascript:alert(1)",
      "javascript:alert(1)",
      "data:text/html,x",
      "//x.com/a",
      "a/b",
      "name_longer_than_15_chars",
      "has space",
      "",
      "   ",
      null,
      undefined,
    ]) {
      expect(twitterUrl(bad)).toBeNull();
    }
  });
});

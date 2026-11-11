import { describe, expect, it } from "vitest";
import { avatarInitial, largeAvatar, smallAvatar } from "./avatar";

describe("avatar URLs", () => {
  it("routes X profile images through the resizing route at the asked size", () => {
    const x = "https://pbs.twimg.com/profile_images/1350279872321503234/m9ANAo5E_400x400.jpg";
    expect(smallAvatar(x)).toBe("/api/x-avatar/1350279872321503234/m9ANAo5E_bigger.jpg");
    expect(largeAvatar(x)).toBe("/api/x-avatar/1350279872321503234/m9ANAo5E_400x400.jpg");
    expect(smallAvatar("https://pbs.twimg.com/profile_images/12/ab-c_d.png")).toBe("/api/x-avatar/12/ab-c_d_bigger.png");
    expect(smallAvatar("https://pbs.twimg.com/profile_images/12/abc_normal.jpg")).toBe("/api/x-avatar/12/abc_bigger.jpg");
  });
  it("addresses avatars hosted by the upstream API relative to this site", () => {
    expect(smallAvatar("https://predicting.top/api/kalshi-avatar/lasso")).toBe("/api/kalshi-avatar/lasso");
    expect(smallAvatar("https://predicting.top/api/wallet-avatar/0xc369")).toBe("/api/wallet-avatar/0xc369");
  });
  it("leaves every other URL as it is", () => {
    const other = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
    expect(smallAvatar(other)).toBe(other);
    expect(smallAvatar("https://predicting.top/logo.png")).toBe("https://predicting.top/logo.png");
    expect(smallAvatar("https://evil.example/https://predicting.top/api/x")).toBe("https://evil.example/https://predicting.top/api/x");
  });
  it("picks the fallback letter", () => {
    expect(avatarInitial("aenews")).toBe("A");
    expect(avatarInitial("")).toBe("?");
    expect(avatarInitial(null)).toBe("?");
  });
});

import { describe, expect, it } from "vitest";
import { EMPTY_FORM, firstError, normalizeHandle, refusalMessage, submissionSchema, type SubmissionForm } from "./schema";

const valid: SubmissionForm = { x_handle: "@some_trader", account: "0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1", platform: "polymarket", pnl: "$125,000", website: "" };
const withField = (patch: Partial<SubmissionForm>) => ({ ...valid, ...patch });

const HANDLE = "Enter a valid X handle (letters, numbers and _ only, up to 15).";

describe("normalizeHandle", () => {
  it.each([
    ["@name", "name"],
    ["  name  ", "name"],
    ["https://x.com/name", "name"],
    ["https://www.twitter.com/name/status/1?s=20", "name"],
    ["HTTP://X.COM/name?ref=a", "name"],
    ["name#top", "name"],
    ["@@name", "@name"],
  ])("%s -> %s", (input, want) => expect(normalizeHandle(input)).toBe(want));
});

describe("submission form", () => {
  it("accepts a complete entry and returns the bare handle", () => {
    expect(firstError(valid)).toBeNull();
    expect(submissionSchema.parse(valid).x_handle).toBe("some_trader");
  });

  it("reports the X handle first on an empty form", () => {
    expect(firstError(EMPTY_FORM)).toBe(HANDLE);
  });

  it.each(["bad handle!", "sixteen_chars_xx", "na-me", "@", "x.com/name"])("refuses the handle %s", (x_handle) => {
    expect(firstError(withField({ x_handle }))).toBe(HANDLE);
  });

  it.each(["a", "fifteen_chars_x", "https://x.com/Name_1", "@name"])("accepts the handle %s", (x_handle) => {
    expect(firstError(withField({ x_handle }))).toBeNull();
  });

  it("refuses a handle over 100 characters with the length message first", () => {
    expect(firstError(withField({ x_handle: "a".repeat(101) }))).toBe("String must contain at most 100 character(s)");
  });

  it("asks for the account when it is empty or only spaces", () => {
    expect(firstError(withField({ account: "" }))).toBe("Enter your Polymarket wallet or Kalshi account name.");
    expect(firstError(withField({ account: "   " }))).toBe("Enter your Polymarket wallet or Kalshi account name.");
  });

  it("refuses characters an account cannot hold", () => {
    expect(firstError(withField({ account: "<script>" }))).toBe("Use a wallet address, Kalshi username or profile link.");
    expect(firstError(withField({ account: "name!" }))).toBe("Use a wallet address, Kalshi username or profile link.");
  });

  it("accepts a username, a wallet and a profile link as the account", () => {
    for (const account of ["Mitchieboi", "https://kalshi.com/ideas/profiles/some.name?tab=a&b=1#x", "name one"]) expect(firstError(withField({ account }))).toBeNull();
  });

  it("refuses an account over 200 characters", () => {
    expect(firstError(withField({ account: "a".repeat(201) }))).toBe("Keep the account under 200 characters.");
  });

  it("asks for the P&L when it is empty", () => {
    expect(firstError(withField({ pnl: "" }))).toBe("Enter your P&L.");
    expect(firstError(withField({ pnl: "  " }))).toBe("Enter your P&L.");
  });

  it("refuses a P&L over 40 characters, and one with other symbols", () => {
    expect(firstError(withField({ pnl: "1".repeat(41) }))).toBe("Keep the P&L under 40 characters.");
    expect(firstError(withField({ pnl: "€5000" }))).toBe("Use numbers and $ , . k m only.");
    expect(firstError(withField({ pnl: "(500)" }))).toBe("Use numbers and $ , . k m only.");
  });

  it.each(["$125,000", "-$3.2k", "+1.5m", "~ 40k", "125000"])("accepts the P&L %s", (pnl) => {
    expect(firstError(withField({ pnl }))).toBeNull();
  });

  it("reports fields in form order: handle, account, then P&L", () => {
    expect(firstError(withField({ account: "", pnl: "" }))).toBe("Enter your Polymarket wallet or Kalshi account name.");
    expect(firstError(withField({ x_handle: "", account: "", pnl: "" }))).toBe(HANDLE);
  });

  it("accepts each platform and refuses any other", () => {
    for (const platform of ["polymarket", "kalshi", "both"]) expect(firstError(withField({ platform }))).toBeNull();
    expect(firstError(withField({ platform: "myriad" }))).toBe("Invalid enum value. Expected 'polymarket' | 'kalshi' | 'both', received 'myriad'");
  });

  it("allows the hidden website field up to 200 characters", () => {
    expect(firstError(withField({ website: "a".repeat(200) }))).toBeNull();
    expect(firstError(withField({ website: "a".repeat(201) }))).toBe("String must contain at most 200 character(s)");
  });
});

describe("refusalMessage", () => {
  it("has its own message for the rate limit", () => {
    expect(refusalMessage(429, { message: "slow down" })).toBe("Too many submissions. Please try again later.");
  });
  it("uses the server's message when there is one", () => {
    expect(refusalMessage(400, { message: "Duplicate entry." })).toBe("Duplicate entry.");
  });
  it("falls back to a general message", () => {
    expect(refusalMessage(500, {})).toBe("Something went wrong. Please try again.");
    expect(refusalMessage(500, "not json")).toBe("Something went wrong. Please try again.");
  });
});

import { describe, expect, it } from "vitest";
import { registerLanding, type Landing } from "./referral";

function store(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

function landing(search: string, over: Partial<Landing> = {}) {
  const sent: { path: string; body: unknown }[] = [];
  const l: Landing = {
    search,
    pathname: "/polymarket",
    local: store(),
    session: store(),
    send: (path, body) => sent.push({ path, body }),
    newVisitorId: () => "vis_test",
    ...over,
  };
  return { l, sent };
}

describe("registerLanding", () => {
  it("sends the visit with the code, a new visitor id, the landing page and the UTM tags", () => {
    const { l, sent } = landing("?ref=alice&utm_source=x&utm_campaign=c");
    expect(registerLanding(l, { visitSent: false })).toBe(true);
    expect(sent).toEqual([
      {
        path: "/api/referral/visit",
        body: { referral_code: "alice", visitor_id: "vis_test", landing_page: "/polymarket", utm_source: "x", utm_medium: null, utm_campaign: "c" },
      },
    ]);
    expect(l.local.getItem("referral_code")).toBe("alice");
    expect(l.local.getItem("referral_visitor_id")).toBe("vis_test");
  });
  it("sends the visit once when the effect runs twice on one page load", () => {
    const { l, sent } = landing("?ref=alice");
    const page = { visitSent: false };
    expect(registerLanding(l, page)).toBe(true);
    expect(registerLanding(l, page)).toBe(true);
    expect(sent).toHaveLength(1);
  });
  it("keeps the visitor id of a returning visitor", () => {
    const { l, sent } = landing("?ref=bob", { local: store({ referral_visitor_id: "vis_old", referral_code: "alice" }) });
    registerLanding(l, { visitSent: false });
    expect(sent[0].body).toMatchObject({ referral_code: "bob", visitor_id: "vis_old" });
    expect(l.local.getItem("referral_code")).toBe("bob");
  });
  it("sends nothing without a code, and reports a pending qualification only for a referred visitor", () => {
    const fresh = landing("");
    expect(registerLanding(fresh.l, { visitSent: false })).toBe(false);
    expect(fresh.sent).toEqual([]);
    const returning = landing("", { local: store({ referral_code: "alice", referral_visitor_id: "vis_old" }) });
    expect(registerLanding(returning.l, { visitSent: false })).toBe(true);
    expect(returning.sent).toEqual([]);
  });
  it("does nothing once the session is qualified", () => {
    const { l, sent } = landing("?ref=alice", { session: store({ referral_qualified: "true" }) });
    expect(registerLanding(l, { visitSent: false })).toBe(false);
    expect(sent).toEqual([]);
    expect(l.local.getItem("referral_code")).toBeNull();
  });
});

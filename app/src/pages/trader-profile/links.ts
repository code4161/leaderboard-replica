// Outbound links: referral tags on platform profiles and X handles.

const POLYMARKET_VIA = "unbroken0x";
const KALSHI_REFERRAL = "predictingtop";

function normalisePolymarket(u: URL): void {
  if (u.hostname === "www.polymarket.com") u.hostname = "polymarket.com";
  if (u.hostname !== "polymarket.com") return;
  const wallet = u.pathname.match(/^\/(?:profile\/)?@?(0x[0-9a-fA-F]{40})\/?$/);
  if (wallet) {
    u.pathname = `/profile/${wallet[1]}`;
    return;
  }
  const handle = u.pathname.match(/^\/@([^/]+)\/?$/);
  if (handle) u.pathname = `/@${decodeURIComponent(handle[1]).toLowerCase()}`;
}

export function withVia(url: string, via = POLYMARKET_VIA): string {
  try {
    const u = new URL(url);
    normalisePolymarket(u);
    u.searchParams.set("via", via);
    return u.toString();
  } catch {
    const h = url.indexOf("#");
    const hash = h >= 0 ? url.slice(h) : "";
    const rest = h >= 0 ? url.slice(0, h) : url;
    const q = rest.indexOf("?");
    if (q < 0) return `${rest}?via=${encodeURIComponent(via)}${hash}`;
    const params = new URLSearchParams(rest.slice(q + 1));
    params.set("via", via);
    return `${rest.slice(0, q)}?${params.toString()}${hash}`;
  }
}

/** A wallet address wins over the stored profile URL. */
export function polymarketProfile(wallet: string | null | undefined, profile: string | null | undefined): string | null {
  if (wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet)) return withVia(`https://polymarket.com/profile/${wallet}`);
  return profile ? withVia(profile) : null;
}

export function withKalshiReferral(url: string, referral = KALSHI_REFERRAL): string {
  try {
    const u = new URL(url);
    u.searchParams.set("referral", referral);
    return u.toString();
  } catch {
    return `${url}${url.includes("?") ? "&" : "?"}referral=${encodeURIComponent(referral)}`;
  }
}

export const twitterUrl = (t: string) => (t.startsWith("http") ? t : `https://x.com/${t.startsWith("@") ? t.slice(1) : t}`);

export function twitterHandle(t: string): string {
  if (t.startsWith("http")) {
    const m = t.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
    return m ? m[1] : t;
  }
  return t.startsWith("@") ? t.slice(1) : t;
}

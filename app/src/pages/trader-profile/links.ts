// Outbound links: referral tags on platform profiles and X handles.
import { safeExternalUrl } from "@/lib/safe-url";

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

// The X link builder is the strict one the leaderboard uses.
export { twitterUrl } from "@/lib/twitter";

export function twitterHandle(t: string): string {
  if (t.startsWith("http")) {
    const m = t.match(/(?:twitter\.com|x\.com)\/([^/?]+)/);
    return m ? m[1] : t;
  }
  return t.startsWith("@") ? t.slice(1) : t;
}

const POLYMARKET_HOME = "https://polymarket.com";
const KALSHI_HOME = "https://kalshi.com";

export type ProfileLinks = { polymarket: string; kalshi: string; hyperliquid: string | undefined };

/**
 * The outbound hrefs of a trader's profile page. A stored profile URL is used only when it is an http(s)
 * URL: an unsafe Polymarket or Kalshi one falls back to the platform's home page (what an empty one
 * gets), and an unsafe Hyperliquid one gives no link.
 */
export function profileLinks(t: {
  platform?: string | null;
  wallet?: string | null;
  polymarket_profile?: string | null;
  kalshi_profile?: string | null;
  hyperliquid_profile?: string | null;
}): ProfileLinks {
  const polymarketHome = withVia(POLYMARKET_HOME);
  const stored = t.polymarket_profile;
  const polymarket = !stored ? polymarketHome : t.platform === "hyperliquid" ? stored : polymarketProfile(t.wallet, stored) ?? polymarketHome;
  return {
    polymarket: safeExternalUrl(polymarket) ?? polymarketHome,
    kalshi: safeExternalUrl(withKalshiReferral(t.kalshi_profile || KALSHI_HOME)) ?? withKalshiReferral(KALSHI_HOME),
    hyperliquid: safeExternalUrl(t.hyperliquid_profile),
  };
}

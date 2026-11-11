// Outbound profile links carry the same partner parameters the original adds.
const POLYMARKET_VIA = "unbroken0x";
const KALSHI_REFERRAL = "predictingtop";

export function polymarketProfileUrl(url: string, via: string = POLYMARKET_VIA): string {
  const u = new URL(url);
  if (u.hostname === "www.polymarket.com") u.hostname = "polymarket.com";
  if (u.hostname === "polymarket.com") {
    const wallet = u.pathname.match(/^\/(?:profile\/)?@?(0x[0-9a-fA-F]{40})\/?$/);
    const handle = u.pathname.match(/^\/@([^/]+)\/?$/);
    if (wallet) u.pathname = `/profile/${wallet[1]}`;
    else if (handle) u.pathname = `/@${decodeURIComponent(handle[1]).toLowerCase()}`;
  }
  u.searchParams.set("via", via);
  return u.toString();
}

export function kalshiProfileUrl(url: string, referral: string = KALSHI_REFERRAL): string {
  const u = new URL(url);
  u.searchParams.set("referral", referral);
  return u.toString();
}

// Outbound links carry the same referral parameters the original adds, and the two referral pings
// (a visit that arrived with ?ref=, and that visitor staying a minute) go to this site's own API.
import { useEffect, useRef } from "react";

const POLYMARKET_VIA = "unbroken0x";

function normalisePolymarket(url: URL): void {
  if (url.hostname === "www.polymarket.com") url.hostname = "polymarket.com";
  if (url.hostname !== "polymarket.com") return;
  const wallet = url.pathname.match(/^\/(?:profile\/)?@?(0x[0-9a-fA-F]{40})\/?$/);
  if (wallet) {
    url.pathname = `/profile/${wallet[1]}`;
    return;
  }
  const handle = url.pathname.match(/^\/@([^/]+)\/?$/);
  if (handle) url.pathname = `/@${decodeURIComponent(handle[1]).toLowerCase()}`;
}

/** `link` with `via=<code>` set, and a Polymarket profile path put in its canonical form. */
export function withVia(link: string, code: string = POLYMARKET_VIA): string {
  try {
    const url = new URL(link);
    normalisePolymarket(url);
    url.searchParams.set("via", code);
    return url.toString();
  } catch {
    const hashAt = link.indexOf("#");
    const hash = hashAt >= 0 ? link.slice(hashAt) : "";
    const rest = hashAt >= 0 ? link.slice(0, hashAt) : link;
    const queryAt = rest.indexOf("?");
    if (queryAt < 0) return `${rest}?via=${encodeURIComponent(code)}${hash}`;
    const params = new URLSearchParams(rest.slice(queryAt + 1));
    params.set("via", code);
    return `${rest.slice(0, queryAt)}?${params.toString()}${hash}`;
  }
}

/** A trader's Polymarket profile link: by wallet when there is one, else the given profile URL. */
export function polymarketProfileUrl(wallet: string | null | undefined, profile: string | null | undefined): string | null {
  if (wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet)) return withVia(`https://polymarket.com/profile/${wallet}`);
  return profile ? withVia(profile) : null;
}

const CODE_KEY = "referral_code";
const VISITOR_KEY = "referral_visitor_id";
const QUALIFIED_KEY = "referral_qualified";
const QUALIFY_AFTER_MS = 60_000;

type Send = (path: string, body: unknown) => void;
type Store = Pick<Storage, "getItem" | "setItem">;

const post: Send = (path, body) => {
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch((e: unknown) => {
    console.error(`Failed to post ${path}:`, e);
  });
};

function qualify(): void {
  sessionStorage.setItem(QUALIFIED_KEY, "true");
  post("/api/referral/qualify", {});
}

export type Landing = { search: string; pathname: string; local: Store; session: Store; send: Send; newVisitorId: () => string };

/**
 * Handles arrival: a `?ref=` code is remembered and its visit sent, once per page load (`page.visitSent`
 * guards a repeated call). Returns whether this visitor is a referred one still to be qualified.
 */
export function registerLanding(l: Landing, page: { visitSent: boolean }): boolean {
  if (l.session.getItem(QUALIFIED_KEY)) return false;
  const query = new URLSearchParams(l.search);
  const ref = query.get("ref");
  if (ref && !page.visitSent) {
    page.visitSent = true;
    l.local.setItem(CODE_KEY, ref);
    let visitor = l.local.getItem(VISITOR_KEY);
    if (!visitor) {
      visitor = l.newVisitorId();
      l.local.setItem(VISITOR_KEY, visitor);
    }
    l.send("/api/referral/visit", {
      referral_code: ref,
      visitor_id: visitor,
      landing_page: l.pathname,
      utm_source: query.get("utm_source"),
      utm_medium: query.get("utm_medium"),
      utm_campaign: query.get("utm_campaign"),
    });
  }
  return !!l.local.getItem(CODE_KEY) && !!l.local.getItem(VISITOR_KEY);
}

/** Registers a referred visit once per page load, then marks it qualified after a minute of the tab being visible. */
export function useReferral(): void {
  const page = useRef({ visitSent: false });
  useEffect(() => {
    const pending = registerLanding(
      {
        search: window.location.search,
        pathname: window.location.pathname,
        local: localStorage,
        session: sessionStorage,
        send: post,
        newVisitorId: () => `vis_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      },
      page.current,
    );
    if (!pending) return;

    let startedAt = Date.now();
    let elapsed = 0;
    let timer: ReturnType<typeof setTimeout> | undefined = setTimeout(qualify, QUALIFY_AFTER_MS);
    const onVisibility = () => {
      if (document.hidden) {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
          elapsed = Date.now() - startedAt;
        }
      } else if (!sessionStorage.getItem(QUALIFIED_KEY)) {
        const left = QUALIFY_AFTER_MS - elapsed;
        if (left > 0) {
          startedAt = Date.now() - elapsed;
          clearTimeout(timer);
          timer = setTimeout(qualify, left);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}

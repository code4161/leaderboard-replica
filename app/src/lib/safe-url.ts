/**
 * A URL that came from the API, for use in an href or window.open: the value itself when it parses as an
 * absolute http or https URL, else undefined. Anything else (javascript:, data:, a protocol-relative or
 * relative path, text that is not a URL) is refused, so it can never run script or leave the http(s) web.
 */
export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Opens an API-supplied URL in a new tab with no handle back to this page. An unsafe URL opens nothing. */
export function openExternal(value: string | null | undefined, opener: Pick<Window, "open"> = window): boolean {
  const url = safeExternalUrl(value);
  if (!url) return false;
  opener.open(url, "_blank", "noopener,noreferrer");
  return true;
}

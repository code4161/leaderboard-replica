// Fetching and saving the share card images.

const REVOKE_AFTER_MS = 10_000;

/**
 * The PNG behind a share card. Rejects unless the response is a successful one carrying a PNG, so an
 * error page is never saved, copied or shared under an image's name.
 */
export async function shareImage(url: string, get: typeof fetch = fetch): Promise<Blob> {
  const res = await get(url);
  if (!res.ok) throw new Error(`Share image request failed: HTTP ${res.status}`);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type !== "image/png") throw new Error(`Share image is not a PNG: ${type || "no content type"}`);
  return res.blob();
}

type Urls = Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;

/**
 * Hands `blob` to the browser as a download named `fileName`. The object URL is released a little later,
 * never straight after the click: the browser may not have started reading it yet.
 */
export function saveBlob(blob: Blob, fileName: string, doc: Pick<Document, "createElement"> = document, urls: Urls = URL, later: (run: () => void, ms: number) => unknown = setTimeout): void {
  const href = urls.createObjectURL(blob);
  const a = doc.createElement("a");
  a.href = href;
  a.download = fileName;
  a.click();
  later(() => urls.revokeObjectURL(href), REVOKE_AFTER_MS);
}

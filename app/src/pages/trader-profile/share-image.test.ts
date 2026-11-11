import { describe, expect, it } from "vitest";
import { saveBlob, shareImage } from "./share-image";

const respond = (body: string, init: ResponseInit) => (() => Promise.resolve(new Response(body, init))) as unknown as typeof fetch;

describe("shareImage", () => {
  it("returns the body of a successful PNG response", async () => {
    const blob = await shareImage("/api/og/pnl/x?range=all", respond("png-bytes", { status: 200, headers: { "content-type": "image/png" } }));
    expect(await blob.text()).toBe("png-bytes");
  });
  it("accepts a content type with parameters and any letter case", async () => {
    await expect(shareImage("/x", respond("p", { status: 200, headers: { "content-type": "Image/PNG; charset=binary" } }))).resolves.toBeInstanceOf(Blob);
  });
  it("rejects an error status even when the body claims to be a PNG", async () => {
    await expect(shareImage("/x", respond("p", { status: 500, headers: { "content-type": "image/png" } }))).rejects.toThrow("HTTP 500");
    await expect(shareImage("/x", respond("p", { status: 404, headers: { "content-type": "image/png" } }))).rejects.toThrow("HTTP 404");
  });
  it("rejects a successful response that is not a PNG", async () => {
    await expect(shareImage("/x", respond('{"message":"Not found"}', { status: 200, headers: { "content-type": "application/json" } }))).rejects.toThrow("not a PNG");
    await expect(shareImage("/x", respond("<html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))).rejects.toThrow("not a PNG");
  });
  it("rejects when the request itself fails", async () => {
    const down = (() => Promise.reject(new TypeError("Failed to fetch"))) as unknown as typeof fetch;
    await expect(shareImage("/x", down)).rejects.toThrow("Failed to fetch");
  });
});

describe("saveBlob", () => {
  it("clicks a download link and releases the object URL later, not straight after the click", () => {
    const events: string[] = [];
    const link = { href: "", download: "", click: () => events.push(`click ${link.download} ${link.href}`) };
    const doc = { createElement: () => link } as unknown as Pick<Document, "createElement">;
    const urls = { createObjectURL: () => "blob:1", revokeObjectURL: (u: string) => void events.push(`revoke ${u}`) };
    const timers: { run: () => void; ms: number }[] = [];
    saveBlob(new Blob(["x"]), "aenews-pnl-all.png", doc, urls, (run, ms) => timers.push({ run, ms }));
    expect(events).toEqual(["click aenews-pnl-all.png blob:1"]);
    expect(timers).toHaveLength(1);
    expect(timers[0].ms).toBeGreaterThanOrEqual(1000);
    timers[0].run();
    expect(events).toEqual(["click aenews-pnl-all.png blob:1", "revoke blob:1"]);
  });
});

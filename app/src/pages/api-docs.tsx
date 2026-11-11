import { ReplicaNotice } from "@/components/replica-notice";
import { CopyButton } from "./api-docs/copy-button";
import { BASE_URL, ENDPOINTS, EXAMPLE, RATE_LIMITS } from "./api-docs/endpoints";
import { BackHeader, useDocumentTitle } from "./terms/back-header";

export default function ApiDocs() {
  useDocumentTitle("Free Prediction Market API — Polymarket & Kalshi Trader Data | predicting.top");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Public API</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Free, read-only JSON for prediction market traders on Polymarket and Kalshi. No API key needed, and it works from the browser (CORS
          enabled). Leaderboards update every few minutes.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Base URL: <code className="text-foreground">{BASE_URL}</code> · Please credit predicting.top and link back when you display the data.
        </p>
        <section className="mb-8 text-sm">
          <h2 className="font-semibold mb-2">Example</h2>
          <div className="bg-secondary rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">JavaScript</span>
              <CopyButton text={EXAMPLE} />
            </div>
            <pre className="p-3 text-xs overflow-x-auto">
              <code>{EXAMPLE}</code>
            </pre>
          </div>
        </section>
        <h2 className="font-semibold mb-3 text-sm">Endpoints</h2>
        <div className="space-y-4 text-sm">
          {ENDPOINTS.map((e) => (
            <section key={e.path} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-mono text-xs break-all">
                  <span className="text-green-500 mr-2">GET</span>
                  {e.path}
                </h3>
                <CopyButton text={`${BASE_URL}${e.example}`} />
              </div>
              <p className="text-muted-foreground mb-2">{e.summary}</p>
              {e.params && (
                <p className="text-xs mb-1">
                  <span className="text-muted-foreground">Params: </span>
                  <code>{e.params}</code>
                </p>
              )}
              <p className="text-xs mb-1 break-all">
                <span className="text-muted-foreground">Try: </span>
                <a href={e.example} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {e.example}
                </a>
              </p>
              {e.image ? (
                <p className="text-xs text-muted-foreground">Returns an image.</p>
              ) : (
                <p className="text-xs">
                  <span className="text-muted-foreground">Fields: </span>
                  <code>{e.fields.join(", ")}</code>
                </p>
              )}
            </section>
          ))}
        </div>
        <section className="mt-8 text-sm">
          <h2 className="font-semibold mb-2">Rate limits</h2>
          <p className="text-muted-foreground">{RATE_LIMITS}</p>
        </section>
      </main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <a href="https://x.com/predictingtop" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">
            @predictingtop
          </a>
        </div>
      </footer>
      <ReplicaNotice />
    </div>
  );
}

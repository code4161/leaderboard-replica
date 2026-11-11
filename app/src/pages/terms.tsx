import { ReplicaNotice } from "@/components/replica-notice";
import { BackHeader, useDocumentTitle } from "./terms/back-header";
import { CLOSING, SECTIONS } from "./terms/sections";

export default function Terms() {
  useDocumentTitle("Terms of Service | predicting.top");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: December 29, 2025</p>
        <div className="space-y-6 text-sm leading-relaxed">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
              <p className="text-muted-foreground">
                {s.body}
                {s.strong && <strong>{s.strong}</strong>}
                {s.after}
              </p>
            </section>
          ))}
          <section className="pt-4 border-t border-border">
            <p className="text-muted-foreground">{CLOSING}</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Predicting.top</p>
        </div>
      </footer>
      <ReplicaNotice />
    </div>
  );
}

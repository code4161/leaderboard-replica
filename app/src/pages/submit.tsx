import { useState, type ChangeEvent, type FormEvent } from "react";
import { ReplicaNotice } from "@/components/replica-notice";
import { EMPTY_FORM, firstError, refusalMessage, SEND_ERROR, type SubmissionForm } from "./submit/schema";
import { BackHeader, useDocumentTitle } from "./terms/back-header";

const FIELD = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function Submit() {
  useDocumentTitle("Submit Your Entry — Prediction Market Leaderboard | predicting.top");
  const [form, setForm] = useState<SubmissionForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (field: keyof SubmissionForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = firstError(form);
    if (invalid !== null) {
      setError(invalid);
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      // Answered by this replica's own server; it is never passed on to the original.
      const res = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        setError(refusalMessage(res.status, body));
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError(SEND_ERROR);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackHeader className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between" />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Predicting Top Leaderboard — Entry Submission</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Submit your details to be added to the Predicting Top Leaderboard. We will verify your information before adding you.
        </p>
        {status === "sent" ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Thanks, we got it.</h2>
            <p className="text-sm text-muted-foreground">We'll verify your account and add you to the leaderboard if everything checks out.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="x_handle" className="block text-sm font-medium mb-1">
                X / Twitter Handle <span className="text-red-500">*</span>
              </label>
              <input id="x_handle" className={FIELD} value={form.x_handle} onChange={set("x_handle")} placeholder="@yourhandle" maxLength={100} autoComplete="off" required />
            </div>
            <div>
              <label htmlFor="platform" className="block text-sm font-medium mb-1">
                Platform
              </label>
              <select id="platform" className={FIELD} value={form.platform} onChange={set("platform")}>
                <option value="polymarket">Polymarket</option>
                <option value="kalshi">Kalshi</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label htmlFor="account" className="block text-sm font-medium mb-1">
                Polymarket Wallet Address / Kalshi Account Name <span className="text-red-500">*</span>
              </label>
              <input id="account" className={FIELD} value={form.account} onChange={set("account")} placeholder="0x… or your Kalshi username" maxLength={200} autoComplete="off" required />
            </div>
            <div>
              <label htmlFor="pnl" className="block text-sm font-medium mb-1">
                PnL (Profit &amp; Loss) <span className="text-red-500">*</span>
              </label>
              <input id="pnl" className={FIELD} value={form.pnl} onChange={set("pnl")} placeholder="$125,000" maxLength={40} autoComplete="off" required />
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </main>
      <ReplicaNotice />
    </div>
  );
}

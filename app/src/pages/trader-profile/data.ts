// The profile's API calls. Every response is parsed here; components only see the parsed types.
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const period = z.object({ pnl: z.number().catch(0), buys: z.number().catch(0), sells: z.number().catch(0) });
const text = z.string().nullish();

const smartScore = z.object({
  tier: z.string(),
  score: z.number(),
  winRate: z.number(),
  sharpeRatio: z.number(),
  maxDrawdownPercent: z.number(),
  profitFactor: z.number(),
  rSquared: z.number(),
});

const trader = z.object({
  name: z.string().catch(""),
  wallet: text,
  additional_wallets: z.array(z.string().nullable()).nullish(),
  twitter: text,
  pfp: text,
  polymarket_profile: text,
  platform: text,
  kalshi_profile: text,
  kalshi_username: text,
  hyperliquid_profile: text,
  stats: z.object({ "1d": period, "7d": period, "30d": period, all: period }).partial().nullish(),
  views: z.number().nullish(),
  join_date: text,
  smart_score: smartScore.nullish().catch(null),
});
export type Trader = z.infer<typeof trader>;

const historyPoint = z.object({
  timestamp: z.number(),
  pnl: z.number(),
  polymarket: z.number().optional(),
  kalshi: z.number().optional(),
});
const history = z.object({ history: z.array(historyPoint).nullish() });
export type History = z.infer<typeof history>;

const categories = z.object({ categories: z.array(z.object({ category: z.string(), pnl: z.number(), markets: z.number().catch(0) })).nullish() });
const categoryChange = z.object({
  change: z.object({ categories: z.array(z.object({ category: z.string(), change: z.number() })).nullish() }).nullish(),
});

async function get<T>(url: string, schema: z.ZodType<T>, failure: (status: number) => string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(failure(res.status));
  return schema.parse(await res.json());
}

/**
 * Retry rule of the page: only a failure that reads as a network failure is retried, at most twice.
 * The history request's own error message reads as one, so a failed history request is retried; a
 * missing trader is not.
 */
export function retryNetworkOnly(count: number, error: unknown): boolean {
  if (count >= 2 || !(error instanceof Error)) return false;
  const m = (error.message || "").toLowerCase();
  return error.name === "TypeError" || ["failed to fetch", "networkerror", "load failed", "ssl", "quic", "err_", "network request failed"].some((s) => m.includes(s));
}
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 5000) + Math.random() * 250;

export function useTrader(id: string) {
  return useQuery({
    queryKey: ["/api/trader", id],
    queryFn: async () => (await get(`/api/trader/${id}`, z.object({ trader: trader.nullish() }), () => "Trader not found")).trader ?? null,
    enabled: !!id,
    staleTime: 60_000,
    retry: retryNetworkOnly,
    retryDelay,
  });
}

/** One cache entry per history URL, shared by the calendar and the chart. */
export function usePnlHistory(url: string | null, enabled = true) {
  return useQuery({
    queryKey: ["pnl-history", url],
    queryFn: () => get(url ?? "", history, () => "Failed to fetch history"),
    enabled: !!url && enabled,
    staleTime: 300_000,
    retry: retryNetworkOnly,
    retryDelay,
  });
}

export function useKalshiCategories(username: string) {
  const u = encodeURIComponent(username);
  const all = useQuery({
    queryKey: ["/api/kalshi", username, "categories"],
    queryFn: () => get(`/api/kalshi/${u}/categories`, categories, (s) => `HTTP ${s}`),
    staleTime: 1_800_000,
    retry: false,
  });
  const change = useQuery({
    queryKey: ["/api/kalshi", username, "category-change"],
    queryFn: () => get(`/api/kalshi/${u}/category-change`, categoryChange, (s) => `HTTP ${s}`),
    staleTime: 600_000,
    retry: false,
  });
  return { categories: all.data?.categories ?? [], isLoading: all.isLoading, changes: (change.data?.change?.categories ?? []).slice(0, 3) };
}

export const historyUrlFor = (t: { kalshiUsername?: string | null; historyUrl?: string }) => t.historyUrl ?? (t.kalshiUsername ? `/api/kalshi/${t.kalshiUsername}/history` : null);

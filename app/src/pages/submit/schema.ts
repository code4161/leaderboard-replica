import { z } from "zod";

// The entry form's rules. The form shows the first failing rule's message, in field order:
// X handle, account, platform, P&L, then the hidden website field.
export const PLATFORMS = ["polymarket", "kalshi", "both"] as const;

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const ACCOUNT = /^[A-Za-z0-9@._:/?=&#%+\- ]*$/;
const PNL = /^[A-Za-z0-9$+\-.,~ ]+$/;

const tooLong = (n: number) => `String must contain at most ${n} character(s)`;

// Accepts "@name", "name" or a profile link on x.com or twitter.com, and returns the bare name.
export function normalizeHandle(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
}

export const submissionSchema = z.object({
  x_handle: z
    .string()
    .max(100, tooLong(100))
    .transform(normalizeHandle)
    .refine((v) => HANDLE.test(v), "Enter a valid X handle (letters, numbers and _ only, up to 15)."),
  account: z
    .string()
    .trim()
    .max(200, "Keep the account under 200 characters.")
    .min(1, "Enter your Polymarket wallet or Kalshi account name.")
    .regex(ACCOUNT, "Use a wallet address, Kalshi username or profile link."),
  platform: z.enum(PLATFORMS, {
    error: (issue) => `Invalid enum value. Expected 'polymarket' | 'kalshi' | 'both', received '${String(issue.input)}'`,
  }),
  pnl: z.string().trim().min(1, "Enter your P&L.").max(40, "Keep the P&L under 40 characters.").regex(PNL, "Use numbers and $ , . k m only."),
  website: z.string().max(200, tooLong(200)).optional(),
});

export type SubmissionForm = { x_handle: string; account: string; platform: string; pnl: string; website: string };

export const EMPTY_FORM: SubmissionForm = { x_handle: "", account: "", platform: "polymarket", pnl: "", website: "" };

export const FALLBACK_ERROR = "Check the form and try again.";

// The message the form shows for these values, or null when they are valid.
export function firstError(values: SubmissionForm): string | null {
  const parsed = submissionSchema.safeParse(values);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? FALLBACK_ERROR;
}

const errorBody = z.object({ message: z.string().optional() });

export const SEND_ERROR = "Something went wrong. Please try again.";

// The message for a refused submission: the rate limit has its own, otherwise the server's, otherwise a general one.
export function refusalMessage(status: number, body: unknown): string {
  if (status === 429) return "Too many submissions. Please try again later.";
  const parsed = errorBody.safeParse(body);
  return (parsed.success ? parsed.data.message : undefined) ?? SEND_ERROR;
}

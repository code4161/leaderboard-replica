import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// In dev and preview, GET /api/* goes to the upstream public API; in production the Vercel function in api/ serves it.
// The key is anchored so the page route /api-docs stays with the app. Writes are answered here and never forwarded.
const upstream = process.env.UPSTREAM_ORIGIN || "https://predicting.top";
const proxy = {
  "^/api/": {
    target: upstream,
    changeOrigin: true,
    bypass(req: { method?: string }, res?: { statusCode: number; setHeader(k: string, v: string): void; end(body: string): void }) {
      if (req.method !== "GET" && req.method !== "HEAD" && res) {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ success: true, replica: true }));
        return false;
      }
      return undefined;
    },
  },
};
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { proxy },
  preview: { proxy },
  test: { environment: "node", include: ["src/**/*.test.ts", "api/**/*.test.ts"] },
} as never);

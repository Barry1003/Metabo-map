// Vercel serverless function: POST /api/explain
// Holds the Groq key server-side (Vercel env var GROQ_API_KEY) and returns a
// cleaned, de-abbreviated explanation for a metabolite or reaction. The browser
// never sees the key. The same logic serves local dev via a Vite middleware
// (see vite.config.ts) so behaviour is identical in both environments.

import { runExplain } from "./_core.mjs";

interface Req {
  method?: string;
  body?: unknown;
  on?: (ev: string, cb: (chunk?: unknown) => void) => void;
}
interface Res {
  statusCode: number;
  setHeader: (k: string, v: string) => void;
  end: (body?: string) => void;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await runExplain(payload);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Failed" }));
  }
}

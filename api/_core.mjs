// Shared server-side AI core. Runs ONLY on the server (Vercel function or the
// Vite dev middleware) so the Groq key is never shipped to the browser.
//
// Imported by:
//   - api/explain.ts        (Vercel serverless function)
//   - vite.config.ts plugin (local dev middleware)
//
// The `_` prefix keeps Vercel from treating this file as its own route.
//
// Prompt wording lives in src/lib/prompts.mjs and is shared verbatim with the
// browser's premium path — this file only decides HOW to call the provider.

import { buildRequest, DEFAULT_LEVEL, LEVELS } from "../src/lib/prompts.mjs";

// Provider is swappable via env vars (any OpenAI-compatible endpoint):
//   LLM_BASE_URL  e.g. https://api.groq.com/openai/v1  (default)
//                 or   https://api.openai.com/v1
//                 or   https://api.deepseek.com/v1
//                 or   https://api.anthropic.com/v1  (Claude, OpenAI-compat)
//   LLM_API_KEY   the provider key (falls back to GROQ_API_KEY)
//   LLM_MODEL     e.g. gpt-4o, deepseek-chat, claude-3-5-sonnet, llama-3.3-70b-versatile
// Defaults keep the free, verified-working Groq setup.
const BASE_URL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const API_KEY = process.env.LLM_API_KEY || process.env.GROQ_API_KEY;
const MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

async function callLLM(messages, { json = false, maxTokens = 320 } = {}) {
  if (!API_KEY) throw new Error("No LLM_API_KEY / GROQ_API_KEY configured on the server.");
  const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.25,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

// Turn a raw pathway entity into clean, unambiguous study text at the requested
// level. `kind` is "metabolite" | "reaction" | "pathway".
export async function runExplain(payload) {
  const kind = payload?.kind === "metabolite" || payload?.kind === "pathway" ? payload.kind : "reaction";
  const name = String(payload?.name ?? "").slice(0, 120);
  // Outer bound only — buildRequest applies the real context cap. Slicing to
  // 600 here used to truncate retrieved fact sheets before they reached it.
  const context = String(payload?.context ?? "").slice(0, 4000);
  const level = LEVELS.includes(payload?.level) ? payload.level : DEFAULT_LEVEL;
  if (!name) throw new Error("Missing name.");

  const req = buildRequest(kind, name, context, level);
  const raw = await callLLM(req.messages, { json: req.json, maxTokens: req.maxTokens });

  if (kind !== "metabolite") return { explanation: raw };

  try {
    const obj = JSON.parse(raw);
    return { fullName: obj.fullName || name, explanation: obj.explanation || "" };
  } catch {
    return { fullName: name, explanation: raw };
  }
}

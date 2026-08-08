// Client side of the AI enrichment.
//
// Two providers:
//   • Premium — Agent Router, called DIRECTLY from the browser (its WAF blocks
//     server/datacenter calls, so this is the only way it works). The key lives
//     in localStorage on this device only — never in the repo or bundle. Gives
//     frontier models (Claude Opus, GPT-5).
//   • Fallback — the server /api/explain (Groq), key stays server-side.
//
// Results are cached per entity for the session.

import { buildRequest, DEFAULT_LEVEL, type ExplainKind, type Level } from "./prompts.mjs";

export interface Explained {
  fullName?: string;
  explanation: string;
}

const AR_BASE = "https://agentrouter.org/v1";
const AR_KEY_LS = "metabomap_ar_key";
const AR_MODEL_LS = "metabomap_ar_model";
export const DEFAULT_AR_MODEL = "claude-opus-4-8";

export function getPremiumConfig(): { key: string; model: string } | null {
  try {
    const key = localStorage.getItem(AR_KEY_LS);
    if (!key) return null;
    return { key, model: localStorage.getItem(AR_MODEL_LS) || DEFAULT_AR_MODEL };
  } catch {
    return null;
  }
}

export function setPremiumConfig(key: string, model: string) {
  try {
    if (key) { localStorage.setItem(AR_KEY_LS, key.trim()); localStorage.setItem(AR_MODEL_LS, model || DEFAULT_AR_MODEL); }
    else { localStorage.removeItem(AR_KEY_LS); localStorage.removeItem(AR_MODEL_LS); }
  } catch { /* ignore */ }
}

const cache = new Map<string, Explained>();

function parseMetaboliteJSON(text: string, fallbackName: string): Explained {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    return { fullName: obj.fullName || fallbackName, explanation: obj.explanation || "" };
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { const o = JSON.parse(m[0]); return { fullName: o.fullName || fallbackName, explanation: o.explanation || "" }; } catch { /* fall through */ } }
    return { fullName: fallbackName, explanation: cleaned };
  }
}

// Direct browser call to Agent Router with one retry (its content filter
// occasionally false-positives on the first hit).
async function callAgentRouter(kind: ExplainKind, name: string, context: string, level: Level, key: string, model: string): Promise<Explained> {
  const req = buildRequest(kind, name, context, level);
  const body = JSON.stringify({ model, messages: req.messages, max_tokens: req.maxTokens, temperature: 0.25 });
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`${AR_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) throw new Error("empty response");
      return kind === "metabolite" ? parseMetaboliteJSON(content, name) : { explanation: content };
    }
    lastErr = new Error(`AR ${res.status}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  throw lastErr instanceof Error ? lastErr : new Error("Agent Router failed");
}

async function callServer(kind: ExplainKind, name: string, context: string, level: Level): Promise<Explained> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, name, context, level }),
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as Explained;
}

export async function explain(
  kind: ExplainKind,
  name: string,
  context = "",
  level: Level = DEFAULT_LEVEL,
): Promise<Explained> {
  // Level MUST be part of the key — the same metabolite reads very differently
  // at BSc and PhD depth, and without it the first level fetched would be the
  // only one ever shown.
  const cacheKey = `${level}:${kind}:${name}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const premium = getPremiumConfig();
  let result: Explained = { explanation: "" };
  try {
    result = premium
      ? await callAgentRouter(kind, name, context, level, premium.key, premium.model)
      : await callServer(kind, name, context, level);
  } catch {
    // Premium failed (blocked/rate-limited) → fall back to the free server model.
    if (premium) { try { result = await callServer(kind, name, context, level); } catch { /* leave empty */ } }
  }
  cache.set(cacheKey, result);
  return result;
}

// Client side of the AI enrichment. Calls the server function /api/explain
// (Vercel in prod, Vite middleware in dev) — the Groq key lives there, never
// here. Results are cached per entity for the session.

export interface Explained {
  fullName?: string;
  explanation: string;
}

const cache = new Map<string, Explained>();

export async function explain(
  kind: "metabolite" | "reaction" | "pathway",
  name: string,
  context = "",
): Promise<Explained> {
  const key = `${kind}:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name, context }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Explained;
    cache.set(key, data);
    return data;
  } catch {
    return { explanation: "" };
  }
}

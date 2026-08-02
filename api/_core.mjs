// Shared server-side AI core. Runs ONLY on the server (Vercel function or the
// Vite dev middleware) so the Groq key is never shipped to the browser.
//
// Imported by:
//   - api/explain.ts        (Vercel serverless function)
//   - vite.config.ts plugin (local dev middleware)
//
// The `_` prefix keeps Vercel from treating this file as its own route.

const GROQ_MODEL = "llama-3.3-70b-versatile";

async function callGroq(messages, { json = false, maxTokens = 320 } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured on the server.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

// Turn a raw pathway entity into clean, unambiguous, student-level text.
// `kind` is "metabolite" or "reaction".
export async function runExplain(payload) {
  const kind = payload?.kind;
  const name = String(payload?.name ?? "").slice(0, 120);
  const context = String(payload?.context ?? "").slice(0, 600);
  if (!name) throw new Error("Missing name.");

  const SYSTEM =
    "You are a biochemistry tutor writing exam-revision notes for a second-year undergraduate. Be thorough, accurate and well-organised. Expand every abbreviation. Never invent facts. Format with section headers written as **Header** on their own line, followed by short paragraphs or '- ' bullet points. No preamble, no closing remarks.";

  if (kind === "metabolite") {
    const raw = await callGroq(
      [
        {
          role: "system",
          content:
            "You are a biochemistry tutor writing exam-revision notes for a second-year undergraduate. Expand abbreviations to full chemical names. Never invent facts. Respond ONLY with JSON.",
        },
        {
          role: "user",
          content:
            `Metabolite from a metabolic pathway: "${name}".` +
            (context ? ` Context: ${context}.` : "") +
            ` Return JSON {"fullName": string, "explanation": string}. ` +
            `"fullName" = the unambiguous full chemical name for a database lookup (e.g. "L-Orn" -> "L-ornithine"). ` +
            `"explanation" = an extensive exam-style entry using markdown with bold section headers on their own lines: **What it is** (class of molecule, structure in words, number of carbons), **Role in the pathway** (where it comes from, what it becomes), **Key facts** (2-4 '- ' bullet points a student should memorise, including any clinical or regulatory relevance). Be thorough but accurate.`,
        },
      ],
      { json: true, maxTokens: 600 },
    );
    try {
      const obj = JSON.parse(raw);
      return { fullName: obj.fullName || name, explanation: obj.explanation || "" };
    } catch {
      return { fullName: name, explanation: raw };
    }
  }

  if (kind === "pathway") {
    const explanation = await callGroq(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Write an extensive exam-revision study guide for the "${name}" pathway. Use these bold section headers, each on its own line, in this order:\n` +
            `**Overview** — what the pathway does and its big-picture purpose.\n` +
            `**Location** — where in the cell / which tissues.\n` +
            `**Net reaction & energy** — inputs, outputs, and the ATP/NADH/FADH2/GTP balance.\n` +
            `**Key steps** — the committed, rate-limiting and irreversible steps and why they matter (bullets).\n` +
            `**Regulation** — main activators, inhibitors, hormonal control and allosteric effectors (bullets).\n` +
            `**Connections** — how it links to other pathways.\n` +
            `**Clinical relevance** — diseases, deficiencies or drug targets.\n` +
            `**Exam tips** — 3-4 commonly tested facts (bullets).\n\n` +
            `Be thorough and accurate. Context: ${context}`,
        },
      ],
      { maxTokens: 1300 },
    );
    return { explanation };
  }

  // reaction
  const explanation = await callGroq(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content:
          `Write an extensive exam-revision entry for this reaction. Use these bold section headers, each on its own line:\n` +
          `**What happens** — the transformation in plain terms, expanding all abbreviations.\n` +
          `**Enzyme & mechanism** — enzyme name/class and how it catalyses the step.\n` +
          `**Cofactors & energetics** — cofactors used, ATP/NADH changes, and whether it is reversible or irreversible.\n` +
          `**Regulation** — how the step is controlled, if at all.\n` +
          `**Why it matters** — its significance in the pathway and any clinical relevance.\n\n` +
          `Enzyme/reaction: ${name}\n${context ? `Details: ${context}` : ""}`,
      },
    ],
    { maxTokens: 800 },
  );
  return { explanation };
}

/**
 * Optional query rewrite (Rewrite-Retrieve-Read).
 * Keeps Chat close to raw text unless vague; Sidekick/Agents rewrite more freely.
 */

const VAGUE_RE =
  /^(what|how|why|when|where|who|can|could|should|tell|help|explain|summarize|about)\b/i;

export async function maybeRewriteQuery(input: {
  query: string;
  surface: string;
  force?: boolean;
}): Promise<{ query: string; rewritten: boolean }> {
  const raw = input.query.trim();
  if (!raw) return { query: raw, rewritten: false };

  const should =
    input.force ||
    input.surface === "sidekick" ||
    input.surface === "agent" ||
    (input.surface === "chat" && (raw.length < 48 || VAGUE_RE.test(raw)));

  if (!should) return { query: raw, rewritten: false };

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // Heuristic expand without LLM
    return {
      query: heuristicExpand(raw),
      rewritten: true,
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Rewrite the user question into a short retrieval query for a company knowledge base. Keep entity names. No answer — query only.",
          },
          { role: "user", content: raw },
        ],
      }),
    });
    if (!res.ok) return { query: heuristicExpand(raw), rewritten: true };
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const next = data.choices?.[0]?.message?.content?.trim();
    if (!next) return { query: heuristicExpand(raw), rewritten: true };
    return { query: next, rewritten: true };
  } catch {
    return { query: heuristicExpand(raw), rewritten: true };
  }
}

function heuristicExpand(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("refund")) return `${q} refund policy terms`;
  if (lower.includes("vendor") || lower.includes("owe"))
    return `${q} vendor payment terms expense`;
  if (lower.includes("invoice")) return `${q} invoice billing customer`;
  if (lower.includes("onboard")) return `${q} onboarding checklist access`;
  if (lower.includes("ship")) return `${q} shipping SLA fulfillment`;
  return q;
}

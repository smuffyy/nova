import type { SkillToken } from "@/lib/db";
import { db } from "@/lib/db";
import { topicFromQuestion } from "@/lib/chatSummary";

export type SkillDraft = {
  name: string;
  topic: string;
  body: string;
  bullets: string[];
  proficiency: 1 | 2 | 3;
};

export function serializeSkillToken(token: SkillToken) {
  return {
    id: token.id,
    name: token.name,
    topic: token.topic,
    body: token.body,
    bullets: token.bullets,
    proficiency: token.proficiency,
    proficiencyLabel:
      token.proficiency >= 3
        ? "SME"
        : token.proficiency === 2
          ? "Working"
          : "Emerging",
    sourceChatId: token.source_chat_id,
    createdAt: token.created_at,
    updatedAt: token.updated_at,
  };
}

export function formatSkillsForPrompt(
  tokens: SkillToken[],
  activeIds: string[] = []
): string {
  if (!tokens.length) return "";
  const active = new Set(activeIds);
  return tokens
    .map((t) => {
      const focus = active.has(t.id) ? " [ACTIVE — now working]" : "";
      const level =
        t.proficiency >= 3
          ? "SME"
          : t.proficiency === 2
            ? "Working"
            : "Emerging";
      const bullets =
        t.bullets.length > 0
          ? `\n${t.bullets.map((b) => `- ${b}`).join("\n")}`
          : "";
      return `### Skill token: ${t.name}${focus}\nTopic: ${t.topic} · proficiency: ${level}\n${t.body.trim() || "(growing — lean on shelf docs and general reasoning)"}${bullets}`;
    })
    .join("\n\n");
}

function heuristicSkillFromName(name: string): SkillDraft {
  const clean = name.trim() || "General craft";
  return {
    name: clean.slice(0, 48),
    topic: clean.toLowerCase().slice(0, 64),
    body: `Personal SME lane for “${clean}”. Prefer practical, operator-grade guidance in this domain. Still answer general questions; deepen answers when the question touches this skill.`,
    bullets: [
      `Domain focus: ${clean}`,
      "Use shelf docs when available; otherwise be clear about uncertainty",
      "Stay useful for general questions outside this lane",
    ],
    proficiency: 1,
  };
}

function heuristicSkillFromChat(chatId: string): SkillDraft {
  const chat = db.getChat(chatId);
  const messages = db.listMessages(chatId);
  const userTurns = messages.filter((m) => m.role === "user");
  const titleBase =
    topicFromQuestion(userTurns[0]?.content || "") ||
    (chat?.title && chat.title !== "New chat" ? chat.title : null) ||
    "Craft";
  const bullets = userTurns.slice(0, 6).map((m) => {
    const t = m.content.replace(/\s+/g, " ").trim();
    return t.length > 140 ? `${t.slice(0, 139)}…` : t;
  });
  return {
    name: titleBase.slice(0, 48),
    topic: titleBase.toLowerCase().slice(0, 64),
    body: `Skill token distilled from recent work on “${titleBase}”. Treat the bullets as emerging SME notes. Prefer this lens when relevant; still answer general questions.`,
    bullets: bullets.filter(Boolean).slice(0, 8),
    proficiency: 1,
  };
}

async function llmSkillFromTranscript(
  titleHint: string,
  transcript: string
): Promise<SkillDraft | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !transcript.trim()) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You mint a reusable Sidekick "skill token" — a personal SME lane the companion can equip.
Return JSON: {"name":"short label","topic":"lowercase topic","body":"2-4 sentences on how to act as an SME here","bullets":["craft notes", "..."]}
Rules: do not invent facts; capture domain craft; name ≤ 40 chars; 3–8 bullets.`,
        },
        {
          role: "user",
          content: `Hint: ${titleHint}\n\nTranscript:\n${transcript}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const name =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim().slice(0, 48)
        : null;
    const body =
      typeof parsed.body === "string" && parsed.body.trim()
        ? parsed.body.trim().slice(0, 900)
        : null;
    if (!name || !body) return null;
    const topic =
      typeof parsed.topic === "string" && parsed.topic.trim()
        ? parsed.topic.trim().toLowerCase().slice(0, 64)
        : name.toLowerCase();
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets
          .filter((b): b is string => typeof b === "string")
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];
    return { name, topic, body, bullets, proficiency: 1 };
  } catch {
    return null;
  }
}

export async function generateSkillToken(input: {
  name?: string;
  chatId?: string;
}): Promise<SkillDraft> {
  if (input.chatId) {
    const chat = db.getChat(input.chatId);
    const messages = db.listMessages(input.chatId);
    const transcript = messages
      .slice(0, 40)
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 900)}`
      )
      .join("\n");
    const fallback = heuristicSkillFromChat(input.chatId);
    const llm = await llmSkillFromTranscript(
      input.name || chat?.title || fallback.name,
      transcript
    );
    return llm || fallback;
  }
  return heuristicSkillFromName(input.name || "General craft");
}

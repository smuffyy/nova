/** Lightweight chat list title + summary (no LLM). */

function cleanText(raw: string) {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/@([A-Za-z][\w-]*)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentences(text: string, maxChars: number) {
  const cleaned = cleanText(text);
  if (!cleaned) return "";
  const parts = cleaned.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const p of parts) {
    const next = out ? `${out} ${p}` : p;
    if (next.length > maxChars && out) break;
    out = next;
    if (out.length >= maxChars * 0.7) break;
  }
  if (out.length > maxChars) {
    return `${out.slice(0, maxChars - 1).trim()}…`;
  }
  return out;
}

const LEADING_FILLER =
  /^(please|hey|hi|hello|can you|could you|would you|will you|i need|i want|i'm looking for|im looking for|looking for|help me|tell me|explain|show me|give me|find|search for)\s+/i;

const QUESTION_PATTERNS: { re: RegExp; take: number; suffix?: string }[] = [
  { re: /^(?:what|who's|who is|who are)\s+(?:the\s+)?(?:owner|owners)\s+(?:of|for)\s+(.+?)$/i, take: 1, suffix: "ownership" },
  { re: /^who\s+owns\s+(.+?)$/i, take: 1, suffix: "ownership" },
  { re: /^who\s+(?:is|are)\s+(?:in charge of|responsible for)\s+(.+?)$/i, take: 1, suffix: "ownership" },
  { re: /^what\s+(?:is|are|was|were)\s+(?:the|a|an)\s+(.+?)$/i, take: 1 },
  { re: /^what\s+(?:is|are|was|were)\s+(.+?)$/i, take: 1 },
  { re: /^what(?:'s|s)\s+(?:the|a|an)\s+(.+?)$/i, take: 1 },
  { re: /^what(?:'s|s)\s+(.+?)$/i, take: 1 },
  { re: /^how\s+(?:do|does|did|can|could|should|to)\s+(?:i|we|you|one)?\s*(.+?)$/i, take: 1 },
  { re: /^how\s+(?:is|are|does)\s+(.+?)\s+work\??$/i, take: 1 },
  { re: /^where\s+(?:is|are|can i find|do i find)\s+(?:the|a|an)?\s*(.+?)$/i, take: 1 },
  { re: /^when\s+(?:is|are|do|does|did|should)\s+(.+?)$/i, take: 1 },
  { re: /^why\s+(?:is|are|do|does|did)\s+(?:the|a|an)?\s*(.+?)$/i, take: 1 },
  { re: /^(?:can|could|should|would)\s+(?:you|we|i)\s+(.+?)$/i, take: 1 },
  { re: /^(?:tell me about|explain|describe|summarize|summary of)\s+(?:the|a|an)?\s*(.+?)$/i, take: 1 },
  { re: /^(?:look up|lookup|find|search)\s+(?:the|a|an)?\s*(.+?)$/i, take: 1 },
];

const TRAILING_JUNK =
  /\s+(please|thanks|thank you|for me|for us|again|now|today)\.?$/i;

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "in",
  "into",
  "nor",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "via",
  "with",
]);

/** Prefer known tech acronyms casing. */
function polishToken(word: string): string {
  if (
    /^(DCS|RAG|API|BOM|ERP|PLC|CNC|SOP|KPI|OKR|SLA|SSO|LLM|SQL|CSV|PDF|UI|UX)$/i.test(
      word
    )
  ) {
    return word.toUpperCase();
  }
  if (/^[A-Z0-9]{2,6}$/.test(word)) return word;
  if (word.includes("-")) {
    return word
      .split("-")
      .map((p) => polishToken(p))
      .join("-");
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCaseTopic(phrase: string) {
  const words = phrase.split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && i < words.length - 1 && SMALL_WORDS.has(lower)) return lower;
      return polishToken(w);
    })
    .join(" ");
}

function stripEdges(phrase: string) {
  return phrase
    .replace(/^[\s"'“”‘’(]+/, "")
    .replace(/[\s"'“”‘’).,:;!?…]+$/g, "")
    .replace(/\.{2,}$/g, "")
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(/\s+(?:and|or|of|for|to|with)$/i, "")
    .replace(TRAILING_JUNK, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Turn a full question into a short topic label.
 * "What is the refund policy?" → "Refund policy"
 * "What is the fanuc robots dcs mapping?" → "Fanuc robots DCS mapping"
 */
export function topicFromQuestion(raw: string) {
  let text = cleanText(raw);
  if (!text) return "";

  // First line / first sentence only
  text = text.split(/\n/)[0] || text;
  text = text.split(/(?<=[.!?])\s+/)[0] || text;
  text = text.replace(/[?!.]+$/g, "").trim();

  for (const { re, take, suffix } of QUESTION_PATTERNS) {
    const m = text.match(re);
    if (!m?.[take]) continue;
    let topic = stripEdges(m[take]);
    topic = topic.replace(/^(?:the|a|an)\s+/i, "");
    const parts = topic.split(/\s+/);
    if (parts.length > 6) topic = parts.slice(0, 6).join(" ");
    if (suffix) {
      if (!/ownership|owner|owners$/i.test(topic)) {
        const head = parts.slice(0, 3).join(" ");
        topic = `${head} ${suffix}`;
      }
    }
    topic = titleCaseTopic(stripEdges(topic));
    if (topic.length >= 2) return topic.slice(0, 48);
  }

  text = text.replace(LEADING_FILLER, "").trim();

  // Fallback: drop common question openers word-by-word
  let fallback = text
    .replace(
      /^(what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|should|would|will)\s+/i,
      ""
    )
    .replace(/^(?:the|a|an|about)\s+/i, "");
  fallback = stripEdges(fallback);
  const words = fallback.split(/\s+/).filter(Boolean);
  fallback = words.slice(0, 5).join(" ");
  return titleCaseTopic(fallback).slice(0, 48) || "New chat";
}

function looksLikeFullQuestion(text: string) {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  if (
    /^(what|who|where|when|why|how|can|could|would|should|is|are|do|does|did|tell me|explain)\b/i.test(
      t
    )
  ) {
    return true;
  }
  return t.length > 36;
}

/** Short topic label for the chat row title. */
export function smartChatTitle(input: {
  title?: string;
  firstUserMessage?: string | null;
}) {
  const first = input.firstUserMessage?.trim() || "";
  const stored = input.title?.trim() || "";

  // Prefer deriving from the real question when we have it
  if (first) {
    const fromAsk = topicFromQuestion(first);
    if (fromAsk && fromAsk !== "New chat") return fromAsk;
  }

  if (stored && stored !== "New chat" && stored !== "Earlier chat") {
    if (looksLikeFullQuestion(stored)) return topicFromQuestion(stored);
    return titleCaseTopic(stripEdges(cleanText(stored))).slice(0, 48) || stored;
  }

  return "New chat";
}

type Msg = { role: string; content: string };

/**
 * One–two line gist for the list card: prefer the latest answer,
 * fall back to the latest ask.
 */
export function smartChatSummary(messages: Msg[]) {
  if (!messages.length) {
    return {
      titleHint: null as string | null,
      summary: "No messages yet",
      agent: null as string | null,
    };
  }

  const users = messages.filter((m) => m.role === "user");
  const assistants = messages.filter((m) => m.role === "assistant");
  const firstUser = users[0]?.content || "";
  const lastUser = users[users.length - 1]?.content || "";
  const lastAssistant = assistants[assistants.length - 1]?.content || "";

  const mention = firstUser.match(/@([A-Za-z][\w-]*)/);
  const agent = mention?.[1] || null;

  const titleHint = smartChatTitle({ firstUserMessage: firstUser });

  if (lastAssistant) {
    const gist = firstSentences(lastAssistant, 110);
    if (gist) {
      return {
        titleHint,
        summary: gist,
        agent,
      };
    }
  }

  if (lastUser) {
    const ask = firstSentences(lastUser, 100);
    return {
      titleHint,
      summary: ask ? `Asked: ${ask}` : "Conversation started",
      agent,
    };
  }

  return { titleHint, summary: "Conversation started", agent };
}

export function serializeChatListItem(
  chat: {
    id: string;
    title: string;
    imported_chat_ids: string[];
    pill_ids?: string[];
    pinned_at: string | null;
    created_at: string;
    updated_at: string;
  },
  messages: Msg[]
) {
  const { titleHint, summary, agent } = smartChatSummary(messages);
  const firstUser = messages.find((m) => m.role === "user")?.content || null;
  const displayTitle = smartChatTitle({
    title: titleHint || chat.title,
    firstUserMessage: firstUser,
  });

  return {
    id: chat.id,
    title: displayTitle,
    rawTitle: chat.title,
    importedChatIds: chat.imported_chat_ids,
    pillIds: chat.pill_ids || [],
    pinnedAt: chat.pinned_at,
    createdAt: chat.created_at,
    updatedAt: chat.updated_at,
    messageCount: messages.length,
    preview: summary,
    summary,
    agent,
  };
}

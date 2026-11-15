/**
 * Light structure for assistant answers: paragraphs + bullet/numbered lists.
 * No full markdown — keeps cite markers like [1] intact.
 */

import type { ReactNode } from "react";

const BULLET_RE = /^[-*•]\s+(.+)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.+)$/;

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  function flushPara() {
    if (!para.length) return;
    const text = para.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ type: "p", text });
    para = [];
  }

  function flushList() {
    if (!list || !list.items.length) {
      list = null;
      return;
    }
    blocks.push({ type: list.kind, items: list.items });
    list = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    const bullet = line.match(BULLET_RE);
    const numbered = line.match(NUMBERED_RE);

    if (bullet) {
      flushPara();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1].trim());
      continue;
    }

    if (numbered) {
      flushPara();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(numbered[1].trim());
      continue;
    }

    flushList();
    para.push(line);
  }

  flushPara();
  flushList();
  return blocks;
}

export function AnswerText({
  content,
  className = "chat-answer__text",
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);
  if (blocks.length === 0) {
    return <div className={className}>{content}</div>;
  }

  const nodes: ReactNode[] = blocks.map((block, i) => {
    if (block.type === "p") {
      return (
        <p key={i} className="chat-answer__p">
          {block.text}
        </p>
      );
    }
    if (block.type === "ol") {
      return (
        <ol key={i} className="chat-answer__list chat-answer__list--ol">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ol>
      );
    }
    return (
      <ul key={i} className="chat-answer__list">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    );
  });

  return <div className={className}>{nodes}</div>;
}

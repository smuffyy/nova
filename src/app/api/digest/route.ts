import { NextResponse } from "next/server";
import { getSessionAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { askDigest } from "@/lib/rag/surfaces";
import { buildLightGraph } from "@/lib/rag/graph";

export async function GET() {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chunks = db.listReadyChunks(access.workspace.id).slice(0, 80);
  const graph = buildLightGraph(
    chunks.map((c) => ({
      id: c.id,
      content: c.content,
      filename: c.filename,
    }))
  );

  return NextResponse.json({
    workspace: access.workspace.name,
    sourceCount: db.listSources(access.workspace.id).length,
    chunkCount: chunks.length,
    graph: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      sample: graph.nodes.slice(0, 12),
    },
  });
}

export async function POST(req: Request) {
  const access = await getSessionAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string };

  const openMeetings = db
    .listMeetupRooms(access.workspace.id)
    .filter((r) => r.status === "open")
    .map((r) => r.title)
    .slice(0, 12);

  const activeAsks = db
    .listAskProjects(access.workspace.id)
    .filter((p) => (p.status || "active") === "active")
    .map((p) => p.title)
    .slice(0, 12);

  const meetingsLine =
    openMeetings.length > 0
      ? openMeetings.map((t) => `• ${t}`).join("\n")
      : "• (none open)";
  const asksLine =
    activeAsks.length > 0
      ? activeAsks.map((t) => `• ${t}`).join("\n")
      : "• (none active)";

  const defaultQuery = `Summarize this week's operational pulse for the company.

Ground your answer in company library sources. Also weave in what's open right now:

Open meetings / Meetup rooms:
${meetingsLine}

Active Asks (projects):
${asksLine}

Cover: open risks, policies people ask about, finance/vendor notes from the library, and how open meetings and asks relate. Cite sources. Do not invent meetings, mail, or asks that are not listed or sourced.`;

  const query = body.query?.trim() || defaultQuery;

  const result = await askDigest({
    workspaceId: access.workspace.id,
    userId: access.user.id,
    query,
  });

  return NextResponse.json({
    answer: result.answer,
    citations: result.citations,
    refused: result.refused,
    gateBand: result.gateBand,
    llmUsed: result.llmUsed,
    context: {
      openMeetings,
      activeAsks,
    },
  });
}

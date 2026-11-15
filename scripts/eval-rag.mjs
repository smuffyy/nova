#!/usr/bin/env node
/**
 * Pilot eval gate: runs the grounded-answer suite against a live server.
 *
 * Run: npm run eval:rag            (expects `npm run dev` on :3000)
 *      BASE_URL=... npm run eval:rag
 *
 * Exits non-zero when any case fails, so this can gate a pilot kickoff.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const storePath = path.join(root, "data", "portal-store.json");
const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

function checkCorpus() {
  if (!fs.existsSync(storePath)) {
    console.error("No portal-store.json — run `npm run db:seed` first.");
    process.exit(1);
  }
  const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const ready = (store.sources || []).filter((s) => s.status === "ready").length;
  const chunks = (store.chunks || []).length;
  console.log(`corpus: sources ready=${ready} chunks=${chunks}`);
  if (ready === 0) {
    console.error("FAIL: no ready sources — run `npm run db:seed`.");
    process.exit(1);
  }
}

/** Demo login; returns the session cookie for the eval request. */
async function login() {
  const res = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`demo login failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const cookie = res.headers.getSetCookie?.() ?? [];
  if (cookie.length === 0) throw new Error("demo login returned no session cookie");
  return cookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  checkCorpus();

  let cookie;
  try {
    cookie = await login();
  } catch (err) {
    console.error(`\nCould not reach ${baseUrl} — is \`npm run dev\` running?`);
    console.error(String(err.message || err));
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/eval`, {
    method: "POST",
    headers: { cookie },
  });
  if (!res.ok) {
    console.error(`eval request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }

  const report = await res.json();
  console.log(
    `\nSentry pilot eval — ${report.passed}/${report.total} passed · avgFaithfulness=${report.avgFaithfulness.toFixed(2)}\n`
  );

  for (const s of report.scores) {
    const flag = s.passed ? "PASS" : "FAIL";
    const spec = `${s.specificityHits}/${s.specificityNeeded}`;
    console.log(
      `[${flag}] ${s.id.padEnd(22)} refused=${String(s.refused).padEnd(5)} band=${s.gateBand} specifics=${spec}`
    );
    if (s.notes?.length) console.log(`       ${s.notes.join(" · ")}`);
  }

  if (report.failed > 0) {
    console.error(`\nFAIL: ${report.failed} case(s) regressed.`);
    process.exit(1);
  }
  console.log("\nPASS: grounded answers and refusals both behaving.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import PptxGenJS from "pptxgenjs";

const cream = "F2ECE3";
const ink = "161513";
const muted = "6A655C";
const olive = "6D7358";
const orange = "D65A2A";
const dark = "161513";
const creamText = "F2ECE3";

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "NOVA";
pptx.title = "NOVA Pitch Deck — Savings Focus";

function addFooter(slide, n, total = 11, darkMode = false) {
  slide.addText(`${String(n).padStart(2, "0")} / ${total}`, {
    x: 11.6,
    y: 7.05,
    w: 1.4,
    h: 0.3,
    fontSize: 11,
    color: darkMode ? "8A847A" : muted,
    align: "right",
    fontFace: "Arial",
  });
}

function kicker(slide, text, y = 0.45, darkMode = false) {
  slide.addText(text.toUpperCase(), {
    x: 0.7,
    y,
    w: 12,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: darkMode ? orange : olive,
    fontFace: "Arial",
    charSpacing: 3,
  });
}

// 01 Title
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "E8E1D6" },
  });
  kicker(s, "Pitch deck · 2026");
  s.addText("NOVA", {
    x: 0.7, y: 2.4, w: 12, h: 1.2,
    fontSize: 72, bold: true, color: ink, fontFace: "Arial",
  });
  s.addText("Recover time. Protect cash.\nGrow without adding headcount.", {
    x: 0.7, y: 3.7, w: 10, h: 1.2,
    fontSize: 28, color: ink, fontFace: "Arial",
  });
  s.addText("An AI operating team measured in savings — hours returned and dollars protected.", {
    x: 0.7, y: 5.2, w: 10, h: 0.6,
    fontSize: 16, color: muted, fontFace: "Arial",
  });
  addFooter(s, 1);
}

// 02 Problem
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "The problem");
  s.addText("Fragmented tools quietly burn money every week.", {
    x: 0.7, y: 0.9, w: 11, h: 1.1,
    fontSize: 32, bold: true, color: ink, fontFace: "Arial",
  });
  const cards = [
    ["7.4 hrs", "lost per manager / week hunting context"],
    ["$28k", "annual loaded cost of that lost time (~$75/hr)"],
    ["$85k", "cost of hiring one junior analyst to paper over the gap"],
  ];
  cards.forEach((c, i) => {
    const x = 0.7 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.4, w: 3.8, h: 3.2,
      fill: { color: "EDE6DB" }, rectRadius: 0.1,
    });
    s.addText(c[0], {
      x: x + 0.25, y: 2.7, w: 3.3, h: 1,
      fontSize: 40, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(c[1], {
      x: x + 0.25, y: 3.9, w: 3.3, h: 1.3,
      fontSize: 15, color: muted, fontFace: "Arial",
    });
  });
  addFooter(s, 2);
}

// 03 Insight
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: dark },
  });
  kicker(s, "The insight", 0.45, true);
  s.addText("Savings come from a team,\nnot a chatbot.", {
    x: 0.7, y: 1.0, w: 11, h: 1.6,
    fontSize: 36, bold: true, color: creamText, fontFace: "Arial",
  });
  const metrics = [
    ["1", "conversation entry point"],
    ["6", "persistent specialists"],
    ["40%+", "faster cross-team decisions"],
    ["0", "autonomous money moves"],
  ];
  metrics.forEach((m, i) => {
    const x = 0.7 + i * 3.1;
    s.addText(m[0], {
      x, y: 4.2, w: 2.8, h: 0.9,
      fontSize: 40, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(m[1], {
      x, y: 5.2, w: 2.8, h: 0.8,
      fontSize: 14, color: "A39E93", fontFace: "Arial",
    });
  });
  addFooter(s, 3, 11, true);
}

// 04 Product
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "Product");
  s.addText("Six agents. One shared brain.", {
    x: 0.7, y: 0.9, w: 11, h: 0.8,
    fontSize: 32, bold: true, color: ink, fontFace: "Arial",
  });
  const agents = [
    ["Atlas", "Strategy", "Turns findings into decisions."],
    ["Ledger", "Finance", "Cash, margins, anomalies."],
    ["Scout", "Sales", "Pipeline & dormant accounts."],
    ["Signal", "Marketing", "Campaigns from real segments."],
    ["Relay", "Operations", "Inventory & delivery risk."],
    ["Prism", "Research", "Market & competitor signal."],
  ];
  agents.forEach((a, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.7 + col * 4.1;
    const y = 2.0 + row * 2.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 3.8, h: 1.9,
      fill: { color: "EDE6DB" }, rectRadius: 0.1,
    });
    s.addText(a[0], {
      x: x + 0.25, y: y + 0.25, w: 3.3, h: 0.4,
      fontSize: 20, bold: true, color: ink, fontFace: "Arial",
    });
    s.addText(a[1].toUpperCase(), {
      x: x + 0.25, y: y + 0.7, w: 3.3, h: 0.3,
      fontSize: 12, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(a[2], {
      x: x + 0.25, y: y + 1.1, w: 3.3, h: 0.5,
      fontSize: 13, color: muted, fontFace: "Arial",
    });
  });
  addFooter(s, 4);
}

// 05 Savings model
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "Savings model");
  s.addText("Where the dollars come back.", {
    x: 0.7, y: 0.9, w: 11, h: 0.7,
    fontSize: 32, bold: true, color: ink, fontFace: "Arial",
  });
  const big = [
    ["~$16k", "Time recovered / year", "18 hrs/month × $75 loaded"],
    ["~$78k", "Hire avoided / year", "Analyst capacity without headcount"],
    ["7 days", "Faster cash cycle", "Illustrative DSO 35→28"],
  ];
  big.forEach((b, i) => {
    const x = 0.7 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.9, w: 3.8, h: 2.6,
      fill: { color: "EDE6DB" }, rectRadius: 0.1,
    });
    s.addText(b[0], {
      x: x + 0.25, y: 2.15, w: 3.3, h: 0.8,
      fontSize: 36, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(b[1], {
      x: x + 0.25, y: 3.0, w: 3.3, h: 0.4,
      fontSize: 15, bold: true, color: ink, fontFace: "Arial",
    });
    s.addText(b[2], {
      x: x + 0.25, y: 3.5, w: 3.3, h: 0.6,
      fontSize: 13, color: muted, fontFace: "Arial",
    });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 4.8, w: 5.9, h: 1.6,
    fill: { color: "EDE6DB" }, rectRadius: 0.1,
  });
  s.addText("$1.3k+", {
    x: 0.95, y: 5.0, w: 5.4, h: 0.6,
    fontSize: 32, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("monthly labor value from ~30 min/day saved per manager", {
    x: 0.95, y: 5.65, w: 5.4, h: 0.5,
    fontSize: 13, color: muted, fontFace: "Arial",
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.85, y: 4.8, w: 5.8, h: 1.6,
    fill: { color: "EDE6DB" }, rectRadius: 0.1,
  });
  s.addText("12×", {
    x: 7.1, y: 5.0, w: 5.3, h: 0.6,
    fontSize: 32, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("first-month savings multiple vs. coordination effort", {
    x: 7.1, y: 5.65, w: 5.3, h: 0.5,
    fontSize: 13, color: muted, fontFace: "Arial",
  });
  addFooter(s, 5);
}

// 06 Cash impact
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: dark },
  });
  kicker(s, "Cash & revenue impact", 0.45, true);
  s.addText("Protect what’s already yours.", {
    x: 0.7, y: 1.0, w: 11, h: 0.8,
    fontSize: 32, bold: true, color: creamText, fontFace: "Arial",
  });
  const items = [
    ["20%", "illustrative profit recovery when cash + dormant sales actions run together"],
    ["62 days", "example overdue age NOVA surfaces before write-off risk grows"],
    ["2–3×", "faster exception detection vs weekly spreadsheet reviews"],
  ];
  items.forEach((it, i) => {
    const x = 0.7 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.2, w: 3.8, h: 3.0,
      fill: { color: "22201C" }, rectRadius: 0.1,
    });
    s.addText(it[0], {
      x: x + 0.25, y: 2.5, w: 3.3, h: 0.9,
      fontSize: 36, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(it[1], {
      x: x + 0.25, y: 3.5, w: 3.3, h: 1.3,
      fontSize: 14, color: "A39E93", fontFace: "Arial",
    });
  });
  addFooter(s, 6, 11, true);
}

// 07 By segment
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "Savings by company size");
  s.addText("Different altitude. Same kind of win.", {
    x: 0.7, y: 0.9, w: 11, h: 0.7,
    fontSize: 30, bold: true, color: ink, fontFace: "Arial",
  });
  s.addTable(
    [
      [
        { text: "Segment", options: { bold: true, color: olive } },
        { text: "Primary leak", options: { bold: true, color: olive } },
        { text: "What NOVA returns", options: { bold: true, color: olive } },
        { text: "Illustrative annual save", options: { bold: true, color: olive } },
      ],
      ["Small", "Owner context-switching", "Hours + fewer fire drills", "$12k–$25k"],
      ["Growing", "Department handoff tax", "Faster decisions + less rework", "$40k–$90k"],
      ["Large", "Multi-site blind spots", "Earlier exceptions + routed actions", "$150k–$400k+"],
    ],
    {
      x: 0.7, y: 2.0, w: 12, h: 3.5,
      colW: [2.2, 3.4, 3.6, 2.8],
      border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
      fontFace: "Arial",
      fontSize: 14,
      color: ink,
      align: "left",
      valign: "middle",
    }
  );
  s.addText("Ranges combine labor recovery + avoided coordination overhead.", {
    x: 0.7, y: 6.5, w: 11, h: 0.35,
    fontSize: 11, color: muted, fontFace: "Arial",
  });
  addFooter(s, 7);
}

// 08 How it works
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "How the savings happen");
  s.addText("Ask once. Get a coordinated answer.", {
    x: 0.7, y: 0.9, w: 11, h: 0.7,
    fontSize: 30, bold: true, color: ink, fontFace: "Arial",
  });
  const steps = [
    ["01", "Intake — plain-language question"],
    ["02", "Route — right agents activated"],
    ["03", "Investigate — shared memory + tools"],
    ["04", "Synthesize — Atlas packages the decision"],
    ["05", "Act — humans approve next steps"],
  ];
  steps.forEach((st, i) => {
    s.addText(st[0], {
      x: 0.7, y: 1.9 + i * 0.7, w: 0.8, h: 0.5,
      fontSize: 16, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(st[1], {
      x: 1.6, y: 1.9 + i * 0.7, w: 6, h: 0.5,
      fontSize: 16, color: ink, fontFace: "Arial",
    });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 8.3, y: 2.0, w: 4.3, h: 4.0,
    fill: { color: "EDE6DB" }, rectRadius: 0.1,
  });
  s.addText("< 90s", {
    x: 8.55, y: 2.5, w: 3.8, h: 0.8,
    fontSize: 40, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("to first multi-agent briefing", {
    x: 8.55, y: 3.4, w: 3.8, h: 0.5,
    fontSize: 14, color: muted, fontFace: "Arial",
  });
  s.addText("4–6", {
    x: 8.55, y: 4.3, w: 3.8, h: 0.7,
    fontSize: 36, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("agents on a typical cross-functional query", {
    x: 8.55, y: 5.1, w: 3.8, h: 0.5,
    fontSize: 14, color: muted, fontFace: "Arial",
  });
  addFooter(s, 8);
}

// 09 vs hiring
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: dark },
  });
  kicker(s, "Compared to the alternative", 0.45, true);
  s.addText("NOVA vs hiring your way out.", {
    x: 0.7, y: 1.0, w: 11, h: 0.8,
    fontSize: 32, bold: true, color: creamText, fontFace: "Arial",
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.7, y: 2.1, w: 5.8, h: 2.4,
    fill: { color: "22201C" }, rectRadius: 0.1,
  });
  s.addText("$85k", {
    x: 0.95, y: 2.4, w: 5.3, h: 0.8,
    fontSize: 40, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("one junior analyst / year — still needs coordination", {
    x: 0.95, y: 3.4, w: 5.3, h: 0.7,
    fontSize: 14, color: "A39E93", fontFace: "Arial",
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 2.1, w: 5.8, h: 2.4,
    fill: { color: "22201C" }, rectRadius: 0.1,
  });
  s.addText("~$16k", {
    x: 7.05, y: 2.4, w: 5.3, h: 0.8,
    fontSize: 40, bold: true, color: orange, fontFace: "Arial",
  });
  s.addText("time recovery alone from NOVA — before cash & revenue wins", {
    x: 7.05, y: 3.4, w: 5.3, h: 0.7,
    fontSize: 14, color: "A39E93", fontFace: "Arial",
  });
  const bottom = [
    ["5×", "cheaper than adding analyst capacity"],
    ["weeks", "to value — not a hiring cycle"],
    ["100%", "of approvals stay with your people"],
  ];
  bottom.forEach((b, i) => {
    const x = 0.7 + i * 4.1;
    s.addText(b[0], {
      x, y: 5.0, w: 3.8, h: 0.6,
      fontSize: 28, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(b[1], {
      x, y: 5.7, w: 3.8, h: 0.6,
      fontSize: 13, color: "A39E93", fontFace: "Arial",
    });
  });
  addFooter(s, 9, 11, true);
}

// 10 Who
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: cream },
  });
  kicker(s, "Who it’s for");
  s.addText("Small tables to large floors.", {
    x: 0.7, y: 0.9, w: 11, h: 0.7,
    fontSize: 32, bold: true, color: ink, fontFace: "Arial",
  });
  const who = [
    ["Small", "Owner-operators", "A full team’s clarity without adding headcount. Biggest win: hours + fewer surprises."],
    ["Growing", "Multi-team companies", "Shared context across finance, sales, and ops. Biggest win: handoff tax removed."],
    ["Large", "Multi-site orgs", "Exception layer on existing systems. Biggest win: earlier risk detection."],
  ];
  who.forEach((w, i) => {
    const x = 0.7 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.0, w: 3.8, h: 3.8,
      fill: { color: "EDE6DB" }, rectRadius: 0.1,
    });
    s.addText(w[0], {
      x: x + 0.25, y: 2.3, w: 3.3, h: 0.6,
      fontSize: 28, bold: true, color: ink, fontFace: "Arial",
    });
    s.addText(w[1], {
      x: x + 0.25, y: 3.1, w: 3.3, h: 0.4,
      fontSize: 15, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(w[2], {
      x: x + 0.25, y: 3.7, w: 3.3, h: 1.6,
      fontSize: 14, color: muted, fontFace: "Arial",
    });
  });
  addFooter(s, 10);
}

// 11 Close
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: dark },
  });
  kicker(s, "The close", 0.45, true);
  s.addText("Stop paying the\ncoordination tax.", {
    x: 0.7, y: 1.3, w: 12, h: 1.8,
    fontSize: 44, bold: true, color: creamText, fontFace: "Arial",
  });
  const close = [
    ["~$16k+", "time recoverable / year"],
    ["~$78k", "analyst hire avoided"],
    ["7 days", "faster cash cycle target"],
  ];
  close.forEach((c, i) => {
    const x = 0.7 + i * 4.1;
    s.addText(c[0], {
      x, y: 4.0, w: 3.8, h: 0.8,
      fontSize: 36, bold: true, color: orange, fontFace: "Arial",
    });
    s.addText(c[1], {
      x, y: 4.9, w: 3.8, h: 0.5,
      fontSize: 14, color: "A39E93", fontFace: "Arial",
    });
  });
  s.addText("NOVA · AI business team · savings you can measure", {
    x: 0.7, y: 6.2, w: 11, h: 0.4,
    fontSize: 15, color: "A39E93", fontFace: "Arial",
  });
  addFooter(s, 11, 11, true);
}

await pptx.writeFile({ fileName: "/Users/hrajkishor/Projects/nova/pitch-materials/NOVA-Pitch-Deck.pptx" });
console.log("Wrote NOVA-Pitch-Deck.pptx");

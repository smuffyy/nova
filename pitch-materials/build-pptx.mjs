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
pptx.title = "NOVA Investor Pitch — Why It's Epic to Buy";

function footer(slide, n, total = 12, darkMode = false) {
  slide.addText(`${String(n).padStart(2, "0")} / ${total}`, {
    x: 11.6, y: 7.05, w: 1.4, h: 0.3,
    fontSize: 11, color: darkMode ? "8A847A" : muted, align: "right", fontFace: "Arial",
  });
}
function kicker(slide, text, y = 0.45, darkMode = false) {
  slide.addText(text.toUpperCase(), {
    x: 0.7, y, w: 12, h: 0.35,
    fontSize: 12, bold: true, color: darkMode ? orange : olive, fontFace: "Arial", charSpacing: 3,
  });
}
function bg(slide, color) {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color } });
}
function card(slide, x, y, w, h, fill = "EDE6DB") {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.1 });
}

// 01
{
  const s = pptx.addSlide(); bg(s, "E8E1D6"); kicker(s, "Investor deck · 2026");
  s.addText("NOVA", { x: 0.7, y: 2.2, w: 12, h: 1.1, fontSize: 72, bold: true, color: ink, fontFace: "Arial" });
  s.addText("The AI operating team\nevery company will run on.", {
    x: 0.7, y: 3.5, w: 11, h: 1.3, fontSize: 28, color: ink, fontFace: "Arial",
  });
  s.addText("One conversation. Six specialists. Measurable savings from day one.", {
    x: 0.7, y: 5.1, w: 11, h: 0.5, fontSize: 16, color: muted, fontFace: "Arial",
  });
  footer(s, 1);
}

// 02 Pain
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "The pain");
  s.addText("Businesses pay a hidden tax every week.", {
    x: 0.7, y: 0.9, w: 12, h: 0.9, fontSize: 32, bold: true, color: ink, fontFace: "Arial",
  });
  [["7.4 hrs", "lost / manager / week hunting context"], ["$28k", "annual loaded cost of that lost time"], ["$85k", "junior analyst hire to paper over it"]].forEach((c, i) => {
    const x = 0.7 + i * 4.1; card(s, x, 2.2, 3.8, 2.8);
    s.addText(c[0], { x: x + 0.25, y: 2.5, w: 3.3, h: 0.9, fontSize: 36, bold: true, color: orange, fontFace: "Arial" });
    s.addText(c[1], { x: x + 0.25, y: 3.5, w: 3.3, h: 1.1, fontSize: 14, color: muted, fontFace: "Arial" });
  });
  footer(s, 2);
}

// 03 Market
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "Why now", 0.45, true);
  s.addText("Agentic software is the next platform shift.", {
    x: 0.7, y: 1.0, w: 12, h: 0.9, fontSize: 30, bold: true, color: creamText, fontFace: "Arial",
  });
  [["$47B", "SMB software spend"], ["$28B", "enterprise AI by 2028e"], ["33%", "agentic CAGR"], ["$180M", "3-yr SOM beachhead"]].forEach((m, i) => {
    const x = 0.7 + i * 3.1;
    s.addText(m[0], { x, y: 3.0, w: 2.9, h: 0.9, fontSize: 36, bold: true, color: orange, fontFace: "Arial" });
    s.addText(m[1], { x, y: 4.0, w: 2.9, h: 0.8, fontSize: 14, color: "A39E93", fontFace: "Arial" });
  });
  footer(s, 3, 12, true);
}

// 04 Product
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "The product");
  s.addText("Not a chatbot. An operating team.", {
    x: 0.7, y: 0.9, w: 12, h: 0.7, fontSize: 30, bold: true, color: ink, fontFace: "Arial",
  });
  const agents = [
    ["Atlas", "Strategy"], ["Ledger", "Finance"], ["Scout", "Sales"],
    ["Signal", "Marketing"], ["Relay", "Operations"], ["Prism", "Research"],
  ];
  agents.forEach((a, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.7 + col * 4.1, y = 2.0 + row * 2.1;
    card(s, x, y, 3.8, 1.85);
    s.addText(a[0], { x: x + 0.25, y: y + 0.35, w: 3.3, h: 0.45, fontSize: 22, bold: true, color: ink, fontFace: "Arial" });
    s.addText(a[1].toUpperCase(), { x: x + 0.25, y: y + 0.95, w: 3.3, h: 0.35, fontSize: 12, bold: true, color: orange, fontFace: "Arial" });
  });
  footer(s, 4);
}

// 05 Epic to buy
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "Why it's epic to buy", 0.45, true);
  s.addText("Instant ROI buyers can feel.", {
    x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 30, bold: true, color: creamText, fontFace: "Arial",
  });
  [["~$16k", "Time recovered / year"], ["~$78k", "Hire avoided / year"], ["12×", "First-month savings"]].forEach((c, i) => {
    const x = 0.7 + i * 4.1; card(s, x, 2.1, 3.8, 2.3, "22201C");
    s.addText(c[0], { x: x + 0.25, y: 2.4, w: 3.3, h: 0.8, fontSize: 36, bold: true, color: orange, fontFace: "Arial" });
    s.addText(c[1], { x: x + 0.25, y: 3.4, w: 3.3, h: 0.6, fontSize: 14, color: "A39E93", fontFace: "Arial" });
  });
  [["7 days", "faster cash cycle"], ["20%", "profit recovery target"], ["5×", "cheaper than hiring"]].forEach((c, i) => {
    const x = 0.7 + i * 4.1;
    s.addText(c[0], { x, y: 4.8, w: 3.8, h: 0.6, fontSize: 28, bold: true, color: orange, fontFace: "Arial" });
    s.addText(c[1], { x, y: 5.5, w: 3.8, h: 0.5, fontSize: 13, color: "A39E93", fontFace: "Arial" });
  });
  footer(s, 5, 12, true);
}

// 06 Segments
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "Buyer math by segment");
  s.addText("Every size has a clear win.", {
    x: 0.7, y: 0.9, w: 12, h: 0.7, fontSize: 30, bold: true, color: ink, fontFace: "Arial",
  });
  s.addTable([
    [
      { text: "Segment", options: { bold: true, color: olive } },
      { text: "Pain", options: { bold: true, color: olive } },
      { text: "Epic win", options: { bold: true, color: olive } },
      { text: "Save / yr", options: { bold: true, color: olive } },
    ],
    ["Small", "Owner context-switching", "Full team without hiring", "$12k–$25k"],
    ["Growing", "Department handoff tax", "Shared brain across teams", "$40k–$90k"],
    ["Large", "Multi-site blind spots", "Exception layer + action", "$150k–$400k+"],
  ], {
    x: 0.7, y: 2.0, w: 12, h: 3.6, colW: [2.2, 3.4, 3.6, 2.8],
    border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
    fontFace: "Arial", fontSize: 14, color: ink, valign: "middle",
  });
  footer(s, 6);
}

// 07 Why we win
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "Why we win");
  s.addText("A wedge competitors can’t copy overnight.", {
    x: 0.7, y: 0.9, w: 12, h: 0.8, fontSize: 28, bold: true, color: ink, fontFace: "Arial",
  });
  ["Team, not tool", "Shared memory across functions", "Works beside existing stack", "Savings-led sales motion", "People stay in control"].forEach((t, i) => {
    s.addText(`${String(i + 1).padStart(2, "0")}  ${t}`, {
      x: 0.7, y: 2.0 + i * 0.7, w: 7, h: 0.55, fontSize: 18, color: ink, fontFace: "Arial",
    });
  });
  card(s, 8.3, 2.2, 4.3, 3.6);
  s.addText("1 OS", { x: 8.55, y: 2.7, w: 3.8, h: 0.8, fontSize: 40, bold: true, color: orange, fontFace: "Arial" });
  s.addText("vs N point solutions that don’t talk to each other", {
    x: 8.55, y: 3.7, w: 3.8, h: 1.2, fontSize: 15, color: muted, fontFace: "Arial",
  });
  footer(s, 7);
}

// 08 GTM
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "Go-to-market", 0.45, true);
  s.addText("Land with operators. Expand company-wide.", {
    x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 28, bold: true, color: creamText, fontFace: "Arial",
  });
  [["45%", "trial → paid"], ["3.2", "mo sales cycle"], ["118%", "NRR year-2"], ["< 6", "mo CAC payback"]].forEach((m, i) => {
    const x = 0.7 + i * 3.1;
    s.addText(m[0], { x, y: 3.0, w: 2.9, h: 0.9, fontSize: 36, bold: true, color: orange, fontFace: "Arial" });
    s.addText(m[1], { x, y: 4.0, w: 2.9, h: 0.6, fontSize: 14, color: "A39E93", fontFace: "Arial" });
  });
  footer(s, 8, 12, true);
}

// 09 Unit econ
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "Unit economics");
  s.addText("Built for efficient growth.", {
    x: 0.7, y: 0.9, w: 12, h: 0.7, fontSize: 30, bold: true, color: ink, fontFace: "Arial",
  });
  s.addTable([
    [
      { text: "Metric", options: { bold: true, color: olive } },
      { text: "Starter", options: { bold: true, color: olive } },
      { text: "Growth", options: { bold: true, color: olive } },
      { text: "Enterprise", options: { bold: true, color: olive } },
    ],
    ["Target ACV", "$588", "$2,388", "$12,000+"],
    ["Gross margin", "78%", "82%", "75%"],
    ["LTV : CAC", "14.7×", "13.6×", "6.8×"],
    ["Logo churn / yr", "18%", "12%", "6%"],
  ], {
    x: 0.7, y: 2.0, w: 12, h: 3.8, colW: [3.2, 2.8, 2.8, 3.2],
    border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
    fontFace: "Arial", fontSize: 15, color: ink, valign: "middle",
  });
  footer(s, 9);
}

// 10 Targets
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "18-month plan");
  s.addText("What winning looks like in numbers.", {
    x: 0.7, y: 0.9, w: 12, h: 0.7, fontSize: 28, bold: true, color: ink, fontFace: "Arial",
  });
  [["2,500", "paying workspaces"], ["$4.8M", "ARR"], ["$1.9k", "blended ACV"], ["85%", "gross margin"]].forEach((m, i) => {
    const x = 0.7 + i * 3.1; card(s, x, 2.2, 2.95, 2.4);
    s.addText(m[0], { x: x + 0.2, y: 2.55, w: 2.55, h: 0.9, fontSize: 32, bold: true, color: orange, fontFace: "Arial" });
    s.addText(m[1], { x: x + 0.2, y: 3.55, w: 2.55, h: 0.6, fontSize: 13, color: muted, fontFace: "Arial" });
  });
  footer(s, 10);
}

// 11 Thesis
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "The epic buy thesis", 0.45, true);
  s.addText("Four reasons investors lean in.", {
    x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 28, bold: true, color: creamText, fontFace: "Arial",
  });
  const thesis = [
    ["01 · Massive TAM", "$47B SMB + $28B AI converging into agentic OS"],
    ["02 · Clear ROI", "$16k–$400k+ annual savings story that sells itself"],
    ["03 · Category wedge", "Multi-agent shared memory — not another single-purpose copilot"],
    ["04 · Efficient GTM", "13×+ LTV:CAC · <6 mo payback · 118% NRR target"],
  ];
  thesis.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.7 + col * 6.2, y = 2.0 + row * 2.2;
    card(s, x, y, 5.9, 1.95, "22201C");
    s.addText(t[0], { x: x + 0.25, y: y + 0.3, w: 5.4, h: 0.5, fontSize: 18, bold: true, color: orange, fontFace: "Arial" });
    s.addText(t[1], { x: x + 0.25, y: y + 0.95, w: 5.4, h: 0.7, fontSize: 14, color: "A39E93", fontFace: "Arial" });
  });
  footer(s, 11, 12, true);
}

// 12 Ask
{
  const s = pptx.addSlide(); bg(s, "E8E1D6"); kicker(s, "The ask");
  s.addText("Build the operating team\nevery company can afford.", {
    x: 0.7, y: 1.4, w: 12, h: 1.6, fontSize: 36, bold: true, color: ink, fontFace: "Arial",
  });
  [["$2.5M", "seed raise"], ["18 mo", "to $4.8M ARR plan"], ["10", "people · product + GTM"]].forEach((m, i) => {
    const x = 0.7 + i * 4.1;
    s.addText(m[0], { x, y: 3.8, w: 3.8, h: 0.8, fontSize: 36, bold: true, color: orange, fontFace: "Arial" });
    s.addText(m[1], { x, y: 4.7, w: 3.8, h: 0.5, fontSize: 14, color: muted, fontFace: "Arial" });
  });
  s.addText("NOVA · AI business team · small to enterprise", {
    x: 0.7, y: 6.0, w: 11, h: 0.4, fontSize: 15, color: muted, fontFace: "Arial",
  });
  footer(s, 12);
}

await pptx.writeFile({ fileName: "/workspace/pitch-materials/NOVA-Pitch-Deck.pptx" });
console.log("Wrote NOVA-Pitch-Deck.pptx");

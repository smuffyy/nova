import PptxGenJS from "pptxgenjs";

const cream = "F2ECE3";
const sand = "E8E1D6";
const cardFill = "EDE6DB";
const ink = "161513";
const muted = "6A655C";
const olive = "6D7358";
const orange = "D65A2A";
const dark = "161513";
const creamText = "F2ECE3";
const darkMuted = "A39E93";
const font = "Arial";
const TOTAL = 10;

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "NOVA";
pptx.title = "NOVA — What It Is and How Much It Saves You";

function footer(slide, n, darkMode = false) {
  slide.addText("NOVA", {
    x: 0.7, y: 7.05, w: 3, h: 0.3,
    fontSize: 11, bold: true, color: darkMode ? darkMuted : muted, fontFace: font, charSpacing: 3,
  });
  slide.addText(`${String(n).padStart(2, "0")} / ${TOTAL}`, {
    x: 11.6, y: 7.05, w: 1.4, h: 0.3,
    fontSize: 11, color: darkMode ? "8A847A" : muted, align: "right", fontFace: font,
  });
}
function kicker(slide, text, darkMode = false) {
  slide.addText(text.toUpperCase(), {
    x: 0.7, y: 0.45, w: 12, h: 0.35,
    fontSize: 12, bold: true, color: darkMode ? orange : olive, fontFace: font, charSpacing: 3,
  });
}
function title(slide, text, darkMode = false, size = 32) {
  slide.addText(text, {
    x: 0.7, y: 0.9, w: 12, h: 0.9, fontSize: size, bold: true, color: darkMode ? creamText : ink, fontFace: font,
  });
}
function bg(slide, color) {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color } });
}
function card(slide, x, y, w, h, fill = cardFill) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.1 });
}
function note(slide, text, darkMode = false) {
  slide.addText(text, {
    x: 0.7, y: 6.55, w: 12, h: 0.35, fontSize: 11, italic: true, color: darkMode ? darkMuted : muted, fontFace: font,
  });
}

// 01 Title
{
  const s = pptx.addSlide(); bg(s, sand); kicker(s, "Product overview · 2026");
  s.addText("NOVA", { x: 0.7, y: 2.0, w: 12, h: 1.1, fontSize: 72, bold: true, color: ink, fontFace: font });
  s.addText("Your AI operating team.\nSave hours, cash, and hires — every week.", {
    x: 0.7, y: 3.3, w: 11.5, h: 1.4, fontSize: 28, color: ink, fontFace: font,
  });
  s.addText("Six AI specialists for strategy, finance, sales, marketing, operations, and research — in one app.", {
    x: 0.7, y: 5.0, w: 11.5, h: 0.5, fontSize: 16, color: muted, fontFace: font,
  });
  footer(s, 1);
}

// 02 Problem
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "The problem");
  title(s, "Running a business means paying a hidden tax.");
  [
    ["7.4 hrs", "lost per manager, every week, hunting for numbers, files, and context"],
    ["$28k", "yearly cost of that lost time per manager"],
    ["$85k", "salary of the junior analyst most teams hire to cover the gap"],
  ].forEach((c, i) => {
    const x = 0.7 + i * 4.1; card(s, x, 2.2, 3.8, 2.8);
    s.addText(c[0], { x: x + 0.25, y: 2.5, w: 3.3, h: 0.9, fontSize: 40, bold: true, color: orange, fontFace: font });
    s.addText(c[1], { x: x + 0.25, y: 3.5, w: 3.3, h: 1.3, fontSize: 15, color: muted, fontFace: font, valign: "top" });
  });
  s.addText("Overdue invoices slip, quiet customers churn, and stock runs out — because nobody had time to look.", {
    x: 0.7, y: 5.4, w: 12, h: 0.6, fontSize: 17, color: ink, fontFace: font,
  });
  footer(s, 2);
}

// 03 What NOVA is
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "What NOVA is");
  title(s, "Not a chatbot. An operating team that works for you.");
  [
    ["Knows your data", "Connects to Gmail, Google Drive, and your accounting tools, then learns your customers, products, suppliers, and targets."],
    ["Watches every day", "Specialist agents scan finance, sales, inventory, and the market, and hand you a short morning briefing of what matters."],
    ["Acts — with your OK", "Drafts reminders, campaigns, and purchase orders, creates tasks, and waits for your approval before anything goes out."],
  ].forEach((c, i) => {
    const x = 0.7 + i * 4.1; card(s, x, 2.2, 3.8, 3.6);
    s.addText(`0${i + 1}`, { x: x + 0.25, y: 2.4, w: 3.3, h: 0.5, fontSize: 14, bold: true, color: olive, fontFace: font });
    s.addText(c[0], { x: x + 0.25, y: 2.9, w: 3.3, h: 0.6, fontSize: 20, bold: true, color: ink, fontFace: font, fit: "shrink" });
    s.addText(c[1], { x: x + 0.25, y: 3.6, w: 3.3, h: 2.0, fontSize: 15, color: muted, fontFace: font, valign: "top" });
  });
  s.addText("One conversation. Ask anything, or @mention a specialist: “@finance who owes us money?”", {
    x: 0.7, y: 6.1, w: 12, h: 0.5, fontSize: 16, color: ink, fontFace: font,
  });
  footer(s, 3);
}

// 04 The team
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "Meet the team", true);
  title(s, "Six specialists. Zero new hires.", true);
  [
    ["Atlas", "Strategy", "Coordinates the team and turns findings into decisions and plans.", "111111"],
    ["Ledger", "Finance", "Revenue, expenses, cash flow, receivables, and anomalies.", "2563EB"],
    ["Scout", "Sales", "Finds dormant customers, follow-ups, and pipeline risk.", "0D9488"],
    ["Signal", "Marketing", "Campaigns, retention, and pushing high-margin products.", "C2410C"],
    ["Relay", "Operations", "Orders, inventory, suppliers, and delivery bottlenecks.", "0F766E"],
    ["Prism", "Research", "Competitors, suppliers, prices, and industry trends.", "475569"],
  ].forEach((a, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.7 + col * 4.1, y = 2.1 + row * 2.2;
    card(s, x, y, 3.8, 1.95, "24221F");
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: y + 0.3, w: 0.12, h: 1.35, fill: { color: a[3] === "111111" ? orange : a[3] }, rectRadius: 0.05 });
    s.addText(a[0], { x: x + 0.55, y: y + 0.2, w: 2.0, h: 0.5, fontSize: 20, bold: true, color: creamText, fontFace: font });
    s.addText(a[1].toUpperCase(), { x: x + 2.2, y: y + 0.25, w: 1.4, h: 0.4, fontSize: 10, bold: true, color: orange, fontFace: font, align: "right", charSpacing: 2 });
    s.addText(a[2], { x: x + 0.55, y: y + 0.75, w: 3.05, h: 1.0, fontSize: 13, color: darkMuted, fontFace: font, valign: "top" });
  });
  footer(s, 4, true);
}

// 05 How it works
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "How it works");
  title(s, "From connect to savings in four steps.");
  [
    ["Connect", "Link email, Drive, and accounting. Upload catalogs, price sheets, and policies."],
    ["Brief", "Every morning NOVA lists priorities, opportunities, and items needing action."],
    ["Ask", "Chat in plain language or @mention an agent for deep, specific answers."],
    ["Approve", "Review drafted emails, tasks, and POs. One click and it’s done."],
  ].forEach((st, i) => {
    const x = 0.7 + i * 3.1;
    card(s, x, 2.2, 2.85, 3.4);
    s.addShape(pptx.shapes.OVAL, { x: x + 0.25, y: 2.45, w: 0.7, h: 0.7, fill: { color: orange } });
    s.addText(String(i + 1), { x: x + 0.25, y: 2.45, w: 0.7, h: 0.7, fontSize: 20, bold: true, color: creamText, align: "center", valign: "middle", fontFace: font });
    s.addText(st[0], { x: x + 0.25, y: 3.35, w: 2.4, h: 0.55, fontSize: 22, bold: true, color: ink, fontFace: font });
    s.addText(st[1], { x: x + 0.25, y: 3.95, w: 2.4, h: 1.5, fontSize: 14, color: muted, fontFace: font, valign: "top" });
    if (i < 3) s.addText("→", { x: x + 2.82, y: 3.5, w: 0.3, h: 0.5, fontSize: 20, color: olive, fontFace: font, align: "center" });
  });
  s.addText("You stay in control: agents only act within the permissions you grant.", {
    x: 0.7, y: 5.9, w: 12, h: 0.5, fontSize: 16, color: ink, fontFace: font,
  });
  footer(s, 5);
}

// 06 Savings levers
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "Where the savings come from");
  title(s, "Four ways NOVA pays for itself.");
  [
    ["~$16k / yr", "Time recovered", "No more digging through inboxes, sheets, and files. Answers in seconds."],
    ["~$78k / yr", "Hire avoided", "Analysis an analyst would do — reports, variance checks, forecasts — done by agents."],
    ["7 days", "Faster cash", "Ledger catches overdue invoices early and drafts the reminder for you."],
    ["Up to 20%", "Profit recovered", "Win back quiet customers, prevent stockouts, and promote high-margin products."],
  ].forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.7 + col * 6.1, y = 2.05 + row * 2.2;
    card(s, x, y, 5.85, 2.0);
    s.addText(c[0], { x: x + 0.3, y: y + 0.25, w: 2.6, h: 0.8, fontSize: 30, bold: true, color: orange, fontFace: font });
    s.addText(c[1], { x: x + 2.9, y: y + 0.3, w: 2.8, h: 0.5, fontSize: 18, bold: true, color: ink, fontFace: font });
    s.addText(c[2], { x: x + 2.9, y: y + 0.8, w: 2.8, h: 1.1, fontSize: 13, color: muted, fontFace: font, valign: "top" });
  });
  note(s, "Typical figures for a small-to-mid business team; your results depend on size, data, and how actively you act on recommendations.");
  footer(s, 6);
}

// 07 Example morning
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "A real morning with NOVA");
  title(s, "Arun Electricals: one briefing, ₹5L+ in value surfaced.", false, 28);
  s.addText("24-person electrical distributor in Bengaluru · 486 customers · ₹38.4L monthly revenue", {
    x: 0.7, y: 1.75, w: 12, h: 0.4, fontSize: 14, color: muted, fontFace: font,
  });
  s.addTable([
    [
      { text: "Agent", options: { bold: true, color: olive } },
      { text: "What NOVA found", options: { bold: true, color: olive } },
      { text: "Action proposed", options: { bold: true, color: olive } },
      { text: "Value", options: { bold: true, color: olive } },
    ],
    ["Ledger · Finance", "Sharma Industries invoice 18 days overdue", "Send payment reminder today", { text: "₹84,000 collected", options: { bold: true, color: orange } }],
    ["Scout · Sales", "8 high-value customers stopped reordering", "Reactivation outreach this week", { text: "₹4.2L recoverable", options: { bold: true, color: orange } }],
    ["Relay · Operations", "MCB 32A runs out in ~5 days", "Raise PO with Polycab now", { text: "Stockout avoided", options: { bold: true, color: orange } }],
    ["Signal · Marketing", "Highest-margin sensors get 38% less promotion", "Focused promotion this month", { text: "Better margin mix", options: { bold: true, color: orange } }],
    ["Ledger · Finance", "September material + shipping cost spike", "Variance report delivered", { text: "₹1.68L/mo flagged", options: { bold: true, color: orange } }],
  ], {
    x: 0.7, y: 2.3, w: 12, colW: [2.3, 4.0, 3.4, 2.3], rowH: 0.62,
    border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
    fontFace: font, fontSize: 13, color: ink, valign: "middle",
  });
  s.addText("All found before 8:30 AM — without a single spreadsheet opened.", {
    x: 0.7, y: 6.2, w: 12, h: 0.4, fontSize: 16, bold: true, color: ink, fontFace: font,
  });
  footer(s, 7);
}

// 08 Savings by size
{
  const s = pptx.addSlide(); bg(s, cream); kicker(s, "Savings by company size");
  title(s, "The bigger the team, the bigger the savings.");
  s.addTable([
    [
      { text: "Company", options: { bold: true, color: olive } },
      { text: "Today’s pain", options: { bold: true, color: olive } },
      { text: "What NOVA changes", options: { bold: true, color: olive } },
      { text: "Estimated save / yr", options: { bold: true, color: olive } },
    ],
    ["Small (1–25)", "Owner juggles every function", "A full team without hiring", { text: "$12k – $25k", options: { bold: true, color: orange } }],
    ["Growing (25–200)", "Handoff tax between departments", "One shared brain across teams", { text: "$40k – $90k", options: { bold: true, color: orange } }],
    ["Large (200+)", "Blind spots across sites", "Exception alerts + action layer", { text: "$150k – $400k+", options: { bold: true, color: orange } }],
  ], {
    x: 0.7, y: 2.1, w: 12, colW: [2.6, 3.4, 3.4, 2.6], rowH: 0.9,
    border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
    fontFace: font, fontSize: 16, color: ink, valign: "middle",
  });
  note(s, "Estimates combine recovered manager time, avoided hires, faster collections, and recovered revenue.");
  footer(s, 8);
}

// 09 NOVA vs hiring
{
  const s = pptx.addSlide(); bg(s, dark); kicker(s, "The math", true);
  title(s, "NOVA vs. hiring for the same work.", true);
  card(s, 0.7, 2.1, 5.85, 3.7, "24221F");
  s.addText("Hire a junior analyst", { x: 1.0, y: 2.3, w: 5.3, h: 0.5, fontSize: 18, bold: true, color: darkMuted, fontFace: font });
  s.addText("$85,000 / yr", { x: 1.0, y: 2.9, w: 5.3, h: 0.9, fontSize: 40, bold: true, color: creamText, fontFace: font });
  s.addText("One person · one function · 40 hrs a week · months to ramp up", {
    x: 1.0, y: 3.9, w: 5.3, h: 1.2, fontSize: 15, color: darkMuted, fontFace: font, valign: "top",
  });
  card(s, 6.8, 2.1, 5.85, 3.7, orange);
  s.addText("Run NOVA", { x: 7.1, y: 2.3, w: 5.3, h: 0.5, fontSize: 18, bold: true, color: creamText, fontFace: font });
  s.addText("from $588 / yr", { x: 7.1, y: 2.9, w: 5.3, h: 0.9, fontSize: 40, bold: true, color: creamText, fontFace: font });
  s.addText("Six specialists · every function · always on · useful on day one", {
    x: 7.1, y: 3.9, w: 5.3, h: 1.2, fontSize: 15, color: creamText, fontFace: font, valign: "top",
  });
  [["5×+", "cheaper than hiring"], ["12×", "typical first-month return"], ["< 6 mo", "payback, even on Growth"]].forEach((m, i) => {
    const x = 0.7 + i * 4.1;
    s.addText(m[0], { x, y: 6.0, w: 1.6, h: 0.6, fontSize: 24, bold: true, color: orange, fontFace: font });
    s.addText(m[1], { x: x + 1.6, y: 6.0, w: 2.4, h: 0.6, fontSize: 13, color: darkMuted, fontFace: font, valign: "middle" });
  });
  footer(s, 9, true);
}

// 10 Get started
{
  const s = pptx.addSlide(); bg(s, sand); kicker(s, "Get started");
  title(s, "Start saving this week.", false, 40);
  s.addTable([
    [
      { text: "Plan", options: { bold: true, color: olive } },
      { text: "Best for", options: { bold: true, color: olive } },
      { text: "Price", options: { bold: true, color: olive } },
    ],
    ["Starter", "Owners and small teams", { text: "$49 / mo", options: { bold: true } }],
    ["Growth", "Growing teams across departments", { text: "$199 / mo", options: { bold: true } }],
    ["Enterprise", "Multi-site operations, custom agents", { text: "From $1,000 / mo", options: { bold: true } }],
  ], {
    x: 0.7, y: 2.0, w: 7.4, colW: [1.6, 3.5, 2.3], rowH: 0.65,
    border: [{ type: "solid", pt: 0.5, color: "D4CDC2" }],
    fontFace: font, fontSize: 15, color: ink, valign: "middle",
  });
  card(s, 8.4, 2.0, 4.25, 3.4, ink);
  s.addText("Your first week", { x: 8.7, y: 2.2, w: 3.7, h: 0.5, fontSize: 18, bold: true, color: orange, fontFace: font });
  s.addText([
    { text: "Day 1 — Connect email, Drive, accounting", options: { bullet: true, breakLine: true } },
    { text: "Day 2 — First morning briefing", options: { bullet: true, breakLine: true } },
    { text: "Day 3 — Approve first reminders and tasks", options: { bullet: true, breakLine: true } },
    { text: "Day 7 — See cash and time saved", options: { bullet: true } },
  ], { x: 8.7, y: 2.8, w: 3.8, h: 2.4, fontSize: 14, color: creamText, fontFace: font, valign: "top", paraSpaceAfter: 8 });
  s.addText("Your AI operating team is ready when you are.", {
    x: 0.7, y: 5.8, w: 12, h: 0.6, fontSize: 22, bold: true, color: ink, fontFace: font,
  });
  footer(s, 10);
}

await pptx.writeFile({ fileName: "NOVA-Overview-and-Savings.pptx" });
console.log("Wrote NOVA-Overview-and-Savings.pptx");

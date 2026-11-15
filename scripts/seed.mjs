import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "portal-store.json");

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@portal.local";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "portal-demo";

function hashPassword(password) {
  const salt = process.env.PORTAL_SESSION_SECRET || "portal-dev-secret";
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function now() {
  return new Date().toISOString();
}

function emptyStore() {
  return {
    workspaces: [],
    users: [],
    memberships: [],
    sources: [],
    chunks: [],
    messages: [],
    waitlist: [],
    meetup_rooms: [],
    meetup_members: [],
    meetup_messages: [],
    role_policies: [],
  };
}

function readStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const initial = emptyStore();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
}

function chunkText(text, size = 900, overlap = 120) {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length <= size) {
      current = current ? `${current}\n\n${para}` : para;
      continue;
    }
    if (current) push();
    if (para.length <= size) {
      current = para;
      continue;
    }
    for (let i = 0; i < para.length; i += size - overlap) {
      chunks.push(para.slice(i, i + size).trim());
    }
  }
  push();
  return chunks.filter(Boolean);
}

const demoFiles = [
  {
    filename: "vendor-payment-terms.txt",
    content: `Northwind Studio — Vendor Payment Terms

Acme Supplies LLC
- Payment terms: Net 30
- Preferred payment: ACH
- Primary contact: Jordan Lee (ap@acmesupplies.example)
- Notes: 2% discount if paid within 10 days (2/10 Net 30)

Bright Paper Co
- Payment terms: Net 15
- Preferred payment: credit card on file
- Contact: billing@brightpaper.example

CloudHost Inc
- Payment terms: Due on receipt for invoices under $500; Net 30 otherwise
- Contract renews annually each March
`,
  },
  {
    filename: "refund-policy.txt",
    content: `Northwind Studio — Customer Refund Policy (effective Jan 2025)

Digital services
- Full refund within 7 days of purchase if work has not started
- After work starts: prorated refund for unused scope, less any third-party costs already incurred

Physical goods / print
- Unused items may be returned within 14 days for store credit
- Custom print jobs are non-refundable once approved

How to request
- Email support@northwindstudio.example with order ID
- Ops lead (Maya Chen) owns refund approvals over $250
`,
  },
  {
    filename: "onboarding-checklist.txt",
    content: `Northwind Studio — New Hire Onboarding Checklist
Owner: Maya Chen (Ops)

Day 1
- [ ] Create email + Google Workspace account
- [ ] Add to Slack #general and #ops
- [ ] Share PORTAL workspace invite
- [ ] Review employee handbook PDF

Week 1
- [ ] Shadow customer kickoff call
- [ ] Read refund policy and vendor payment terms
- [ ] Complete security awareness module
- [ ] Meet finance for expense submission walkthrough

Tools of record
- CRM: HubSpot
- Books: QuickBooks Online (export CSV for PORTAL)
- Files: Google Drive / Shared "Company Brain" folder
`,
  },
  {
    filename: "expenses-q2.csv",
    content: `date,vendor,category,amount,memo
2025-04-03,Acme Supplies LLC,Office,412.50,Paper and toner
2025-04-18,CloudHost Inc,Software,89.00,Hosting April
2025-05-02,Bright Paper Co,Office,220.00,Client print stock
2025-05-21,CloudHost Inc,Software,89.00,Hosting May
2025-06-01,Acme Supplies LLC,Office,155.75,Desk supplies
2025-06-14,Bright Paper Co,COGS,640.00,June print run
2025-06-28,CloudHost Inc,Software,89.00,Hosting June
`,
  },
  {
    filename: "invoices-recent.txt",
    content: `Northwind Studio — Recent Invoices

INV-1042 — Contoso Retail — 2025-05-12 — $4,800 — Paid
INV-1048 — Contoso Retail — 2025-06-10 — $2,250 — Sent (awaiting payment)
INV-1051 — Fabrikam Events — 2025-06-22 — $1,100 — Paid
INV-1055 — Contoso Retail — 2025-07-01 — $3,000 — Draft

Notes
- Contoso Retail standard terms: Net 30
- Fabrikam Events: 50% deposit, remainder on delivery
`,
  },
];

const store = readStore();
const uploadsDir = path.join(root, "uploads", "demo");
fs.mkdirSync(uploadsDir, { recursive: true });

let workspace = store.workspaces.find((w) => w.slug === "demo");
if (!workspace) {
  workspace = {
    id: randomUUID(),
    name: "Northwind Studio (Demo)",
    slug: "demo",
    created_at: now(),
  };
  store.workspaces.push(workspace);
}

let user = store.users.find((u) => u.email === DEMO_EMAIL);
if (!user) {
  user = {
    id: randomUUID(),
    email: DEMO_EMAIL,
    password_hash: hashPassword(DEMO_PASSWORD),
    name: "Demo Operator",
    created_at: now(),
  };
  store.users.push(user);
}

if (
  !store.memberships.some(
    (m) => m.user_id === user.id && m.workspace_id === workspace.id
  )
) {
  store.memberships.push({
    user_id: user.id,
    workspace_id: workspace.id,
    role: "owner",
  });
} else {
  const m = store.memberships.find(
    (row) => row.user_id === user.id && row.workspace_id === workspace.id
  );
  if (m) m.role = "owner";
}

// Member without finance.money — for role-gate demos
const MEMBER_EMAIL = "member@portal.local";
const MEMBER_PASSWORD = "portal-member";
let member = store.users.find((u) => u.email === MEMBER_EMAIL);
if (!member) {
  member = {
    id: randomUUID(),
    email: MEMBER_EMAIL,
    password_hash: hashPassword(MEMBER_PASSWORD),
    name: "Demo Member",
    created_at: now(),
  };
  store.users.push(member);
}
if (
  !store.memberships.some(
    (m) => m.user_id === member.id && m.workspace_id === workspace.id
  )
) {
  store.memberships.push({
    user_id: member.id,
    workspace_id: workspace.id,
    role: "member",
  });
}

store.role_policies = store.role_policies || [];
if (!store.role_policies.some((r) => r.workspace_id === workspace.id)) {
  store.role_policies.push({
    workspace_id: workspace.id,
    updated_at: now(),
    policy: {
      roles: [
        {
          id: "owner",
          label: "Owner",
          description: "Full workspace control, including finance and roles.",
          capabilities: ["finance.money", "roles.manage", "dojo.company"],
          system: true,
        },
        {
          id: "admin",
          label: "Admin",
          description: "Operations admins who can see money and manage roles.",
          capabilities: ["finance.money", "roles.manage", "dojo.company"],
          system: true,
        },
        {
          id: "finance",
          label: "Finance admin",
          description: "Sees Ledger money views; cannot edit role policy.",
          capabilities: ["finance.money"],
          system: true,
        },
        {
          id: "member",
          label: "Member",
          description: "Company memory and agents — no money dashboard.",
          capabilities: [],
          system: true,
        },
      ],
    },
  });
}

// ensure existing demo policy gets dojo.company on owner/admin
for (const row of store.role_policies || []) {
  if (!row.policy?.roles) continue;
  for (const role of row.policy.roles) {
    if (role.id === "owner" || role.id === "admin") {
      const caps = new Set(role.capabilities || []);
      caps.add("finance.money");
      caps.add("roles.manage");
      caps.add("dojo.company");
      role.capabilities = Array.from(caps);
    }
  }
}

const demoNames = new Set(demoFiles.map((f) => f.filename));
const toRemove = store.sources.filter(
  (s) => s.workspace_id === workspace.id && demoNames.has(s.filename)
);
for (const row of toRemove) {
  store.sources = store.sources.filter((s) => s.id !== row.id);
  store.chunks = store.chunks.filter((c) => c.source_id !== row.id);
  const abs = path.join(root, row.storage_path);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

for (const file of demoFiles) {
  const sourceId = randomUUID();
  const rel = path.join("uploads", "demo", `${sourceId}-${file.filename}`);
  const abs = path.join(root, rel);
  fs.writeFileSync(abs, file.content, "utf8");
  const source = {
    id: sourceId,
    workspace_id: workspace.id,
    filename: file.filename,
    mime_type: file.filename.endsWith(".csv") ? "text/csv" : "text/plain",
    storage_path: rel,
    status: "ready",
    error_message: null,
    created_at: now(),
    updated_at: now(),
  };
  store.sources.push(source);
  const chunks = chunkText(file.content);
  chunks.forEach((content, index) => {
    store.chunks.push({
      id: randomUUID(),
      source_id: sourceId,
      workspace_id: workspace.id,
      chunk_index: index,
      content,
      embedding_json: null,
    });
  });
}

writeStore(store);
console.log("Seeded demo workspace");
console.log(`  Owner:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}  (finance money + roles)`);
console.log(`  Member: member@portal.local / portal-member  (no money dashboard)`);
console.log(`  Workspace: Northwind Studio (Demo)`);

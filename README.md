# NOVA

**AI operating team for business** — specialists for strategy, finance, sales, marketing, operations, and research in one desktop app.

## Desktop app (recommended)

```bash
npm install
npm run nova:desktop
```

This starts Next.js (dev) and opens the **NOVA** Electron window at `/nova`.

### Production desktop build

```bash
npm install
npm run nova:build
```

Runs `next build`, starts the production server, then opens Electron.

## Web only

```bash
npm install
npm run dev
```

- Product: [http://localhost:3000/nova](http://localhost:3000/nova)
- Marketing pitch: [http://localhost:3000](http://localhost:3000)

```bash
npm run build && npm start
```

## What’s in the product

| Area | Path |
|------|------|
| Home briefing | `/nova` |
| Chat (LLM + agents) | `/nova/chat` |
| Agents (Atlas, Ledger, Scout, Signal, Relay, Prism) | `/nova/agents` |
| Tasks / Knowledge / Activity | `/nova/tasks` etc. |
| Settings / LLM connection | `/nova/settings` |

Optional: copy `.env.example` → `.env.local` and set an LLM key (`OPENROUTER_API_KEY` recommended). Without a key, chat uses the local business mock.

## Investor materials

Downloadable from the pitch site and `public/pitch/`:

- `NOVA-Pitch-Deck.pdf` / `.pptx`
- `NOVA-One-Pager.pdf`

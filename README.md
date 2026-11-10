# Rank High Lead — AI Sales Operating System

(Internal code name: Revenue OS — package names use `@revenue-os/*`.)

AI Sales Operating System: user goal define kare, system prospect discovery → research → outreach → meeting booking tak kaam kare.
Product vision: [docs/00-vision.md](docs/00-vision.md) · Kahan tak pohanche: **[docs/PROGRESS.md](docs/PROGRESS.md)**

---

## 🚀 Quick start (pehli dafa, Windows)

**Zaroori cheezein:** Node 24+, pnpm, WSL Ubuntu. Docker ki zaroorat nahi.

```bash
pnpm install                                                  # sab dependencies
pnpm setup                                                    # .env banata hai
wsl -d Ubuntu -u root -- bash infrastructure/wsl/install.sh   # sirf pehli dafa: PostgreSQL 18 + pgvector + Redis
start-miracle.bat                                             # DB + Redis + build (agar zaroorat ho) + API + worker + web
pnpm db:deploy                                                # database tables (migrations)
pnpm db:seed                                                  # dev workspace, team users, roles, pipeline
```

Phir kholein: **http://localhost:3000/login**. Login page par do cards hain: **Zohaib (Designer)** aur **Asif (Developer)**. Development mein password `rankhighlead-dev` hai aur card dabate hi login ho jata hai.

System check: **http://localhost:3000/diagnostics**. Paanchon rows OK honi chahiye: Web, API, PostgreSQL, Redis, Worker.

**Roz ka kaam:** `start-miracle.bat` chalayein, band karne ke liye `stop-miracle.bat`.
- `start-miracle.bat build`: API, worker ya `packages/*` ka code badla ho to pehle dobara build karta hai.
- `start-miracle.bat full`: sab kuch watch mode mein (`pnpm dev`). 8 GB RAM par bohat slow hai.

WSL distro tab tak chalta hai jab tak koi `wsl` process zinda ho. `start-miracle.bat` iske liye ek chhoti "Miracle Infra" window khuli rakhta hai.

---

## 🌐 Live: Hostinger Business Web Hosting (GitHub se)

Plan: **Business Web Hosting** (50 GB). Is plan par Node.js web apps GitHub se deploy hoti hain. Is plan ke hisaab se deploy ki tabdeeliyan abhi baqi hain.

**Zaroori baat:** yeh app PostgreSQL (pgvector, pg_trgm, JSONB) aur Redis (BullMQ queues) par chalti hai. Shared hosting par sirf MySQL milta hai, PostgreSQL aur Redis nahi. Is liye live par database aur Redis bahar ki managed service se aayenge (misaal: PostgreSQL ke liye Neon, Redis ke liye Redis Cloud), aur Hostinger par sirf Node apps (web, API, worker) chalengi. Code MySQL par nahi badla jayega.

## 🗂️ Project ka naqsha

```
apps/
  web/        Next.js frontend (port 3000)
              src/app/page.tsx       → landing page (components/landing/)
              src/app/(app)/…        → app screens, shared sidebar/topbar (components/app/)
              src/lib/screens.ts     → screen list: naam, icon, section, kis phase mein live
              src/lib/roadmap.ts     → phases ki progress (docs/PROGRESS.md ke saath sync)
  api/        NestJS backend (port 4000) — saari business logic, /api/*
  worker/     BullMQ background jobs — discovery, research, email, AI...
packages/
  config/     .env ko typed + validate karta hai (galat config = saaf error)
  shared/     queue names, types, helpers — sab apps mein common
  database/   Prisma schema + client (PostgreSQL)
  events/     domain events + outbox            ← Phase 4
  policy/     ACT / ASK / WAIT / BLOCK engine   ← Phase 10
  providers/  Provider Gateway, capability interfaces, fake + real adapters
  domain/     API + worker dono ki shared domain logic (entity resolution, merge, evidence, discovery engine)
  ai/         AI runtime, agents, prompts       ← Phase 9
infrastructure/
  wsl/        Local PostgreSQL + Redis, WSL Ubuntu mein (install / start / stop)
docs/         Saari locked specifications (pehle yahan parhein)
scripts/      setup + helper scripts
```

Request ka raasta: **Browser → web (Next.js) → `/api/*` → api (NestJS) → PostgreSQL**,
aur lambe kaam: **api → Redis/BullMQ queue → worker → result → PostgreSQL**.

---

## 🧰 Commands

| Command | Kya karta hai |
|---|---|
| `start-miracle.bat` / `stop-miracle.bat` | Local sab kuch start / band (light mode) |
| `pnpm dev` | Sab kuch watch mode mein (heavy) |
| `pnpm dev:web` / `dev:api` / `dev:worker` | Sirf ek app |
| `pnpm build` | Sab build |
| `pnpm typecheck` | TypeScript errors check |
| `pnpm test` | Saare tests (database tests `revenue_os_test` DB khud bana lete hain — PostgreSQL chalna chahiye) |
| `pnpm db:migrate` | Schema badla? Nayi Prisma migration banao + chalao |
| `pnpm db:deploy` | Maujooda migrations database pe lagao (pull ke baad) |
| `pnpm db:seed` | Dev data: workspace, owner, roles, pipeline (dobara chalana safe hai) |
| `pnpm db:studio` | Database browser mein dekho |
| `pnpm format` | Code format (Prettier) |

**Ports:** web 3000 · api 4000 · Postgres **5433** · Redis **6380** (5432/6379 is liye nahi taake pehle se install Postgres/Redis se takraav na ho). Sab `.env` mein badle ja sakte hain.

---

## 📚 Docs kahan hain

| File | Kya hai |
|---|---|
| [AI-INSTRUCTIONS.md](AI-INSTRUCTIONS.md) | Kisi bhi AI tool (Claude, Copilot...) ke liye rules — pehle ye |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Kaunsa phase complete, agla kya |
| [docs/00-vision.md](docs/00-vision.md) · [02-master-specification-v1.md](docs/02-master-specification-v1.md) | Product kya hai |
| [docs/screens/](docs/screens/) | 18 screens ka behaviour spec |
| `docs/04` … `docs/16` | Technical specs (architecture, DB, events, agents, policy, queues…) |
| [docs/17-tech-spec-13-implementation-roadmap.md](docs/17-tech-spec-13-implementation-roadmap.md) | Build order — Phase 0 → 24 |

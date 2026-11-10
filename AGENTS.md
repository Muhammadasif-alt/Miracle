# Miracle (Lead-Hunting-Rank) Workspace Rules

## Active Project Root
- Path: `D:\PROJECTS\Lead-Hunting-Rank-main`
- Application: Miracle (Personal AI Lead Generation, Cold Outreach, CRM, Meetings & Analytics)

## Project Isolation Directives
1. All changes, tests, data files (`apps/web/.data/`), and dependencies MUST stay strictly inside `D:\PROJECTS\Lead-Hunting-Rank-main`.
2. Never create temporary files, caches, or marker files in `D:\` root or outside this directory.
3. Database engine: PostgreSQL at `D:\tools\pgsql\pgsql\bin\postgres.exe` (port 5433).
4. Run commands must always start with: `cd "D:\PROJECTS\Lead-Hunting-Rank-main"`.

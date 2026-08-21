# JEE Companion

AI-powered study operating system for JEE Advanced prep. Not a timetable app —
a dynamic planner that continuously decides what to study, when, and why,
based on backlog, tests, energy levels, and deadlines that shift in real time.

See `docs/architecture.md` for the full system design, `docs/decisions.md`
for why key choices were made, and `CONSTRAINTS.md` for boundaries that
should not change without explicit sign-off.

## Structure

```
apps/mobile/                Expo React Native app
packages/shared-types/      Shared TypeScript types
packages/planner-engine/    Deterministic scheduling logic (zero AI dependency)
packages/data-access/       TaskRepository — the only path to task storage
packages/ai-router/         Multi-provider AI routing (capability-first ranking)
packages/syllabus-graph/    PCM topic tree (static data + query helpers)
supabase/                   DB migrations, seed data, edge functions
docs/                       Architecture reference, decisions log
```

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase + Gemini + OpenRouter keys
```

Run typecheck across every package before committing:

```bash
npm run typecheck
```

## Dev tooling

Free/open coding agents only — no paid subscriptions. Rotate between:
Cline or Continue.dev (VS Code, BYO model), Windsurf free tier, Aider
(terminal). All point at Gemini free tier / OpenRouter free models via
the same `.env` keys.

## Status

**Milestone A (done):** hardcoded task data flows through `shared-types` →
`planner-engine` → rendered schedule in the Expo app. Proves the
deterministic core works end to end with zero AI or backend involvement.

**Milestone B (in progress):** `TaskRepository` abstraction added
(`packages/data-access`) with a working `InMemoryTaskRepository` reference
implementation. Next: Supabase schema applied, `SupabaseTaskRepository`
implemented behind the same interface, mobile app switched off fixture
data onto real persisted tasks.

Full milestone roadmap (A through F) is in `docs/architecture.md`.

`ai-router` provider implementations (`packages/ai-router/src/providers/*`)
are interface-complete but stubbed — real Gemini/OpenRouter HTTP calls are
scheduled for Milestone C, intentionally after the data layer is real.

# Architecture Overview

Full original design conversation: see project owner's notes. This is the condensed
reference for AI coding agents working in this repo — read this before making
structural changes.

## Core principle

Not a timetable app. A **dynamic planning engine + study companion + knowledge system**
that continuously re-answers: *"given everything I know right now, what's the best
use of the next hour?"*

## Zero-cost philosophy (in priority order)

1. Use software instead of AI whenever software can do the job
2. Use the smallest adequate model
3. Use local inference when practical
4. Use free cloud inference
5. Route across providers
6. Cache everything that doesn't need recomputation

## Package boundaries — DO NOT blur these

- **`planner-engine`** — deterministic scheduling math only. No AI calls. Ever.
  Priority scoring, time-block allocation, free-window computation.
- **`ai-router`** — model routing/fallback only. Doesn't know JEE physics.
  Answers "who should handle this?" via capability-level matching, then
  tries providers in order (capability before quota).
- **`syllabus-graph`** — static PCM topic tree (JSON, version controlled) +
  merge logic with per-user mastery data from Supabase.
- **`shared-types`** — dependency-free types imported everywhere. No logic.

## AI capability hierarchy (LEVEL 0-4)

```
LEVEL 0  No AI              → software/algorithms (planner-engine)
LEVEL 1  Tiny/fast model    → classification/parsing
LEVEL 2  General free model → planning/revision
LEVEL 3  Strong free model  → difficult practice (Gemini free tier)
LEVEL 4  Strongest free     → hard JEE Advanced / complex tutoring (OpenRouter)
```

Model router must pick smallest sufficient model, not highest-quota model.

## Six major systems (from original design)

1. AI Planner — priority scoring, not mathematical division of hours
2. Dynamic priority engine — deadline urgency, test proximity, weakness,
   forgetting risk, backlog age, academic importance
3. Dynamic rescheduling — reacts to "test announced", "going out", etc.
   without manual drag-and-drop
4. Brain dump — freeform text → extracted tasks/events/optional goals
5. Document intelligence — PDF upload → indexed → RAG retrieval, never
   dumped whole into context window
6. Anti-forgetting system — spaced repetition running in background,
   frequency adapts to actual recall performance

## Graceful degradation requirement

If every AI provider is unavailable, the app must still fully function for:
viewing timetable, executing tasks, timer, solving questions, error log,
PDFs, revision, calendar, history. Only "smart" AI features go offline.

## Development milestones (build in this order, don't skip ahead)

- **Milestone A** — Task → Plan → Schedule (hardcoded task data, no
  Supabase, no AI — just planner-engine rendering in Expo)
- **Milestone B** — Task → Plan → Execute → Record (real Supabase, no
  AI yet — CRUD loop works end to end)
- **Milestone C** — Test → Reprioritize → Replan (AI router comes online
  here, first real provider calls, natural-language brain-dump parsing)
- **Milestone D** — PDF → Index → Retrieve → Practice (document
  intelligence / RAG — only after C is solid)
- **Milestone E** — Question → Attempt → Mistake → Revision (solve mode,
  error log, spaced repetition scheduling)
- **Milestone F** — Tutor → Retrieval → Reasoning → Verification (AI
  tutor mode, hint hierarchy)

Do not build the PDF/RAG subsystem, energy modeling, or polished UI before
Milestone C's core loop (natural language → structured task → DB →
schedule → rendered in app) is proven working end to end.

## Stack

- Frontend: React Native + Expo
- Local: SQLite + offline-first + native timers/notifications
- Backend: Supabase/PostgreSQL + pgvector
- AI: Multi-provider free router (Gemini + OpenRouter free models)
- Dev: GitHub + free/open coding agents (Cline, Continue.dev, Aider,
  Windsurf free tier) — rotated to manage rate limits, no paid subscriptions

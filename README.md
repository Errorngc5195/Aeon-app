<<<<<<< HEAD
# JEE Companion

AI-powered study operating system for JEE Advanced prep. Not a timetable app —
a dynamic planner that continuously decides what to study, when, and why,
based on backlog, tests, energy levels, and deadlines that shift in real time.

See `docs/architecture.md` for the full system design and `docs/decisions.md`
for why key choices were made.

## Structure

```
apps/mobile/          Expo React Native app
packages/planner-engine/   Deterministic scheduling logic (no AI)
packages/ai-router/        Multi-provider AI routing + fallback chain
packages/syllabus-graph/   PCM topic tree (static data + query helpers)
packages/shared-types/     Shared TypeScript types
supabase/              DB migrations, seed data, edge functions
docs/                  Architecture reference, decisions log
```

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase + Gemini + OpenRouter keys
```

## Dev tooling

Free/open coding agents only — no paid subscriptions. Rotate between:
Cline or Continue.dev (VS Code, BYO model), Windsurf free tier, Aider
(terminal). All point at Gemini free tier / OpenRouter free models via
the same `.env` keys.

## Status

Early scaffold. Package structure and types are in place; provider
implementations (`packages/ai-router/src/providers/*`) are stubs pending
actual API wiring.
=======
# Aeon-app
A all-in-one study app for a jee aspirant (me), just a personal leveling up project based on modern ai systems.
>>>>>>> 9c635d893e9b4a9514c36d3e04300396972d4001

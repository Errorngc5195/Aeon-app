# Decisions Log

Short record of why we picked X over Y. Add to this as choices get made —
future you (or a coding agent picking up mid-project) will want the reasoning,
not just the result.

## 2026-08-20 — Package manager: npm workspaces
Chose over pnpm/yarn for simplicity. No build-caching needs yet at this
project size. Revisit if monorepo grows large enough that install/build
times become painful.

## 2026-08-20 — Coding agent strategy: free tool rotation, no subscriptions
Rejected Claude Code / Cursor Pro / Windsurf Pro as primary dev tools —
all require paid subscriptions. Using Cline / Continue.dev (free, open
source, BYO model) + Windsurf free tier + Aider, backed by Gemini free
tier and OpenRouter free models. Rotate between tools/models as individual
rate limits get hit. Tradeoff accepted: more manual guidance needed per
session vs. a single strong paid agent.

## 2026-08-20 — Repo structure: monorepo, not separate repos
planner-engine, ai-router, syllabus-graph, and the mobile app all live in
one repo under npm workspaces. Reasoning: free coding agents need full
project context to reason well across the planner/AI boundary, and a
single repo is easier to manage with tools jumping in/out due to rate
limits.

## 2026-08-20 — planner-engine has zero AI dependencies
Enforced by package boundary, not just convention: planner-engine has no
dependency on ai-router. All scheduling math (priority scoring, time-block
allocation) is deterministic TypeScript. This directly implements the
"software before AI" rule and keeps the core app fully functional if every
AI provider is down.

## 2026-08-20 — AI router: capability-first dynamic ranking, not fixed fallback order
Rejected a hardcoded "Gemini → OpenRouter → Local" fallback chain. Instead
`AIRouter.rankEligible()` filters providers by capability/level/health/
quota and sorts by smallest-sufficient-capability-level then latency.
Reasoning: free-tier quotas and model lineups change over time (OpenRouter
adds/removes free models, Gemini's per-project limits vary) — a fixed
chain would need manual updates every time the free-tier landscape shifts.
Providers report their own live state (`ProviderHealth`, `QuotaState`);
the router never hardcodes assumed numbers.

## 2026-08-20 — AIProvider interface frozen before any real provider implementation
Wrote `getHealth() / getQuota() / generate()` as the permanent contract in
`packages/ai-router/src/providers/types.ts` before implementing Gemini or
OpenRouter's actual HTTP calls. Reasoning: once real API code exists it's
tempting to leak provider-specific details into the shared interface.
Freezing the shape first keeps the app and router provider-agnostic.
Changing this interface later requires a new dated entry here plus
explicit confirmation — see CONSTRAINTS.md.

## 2026-08-20 — Planner boundary: AI emits PlanningIntent, never ScheduleBlock[] directly
Added `PlanningIntent` type. AI-driven rescheduling (e.g. "test announced
tomorrow") produces a structured intent (goal, priorityBoost, deadline,
preferredSessionCount, reasoning) which planner-engine's deterministic
logic turns into actual `ScheduleBlock[]`. Reasoning: keeps a malformed or
unusual AI response from directly corrupting the schedule shape the app
renders — the deterministic layer always has final say over real time
blocks.

## 2026-08-20 — Dev sequencing: GitHub checkpoint → Expo shell → Supabase → AI router
Agreed sequencing (via cross-AI review) to push this scaffold to GitHub as
a clean checkpoint before touching Expo, then get a minimal mobile shell
rendering a planner-engine-generated schedule with hardcoded data before
Supabase or real AI provider calls enter the picture. Reasoning: fewer
moving pieces at once makes debugging with free/rate-limited coding
agents tractable — each phase gets tested and committed before the next
begins. Full milestone breakdown in docs/architecture.md.

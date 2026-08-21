# Constraints for AI coding agents

Read this before making structural changes. If you're an AI coding agent
(Cline, Windsurf, Aider, etc.) working in this repo, these boundaries are
intentional and expensive to reverse. Implement within them — don't
redesign them because you got stuck.

## Do NOT change without explicit human instruction

1. **Package boundaries.** `planner-engine` has zero AI dependency. It
   never imports from `ai-router`. `data-access` (TaskRepository) is the
   only path to storage — the mobile UI and the AI layer both go through
   it, neither talks to Supabase directly. This is enforced by design,
   not by accident — see `docs/decisions.md`.

2. **Database architecture.** Tables in `supabase/migrations/0001_init.sql`
   and their RLS policies. Add migrations, don't rewrite existing ones.

3. **Planner semantics.** AI never emits `ScheduleBlock[]` directly. It
   emits a `PlanningIntent`. The deterministic planner turns intent into
   actual time blocks. Don't shortcut this by having AI write blocks
   directly, even if it seems simpler for a specific feature.

4. **The `AIProvider` interface** (`packages/ai-router/src/providers/types.ts`).
   Every provider — Gemini, OpenRouter, Local, anything added later —
   implements exactly this contract: `getHealth()`, `getQuota()`,
   `generate()`. If a provider needs something outside this interface,
   that's a signal to flag it, not to add a provider-specific escape hatch.

5. **The `TaskRepository` interface** (`packages/data-access/src/taskRepository.ts`).
   `getTasks() / getTask() / createTask() / updateTask() / completeTask() /
   deleteTask()`. This is the only path to task storage. No component —
   including the AI layer — writes to Supabase (or any future local
   cache) directly. AI-created tasks pass through the exact same
   `validateCreateTaskInput()` / `validateUpdateTaskInput()` as manual
   ones. There is no AI bypass.

6. **The scheduler never silently drops tasks.** `buildDaySchedule()`
   returns every input task in either a `ScheduleBlock` or the
   `deferred` array with a reason. Don't "simplify" this back to
   silently dropping tasks that don't fit — callers depend on
   `deferred`/`totalDeferredMinutes` to tell the user the truth about
   their workload.

7. **Free-tier-only tooling and inference.** No paid coding tools, no paid
   AI API tiers, unless explicitly told otherwise.

## What IS fine to do

- Implement provider `generate()` bodies (currently stubbed with
  `throw new Error("not yet implemented")`).
- Add new `AICapability` values if a real request needs one that doesn't
  exist yet.
- Add new Supabase migrations for new tables/columns.
- Build out `apps/mobile` UI and screens.
- Fix bugs, add tests, improve error handling within existing boundaries.

## If you think a boundary should change

Say so explicitly and explain why, don't just change it. Add the proposal
to `docs/decisions.md` under a new dated entry and wait for confirmation
before implementing.

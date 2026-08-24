import type { ScheduleBlock, ScoredTask, DaySchedule } from "@jee/shared-types";
import { explainPriorityScore } from "./priorityScore";

export interface FixedEvent {
  label: string;
  startTime: string; // ISO datetime
  endTime: string;
}

export interface SchedulerOptions {
  date: string;           // YYYY-MM-DD
  fixedEvents: FixedEvent[]; // coaching, school, meals - non-negotiable blocks
  dayStart: string;       // ISO datetime, e.g. wake time
  dayEnd: string;         // ISO datetime, e.g. sleep time
  minBreakMinutes: number; // inserted between study blocks
  tasks: ScoredTask[];     // already ranked by priorityScore, highest first
}

export interface DeferredTask {
  taskId: string;
  title: string;
  estimatedMinutes: number;
  priorityScore: number;
  reason: "no_window_large_enough" | "day_full";
}

export interface SchedulingResult extends DaySchedule {
  deferred: DeferredTask[];      // tasks that did NOT fit anywhere today
  totalDeferredMinutes: number;  // sum of deferred.estimatedMinutes, for "2h 10m remaining" messaging
}

interface FreeWindow {
  start: number; // epoch ms
  end: number;
}

/**
 * Deterministic scheduler. Takes ranked tasks and fixed events, and fills
 * available time windows greedily by priority score, respecting minimum
 * break spacing. No AI involved — this is pure allocation logic.
 *
 * The AI layer (packages/ai-router) sits ABOVE this: it decides task
 * priority weighting nuance and triggers regeneration, but the actual
 * time-slotting math lives here so it's fast, free, and testable.
 *
 * IMPORTANT: this function never silently drops a task. Every task in
 * opts.tasks ends up in exactly one of: a scheduled ScheduleBlock, or the
 * `deferred` array with a reason. Callers (mobile UI, ai-router) must
 * surface `deferred` to the user rather than assuming a full schedule
 * means full coverage — see docs/decisions.md "scheduler never drops tasks".
 */
export function buildDaySchedule(opts: SchedulerOptions): SchedulingResult {
  const dayStartMs = new Date(opts.dayStart).getTime();
  const dayEndMs = new Date(opts.dayEnd).getTime();

  const fixedBlocks: ScheduleBlock[] = opts.fixedEvents.map((e, i) => ({
    id: `fixed-${i}`,
    taskId: null,
    label: e.label,
    startTime: e.startTime,
    endTime: e.endTime,
    type: "fixed_event",
    locked: true,
    reasoning: ["Fixed event — not scheduled by priority"],
  }));

  const freeWindows = computeFreeWindows(
    dayStartMs,
    dayEndMs,
    fixedBlocks.map((b) => ({
      start: new Date(b.startTime).getTime(),
      end: new Date(b.endTime).getTime(),
    }))
  );

  const taskBlocks: ScheduleBlock[] = [];
  const deferred: DeferredTask[] = [];
  const breakMs = opts.minBreakMinutes * 60_000;

  // Try each task against each window in order. A task that doesn't fit
  // in the current window may still fit in a later one (e.g. a short gap
  // before coaching, then a long evening window) — so we don't just bail
  // on first miss like the old implementation did.
  const remaining = [...opts.tasks];

  for (const window of freeWindows) {
    let cursor = window.start;
    let i = 0;
    while (i < remaining.length) {
      const task = remaining[i];
      const durationMs = task.estimatedMinutes * 60_000;
      const blockEnd = cursor + durationMs;

      if (blockEnd > window.end) {
        // Doesn't fit in what's left of THIS window — try the next task
        // against the same window (a shorter one later in the list might
        // still fit), don't abandon the whole window on first miss.
        i += 1;
        continue;
      }

      taskBlocks.push({
        id: `task-${task.id}`,
        taskId: task.id,
        label: task.title,
        startTime: new Date(cursor).toISOString(),
        endTime: new Date(blockEnd).toISOString(),
        type: task.type,
        locked: false,
        reasoning: explainPriorityScore(task),
      });

      cursor = blockEnd + breakMs;
      remaining.splice(i, 1); // scheduled — remove from remaining, don't advance i
    }
  }

  for (const task of remaining) {
    deferred.push({
      taskId: task.id,
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      priorityScore: task.priorityScore,
      reason: "no_window_large_enough",
    });
  }

  const allBlocks = [...fixedBlocks, ...taskBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return {
    date: opts.date,
    blocks: allBlocks,
    generatedAt: new Date().toISOString(),
    regeneratedReason: null,
    deferred,
    totalDeferredMinutes: deferred.reduce((sum, d) => sum + d.estimatedMinutes, 0),
  };
}

function computeFreeWindows(
  dayStart: number,
  dayEnd: number,
  occupied: { start: number; end: number }[]
): FreeWindow[] {
  const sorted = [...occupied].sort((a, b) => a.start - b.start);
  const windows: FreeWindow[] = [];
  let cursor = dayStart;

  for (const block of sorted) {
    if (block.start > cursor) {
      windows.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }

  if (cursor < dayEnd) {
    windows.push({ start: cursor, end: dayEnd });
  }

  return windows;
}

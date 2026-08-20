import type { ScheduleBlock, ScoredTask, DaySchedule } from "@jee/shared-types";

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
 */
export function buildDaySchedule(opts: SchedulerOptions): DaySchedule {
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
  const breakMs = opts.minBreakMinutes * 60_000;
  let taskIdx = 0;

  for (const window of freeWindows) {
    let cursor = window.start;
    while (taskIdx < opts.tasks.length && cursor < window.end) {
      const task = opts.tasks[taskIdx];
      const durationMs = task.estimatedMinutes * 60_000;
      const blockEnd = cursor + durationMs;
      if (blockEnd > window.end) break; // doesn't fit in remaining window

      taskBlocks.push({
        id: `task-${task.id}`,
        taskId: task.id,
        label: task.title,
        startTime: new Date(cursor).toISOString(),
        endTime: new Date(blockEnd).toISOString(),
        type: task.type,
        locked: false,
      });

      cursor = blockEnd + breakMs;
      taskIdx += 1;
    }
  }

  const allBlocks = [...fixedBlocks, ...taskBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return {
    date: opts.date,
    blocks: allBlocks,
    generatedAt: new Date().toISOString(),
    regeneratedReason: null,
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

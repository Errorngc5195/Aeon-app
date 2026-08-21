import type { ScoredTask } from "@jee/shared-types";
import { buildDaySchedule, type SchedulerOptions, type SchedulingResult } from "./scheduler";

export type RescheduleTrigger =
  | { kind: "test_announced"; testDate: string; affectedTopicIds: string[] }
  | { kind: "went_out"; startTime: string; endTime: string }
  | { kind: "coaching_cancelled"; originalStart: string; originalEnd: string }
  | { kind: "task_completed_early"; taskId: string }
  | { kind: "manual_note"; text: string }; // freeform, gets sent to ai-router for parsing

/**
 * Re-derives priority boosts from a trigger event BEFORE calling the AI.
 * This is the deterministic pre-processing step — e.g. "test_announced"
 * mechanically boosts testProximity for affected tasks without needing
 * an AI call. Only "manual_note" (freeform text) needs AI to interpret.
 *
 * Returns which tasks need a priority bump, so the caller (ai-router or
 * the app layer) can re-score them via priorityScore.ts and re-run
 * buildDaySchedule with the updated ranking.
 */
export function applyTrigger(
  trigger: RescheduleTrigger,
  tasks: ScoredTask[]
): { boostedTaskIds: string[]; requiresAIParsing: boolean } {
  switch (trigger.kind) {
    case "test_announced": {
      const boosted = tasks
        .filter((t) => trigger.affectedTopicIds.includes(t.topicId))
        .map((t) => t.id);
      return { boostedTaskIds: boosted, requiresAIParsing: false };
    }
    case "went_out":
    case "coaching_cancelled":
      // these change available time windows, not task priority directly.
      // caller should rebuild free windows via buildDaySchedule with
      // adjusted fixedEvents/dayStart/dayEnd.
      return { boostedTaskIds: [], requiresAIParsing: false };
    case "task_completed_early":
      return { boostedTaskIds: [], requiresAIParsing: false };
    case "manual_note":
      // freeform text like "I have exams approaching, change my timetable" —
      // this genuinely needs AI to extract structured intent.
      return { boostedTaskIds: [], requiresAIParsing: true };
  }
}

export function regenerateSchedule(
  opts: SchedulerOptions,
  reason: string
): SchedulingResult {
  const schedule = buildDaySchedule(opts);
  return { ...schedule, regeneratedReason: reason };
}

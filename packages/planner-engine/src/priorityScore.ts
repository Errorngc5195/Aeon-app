import type { PriorityInputs, Task, ScoredTask } from "@jee/shared-types";

// Weights for the priority formula described in the architecture doc:
// Priority = deadline urgency + test proximity + academic importance
//            + weakness + forgetting risk + backlog age
// These are starting weights — tune once real usage data exists.
// This whole module is deterministic math. No AI calls here, ever.
export const PRIORITY_WEIGHTS = {
  deadlineUrgency: 0.28,
  testProximity: 0.24,
  academicImportance: 0.14,
  weakness: 0.16,
  forgettingRisk: 0.12,
  backlogAge: 0.06,
} as const;

export function computePriorityScore(inputs: PriorityInputs): number {
  const raw =
    inputs.deadlineUrgency * PRIORITY_WEIGHTS.deadlineUrgency +
    inputs.testProximity * PRIORITY_WEIGHTS.testProximity +
    inputs.academicImportance * PRIORITY_WEIGHTS.academicImportance +
    inputs.weakness * PRIORITY_WEIGHTS.weakness +
    inputs.forgettingRisk * PRIORITY_WEIGHTS.forgettingRisk +
    inputs.backlogAge * PRIORITY_WEIGHTS.backlogAge;

  // inputs are 0-1, weights sum to 1, so raw is already 0-1. Scale to 0-100.
  return Math.round(raw * 100);
}

export function deadlineUrgency(deadline: string | null, now: Date): number {
  if (!deadline) return 0.1; // no deadline = low urgency floor, not zero
  const days = (new Date(deadline).getTime() - now.getTime()) / 86_400_000;
  if (days <= 0) return 1;
  if (days >= 14) return 0.05;
  // inverse curve: urgency rises sharply in the last 3 days
  return Math.min(1, 1 / (days * 0.35));
}

export function forgettingRisk(lastPracticedAt: string | null, now: Date): number {
  if (!lastPracticedAt) return 0.5; // never practiced, moderate default risk
  const daysSince = (now.getTime() - new Date(lastPracticedAt).getTime()) / 86_400_000;
  // simple decay curve approximating forgetting; spaced-repetition module
  // in packages/ai-router will refine this per-topic later using accuracy history
  return Math.min(1, daysSince / 21);
}

export function scoreTask(task: Task, inputs: PriorityInputs): ScoredTask {
  return {
    ...task,
    priorityInputs: inputs,
    priorityScore: computePriorityScore(inputs),
  };
}

export function rankTasks(scored: ScoredTask[]): ScoredTask[] {
  return [...scored].sort((a, b) => b.priorityScore - a.priorityScore);
}

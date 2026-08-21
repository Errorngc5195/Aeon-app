import type { CreateTaskInput, UpdateTaskInput } from "@jee/shared-types";

export class TaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskValidationError";
  }
}

// Every task creation — manual entry, brain-dump parsing, PlanningIntent
// resolution — passes through this before reaching TaskRepository. This
// is the enforcement point for "no AI bypass": the AI layer cannot skip
// validation just because it's the one generating the input.
export function validateCreateTaskInput(input: CreateTaskInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new TaskValidationError("Task title cannot be empty");
  }
  if (input.title.length > 200) {
    throw new TaskValidationError("Task title too long (max 200 chars)");
  }
  if (input.estimatedMinutes <= 0 || input.estimatedMinutes > 480) {
    throw new TaskValidationError(
      "estimatedMinutes must be between 1 and 480 (8 hours) — got " + input.estimatedMinutes
    );
  }
  if (input.deadline !== null && isNaN(new Date(input.deadline).getTime())) {
    throw new TaskValidationError("deadline is not a valid date: " + input.deadline);
  }
  if (!input.topicId || input.topicId.trim().length === 0) {
    throw new TaskValidationError("topicId is required");
  }
}

export function validateUpdateTaskInput(patch: UpdateTaskInput): void {
  if (patch.title !== undefined && patch.title.trim().length === 0) {
    throw new TaskValidationError("Task title cannot be empty");
  }
  if (
    patch.estimatedMinutes !== undefined &&
    (patch.estimatedMinutes <= 0 || patch.estimatedMinutes > 480)
  ) {
    throw new TaskValidationError(
      "estimatedMinutes must be between 1 and 480 (8 hours) — got " + patch.estimatedMinutes
    );
  }
  if (
    patch.deadline !== undefined &&
    patch.deadline !== null &&
    isNaN(new Date(patch.deadline).getTime())
  ) {
    throw new TaskValidationError("deadline is not a valid date: " + patch.deadline);
  }
}

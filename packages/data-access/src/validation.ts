import type { CreateTaskInput, UpdateTaskInput, ExtractedTask } from "@jee/shared-types";

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

// Converts AI-extracted brain-dump tasks into validated CreateTaskInput.
// This is the ONE place AI output crosses into the same validated path
// manual task creation uses — see CONSTRAINTS.md "no AI bypass".
// topicHint (freeform AI guess) is not the same as topicId (a real
// syllabus-graph id) — callers should resolve topicHint against
// syllabus-graph before calling this where possible. If unresolved, we
// fall back to a placeholder id rather than silently dropping the task,
// since an unresolved topic is still a real task the user needs to see.
export function extractedTaskToCreateInput(extracted: ExtractedTask, resolvedTopicId: string | null): CreateTaskInput {
  const input: CreateTaskInput = {
    subject: extracted.subject ?? "physics", // default subject — app layer should prompt user to confirm if null
    topicId: resolvedTopicId ?? "unresolved",
    type: extracted.type,
    title: extracted.title,
    estimatedMinutes: extracted.estimatedMinutes,
    deadline: extracted.deadline,
    isOptional: extracted.isOptional,
    sourceDocId: null,
  };
  validateCreateTaskInput(input);
  return input;
}
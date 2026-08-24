import type { Task, CreateTaskInput, UpdateTaskInput, Subject, TaskType } from "@jee/shared-types";

// Mirrors supabase/database.types.ts `tasks` table shape. Duplicated here
// (not imported from database.types.ts) so this package doesn't need a
// hard dependency on the generated Supabase types — keeps the mapper
// testable in isolation and stable if the generated file's shape shifts.
export interface TaskRow {
  id: string;
  user_id: string;
  subject: string;
  topic_id: string | null;
  type: string;
  title: string;
  estimated_minutes: number;
  deadline: string | null;
  is_optional: boolean;
  source_doc_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskInsertRow {
  user_id: string;
  subject: string;
  topic_id: string | null;
  type: string;
  title: string;
  estimated_minutes: number;
  deadline: string | null;
  is_optional: boolean;
  source_doc_id: string | null;
}

export interface TaskUpdateRow {
  subject?: string;
  topic_id?: string | null;
  type?: string;
  title?: string;
  estimated_minutes?: number;
  deadline?: string | null;
  is_optional?: boolean;
  completed_at?: string | null;
}

// ─── PURE FUNCTIONS ─────────────────────────────────────────────────────
// No Supabase calls, no side effects. Domain Task deliberately does NOT
// expose user_id — identity is a persistence-layer/session concern, not
// something planner-engine or the UI should ever see or manipulate.

export function taskFromDb(row: TaskRow): Task {
  return {
    id: row.id,
    subject: row.subject as Subject,
    topicId: row.topic_id ?? "",
    type: row.type as TaskType,
    title: row.title,
    estimatedMinutes: row.estimated_minutes,
    deadline: row.deadline,
    isOptional: row.is_optional,
    sourceDocId: row.source_doc_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

// userId supplied separately by the repository (from the session), never
// by the caller of the mapper — keeps this function pure and reusable.
export function taskToInsertRow(input: CreateTaskInput, userId: string): TaskInsertRow {
  return {
    user_id: userId,
    subject: input.subject,
    topic_id: input.topicId || null,
    type: input.type,
    title: input.title,
    estimated_minutes: input.estimatedMinutes,
    deadline: input.deadline,
    is_optional: input.isOptional,
    source_doc_id: input.sourceDocId,
  };
}

export function taskToUpdateRow(patch: UpdateTaskInput): TaskUpdateRow {
  const row: TaskUpdateRow = {};
  if (patch.topicId !== undefined) row.topic_id = patch.topicId || null;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.estimatedMinutes !== undefined) row.estimated_minutes = patch.estimatedMinutes;
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.isOptional !== undefined) row.is_optional = patch.isOptional;
  return row;
}

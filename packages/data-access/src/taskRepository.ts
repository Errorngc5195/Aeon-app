import type { Task, CreateTaskInput, UpdateTaskInput } from "@jee/shared-types";

// ─── FROZEN CONTRACT ────────────────────────────────────────────────────
// The mobile UI (and later, the AI layer) only ever talks to this
// interface, never directly to Supabase or any other data source. This
// is what lets us go local-first later (SQLite cache + Supabase sync)
// without touching UI code — see docs/decisions.md.
//
// CRITICAL RULE: AI-created tasks go through this exact same interface
// and the same validation as manually created tasks. There is no
// "AI bypass" path that writes to storage directly. See CONSTRAINTS.md.
export interface TaskRepository {
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, patch: UpdateTaskInput): Promise<Task>;
  completeTask(id: string): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

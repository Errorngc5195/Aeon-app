import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@jee/shared-types";
import type { TaskRepository } from "./TaskRepository";
import { validateCreateTaskInput, validateUpdateTaskInput } from "../validation";
import { taskFromDb, taskToInsertRow, taskToUpdateRow, type TaskRow } from "../mappers/taskMapper";

// ─── INVARIANT (see CONSTRAINTS.md) ────────────────────────────────────
// This repository NEVER accepts a caller-supplied user_id. User identity
// comes exclusively from the authenticated Supabase session
// (supabase.auth.getUser()). RLS is the final authorization boundary —
// this class doesn't try to duplicate that logic, it just never gives
// the database a reason to doubt who's asking.
export class SupabaseTaskRepository implements TaskRepository {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error("No authenticated session — cannot perform task operation");
    }
    return data.user.id;
  }

  async getTasks(): Promise<Task[]> {
    // RLS restricts this to the current user's rows automatically — no
    // .eq('user_id', ...) needed, and deliberately not added, so there's
    // no code path that could accidentally filter by a wrong/stale id.
    const { data, error } = await this.supabase.from("tasks").select("*");
    if (error) throw new Error(`getTasks failed: ${error.message}`);
    return (data as TaskRow[]).map(taskFromDb);
  }

  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getTask failed: ${error.message}`);
    return data ? taskFromDb(data as TaskRow) : null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    validateCreateTaskInput(input);
    const userId = await this.getUserId();
    const row = taskToInsertRow(input, userId);
    const { data, error } = await this.supabase.from("tasks").insert(row).select().single();
    if (error) throw new Error(`createTask failed: ${error.message}`);
    return taskFromDb(data as TaskRow);
  }

  async updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
    validateUpdateTaskInput(patch);
    const row = taskToUpdateRow(patch);
    const { data, error } = await this.supabase
      .from("tasks")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`updateTask failed: ${error.message}`);
    return taskFromDb(data as TaskRow);
  }

  async completeTask(id: string): Promise<Task> {
    const { data, error } = await this.supabase
      .from("tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`completeTask failed: ${error.message}`);
    return taskFromDb(data as TaskRow);
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase.from("tasks").delete().eq("id", id);
    if (error) throw new Error(`deleteTask failed: ${error.message}`);
  }
}

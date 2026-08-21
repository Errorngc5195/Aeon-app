import type { Task, CreateTaskInput, UpdateTaskInput } from "@jee/shared-types";
import type { TaskRepository } from "./taskRepository";
import { validateCreateTaskInput, validateUpdateTaskInput } from "./validation";

// Reference implementation of TaskRepository backed by an in-memory Map.
// Useful for: testing the repository interface shape before Supabase is
// wired up, unit tests, and Storybook-style UI development without a
// network dependency. NOT for production — data vanishes on reload.
//
// Swap for SupabaseTaskRepository (same interface) once Milestone B's
// Supabase step is done. UI code that only depends on TaskRepository
// needs zero changes when that swap happens.
export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();
  private nextId = 1;

  async getTasks(): Promise<Task[]> {
    return [...this.tasks.values()];
  }

  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    validateCreateTaskInput(input);
    const task: Task = {
      ...input,
      id: `local-${this.nextId++}`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
    validateUpdateTaskInput(patch);
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new Error(`Task ${id} not found`);
    }
    const updated: Task = { ...existing, ...patch };
    this.tasks.set(id, updated);
    return updated;
  }

  async completeTask(id: string): Promise<Task> {
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new Error(`Task ${id} not found`);
    }
    const updated: Task = { ...existing, completedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }
}

import { SupabaseTaskRepository } from "@jee/data-access";
import type { TaskRepository } from "@jee/data-access";
import { supabase } from "./supabase";

// Single place the mobile app constructs its TaskRepository. Screens
// depend on the TaskRepository interface, never on Supabase directly —
// swapping in a local-cache-backed implementation later means changing
// only this file.
let cachedRepository: TaskRepository | null = null;

export function getTaskRepository(): TaskRepository {
  if (!cachedRepository) {
    cachedRepository = new SupabaseTaskRepository(supabase);
  }
  return cachedRepository;
}

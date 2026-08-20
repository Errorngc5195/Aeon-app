import type { AIRequest, AIResponse } from "@jee/shared-types";

// Per architecture doc section 28-29: don't ask an LLM to re-classify
// something already classified. This is a placeholder in-memory cache —
// swap for a Supabase table (keyed by a hash of taskKind + prompt) once
// the backend is wired up, so cache persists across app sessions.
const memoryCache = new Map<string, AIResponse>();

function cacheKey(request: AIRequest): string {
  return `${request.taskKind}:${request.prompt}`;
}

export async function getCached(request: AIRequest): Promise<AIResponse | null> {
  // Only cache deterministic-ish tasks — classification/parsing, not
  // open-ended tutoring conversations which should stay fresh.
  if (request.taskKind !== "classify") return null;
  return memoryCache.get(cacheKey(request)) ?? null;
}

export async function setCached(request: AIRequest, response: AIResponse): Promise<void> {
  if (request.taskKind !== "classify") return;
  memoryCache.set(cacheKey(request), response);
}

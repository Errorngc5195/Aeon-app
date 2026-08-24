import type { AIProvider } from "./types";
import type {
  AIRequest,
  AIResponse,
  AICapability,
  ProviderHealth,
  QuotaState,
} from "@jee/shared-types";

// Google Gemini via AI Studio free tier, using the STABLE generateContent
// REST endpoint (not the beta Interactions API — see docs/decisions.md).
// Capability level 3 — strong free reasoning model.
//
// Uses responseSchema/responseMimeType:"application/json" so callers that
// pass a JSON schema in AIRequest get back parseable structured output
// (needed for BrainDumpResult extraction) rather than free-text that
// needs fragile manual parsing.
const GEMINI_MODEL = "gemini-2.0-flash"; // update if a newer stable free-tier model becomes available
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiProvider implements AIProvider {
  id = "gemini";
  name = "Google Gemini (free tier)";
  capabilities: AICapability[] = [
    "task_parsing",
    "schedule_reasoning",
    "revision_planning",
    "question_selection",
    "text_tutoring",
    "math_reasoning",
    "physics_reasoning",
    "structured_output",
  ];
  capabilityLevel = 3 as const;

  private apiKey: string | undefined;
  private consecutiveFailures = 0;
  private cooldownUntil: string | null = null;
  private lastKnownQuota: QuotaState = {
    requestsRemaining: null,
    tokensRemaining: null,
    resetsAt: null,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY;
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      available: Boolean(this.apiKey),
      consecutiveFailures: this.consecutiveFailures,
      cooldownUntil: this.cooldownUntil,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async getQuota(): Promise<QuotaState> {
    return this.lastKnownQuota;
  }

  // Structured output comes via request.responseSchema (frozen AIProvider
  // contract — see docs/decisions.md — providers never get extra params
  // outside AIRequest).
  async generate(request: AIRequest): Promise<AIResponse | null> {
    if (!this.apiKey) return null;

    const start = Date.now();
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: request.prompt }] }],
    };

    if (request.responseSchema) {
      body.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: request.responseSchema,
      };
    }

    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        // Rate limited — back off for 60s and let the router try another
        // provider. Never throw; router expects null on failure.
        this.consecutiveFailures += 1;
        this.cooldownUntil = new Date(Date.now() + 60_000).toISOString();
        return null;
      }

      if (!res.ok) {
        this.consecutiveFailures += 1;
        return null;
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string") {
        this.consecutiveFailures += 1;
        return null;
      }

      this.consecutiveFailures = 0;
      this.cooldownUntil = null;

      return {
        text,
        providerId: this.id,
        modelId: GEMINI_MODEL,
        latencyMs: Date.now() - start,
      };
    } catch {
      this.consecutiveFailures += 1;
      return null;
    }
  }
}

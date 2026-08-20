import type { AIProvider } from "./types";
import type {
  AIRequest,
  AIResponse,
  AICapability,
  ProviderHealth,
  QuotaState,
} from "@jee/shared-types";

// Google Gemini via AI Studio free tier. Capability level 3 — strong free
// reasoning model. Actual free-tier limits are model/project-dependent
// (RPM/TPM/RPD) and can change — this class DISCOVERS quota from response
// headers/errors at call time rather than hardcoding assumed numbers, per
// docs/decisions.md "don't design around fixed quotas".
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
    // TODO: Gemini doesn't expose remaining-quota via a dedicated endpoint —
    // update this.lastKnownQuota by parsing rate-limit info from response
    // headers/errors after each real call (see generate() TODO below).
    return this.lastKnownQuota;
  }

  async generate(_request: AIRequest): Promise<AIResponse | null> {
    if (!this.apiKey) return null;

    // TODO: implement actual fetch() to the Gemini API endpoint.
    // On success: reset consecutiveFailures, update lastKnownQuota from
    // response, return AIResponse.
    // On rate-limit error: set cooldownUntil, increment consecutiveFailures,
    // return null (never throw — router expects null on failure).
    throw new Error("GeminiProvider.generate not yet implemented");
  }
}

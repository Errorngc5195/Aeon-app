import type { AIProvider } from "./types";
import type {
  AIRequest,
  AIResponse,
  AICapability,
  ModelCapabilityLevel,
  ProviderHealth,
  QuotaState,
} from "@jee/shared-types";

// OpenRouter free models. OpenRouter's free plan is documented at 50
// requests/day as of writing, but treat that as a starting assumption to
// verify at runtime, not a hardcoded constant baked into routing logic —
// OpenRouter's free model lineup and limits change over time.
//
// Multiple free models sit behind one API key with different capability
// levels, so this provider internally picks the best free model slug that
// satisfies request.requiredCapabilityLevel.
export class OpenRouterProvider implements AIProvider {
  id = "openrouter";
  name = "OpenRouter (free models)";
  capabilities: AICapability[] = [
    "task_parsing",
    "schedule_reasoning",
    "revision_planning",
    "question_selection",
    "text_tutoring",
    "math_reasoning",
    "physics_reasoning",
    "long_context",
    "structured_output",
  ];
  capabilityLevel = 4 as const; // ceiling — actual model picked per-request

  private apiKey: string | undefined;
  private consecutiveFailures = 0;
  private cooldownUntil: string | null = null;
  private lastKnownQuota: QuotaState = {
    requestsRemaining: null,
    tokensRemaining: null,
    resetsAt: null,
  };

  // Map capability level -> specific free OpenRouter model slug.
  // TODO: fill in once we confirm current free model availability — check
  // https://openrouter.ai/models?max_price=0 at implementation time rather
  // than trusting this comment to stay current.
  private modelMap: Record<ModelCapabilityLevel, string | null> = {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY;
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
    // TODO: OpenRouter returns rate-limit info in response headers —
    // update this.lastKnownQuota after each real call.
    return this.lastKnownQuota;
  }

  async generate(request: AIRequest): Promise<AIResponse | null> {
    if (!this.apiKey) return null;
    const model = this.modelMap[request.requiredCapabilityLevel];
    if (!model) return null;

    // TODO: implement actual fetch() to
    // https://openrouter.ai/api/v1/chat/completions
    throw new Error("OpenRouterProvider.generate not yet implemented");
  }
}

import type { AIProvider } from "./types";
import type { AIRequest, AIResponse, AICapability, ProviderHealth, QuotaState } from "@jee/shared-types";

// Placeholder for on-device small model. LEVEL 1 in the architecture doc —
// used for cheap classification/parsing that doesn't need network at all.
// Not required for MVP; stub exists so the router's ranking has a real
// "no network, no quota" tier to fall through to once implemented.
export class LocalProvider implements AIProvider {
  id = "local";
  name = "On-device model";
  capabilities: AICapability[] = ["task_parsing"];
  capabilityLevel = 1 as const;

  async getHealth(): Promise<ProviderHealth> {
    return {
      available: false, // flip to true once wired up
      consecutiveFailures: 0,
      cooldownUntil: null,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async getQuota(): Promise<QuotaState> {
    return { requestsRemaining: null, tokensRemaining: null, resetsAt: null };
  }

  async generate(_request: AIRequest): Promise<AIResponse | null> {
    return null;
  }
}

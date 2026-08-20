import type { AIRequest, AIResponse, ProviderState } from "@jee/shared-types";
import type { AIProvider } from "./providers/types";
import { getCached, setCached } from "./cache";

export interface RouterResult {
  response: AIResponse | null;
  degraded: boolean; // true if we fell back or hit total AI unavailability
  attemptedProviderIds: string[];
}

/**
 * The orchestrator. Deliberately small and "dumb" per the architecture doc:
 * it doesn't reason about JEE physics, it just answers "who should handle
 * this?" by ranking eligible providers and trying them in order.
 *
 * Ranking (per docs/decisions.md "capability-first dynamic ranking"):
 *   1. Filter out providers that don't meet requiredCapabilities /
 *      requiredCapabilityLevel / vision requirement.
 *   2. Filter out providers in cooldown or with zero remaining quota
 *      (when quota is known).
 *   3. Among what's left, prefer smallest sufficient capability level
 *      (don't burn a strong model's quota on an easy task).
 *   4. Break ties with lower latency EMA.
 *
 * This deliberately does NOT hardcode "Gemini then OpenRouter then Local" —
 * that ordering falls out of the ranking above based on live state, so
 * adding/removing providers never requires touching this logic.
 */
export class AIRouter {
  constructor(private providers: AIProvider[]) {}

  private async buildStates(): Promise<Map<string, ProviderState>> {
    const states = new Map<string, ProviderState>();
    for (const p of this.providers) {
      const [health, quota] = await Promise.all([p.getHealth(), p.getQuota()]);
      states.set(p.id, {
        providerId: p.id,
        modelId: p.id, // refined per-request inside provider.generate() if it picks a specific model
        capabilities: p.capabilities,
        capabilityLevel: p.capabilityLevel,
        quota,
        health,
        lastUsedAt: null,
        latencyMsEma: null,
      });
    }
    return states;
  }

  private rankEligible(request: AIRequest, states: Map<string, ProviderState>): AIProvider[] {
    const now = Date.now();

    const eligible = this.providers.filter((p) => {
      const state = states.get(p.id)!;

      const hasCapabilities = request.requiredCapabilities.every((c) =>
        p.capabilities.includes(c)
      );
      if (!hasCapabilities) return false;

      if (p.capabilityLevel < request.requiredCapabilityLevel) return false;

      if (request.requiresVision && !p.capabilities.includes("vision")) return false;

      if (!state.health.available) return false;
      if (state.health.cooldownUntil && new Date(state.health.cooldownUntil).getTime() > now) {
        return false;
      }

      // Only exclude on quota if quota is actually known and exhausted.
      // Unknown (null) quota means "assume available, discover via failure".
      if (state.quota.requestsRemaining !== null && state.quota.requestsRemaining <= 0) {
        return false;
      }

      return true;
    });

    return eligible.sort((a, b) => {
      const levelDiff = a.capabilityLevel - b.capabilityLevel; // smallest sufficient first
      if (levelDiff !== 0) return levelDiff;
      const latA = states.get(a.id)!.latencyMsEma ?? Infinity;
      const latB = states.get(b.id)!.latencyMsEma ?? Infinity;
      return latA - latB;
    });
  }

  async route(request: AIRequest): Promise<RouterResult> {
    const cached = await getCached(request);
    if (cached) {
      return { response: cached, degraded: false, attemptedProviderIds: [] };
    }

    const states = await this.buildStates();
    const ranked = this.rankEligible(request, states);
    const attempted: string[] = [];

    for (const provider of ranked) {
      attempted.push(provider.id);
      const result = await provider.generate(request);
      if (result) {
        await setCached(request, result);
        return { response: result, degraded: false, attemptedProviderIds: attempted };
      }
      // provider returned null (failed/unavailable) — try the next ranked one
    }

    // Every eligible provider failed or none were eligible — graceful
    // degradation. Caller must handle null by falling back to
    // planner-engine's deterministic output only, per doc section 30.
    return { response: null, degraded: true, attemptedProviderIds: attempted };
  }
}

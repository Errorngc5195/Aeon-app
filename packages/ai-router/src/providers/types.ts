import type {
  AIRequest,
  AIResponse,
  AICapability,
  ModelCapabilityLevel,
  ProviderHealth,
  QuotaState,
} from "@jee/shared-types";

// ─── FROZEN CONTRACT ────────────────────────────────────────────────────
// Every provider (Gemini, OpenRouter, Local, anything added later) must
// implement exactly this interface. The application and router never
// know or care which provider actually answered a request.
//
// Do not change this interface casually — it's the seam that lets us
// swap/add free providers without touching call sites. If a provider
// needs something this interface doesn't expose, that's a signal the
// interface needs a deliberate, documented change (see docs/decisions.md),
// not a provider-specific workaround.
export interface AIProvider {
  id: string;
  name: string;
  capabilities: AICapability[];
  capabilityLevel: ModelCapabilityLevel;

  // Returns current health without throwing. Router uses this to skip
  // providers in cooldown rather than attempting and failing.
  getHealth(): Promise<ProviderHealth>;

  // Returns current quota state. null fields mean "unknown", not zero —
  // never hardcode assumed quota numbers, discover them.
  getQuota(): Promise<QuotaState>;

  // Returns null (never throws) on failure/unavailability so the router
  // can move to the next candidate. Throwing is reserved for programmer
  // errors (bad config), not runtime provider failures.
  generate(request: AIRequest): Promise<AIResponse | null>;
}

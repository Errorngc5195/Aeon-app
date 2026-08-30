import { AIRouter, GeminiProvider } from "@jee/ai-router";

// Single place the mobile app constructs its AIRouter. Adding a new
// provider (Claude, OpenRouter, etc.) later means adding one line here —
// screens never import a specific provider directly.
//
// IMPORTANT Expo env var note: any env var read at runtime in the client
// bundle must use the EXPO_PUBLIC_ prefix (Expo inlines these at build
// time — there is no server-only env in a plain Expo app, unlike Next.js
// API routes). So GEMINI_API_KEY must be set as EXPO_PUBLIC_GEMINI_API_KEY
// in .env for this to work. Yes, this means the key ships inside the app
// bundle — acceptable for a personal single-user app during development,
// but NOT something to do in a published/shared app. Revisit before any
// public release — see docs/decisions.md.
let cachedRouter: AIRouter | null = null;

export function getBrainDumpRouter(): AIRouter {
  if (cachedRouter) return cachedRouter;

  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error(
      "EXPO_PUBLIC_GEMINI_API_KEY is not set — add it to your .env file. Get a free key at https://aistudio.google.com/apikey"
    );
  }

  cachedRouter = new AIRouter([new GeminiProvider(geminiKey)]);
  return cachedRouter;
}

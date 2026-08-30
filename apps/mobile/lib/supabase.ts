import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";

// EXPO_PUBLIC_ prefix required for these to be inlined at build time —
// see .env.example at repo root. Never commit real values.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check your .env file"
  );
}

// Official Supabase React Native pattern: AsyncStorage as the session
// storage adapter (no localStorage in React Native), autoRefreshToken +
// persistSession so the session survives app restarts, detectSessionInUrl
// off since there's no browser redirect flow on mobile for email/password.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Pause/resume token auto-refresh based on app foreground state — avoids
// wasted refresh calls while backgrounded, per Supabase's official guidance.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

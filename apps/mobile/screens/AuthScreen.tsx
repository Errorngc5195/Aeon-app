import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../lib/AuthContext";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSignupMessage(null);
    setSubmitting(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === "signup") {
      setSignupMessage("Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{mode === "signin" ? "Sign In" : "Sign Up"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {signupMessage && <Text style={styles.info}>{signupMessage}</Text>}

      {submitting ? (
        <ActivityIndicator />
      ) : (
        <Button title={mode === "signin" ? "Sign In" : "Sign Up"} onPress={handleSubmit} />
      )}

      <Text
        style={styles.switchMode}
        onPress={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setSignupMessage(null);
        }}
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: { color: "#c00", marginBottom: 12 },
  info: { color: "#060", marginBottom: 12 },
  switchMode: { marginTop: 20, color: "#06c", textAlign: "center" },
});

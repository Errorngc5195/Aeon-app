import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from "react-native";
import { parseBrainDump, BrainDumpParseError } from "@jee/ai-router";
import type { BrainDumpResult } from "@jee/shared-types";
import { getBrainDumpRouter } from "../lib/ai";

interface Props {
  onExtracted: (result: BrainDumpResult) => void;
  onCancel: () => void;
}

export function BrainDumpScreen({ onExtracted, onCancel }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlan() {
    if (!text.trim()) {
      setError("Enter something first — tasks, tests, deadlines, whatever's on your mind.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const router = getBrainDumpRouter();
      const today = new Date().toISOString().slice(0, 10);
      const result = await parseBrainDump(router, text, today);
      onExtracted(result);
    } catch (e) {
      if (e instanceof BrainDumpParseError) {
        setError(e.message);
      } else {
        setError("Something went wrong parsing that. Try rephrasing or check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Brain Dump</Text>
        <Text style={styles.subheading}>
          Write out everything on your mind — tasks, deadlines, tests, times you can't study.
        </Text>

        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={10}
          placeholder={`e.g. "Physics 40 questions from today's lecture. Chemistry redox needs revision. Physics test Thursday. Can't study Wednesday 5-8pm."`}
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Reading through that…</Text>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onCancel} color="#888" />
            <Button title="Plan" onPress={handlePlan} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  subheading: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 16 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 180,
    marginBottom: 16,
  },
  error: { color: "#c00", marginBottom: 12 },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  loadingText: { color: "#666" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
});

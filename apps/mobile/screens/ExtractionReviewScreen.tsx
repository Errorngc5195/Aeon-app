import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch,
} from "react-native";
import type { BrainDumpResult, ExtractedTask, CreateTaskInput } from "@jee/shared-types";
import { extractedTaskToCreateInput, TaskValidationError } from "@jee/data-access";
import type { TaskRepository } from "@jee/data-access";

interface Props {
  result: BrainDumpResult;
  repository: TaskRepository;
  onSaved: () => void;
  onBack: () => void;
}

// The enforcement point the head AI specified: AI output is shown for
// human review and is editable. Nothing is saved until the user presses
// Confirm, and even then every task goes through the exact same
// extractedTaskToCreateInput() -> validation -> TaskRepository path that
// manually created tasks use. No AI bypass.
export function ExtractionReviewScreen({ result, repository, onSaved, onBack }: Props) {
  const [tasks, setTasks] = useState<ExtractedTask[]>(result.tasks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTask(index: number, patch: Partial<ExtractedTask>) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setError(null);
    setSaving(true);
    try {
      for (const task of tasks) {
        // topicHint is a freeform AI guess, not a real syllabus-graph id.
        // Resolving topicHint -> real topicId via syllabus-graph search
        // is a nice-to-have for later; for now we pass null so
        // extractedTaskToCreateInput() falls back to "unresolved" rather
        // than silently guessing wrong.
        const input: CreateTaskInput = extractedTaskToCreateInput(task, null);
        await repository.createTask(input);
      }

      // Unavailable periods, tests, and recurring goals from this brain
      // dump aren't persisted yet — TaskRepository only handles tasks.
      // Fixed/unavailable-time storage is a planner-engine input today
      // (see apps/mobile/lib/sampleData.ts), not yet a Supabase table.
      // Surfacing that gap explicitly rather than silently dropping it:
      if (result.unavailablePeriods.length > 0 || result.tests.length > 0 || result.recurringGoals.length > 0) {
        console.warn(
          "Brain dump also extracted unavailable periods/tests/recurring goals — these are not yet persisted (planner-engine input only). See docs/decisions.md."
        );
      }

      onSaved();
    } catch (e) {
      if (e instanceof TaskValidationError) {
        setError(`Validation failed: ${e.message}`);
      } else {
        setError("Failed to save tasks. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>Review what I found</Text>
        <Text style={styles.subheading}>Edit anything that's wrong, then confirm to save.</Text>

        {tasks.length === 0 && <Text style={styles.empty}>No tasks were extracted from that input.</Text>}

        {tasks.map((task, i) => (
          <View key={i} style={styles.taskCard}>
            <TextInput
              style={styles.titleInput}
              value={task.title}
              onChangeText={(v) => updateTask(i, { title: v })}
            />

            <View style={styles.row}>
              <Text style={styles.label}>Subject:</Text>
              <TextInput
                style={styles.smallInput}
                value={task.subject ?? ""}
                placeholder="physics/chemistry/maths"
                onChangeText={(v) => updateTask(i, { subject: (v || null) as ExtractedTask["subject"] })}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Type:</Text>
              <TextInput
                style={styles.smallInput}
                value={task.type}
                onChangeText={(v) => updateTask(i, { type: v as ExtractedTask["type"] })}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Minutes:</Text>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={String(task.estimatedMinutes)}
                onChangeText={(v) => updateTask(i, { estimatedMinutes: parseInt(v, 10) || 0 })}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Deadline:</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="YYYY-MM-DD or blank"
                value={task.deadline ?? ""}
                onChangeText={(v) => updateTask(i, { deadline: v || null })}
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Optional:</Text>
              <Switch
                value={task.isOptional}
                onValueChange={(v) => updateTask(i, { isOptional: v })}
              />
            </View>

            <Text style={styles.confidence}>AI confidence: {Math.round(task.confidence * 100)}%</Text>
            <Text style={styles.removeLink} onPress={() => removeTask(i)}>
              Remove this task
            </Text>
          </View>
        ))}

        {result.unavailablePeriods.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.infoHeading}>Unavailable periods found (not yet saved):</Text>
            {result.unavailablePeriods.map((p, i) => (
              <Text key={i} style={styles.infoLine}>
                • {p.label}: {p.startTime} – {p.endTime}
              </Text>
            ))}
          </View>
        )}

        {result.tests.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.infoHeading}>Tests found (not yet saved):</Text>
            {result.tests.map((t, i) => (
              <Text key={i} style={styles.infoLine}>
                • {t.label} — {t.date}
              </Text>
            ))}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {saving ? (
          <ActivityIndicator style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.buttonRow}>
            <Button title="Back" onPress={onBack} color="#888" />
            <Button title={`Confirm & Save (${tasks.length})`} onPress={handleConfirm} disabled={tasks.length === 0} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  subheading: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 16 },
  empty: { color: "#888", fontStyle: "italic" },
  taskCard: { borderWidth: 1, borderColor: "#e2e2e2", borderRadius: 10, padding: 12, marginBottom: 12 },
  titleInput: { fontSize: 16, fontWeight: "600", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 6, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  label: { width: 80, fontSize: 13, color: "#666" },
  smallInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13 },
  confidence: { fontSize: 11, color: "#999", marginTop: 6 },
  removeLink: { fontSize: 12, color: "#c00", marginTop: 6 },
  infoSection: { backgroundColor: "#f8f8f8", borderRadius: 8, padding: 10, marginBottom: 12 },
  infoHeading: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  infoLine: { fontSize: 12, color: "#555" },
  error: { color: "#c00", marginTop: 12 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 32 },
});

import { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, SafeAreaView } from "react-native";
import { buildDaySchedule } from "@jee/planner-engine";
import type { ScheduleBlock } from "@jee/shared-types";
import { SAMPLE_TASKS, getSampleFixedEvents } from "../lib/sampleData";
import { useAuth } from "../lib/AuthContext";

// Milestone C vertical slice: still using sampleData as the task source
// for now — swapping this for a real TaskRepository-backed load is the
// next chunk (Brain Dump + Extraction Review screens need to exist first
// so there's a way to CREATE real tasks before this screen can READ them
// meaningfully). See docs/decisions.md.

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BlockRow({ block }: { block: ScheduleBlock }) {
  const [expanded, setExpanded] = useState(false);
  const isFixed = block.type === "fixed_event";

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View style={[styles.block, isFixed && styles.blockFixed]}>
        <Text style={styles.blockTime}>
          {formatTime(block.startTime)} – {formatTime(block.endTime)}
        </Text>
        <Text style={styles.blockLabel}>{block.label}</Text>
        <Text style={styles.blockType}>{block.type}</Text>
        {!isFixed && <Text style={styles.whyLink}>{expanded ? "Hide why ▲" : "Why here? ▼"}</Text>}
        {expanded && (
          <View style={styles.reasoningBox}>
            {block.reasoning.map((line, i) => (
              <Text key={i} style={styles.reasoningLine}>
                • {line}
              </Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function TodayScreen({ onOpenBrainDump }: { onOpenBrainDump: () => void }) {
  const { signOut } = useAuth();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const result = buildDaySchedule({
    date: dateStr,
    fixedEvents: getSampleFixedEvents(today),
    dayStart: `${dateStr}T06:30:00`,
    dayEnd: `${dateStr}T22:00:00`,
    minBreakMinutes: 10,
    tasks: [...SAMPLE_TASKS].sort((a, b) => b.priorityScore - a.priorityScore),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Today's Plan</Text>
            <Text style={styles.subheading}>{dateStr}</Text>
          </View>
          <Text style={styles.signOut} onPress={signOut}>
            Sign out
          </Text>
        </View>

        {result.blocks.map((block) => (
          <BlockRow key={block.id} block={block} />
        ))}

        <View style={styles.brainDumpButton}>
          <Pressable style={styles.brainDumpButtonInner} onPress={onOpenBrainDump}>
            <Text style={styles.brainDumpButtonText}>+ Brain Dump</Text>
          </Pressable>
        </View>

        {result.deferred.length > 0 && (
          <View style={styles.deferredSection}>
            <Text style={styles.deferredHeading}>
              Deferred ({result.deferred.length}) — {Math.round(result.totalDeferredMinutes / 60 * 10) / 10}h didn't fit today
            </Text>
            {result.deferred.map((d) => (
              <View key={d.taskId} style={styles.deferredRow}>
                <Text style={styles.deferredTitle}>{d.title}</Text>
                <Text style={styles.deferredMeta}>
                  {d.estimatedMinutes} min · priority {d.priorityScore} · {d.reason}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 },
  heading: { fontSize: 26, fontWeight: "700" },
  subheading: { fontSize: 13, color: "#666", marginTop: 2 },
  signOut: { color: "#c00", fontSize: 13, marginTop: 4 },
  brainDumpButton: { marginTop: 16, alignItems: "center" },
  brainDumpButtonInner: { backgroundColor: "#111", borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28 },
  brainDumpButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  block: { borderWidth: 1, borderColor: "#e2e2e2", borderRadius: 10, padding: 12, marginBottom: 10, marginTop: 12 },
  blockFixed: { backgroundColor: "#f3f3f3", borderColor: "#ccc" },
  blockTime: { fontSize: 12, color: "#888" },
  blockLabel: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  blockType: { fontSize: 12, color: "#999", marginTop: 2, textTransform: "uppercase" },
  whyLink: { fontSize: 12, color: "#06c", marginTop: 8 },
  reasoningBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  reasoningLine: { fontSize: 12, color: "#555", marginBottom: 2 },
  deferredSection: { marginTop: 24, marginBottom: 32, padding: 12, backgroundColor: "#fff5f5", borderRadius: 10, borderWidth: 1, borderColor: "#f3caca" },
  deferredHeading: { fontSize: 14, fontWeight: "700", color: "#a33", marginBottom: 8 },
  deferredRow: { marginBottom: 6 },
  deferredTitle: { fontSize: 14, fontWeight: "600" },
  deferredMeta: { fontSize: 12, color: "#888" },
});

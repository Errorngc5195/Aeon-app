import type { BrainDumpResult, ExtractedTask, ExtractedTest, ExtractedUnavailablePeriod, ExtractedRecurringGoal } from "@jee/shared-types";
import { AIRouter } from "./router";
import { BRAIN_DUMP_RESPONSE_SCHEMA } from "./brainDumpSchema";

export class BrainDumpParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrainDumpParseError";
  }
}

const SYSTEM_INSTRUCTIONS = `You are a planning assistant that extracts structured study-planning
information from a student's freeform text. You do NOT create a schedule
or assign specific times — that is handled by a separate deterministic
system. You only extract:

- tasks (things to do: homework, revision, practice)
- unavailable time periods (when the student cannot study)
- tests (upcoming exams with dates)
- recurring goals (things to do every day/week)

Rules:
- Resolve relative dates ("Thursday", "tomorrow") to ISO 8601 dates using
  the current date provided.
- estimatedMinutes should be a realistic guess based on the described
  workload (e.g. "40 questions" might be ~90-120 minutes depending on
  subject/difficulty implied).
- If subject or topic can't be determined, leave it null rather than
  guessing incorrectly.
- confidence should reflect genuine uncertainty — lower it when the
  input is ambiguous.
- Do not invent tasks, deadlines, or events that were not stated or
  clearly implied.`;

// The ONE function that turns freeform user input into structured data.
// This is the boundary described in CONSTRAINTS.md: AI never emits
// ScheduleBlock[] here, only the extraction types in shared-types. The
// caller (app layer) is responsible for running the result through
// extractedTaskToCreateInput() / TaskRepository / planner-engine.
export async function parseBrainDump(
  router: AIRouter,
  rawInput: string,
  currentDateIso: string
): Promise<BrainDumpResult> {
  const prompt = `${SYSTEM_INSTRUCTIONS}\n\nCurrent date: ${currentDateIso}\n\nStudent's input:\n${rawInput}`;

  const result = await router.route({
    taskKind: "classify",
    prompt,
    requiredCapabilities: ["task_parsing", "structured_output"],
    requiredCapabilityLevel: 2,
    responseSchema: BRAIN_DUMP_RESPONSE_SCHEMA,
  });

  if (!result.response) {
    throw new BrainDumpParseError(
      `No AI provider available to parse brain dump. Attempted: ${result.attemptedProviderIds.join(", ") || "none"}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.response.text);
  } catch {
    throw new BrainDumpParseError("AI response was not valid JSON — cannot extract structured data");
  }

  return normalizeBrainDumpResult(parsed, rawInput, result.response.providerId);
}

// Defensive normalization — AI output is never fully trusted even when
// schema-constrained. Missing arrays become empty arrays rather than
// throwing, so a partial/odd response still produces something usable
// instead of failing the whole brain dump.
function normalizeBrainDumpResult(parsed: unknown, rawInput: string, providerId: string): BrainDumpResult {
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;

  return {
    tasks: Array.isArray(obj.tasks) ? (obj.tasks as ExtractedTask[]) : [],
    unavailablePeriods: Array.isArray(obj.unavailablePeriods)
      ? (obj.unavailablePeriods as ExtractedUnavailablePeriod[])
      : [],
    tests: Array.isArray(obj.tests) ? (obj.tests as ExtractedTest[]) : [],
    recurringGoals: Array.isArray(obj.recurringGoals) ? (obj.recurringGoals as ExtractedRecurringGoal[]) : [],
    rawInput,
    parsedAt: new Date().toISOString(),
    providerId,
  };
}

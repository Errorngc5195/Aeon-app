// JSON schema describing BrainDumpResult, passed to AIProvider.generate()
// via AIRequest.responseSchema so providers that support structured
// output (Gemini) return parseable JSON matching this shape directly.
// Kept here (not generated from TS types) since Gemini's schema dialect
// is a subset of JSON Schema and needs manual care — see
// https://ai.google.dev/gemini-api/docs/structured-output for the dialect.
export const BRAIN_DUMP_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          subject: { type: "string", enum: ["physics", "chemistry", "maths"], nullable: true },
          topicHint: { type: "string", nullable: true },
          type: {
            type: "string",
            enum: ["learning", "homework", "practice", "revision", "test_prep", "recovery"],
          },
          estimatedMinutes: { type: "integer" },
          deadline: { type: "string", nullable: true, description: "ISO 8601 date, resolved from relative phrases" },
          isOptional: { type: "boolean" },
          confidence: { type: "number", description: "0 to 1" },
        },
        required: ["title", "type", "estimatedMinutes", "isOptional", "confidence"],
      },
    },
    unavailablePeriods: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          startTime: { type: "string", description: "ISO 8601 datetime" },
          endTime: { type: "string", description: "ISO 8601 datetime" },
        },
        required: ["label", "startTime", "endTime"],
      },
    },
    tests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subject: { type: "string", enum: ["physics", "chemistry", "maths"], nullable: true },
          label: { type: "string" },
          date: { type: "string", description: "ISO 8601 date" },
          topicHints: { type: "array", items: { type: "string" } },
        },
        required: ["label", "date", "topicHints"],
      },
    },
    recurringGoals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          subject: { type: "string", enum: ["physics", "chemistry", "maths"], nullable: true },
          minutesPerOccurrence: { type: "integer" },
          frequency: { type: "string", enum: ["daily", "weekly"] },
        },
        required: ["label", "minutesPerOccurrence", "frequency"],
      },
    },
  },
  required: ["tasks", "unavailablePeriods", "tests", "recurringGoals"],
} as const;

// Shared types used across mobile app, planner-engine, ai-router, syllabus-graph.
// Keep this package dependency-free (no imports from other @jee/* packages)
// so it can be imported everywhere without circular refs.

export type Subject = "physics" | "chemistry" | "maths";

export type TaskType =
  | "learning"      // new concept, first exposure
  | "homework"      // assigned by coaching, has a deadline
  | "practice"      // extra questions, optional resource
  | "revision"      // spaced repetition / anti-forgetting
  | "test_prep"     // pre-test mode block
  | "recovery";     // break / rest, still schedulable

export type MasteryState =
  | "not_started"
  | "learning"
  | "practicing"
  | "weak"
  | "okay"
  | "strong"
  | "mastered";

export type MistakeType =
  | "concept_gap"
  | "formula_forgotten"
  | "calculation"
  | "misread_question"
  | "wrong_approach"
  | "time_pressure"
  | "guess";

export interface Task {
  id: string;
  subject: Subject;
  topicId: string;          // references SyllabusTopic.id
  type: TaskType;
  title: string;
  estimatedMinutes: number;
  deadline: string | null;  // ISO date, null = no hard deadline
  isOptional: boolean;      // e.g. Cengage-style "only if extra time"
  sourceDocId: string | null; // references uploaded PDF/module, if applicable
  createdAt: string;
  completedAt: string | null;
}

// Input shapes for creating/updating tasks — used by TaskRepository.
// Deliberately separate from Task: callers shouldn't be able to set id,
// createdAt, or completedAt directly on create.
export interface CreateTaskInput {
  subject: Subject;
  topicId: string;
  type: TaskType;
  title: string;
  estimatedMinutes: number;
  deadline: string | null;
  isOptional: boolean;
  sourceDocId: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  estimatedMinutes?: number;
  deadline?: string | null;
  isOptional?: boolean;
  topicId?: string;
  type?: TaskType;
}

export interface PriorityInputs {
  deadlineUrgency: number;   // 0-1, computed from days-to-deadline
  testProximity: number;     // 0-1, boosted if covers upcoming test syllabus
  academicImportance: number;// 0-1, weight of subject/topic in JEE
  weakness: number;          // 0-1, from MasteryState + recent accuracy
  forgettingRisk: number;    // 0-1, from spaced-repetition curve
  backlogAge: number;        // 0-1, normalized days since task created
}

export interface ScoredTask extends Task {
  priorityScore: number;     // final weighted score, 0-100
  priorityInputs: PriorityInputs;
}

export interface ScheduleBlock {
  id: string;
  taskId: string | null;     // null for fixed events like coaching/meals
  label: string;
  startTime: string;         // ISO datetime
  endTime: string;           // ISO datetime
  type: TaskType | "fixed_event";
  locked: boolean;           // true for coaching/school, planner won't move it
}

export interface DaySchedule {
  date: string;               // YYYY-MM-DD
  blocks: ScheduleBlock[];
  generatedAt: string;
  regeneratedReason: string | null; // e.g. "test announced", "went out 5-9pm"
}

// AI never emits ScheduleBlock[] directly. It emits intent; the
// deterministic planner-engine turns intent into actual time blocks.
// This is the boundary described in docs/decisions.md — keeps a bad/odd
// AI response from directly corrupting the schedule shape the app renders.
export interface PlanningIntent {
  taskId: string | null;      // existing task, or null if this creates a new one
  goal: string;                // e.g. "finish_physics_homework"
  priorityBoost: number;       // 0-1, added on top of computed priorityScore
  deadline: string | null;
  preferredSessionCount: number | null; // e.g. split into 4 sessions
  reasoning: string;           // human-readable, shown to user for transparency
}

export interface EnergyLog {
  timestamp: string;
  level: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

export interface QuestionAttempt {
  id: string;
  taskId: string | null;
  subject: Subject;
  topicId: string;
  difficulty: "easy" | "medium" | "hard" | "jee_main" | "jee_advanced";
  timeTakenSeconds: number;
  result: "solved" | "wrong" | "skipped" | "concept_gap" | "silly_mistake";
  mistakeType: MistakeType | null;
  attemptedAt: string;
}

export interface SyllabusTopic {
  id: string;
  subject: Subject;
  name: string;
  parentId: string | null;   // for nested topic trees
  masteryState: MasteryState;
  lastPracticedAt: string | null;
}

// ─── AI router types (frozen interface — see docs/decisions.md) ───────────
// Do not add provider-specific fields here. This contract must stay the
// same regardless of which providers exist behind it.

export type ModelCapabilityLevel = 0 | 1 | 2 | 3 | 4; // matches LEVEL 0-4 in architecture doc

// What a request actually needs, not which model to use. The router
// decides the "which model" part using this.
export type AICapability =
  | "task_parsing"        // brain-dump text -> structured tasks/events
  | "schedule_reasoning"  // priority nuance beyond deterministic scoring
  | "revision_planning"   // spaced repetition content selection
  | "question_selection"  // picking practice questions from library
  | "text_tutoring"       // "explain this", hint hierarchy
  | "math_reasoning"      // step-by-step problem solving
  | "physics_reasoning"
  | "vision"              // reading photographed question papers etc.
  | "long_context"        // large document / multi-file reasoning
  | "structured_output";  // reliable JSON output required

export interface AIRequest {
  taskKind: "classify" | "plan" | "revise" | "practice" | "tutor";
  prompt: string;
  requiredCapabilities: AICapability[];
  requiredCapabilityLevel: ModelCapabilityLevel; // minimum tier, capability-before-quota
  requiresVision?: boolean;
  maxLatencyMs?: number;
}

export interface AIResponse {
  text: string;
  providerId: string;
  modelId: string;
  latencyMs: number;
}

export interface ProviderHealth {
  available: boolean;
  consecutiveFailures: number;
  cooldownUntil: string | null; // ISO datetime, null if not in cooldown
  lastCheckedAt: string;
}

export interface QuotaState {
  requestsRemaining: number | null; // null = unknown/unmetered, don't assume a fixed number
  tokensRemaining: number | null;
  resetsAt: string | null;
}

// Full point-in-time state the router uses to rank providers. This is
// richer than a simple fallback chain on purpose — see docs/decisions.md
// "AI router: capability-first dynamic ranking, not fixed fallback order".
export interface ProviderState {
  providerId: string;
  modelId: string;
  capabilities: AICapability[];
  capabilityLevel: ModelCapabilityLevel;
  quota: QuotaState;
  health: ProviderHealth;
  lastUsedAt: string | null;
  latencyMsEma: number | null; // exponential moving average, for ranking
}

import type { ScoredTask } from "@jee/shared-types";
import type { FixedEvent } from "@jee/planner-engine";

export const SAMPLE_TASKS: ScoredTask[] = [
  {
    id: "t1",
    subject: "physics",
    topicId: "phy-kinematics-1d",
    type: "homework",
    title: "Physics: Non-uniform acceleration problems",
    estimatedMinutes: 60,
    deadline: null,
    isOptional: false,
    sourceDocId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    priorityScore: 88,
    priorityInputs: {
      deadlineUrgency: 0.8,
      testProximity: 0.6,
      academicImportance: 0.9,
      weakness: 0.5,
      forgettingRisk: 0.2,
      backlogAge: 0.3,
    },
  },
  {
    id: "t2",
    subject: "chemistry",
    topicId: "chem-redox",
    type: "revision",
    title: "Chemistry: Redox reactions revision",
    estimatedMinutes: 45,
    deadline: null,
    isOptional: false,
    sourceDocId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    priorityScore: 65,
    priorityInputs: {
      deadlineUrgency: 0.2,
      testProximity: 0.3,
      academicImportance: 0.7,
      weakness: 0.3,
      forgettingRisk: 0.6,
      backlogAge: 0.4,
    },
  },
  {
    id: "t3",
    subject: "maths",
    topicId: "math-integration",
    type: "practice",
    title: "Maths: Integration practice set",
    estimatedMinutes: 50,
    deadline: null,
    isOptional: true,
    sourceDocId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    priorityScore: 52,
    priorityInputs: {
      deadlineUrgency: 0.1,
      testProximity: 0.2,
      academicImportance: 0.6,
      weakness: 0.4,
      forgettingRisk: 0.3,
      backlogAge: 0.5,
    },
  },
];

export function getSampleFixedEvents(baseDate: Date): FixedEvent[] {
  const d = baseDate.toISOString().slice(0, 10);
  return [
    {
      label: "Coaching (Vidyalankar)",
      startTime: `${d}T08:00:00`,
      endTime: `${d}T13:00:00`,
    },
  ];
}
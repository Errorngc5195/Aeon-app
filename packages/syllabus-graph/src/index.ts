import type { Subject, SyllabusTopic } from "@jee/shared-types";
import physicsData from "../data/physics.json";
import chemistryData from "../data/chemistry.json";
import mathsData from "../data/maths.json";

// Static topic data ships without masteryState/lastPracticedAt — those are
// per-user and live in Supabase. This module merges static structure with
// live user data at query time.
type StaticTopic = Omit<SyllabusTopic, "masteryState" | "lastPracticedAt">;

const STATIC_TOPICS: Record<Subject, StaticTopic[]> = {
  physics: physicsData as StaticTopic[],
  chemistry: chemistryData as StaticTopic[],
  maths: mathsData as StaticTopic[],
};

export function getAllStaticTopics(): StaticTopic[] {
  return [...STATIC_TOPICS.physics, ...STATIC_TOPICS.chemistry, ...STATIC_TOPICS.maths];
}

export function getTopicsBySubject(subject: Subject): StaticTopic[] {
  return STATIC_TOPICS[subject];
}

export function getTopicById(id: string): StaticTopic | undefined {
  return getAllStaticTopics().find((t) => t.id === id);
}

export function getChildren(parentId: string): StaticTopic[] {
  return getAllStaticTopics().filter((t) => t.parentId === parentId);
}

export function getTopLevelTopics(subject: Subject): StaticTopic[] {
  return STATIC_TOPICS[subject].filter((t) => t.parentId === null);
}

// Merges static topic data with per-user mastery/practice data (fetched
// from Supabase by the caller) into full SyllabusTopic objects.
export function mergeWithUserData(
  staticTopics: StaticTopic[],
  userData: Map<string, { masteryState: SyllabusTopic["masteryState"]; lastPracticedAt: string | null }>
): SyllabusTopic[] {
  return staticTopics.map((t) => {
    const user = userData.get(t.id);
    return {
      ...t,
      masteryState: user?.masteryState ?? "not_started",
      lastPracticedAt: user?.lastPracticedAt ?? null,
    };
  });
}

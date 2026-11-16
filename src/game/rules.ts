import type { Mission, SupportLevel, System } from "../content/parse";
import { SKILLS, type SkillId } from "../content/skills";
import type { Completion, Experience, Profile, SaveData } from "./save";

export const SUPPORT_FOR_EXPERIENCE: Record<Experience, SupportLevel> = {
  new: "guided",
  tutorials: "standard",
  "small-programs": "challenge",
  experienced: "challenge",
};

export const SUPPORT_LABEL: Record<SupportLevel, string> = {
  guided: "Guided",
  standard: "Standard",
  challenge: "Challenge",
};

// The assessment unlocks hints only after this many submissions.
export const ASSESSMENT_HINT_THRESHOLD = 2;

// Players who say they can already program can open any mission, including
// the assessment, instead of working through material they already know.
export function canSkipAhead(profile: Profile | null): boolean {
  return profile?.experience === "small-programs" || profile?.experience === "experienced";
}

export function isRestored(save: SaveData, missionId: string): boolean {
  return (save.completions[missionId]?.length ?? 0) > 0;
}

// A finished mission stays open even if a mission added before it later
// hasn't been played yet.
export function isUnlocked(missions: Mission[], save: SaveData, index: number): boolean {
  if (index <= 0 || canSkipAhead(save.profile)) return true;
  return isRestored(save, missions[index].id) || isRestored(save, missions[index - 1].id);
}

export type SystemState = "online" | "underway" | "ready" | "locked";

export function systemProgress(missions: Mission[], system: System, save: SaveData) {
  const done = system.missions.filter((m) => isRestored(save, m.id)).length;
  const total = system.missions.length;
  const state: SystemState =
    done === total
      ? "online"
      : done > 0
        ? "underway"
        : isUnlocked(missions, save, missions.indexOf(system.missions[0]))
          ? "ready"
          : "locked";
  return { done, total, state };
}

// Where selecting a region takes you: its first open, unfinished mission, or
// its first mission once everything is done. Null while the region is locked.
export function regionEntry(missions: Mission[], region: string, save: SaveData): Mission | null {
  const inRegion = missions.filter((m) => m.region === region);
  const open = (m: Mission) => isUnlocked(missions, save, missions.indexOf(m));
  if (inRegion.length === 0 || !open(inRegion[0])) return null;
  return inRegion.find((m) => !isRestored(save, m.id) && open(m)) ?? inRegion[0];
}

// Where selecting a system takes you: its first open, unfinished mission, or
// its first mission once everything is done.
export function entryMission(missions: Mission[], system: System, save: SaveData): Mission {
  return (
    system.missions.find((m) => !isRestored(save, m.id) && isUnlocked(missions, save, missions.indexOf(m))) ??
    system.missions[0]
  );
}

// Support fades per skill. Onboarding sets the starting level; after that,
// a clean solve hands the next mission for that skill less scaffolding, and a
// struggle hands it more. Players can still fix one level for everything.

const SUPPORT_ORDER: SupportLevel[] = ["guided", "standard", "challenge"];
const lessSupport = (level: SupportLevel) => SUPPORT_ORDER[Math.min(SUPPORT_ORDER.indexOf(level) + 1, 2)];
export const moreSupport = (level: SupportLevel) => SUPPORT_ORDER[Math.max(SUPPORT_ORDER.indexOf(level) - 1, 0)];

// No hints and at most two submissions.
export const solvedCleanly = (c: Completion) => c.hintsUsed === 0 && c.submits <= 2;
// Two or more hints, or four or more submissions before passing.
export const struggled = (c: Completion) => c.hintsUsed >= 2 || c.submits >= 4;

// The failed submissions after which a mission offers a more complete start.
export const STUCK_SUBMITS = 3;

export interface SupportStep {
  missionId: string;
  to: SupportLevel;
  reason: "clean" | "struggle";
}

// Support is about how much code you're given to write, so only code
// missions move it: tracing a program cleanly says little about writing one.
export function skillSupport(catalog: Mission[], save: SaveData, skill: SkillId, except?: string) {
  const history = catalog
    .filter((m) => m.id !== except && m.kind === "code" && m.skills.includes(skill))
    .flatMap((m) => (save.completions[m.id] ?? []).filter((c) => !c.viaAssessment).map((c) => ({ missionId: m.id, c })))
    .sort((a, b) => a.c.at.localeCompare(b.c.at));

  let level: SupportLevel = save.profile?.support ?? "guided";
  let step: SupportStep | null = null;
  for (const { missionId, c } of history) {
    const reason = solvedCleanly(c) ? "clean" : struggled(c) ? "struggle" : null;
    const next = reason === "clean" ? lessSupport(level) : reason === "struggle" ? moreSupport(level) : level;
    if (reason && next !== level) step = { missionId, to: next, reason };
    level = next;
  }
  return { level, step };
}

export interface SupportChoice {
  level: SupportLevel;
  // Why this level: the mission type, a per-mission switch, the player's
  // fixed choice, or adaptation from their history.
  source: "assessment" | "maintenance" | "mission" | "fixed" | "adaptive";
  step: SupportStep | null;
}

export function supportChoice(mission: Mission, save: SaveData, catalog: Mission[]): SupportChoice {
  if (mission.assessment) return { level: "challenge", source: "assessment", step: null };
  if (mission.reviewSkill) return { level: "challenge", source: "maintenance", step: null };
  const pinned = save.missionSupport[mission.id];
  if (pinned) return { level: pinned, source: "mission", step: null };
  const fixed = save.profile?.fixedSupport;
  if (fixed) return { level: fixed, source: "fixed", step: null };

  // The most supportive level among the mission's skills, so a mission is
  // never harder to start than its least-practiced part. Its own past
  // completions don't count, so the level doesn't change under a replay.
  let choice: SupportChoice | null = null;
  for (const skill of mission.skills) {
    const { level, step } = skillSupport(catalog, save, skill, mission.id);
    if (!choice || SUPPORT_ORDER.indexOf(level) < SUPPORT_ORDER.indexOf(choice.level)) {
      choice = { level, source: "adaptive", step };
    }
  }
  return choice!;
}

// After several failed submissions, the level that would give this mission a
// more complete starting point, if there is one.
export function easierStart(mission: Mission, save: SaveData, choice: SupportChoice): SupportLevel | null {
  if (mission.kind !== "code" || mission.assessment || mission.reviewSkill || isRestored(save, mission.id)) return null;
  if ((save.submits[mission.id] ?? 0) < STUCK_SUBMITS) return null;
  const level = moreSupport(choice.level);
  return mission.starters[level] !== mission.starters[choice.level] ? level : null;
}

export function supportFor(mission: Mission, save: SaveData, catalog: Mission[]): SupportLevel {
  return supportChoice(mission, save, catalog).level;
}

export function codeFor(mission: Mission, save: SaveData, catalog: Mission[]): string {
  return save.drafts[mission.id] ?? mission.starters[supportFor(mission, save, catalog)];
}

// True when the mission uses a skill the player hasn't yet written code for
// in another mission, so its lesson should open by default. Predict missions
// don't count: the first time you write a binary search, you want the lesson
// even if you've traced one.
// Every mission brings one new idea, so its lesson starts open the first time
// through, unless the player is at Challenge. A collapsed lesson stays one
// click away, and the final mission's reference is always collapsed.
export function lessonStartsOpen(mission: Mission, save: SaveData, support: SupportLevel): boolean {
  if (mission.assessment) return false;
  return support === "guided" || (support === "standard" && !isRestored(save, mission.id));
}

export function hintsUnlocked(mission: Mission, save: SaveData): boolean {
  return !mission.assessment || (save.submits[mission.id] ?? 0) >= ASSESSMENT_HINT_THRESHOLD;
}

// The next mission worth playing after `from`: the first unlocked one that
// isn't restored yet, wrapping around to earlier gaps.
export function nextMission(missions: Mission[], save: SaveData, from: number): Mission | null {
  for (let step = 1; step <= missions.length; step++) {
    const index = (from + step) % missions.length;
    if (!isRestored(save, missions[index].id) && isUnlocked(missions, save, index)) return missions[index];
  }
  return null;
}

export type Evidence = "retained" | "demonstrated" | "practiced" | "untried";

// Independent means the player solved it without step-by-step code or hints.
export function isIndependent(completion: Completion): boolean {
  return !completion.viaAssessment && completion.support !== "guided" && completion.hintsUsed === 0 && (!completion.maintenance || completion.submits <= 2);
}

export interface SkillReport {
  id: SkillId;
  name: string;
  summary: string;
  evidence: Evidence;
  missions: Mission[];
}

export function skillReport(missions: Mission[], save: SaveData): SkillReport[] {
  return (Object.keys(SKILLS) as SkillId[]).map((id) => {
    const related = missions.filter((m) => m.skills.includes(id));
    const played = related.flatMap((m) => (save.completions[m.id] ?? []).filter((c) => !c.viaAssessment));
    const evidence: Evidence = save.reviews[id]?.retainedAt ? "retained" : played.some(isIndependent) ? "demonstrated" : played.length > 0 ? "practiced" : "untried";
    return { id, ...SKILLS[id], evidence, missions: related };
  });
}

import type { Mission } from "../content/parse";
import type { SkillId } from "../content/skills";
import type { Completion, SaveData } from "./save";

export const DAY = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVALS = [1, 3, 7, 21] as const;

export interface ReviewState {
  round: number;
  step: number;
  dueAt: string;
  active: boolean;
  missionId: string;
  independentAt?: string;
  retainedAt?: string;
}

export interface MaintenanceCall {
  skill: SkillId;
  mission: Mission;
  state: ReviewState;
}

const independent = (c: Completion) =>
  !c.viaAssessment && !c.solutionViewed && c.support !== "guided" && c.hintsUsed === 0;

// Old saves need no migration timestamp: the completed prerequisite supplies it.
// Merely opening the game never changes a due date.
export function maintenanceCalls(campaign: Mission[], reviews: Mission[], save: SaveData): MaintenanceCall[] {
  const skills = [...new Set(reviews.map((m) => m.reviewSkill!))];
  return skills.flatMap((skill) => {
    const variants = reviews.filter((m) => m.reviewSkill === skill);
    const prerequisite = variants[0].prerequisite!;
    const completed = save.completions[prerequisite]?.[0];
    if (!completed || !Number.isFinite(Date.parse(completed.at))) return [];
    const previous = save.reviews[skill];
    const evidence = campaign.filter((m) => m.skills.includes(skill))
      .flatMap((m) => save.completions[m.id] ?? []).filter(independent)
      .map((c) => c.at).sort().at(-1);
    const state: ReviewState = previous ?? {
      round: 0, step: 0, dueAt: new Date(Date.parse(completed.at) + DAY).toISOString(),
      active: false, missionId: variants[0].id, independentAt: evidence,
    };
    const mission = state.active
      ? variants.find((m) => m.id === state.missionId) ?? variants[state.round % variants.length]
      : variants[state.round % variants.length];
    return [{ skill, mission, state }];
  }).sort((a, b) => Date.parse(a.state.dueAt) - Date.parse(b.state.dueAt) || a.skill.localeCompare(b.skill));
}

export function finishReview(state: ReviewState, clean: boolean, now: string): ReviewState {
  const elapsed = state.independentAt ? Date.parse(now) - Date.parse(state.independentAt) : 0;
  const step = clean ? Math.min(state.step + 1, REVIEW_INTERVALS.length - 1) : 0;
  return {
    ...state,
    active: false,
    round: state.round + 1,
    step,
    dueAt: new Date(Date.parse(now) + REVIEW_INTERVALS[step] * DAY).toISOString(),
    independentAt: clean ? now : undefined,
    retainedAt: state.retainedAt ?? (clean && elapsed >= 7 * DAY ? now : undefined),
  };
}

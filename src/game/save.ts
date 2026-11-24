import { isConfidence } from "./confidence";
import { finishReview, type ReviewState } from "./maintenance";
import type { TrackId } from "../content/regions";
import type { SkillId } from "../content/skills";
import type { SupportLevel } from "../content/parse";

export type Experience = "new" | "tutorials" | "small-programs" | "experienced";
export type Background = "python" | "javascript" | "typescript" | "sql" | "other-language" | "terminal" | "git";
export type Confidence = "unsure" | "likely" | "certain";

export interface ConfidenceRecord {
  missionId: string;
  confidence: Confidence;
  passed: boolean;
  at: string;
}

export interface Profile {
  experience: Experience;
  background: Background[];
  // The starting level from onboarding; adaptive support fades from here.
  support: SupportLevel;
  // Optional per-track starting support so experienced learners in one language
  // still get open lessons in tracks they haven't used yet.
  trackSupport?: Partial<Record<TrackId, SupportLevel>>;
  // Set when the player fixes one level for every mission instead.
  fixedSupport?: SupportLevel;
}

export interface Completion {
  support: SupportLevel;
  hintsUsed: number;
  submits: number;
  at: string;
  // Restored as a side effect of passing the assessment, not played directly.
  viaAssessment: boolean;
  maintenance?: boolean;
  solutionViewed?: boolean;
}

export interface SaveData {
  version: 1;
  profile: Profile | null;
  currentMission: string | null;
  drafts: Record<string, string>;
  hintsRevealed: Record<string, number>;
  submits: Record<string, number>;
  completions: Record<string, Completion[]>;
  reviews: Partial<Record<SkillId, ReviewState>>;
  // Missions the player switched to a different support level while stuck.
  missionSupport: Record<string, SupportLevel>;
  // Missions where the learner opened the reference solution after getting stuck.
  solutionsViewed?: Record<string, boolean>;
  // Optional pre-submit confidence judgments recorded for self-calibration.
  confidenceLog: ConfidenceRecord[];
}

export type Action =
  | { type: "review-start"; skill: SkillId; missionId: string; state: ReviewState; now?: string }
  | { type: "review-submitted"; skill: SkillId; missionId: string; round: number; passed: boolean; confidence?: Confidence; now?: string }
  | { type: "start"; profile: Profile; missionId: string }
  | { type: "set-support"; support: SupportLevel | "adaptive" }
  | { type: "pin-support"; missionId: string; support: SupportLevel }
  | { type: "view-solution"; missionId: string }
  | { type: "open"; missionId: string }
  | { type: "edit"; missionId: string; code: string }
  | { type: "reset-code"; missionId: string }
  | { type: "reveal-hint"; missionId: string }
  | { type: "submitted"; missionId: string; passed: boolean; support: SupportLevel; alsoRestores: string[]; confidence?: Confidence; solutionViewed?: boolean; now?: string }
  | { type: "replay"; missionId: string }
  | { type: "change-profile" }
  | { type: "load"; save: SaveData }
  | { type: "erase" };

export function emptySave(): SaveData {
  return {
    version: 1,
    profile: null,
    currentMission: null,
    drafts: {},
    hintsRevealed: {},
    submits: {},
    completions: {},
    reviews: {},
    missionSupport: {},
    solutionsViewed: {},
    confidenceLog: [],
  };
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

export function reducer(save: SaveData, action: Action): SaveData {
  switch (action.type) {
    case "review-start": {
      const state = save.reviews[action.skill] ?? action.state;
      if (Date.parse(state.dueAt) > Date.parse(action.now ?? new Date().toISOString())) return save;
      if (state.active) return { ...save, currentMission: state.missionId };
      return {
        ...save, currentMission: action.missionId,
        reviews: { ...save.reviews, [action.skill]: { ...state, active: true, missionId: action.missionId } },
        drafts: without(save.drafts, action.missionId),
        hintsRevealed: without(save.hintsRevealed, action.missionId),
        submits: without(save.submits, action.missionId),
      };
    }
    case "review-submitted": {
      const state = save.reviews[action.skill];
      if (!state?.active || state.missionId !== action.missionId || state.round !== action.round) return save;
      const at = action.now ?? new Date().toISOString();
      const submits = (save.submits[action.missionId] ?? 0) + 1;
      const confidenceLog = action.confidence
        ? [...save.confidenceLog, { missionId: action.missionId, confidence: action.confidence, passed: action.passed, at }]
        : save.confidenceLog;
      const next = { ...save, submits: { ...save.submits, [action.missionId]: submits }, confidenceLog };
      if (!action.passed) return next;
      const hintsUsed = save.hintsRevealed[action.missionId] ?? 0;
      const clean = hintsUsed === 0 && submits <= 2;
      const completion: Completion = { at, hintsUsed, submits, support: "challenge", viaAssessment: false, maintenance: true };
      return {
        ...next,
        completions: { ...save.completions, [action.missionId]: [...(save.completions[action.missionId] ?? []), completion] },
        reviews: { ...save.reviews, [action.skill]: finishReview(state, clean, at) },
      };
    }
    case "start":
      return { ...save, profile: action.profile, currentMission: save.currentMission ?? action.missionId };
    case "set-support": {
      if (!save.profile) return save;
      const fixedSupport = action.support === "adaptive" ? undefined : action.support;
      return { ...save, profile: { ...save.profile, fixedSupport } };
    }
    case "pin-support":
      // Dropping the draft loads the new level's starter. The editor keeps
      // the replaced code in its undo history.
      return {
        ...save,
        missionSupport: { ...save.missionSupport, [action.missionId]: action.support },
        drafts: without(save.drafts, action.missionId),
      };
    case "view-solution":
      return {
        ...save,
        solutionsViewed: { ...(save.solutionsViewed ?? {}), [action.missionId]: true },
      };
    case "open":
      return { ...save, currentMission: action.missionId };
    case "edit":
      return { ...save, drafts: { ...save.drafts, [action.missionId]: action.code } };
    case "reset-code":
      return { ...save, drafts: without(save.drafts, action.missionId) };
    case "reveal-hint": {
      const revealed = (save.hintsRevealed[action.missionId] ?? 0) + 1;
      return { ...save, hintsRevealed: { ...save.hintsRevealed, [action.missionId]: revealed } };
    }
    case "submitted": {
      const { missionId, passed, support, alsoRestores, confidence, solutionViewed } = action;
      const at = action.now ?? new Date().toISOString();
      const submits = (save.submits[missionId] ?? 0) + 1;
      const confidenceLog = confidence
        ? [...save.confidenceLog, { missionId, confidence, passed, at }]
        : save.confidenceLog;
      const next = { ...save, submits: { ...save.submits, [missionId]: submits }, confidenceLog };
      if (!passed) return next;

      const hintsUsed = save.hintsRevealed[missionId] ?? 0;
      const usedSolution = Boolean(solutionViewed || save.solutionsViewed?.[missionId]);
      const completions = { ...save.completions };
      const completion: Completion = {
        support,
        hintsUsed,
        submits,
        at,
        viaAssessment: false,
        ...(usedSolution ? { solutionViewed: true } : {}),
      };
      completions[missionId] = [...(completions[missionId] ?? []), completion];
      for (const id of alsoRestores) {
        if (!completions[id]?.length) completions[id] = [{ support, hintsUsed: 0, submits: 0, at, viaAssessment: true }];
      }
      return { ...next, completions };
    }
    case "replay":
      return {
        ...save,
        drafts: without(save.drafts, action.missionId),
        hintsRevealed: without(save.hintsRevealed, action.missionId),
        submits: without(save.submits, action.missionId),
        missionSupport: without(save.missionSupport, action.missionId),
        solutionsViewed: without(save.solutionsViewed ?? {}, action.missionId),
      };
    case "change-profile":
      return { ...save, profile: null };
    case "load":
      return action.save;
    case "erase":
      return emptySave();
  }
}

const STORAGE_KEY = "outpost.save";

export function parseSave(raw: string): SaveData | null {
  try {
    const data = JSON.parse(raw) as Partial<SaveData> | null;
    if (!data || data.version !== 1) return null;
    for (const key of ["drafts", "hintsRevealed", "submits", "completions"] as const) {
      if (typeof data[key] !== "object" || data[key] === null) return null;
    }
    if (data.missionSupport !== undefined && (typeof data.missionSupport !== "object" || data.missionSupport === null || Array.isArray(data.missionSupport))) {
      return null;
    }
    if (data.solutionsViewed !== undefined) {
      if (typeof data.solutionsViewed !== "object" || data.solutionsViewed === null || Array.isArray(data.solutionsViewed)) {
        return null;
      }
      for (const value of Object.values(data.solutionsViewed)) {
        if (typeof value !== "boolean") return null;
      }
    }
    if (data.profile?.trackSupport !== undefined) {
      const ts = data.profile.trackSupport;
      if (!ts || typeof ts !== "object" || Array.isArray(ts)) return null;
      for (const [track, level] of Object.entries(ts)) {
        if (!["python", "javascript", "typescript", "sql"].includes(track)) return null;
        if (level !== "guided" && level !== "standard" && level !== "challenge") return null;
      }
    }
    if (data.reviews !== undefined) {
      if (!data.reviews || typeof data.reviews !== "object" || Array.isArray(data.reviews)) return null;
      for (const state of Object.values(data.reviews)) {
        if (!state || !Number.isInteger(state.round) || state.round < 0 ||
            !Number.isInteger(state.step) || state.step < 0 || state.step > 3 ||
            typeof state.active !== "boolean" || typeof state.missionId !== "string" ||
            !Number.isFinite(Date.parse(state.dueAt)) ||
            (state.independentAt !== undefined && !Number.isFinite(Date.parse(state.independentAt))) ||
            (state.retainedAt !== undefined && !Number.isFinite(Date.parse(state.retainedAt)))) return null;
      }
    }
    if (data.confidenceLog !== undefined) {
      if (!Array.isArray(data.confidenceLog)) return null;
      for (const entry of data.confidenceLog) {
        if (
          !entry ||
          typeof entry !== "object" ||
          typeof entry.missionId !== "string" ||
          !isConfidence(entry.confidence) ||
          typeof entry.passed !== "boolean" ||
          !Number.isFinite(Date.parse(entry.at))
        ) {
          return null;
        }
      }
    }
    return { ...emptySave(), ...data } as SaveData;
  } catch {
    return null;
  }
}

// Storage can be unavailable (private windows, blocked site data). The game
// still works; progress just won't survive a reload.
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseSave(raw) ?? emptySave();
  } catch {
    // fall through
  }
  return emptySave();
}

export function storeSave(save: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // see loadSave
  }
}

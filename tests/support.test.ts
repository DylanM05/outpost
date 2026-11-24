import { expect, test } from "vitest";
import { allMissions, missions, reviewMissions } from "../src/content";
import type { SupportLevel } from "../src/content/parse";
import { DAY, maintenanceCalls } from "../src/game/maintenance";
import {
  canViewSolution,
  codeFor,
  easierStart,
  isIndependent,
  isUnlocked,
  lessonStartsOpen,
  skillSupport,
  solvedCleanly,
  starterChangesAtLevel,
  STUCK_SUBMITS,
  supportChoice,
} from "../src/game/rules";
import { emptySave, parseSave, reducer, type Completion, type SaveData } from "../src/game/save";

const byId = (id: string) => allMissions.find((m) => m.id === id)!;

let clock = 0;
function done(overrides: Partial<Completion> = {}): Completion {
  clock += 1;
  return {
    support: "guided",
    hintsUsed: 0,
    submits: 1,
    at: new Date(Date.UTC(2026, 0, 1, 0, clock)).toISOString(),
    viaAssessment: false,
    ...overrides,
  };
}

function player(support: SupportLevel, completions: Record<string, Completion[]> = {}): SaveData {
  return { ...emptySave(), profile: { experience: "new", background: [], support }, completions };
}

test("a skill with no history starts at the onboarding level", () => {
  expect(supportChoice(byId("restore-power"), player("guided"), allMissions)).toMatchObject({
    level: "guided",
    source: "adaptive",
    step: null,
  });
  expect(supportChoice(byId("restore-power"), player("standard"), allMissions).level).toBe("standard");
});

test("a clean solve gives the next mission for that skill less support, one level at a time", () => {
  const once = player("guided", { "restore-power": [done()] });
  expect(supportChoice(byId("charge-the-cells"), once, allMissions)).toMatchObject({
    level: "standard",
    step: { missionId: "restore-power", reason: "clean", to: "standard" },
  });

  const twice = player("guided", { "restore-power": [done()], "charge-the-cells": [done()] });
  expect(skillSupport(allMissions, twice, "functions").level).toBe("challenge");
});

test("predict missions don't move support", () => {
  const save = player("standard", { "halve-the-search": [done()] });
  expect(supportChoice(byId("search-the-archive"), save, allMissions)).toMatchObject({ level: "standard", step: null });
});

test("the lesson starts open at Standard until the mission is done, and closed at Challenge", () => {
  const fresh = player("standard");
  expect(lessonStartsOpen(byId("find-the-jumps"), fresh, "guided")).toBe(true);
  expect(lessonStartsOpen(byId("find-the-jumps"), fresh, "standard")).toBe(true);
  expect(lessonStartsOpen(byId("find-the-jumps"), fresh, "challenge")).toBe(false);

  const replay = player("standard", { "find-the-jumps": [done()] });
  expect(lessonStartsOpen(byId("find-the-jumps"), replay, "standard")).toBe(false);
  expect(lessonStartsOpen(byId("find-the-jumps"), replay, "guided")).toBe(true);
  expect(lessonStartsOpen(missions.find((m) => m.assessment)!, fresh, "guided")).toBe(false);
});

test("a finished mission stays open when a new mission is added before it", () => {
  const save = player("standard", { "build-the-manifest": [done()], "find-the-crate": [done()] });
  const index = (id: string) => missions.findIndex((m) => m.id === id);
  expect(isUnlocked(missions, save, index("number-the-bays"))).toBe(true);
  expect(isUnlocked(missions, save, index("find-the-crate"))).toBe(true);
  expect(isUnlocked(missions, save, index("pump-the-reservoir"))).toBe(true);
  expect(isUnlocked(missions, save, index("read-the-flow-log"))).toBe(false);
});

test("adaptation stays within the skill", () => {
  const save = player("guided", { "restore-power": [done()] });
  expect(supportChoice(byId("route-power"), save, allMissions).level).toBe("guided");
});

test("a struggle gives the next mission more support", () => {
  const hinted = player("challenge", { "restore-power": [done({ support: "challenge", hintsUsed: 2 })] });
  expect(supportChoice(byId("charge-the-cells"), hinted, allMissions)).toMatchObject({
    level: "standard",
    step: { reason: "struggle" },
  });

  const retried = player("standard", { "restore-power": [done({ support: "standard", submits: 4 })] });
  expect(supportChoice(byId("charge-the-cells"), retried, allMissions).level).toBe("guided");
});

test("a solve that was neither clean nor a struggle leaves the level alone", () => {
  const save = player("standard", { "restore-power": [done({ support: "standard", submits: 3 })] });
  expect(supportChoice(byId("charge-the-cells"), save, allMissions)).toMatchObject({ level: "standard", step: null });
});

test("missions restored by the final mission don't count as evidence either way", () => {
  const save = player("guided", { "restore-power": [done({ viaAssessment: true, submits: 0 })] });
  expect(supportChoice(byId("charge-the-cells"), save, allMissions).level).toBe("guided");
});

test("a mission's own completions don't change its level, so replays start where they did", () => {
  const save = player("guided", { "restore-power": [done()] });
  expect(supportChoice(byId("restore-power"), save, allMissions).level).toBe("guided");
});

test("a mission with several skills uses the most supportive of them", () => {
  // Bring it home practices loops, lists, and decisions; only decisions has moved.
  const save = player("guided", { "route-power": [done()], "safety-interlocks": [done()] });
  expect(skillSupport(allMissions, save, "conditionals").level).toBe("challenge");
  expect(supportChoice(byId("bring-it-home"), save, allMissions).level).toBe("guided");
});

test("a fixed level overrides adaptation, and a per-mission switch overrides both", () => {
  let save = player("guided", { "restore-power": [done()] });
  save = reducer(save, { type: "set-support", support: "challenge" });
  expect(supportChoice(byId("charge-the-cells"), save, allMissions)).toMatchObject({ level: "challenge", source: "fixed" });

  save = reducer(save, { type: "pin-support", missionId: "charge-the-cells", support: "standard" });
  expect(supportChoice(byId("charge-the-cells"), save, allMissions)).toMatchObject({ level: "standard", source: "mission" });

  save = reducer(save, { type: "set-support", support: "adaptive" });
  expect(save.profile?.fixedSupport).toBeUndefined();
  expect(save.profile?.support).toBe("guided");
});

test("the final mission and maintenance calls are always Challenge", () => {
  const save = player("guided");
  const assessment = missions.find((m) => m.assessment)!;
  expect(supportChoice(assessment, save, allMissions)).toMatchObject({ level: "challenge", source: "assessment" });
  const review = allMissions.find((m) => m.reviewSkill)!;
  expect(supportChoice(review, save, allMissions)).toMatchObject({ level: "challenge", source: "maintenance" });
});

test("switching a stuck mission's support loads the new starter, and replaying clears the switch", () => {
  let save = player("standard");
  save = reducer(save, { type: "edit", missionId: "charge-the-cells", code: "my attempt" });
  save = reducer(save, { type: "pin-support", missionId: "charge-the-cells", support: "guided" });
  expect(codeFor(byId("charge-the-cells"), save, allMissions)).toBe(byId("charge-the-cells").starters.guided);

  save = reducer(save, { type: "replay", missionId: "charge-the-cells" });
  expect(save.missionSupport).toEqual({});
});

test("a more complete start is offered only after several failed submissions, and only when one exists", () => {
  const mission = byId("charge-the-cells");
  let save = player("standard");
  const choice = () => supportChoice(mission, save, allMissions);
  for (let i = 0; i < 2; i++) save = reducer(save, { type: "submitted", missionId: mission.id, passed: false, support: "standard", alsoRestores: [] });
  expect(easierStart(mission, save, choice())).toBeNull();
  save = reducer(save, { type: "submitted", missionId: mission.id, passed: false, support: "standard", alsoRestores: [] });
  expect(easierStart(mission, save, choice())).toBe("guided");

  // Debugging missions share one starter across levels, so switching wouldn't help.
  const shared = { ...player("standard"), submits: { "first-fault": 5 } };
  expect(easierStart(byId("first-fault"), shared, supportChoice(byId("first-fault"), shared, allMissions))).toBeNull();

  // Guided is already the most complete start.
  const guided = { ...player("guided"), submits: { [mission.id]: 5 } };
  expect(easierStart(mission, guided, supportChoice(mission, guided, allMissions))).toBeNull();
});

test("saves from before adaptive support load with an empty switch list", () => {
  const { missionSupport: _, ...old } = player("standard");
  const loaded = parseSave(JSON.stringify(old))!;
  expect(loaded.missionSupport).toEqual({});
  expect(supportChoice(byId("restore-power"), loaded, allMissions).level).toBe("standard");
});

test("trackSupport sets per-track starting levels without overriding unrelated tracks and respects mission track for shared skills", () => {
  const save: SaveData = {
    ...emptySave(),
    profile: {
      experience: "experienced",
      background: ["python"],
      support: "challenge",
      trackSupport: { python: "challenge", javascript: "standard", typescript: "standard", sql: "standard" },
    },
  };
  const jsMission = missions.find((m) => m.region === "act25" && m.kind === "code")!;
  const sqlMission = missions.find((m) => m.region === "act28" && m.kind === "code")!;
  expect(supportChoice(byId("restore-power"), save, allMissions).level).toBe("challenge");
  expect(supportChoice(jsMission, save, allMissions).level).toBe("standard");
  expect(supportChoice(sqlMission, save, allMissions).level).toBe("standard");

  // Shared skill ("reading-code") on a JS mission should use JS trackSupport, not Python's.
  const jsShared = { ...jsMission, skills: ["reading-code" as const] };
  const jsExperiencedSave: SaveData = {
    ...emptySave(),
    profile: {
      experience: "experienced",
      background: ["javascript"],
      support: "challenge",
      trackSupport: { python: "standard", javascript: "challenge", typescript: "standard", sql: "standard" },
    },
  };
  expect(supportChoice(jsShared, jsExperiencedSave, allMissions).level).toBe("challenge");
});

test("parseSave validates and round-trips solutionsViewed and trackSupport", () => {
  const save: SaveData = {
    ...emptySave(),
    profile: {
      experience: "experienced",
      background: ["javascript"],
      support: "challenge",
      trackSupport: { python: "standard", javascript: "challenge", typescript: "standard", sql: "standard" },
    },
    solutionsViewed: { "charge-the-cells": true },
  };
  const parsed = parseSave(JSON.stringify(save));
  expect(parsed?.profile?.trackSupport).toEqual(save.profile?.trackSupport);
  expect(parsed?.solutionsViewed).toEqual({ "charge-the-cells": true });

  expect(parseSave(JSON.stringify({ ...save, solutionsViewed: { x: "yes" } }))).toBeNull();
  expect(
    parseSave(JSON.stringify({ ...save, profile: { ...save.profile, trackSupport: { python: "expert" } } })),
  ).toBeNull();
  expect(
    parseSave(JSON.stringify({ ...save, profile: { ...save.profile, trackSupport: [] } })),
  ).toBeNull();
});

test("reference solution unlocks only after retries and hints, excludes assessments, marks completion as practice, and blocks maintenance independentAt", () => {
  const mission = byId("charge-the-cells");
  const assessment = missions.find((m) => m.assessment)!;
  let save = player("standard");
  expect(canViewSolution(mission, save)).toBe(false);

  for (let i = 0; i < STUCK_SUBMITS; i++) {
    save = reducer(save, { type: "submitted", missionId: mission.id, passed: false, support: "standard", alsoRestores: [] });
    save = reducer(save, { type: "submitted", missionId: assessment.id, passed: false, support: "challenge", alsoRestores: [] });
  }
  for (let i = 0; i < assessment.hints.length; i++) {
    save = reducer(save, { type: "reveal-hint", missionId: assessment.id });
  }
  expect(canViewSolution(assessment, save)).toBe(false);
  expect(canViewSolution(mission, save)).toBe(false);

  for (let i = 0; i < mission.hints.length; i++) {
    save = reducer(save, { type: "reveal-hint", missionId: mission.id });
  }
  expect(canViewSolution(mission, save)).toBe(true);

  save = reducer(save, { type: "view-solution", missionId: mission.id });
  expect(save.solutionsViewed?.[mission.id]).toBe(true);

  // Even without action.solutionViewed, reducer reads save.solutionsViewed[missionId]
  save = reducer(save, {
    type: "submitted",
    missionId: mission.id,
    passed: true,
    support: "standard",
    alsoRestores: [],
    now: new Date(Date.now() - 2 * DAY).toISOString(),
  });
  const completion = save.completions[mission.id]?.at(-1)!;
  expect(completion.solutionViewed).toBe(true);
  expect(isIndependent(completion)).toBe(false);
  expect(solvedCleanly(completion)).toBe(false);

  const prereqCall = maintenanceCalls(missions, reviewMissions, {
    ...emptySave(),
    profile: { experience: "new", background: [], support: "standard" },
    completions: {
      "restore-power": [{ support: "standard", hintsUsed: 0, submits: 1, at: completion.at, viaAssessment: false, solutionViewed: true }],
    },
  })[0];
  expect(prereqCall?.state.independentAt).toBeUndefined();

  expect(starterChangesAtLevel(byId("charge-the-cells"), "standard", "guided")).toBe(true);
  expect(starterChangesAtLevel(byId("first-fault"), "standard", "guided")).toBe(false);

  save = reducer(save, { type: "replay", missionId: mission.id });
  expect(save.solutionsViewed?.[mission.id]).toBeUndefined();
});

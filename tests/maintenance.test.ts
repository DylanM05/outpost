import { describe, expect, test } from "vitest";
import { allMissions, missions, reviewMissions } from "../src/content";
import { DAY, maintenanceCalls } from "../src/game/maintenance";
import { skillReport } from "../src/game/rules";
import { emptySave, parseSave, reducer, type Completion, type SaveData } from "../src/game/save";

const epoch = Date.parse("2026-01-01T12:00:00Z");
const at = (day: number) => new Date(epoch + day * DAY).toISOString();
const completion = (day = 0): Completion => ({ at: at(day), support: "standard", hintsUsed: 0, submits: 1, viaAssessment: false });
function learned(): SaveData {
  return { ...emptySave(), completions: { "restore-power": [completion()] } };
}
function call(save: SaveData) {
  return maintenanceCalls(missions, reviewMissions, save).find((c) => c.skill === "functions")!;
}
function start(save: SaveData, day: number) {
  const c = call(save);
  return reducer(save, { type: "review-start", skill: c.skill, missionId: c.mission.id, state: c.state, now: at(day) });
}
function submit(save: SaveData, day: number, passed = true) {
  const state = save.reviews.functions!;
  return reducer(save, { type: "review-submitted", skill: "functions", missionId: state.missionId, round: state.round, passed, now: at(day) });
}

test("no reviews before the prerequisite; first review is due exactly a day later", () => {
  expect(maintenanceCalls(missions, reviewMissions, emptySave())).toEqual([]);
  const save = learned();
  expect(call(save).state.dueAt).toBe(at(1));
  expect(start(save, 0.99)).toEqual(save);
  expect(start(save, 1).reviews.functions?.active).toBe(true);
});

test("old version 1 backups preserve progress and derive stable due dates", () => {
  const { reviews: _, ...old } = learned();
  const loaded = parseSave(JSON.stringify(old))!;
  expect(loaded.reviews).toEqual({});
  expect(loaded.completions).toEqual(old.completions);
  expect(call(loaded).state.dueAt).toBe(at(1));
  expect(call(parseSave(JSON.stringify(loaded))!).state.dueAt).toBe(at(1));
});

test("assessment-restored prerequisites unlock reviews without manufacturing skill evidence", () => {
  const save = learned();
  save.completions["restore-power"][0].viaAssessment = true;
  expect(call(save).state.independentAt).toBeUndefined();
  expect(skillReport(allMissions, save).find((s) => s.id === "functions")?.evidence).toBe("untried");
});

test("resume and backup restore preserve code, hints, submissions and the selected variant", () => {
  let save = start(learned(), 1);
  const id = save.currentMission!;
  save = reducer(save, { type: "edit", missionId: id, code: "working draft" });
  save = reducer(save, { type: "reveal-hint", missionId: id });
  save = submit(save, 1, false);
  const loaded = parseSave(JSON.stringify(save))!;
  expect(start(loaded, 2)).toEqual(loaded);
  expect(loaded.drafts[id]).toBe("working draft");
  expect(loaded.hintsRevealed[id]).toBe(1);
  expect(loaded.submits[id]).toBe(1);
});

test("independent reviews rotate tasks, space returns, and eventually establish retention", () => {
  let save = learned();
  const ids: string[] = [];
  for (const [day, nextDay] of [[1, 4], [4, 11], [11, 32], [32, 53]]) {
    save = start(save, day);
    ids.push(save.currentMission!);
    save = submit(save, day);
    expect(save.reviews.functions?.dueAt).toBe(at(nextDay));
    expect(save.reviews.functions?.active).toBe(false);
    expect(save.reviews.functions?.retainedAt).toBe(day < 11 ? undefined : at(11));
  }
  expect(new Set(ids.slice(0, 3)).size).toBe(3);
  expect(ids[3]).toBe(ids[0]);
  expect(save.submits[ids[3]]).toBe(1); // a new round clears previous attempt counters
  expect(save.completions["restore-power"]).toEqual([completion()]);
  expect(skillReport(allMissions, save).find((s) => s.id === "functions")?.evidence).toBe("retained");
});

test("duplicate and stale submissions cannot advance a review or farm evidence", () => {
  const active = start(learned(), 1);
  const done = submit(active, 1);
  expect(submit(done, 1)).toEqual(done);
  expect(start(done, 2)).toEqual(done);
  const next = start(done, 4);
  expect(reducer(next, { type: "review-submitted", skill: "functions", missionId: active.currentMission!, round: 0, passed: true, now: at(4) })).toEqual(next);
});

describe.each(["hint", "retries"] as const)("struggle through %s", (kind) => {
  test("brings a fresh review back in one day and does not claim retention", () => {
    let save = start(learned(), 8);
    if (kind === "hint") save = reducer(save, { type: "reveal-hint", missionId: save.currentMission! });
    else { save = submit(save, 8, false); save = submit(save, 8, false); }
    save = submit(save, 8);
    expect(save.reviews.functions?.dueAt).toBe(at(9));
    expect(save.reviews.functions?.retainedAt).toBeUndefined();
    expect(save.reviews.functions?.independentAt).toBeUndefined();
    expect(call(save).mission.id).not.toBe(save.currentMission);
  });
});

test("guided campaign plus a heavily retried call is practice, not demonstration", () => {
  let save = learned();
  save.completions["restore-power"][0].support = "guided";
  save = start(save, 1);
  save = submit(submit(save, 1, false), 1, false);
  save = submit(save, 1);
  expect(skillReport(allMissions, save).find((s) => s.id === "functions")?.evidence).toBe("practiced");
});

test("an overdue review schedules from actual completion, with no catch-up backlog", () => {
  const save = submit(start(learned(), 60), 60);
  expect(save.reviews.functions?.dueAt).toBe(at(63));
  expect(maintenanceCalls(missions, reviewMissions, save)).toHaveLength(1);
});

test("different skills have independent schedules and are queued oldest first", () => {
  const save = learned();
  save.completions["safety-interlocks"] = [completion(2)];
  const calls = maintenanceCalls(missions, reviewMissions, save);
  expect(calls.map((c) => c.skill)).toEqual(["functions", "conditionals"]);
  expect(calls.map((c) => c.state.dueAt)).toEqual([at(1), at(3)]);
});

test("malformed review state is rejected rather than breaking the queue", () => {
  const save = start(learned(), 1);
  for (const patch of [{ dueAt: "bad" }, { round: -1 }, { step: 7 }, { active: "yes" }, { retainedAt: "bad" }]) {
    expect(parseSave(JSON.stringify({ ...save, reviews: { functions: { ...save.reviews.functions, ...patch } } }))).toBeNull();
  }
});

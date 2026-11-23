import { expect, test } from "vitest";
import { missions } from "../src/content";
import { REGIONS, regionsInTrack } from "../src/content/regions";
import { isUnlocked, nextMission, regionEntry, trackEntry } from "../src/game/rules";
import { emptySave, reducer, type Completion, type SaveData } from "../src/game/save";

const [ridge, survey] = REGIONS.map((r) => r.id);
const done = (): Completion[] => [{ support: "standard", hintsUsed: 0, submits: 1, at: "2026-01-01T00:00:00Z", viaAssessment: false }];

function player(experience: "new" | "experienced", completed: string[] = []): SaveData {
  return {
    ...emptySave(),
    profile: { experience, background: [], support: "standard" },
    completions: Object.fromEntries(completed.map((id) => [id, done()])),
  };
}

test("the survey office opens for beginners once Kestrel Ridge's final mission is done", () => {
  const firstSurvey = missions.find((m) => m.region === survey)!;
  const ridgeMissions = missions.filter((m) => m.region === ridge);

  expect(regionEntry(missions, survey, player("new"))).toBeNull();
  expect(regionEntry(missions, survey, player("new", ridgeMissions.slice(0, -1).map((m) => m.id)))).toBeNull();
  expect(regionEntry(missions, survey, player("new", ridgeMissions.map((m) => m.id)))).toBe(firstSurvey);
});

test("experienced players can open every region from the start", () => {
  expect(regionEntry(missions, survey, player("experienced"))?.region).toBe(survey);
});

test("a region's entry is its first unfinished mission", () => {
  const ridgeMissions = missions.filter((m) => m.region === ridge);
  expect(regionEntry(missions, ridge, player("new", [ridgeMissions[0].id]))).toBe(ridgeMissions[1]);
});

test("passing Kestrel Ridge's final mission doesn't restore the survey office", () => {
  const assessment = missions.find((m) => m.assessment && m.region === ridge)!;
  const alsoRestores = missions.filter((m) => m !== assessment && m.region === assessment.region).map((m) => m.id);
  const save = reducer(player("experienced"), {
    type: "submitted",
    missionId: assessment.id,
    passed: true,
    support: "challenge",
    alsoRestores,
  });
  const surveyMissions = missions.filter((m) => m.region === survey);
  expect(surveyMissions.some((m) => save.completions[m.id])).toBe(false);
  expect(isUnlocked(missions, { ...save, profile: { ...save.profile!, experience: "new" } }, missions.indexOf(surveyMissions[0]))).toBe(true);
});

test("Python, JavaScript, and SQL tracks all start unlocked from day one for beginners", () => {
  const beginner = player("new");
  const jsFirstRegion = regionsInTrack("javascript")[0];
  const jsFirstMission = missions.find((m) => m.region === jsFirstRegion.id)!;
  const sqlFirstRegion = regionsInTrack("sql")[0];
  const sqlFirstMission = missions.find((m) => m.region === sqlFirstRegion.id)!;

  expect(regionEntry(missions, ridge, beginner)?.region).toBe(ridge);
  expect(regionEntry(missions, jsFirstRegion.id, beginner)).toBe(jsFirstMission);
  expect(trackEntry(missions, "javascript", beginner)).toBe(jsFirstMission);
  expect(regionEntry(missions, sqlFirstRegion.id, beginner)).toBe(sqlFirstMission);
  expect(trackEntry(missions, "sql", beginner)).toBe(sqlFirstMission);
  // Second mission within JS and SQL still requires completing the first mission in that track.
  expect(isUnlocked(missions, beginner, missions.indexOf(jsFirstMission) + 1)).toBe(false);
  expect(isUnlocked(missions, beginner, missions.indexOf(sqlFirstMission) + 1)).toBe(false);
});

test("nextMission stays within the current track instead of jumping across languages", () => {
  const pythonRegions = regionsInTrack("python");
  const pythonMissions = missions.filter((m) => pythonRegions.some((r) => r.id === m.region));
  const allPythonDone = player("new", pythonMissions.map((m) => m.id));
  const lastPythonIdx = missions.indexOf(pythonMissions.at(-1)!);
  expect(nextMission(missions, allPythonDone, lastPythonIdx)).toBeNull();
});

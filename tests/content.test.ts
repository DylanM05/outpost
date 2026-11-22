// Runs every mission's reference solution and starter code through the real
// harness, so a broken mission fails here instead of in front of a player.
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, test } from "vitest";
import { allMissions, missions, reviewMissions, systems, systemsIn } from "../src/content";
import { SUPPORT_LEVELS, type Language } from "../src/content/parse";
import { REGIONS } from "../src/content/regions";
import { comparePrediction, outputLines } from "../src/game/predict";
import { runJsMission } from "../src/js/harness";
import { HARNESS_PY, passedAll, type RunResult } from "../src/python/harness";

let pyodide: PyodideInterface;

beforeAll(async () => {
  pyodide = await loadPyodide();
  pyodide.runPython(HARNESS_PY);
});

async function run(language: Language, code: string, checks: string, hidden = ""): Promise<RunResult> {
  if (language === "javascript") {
    return runJsMission(code, checks, hidden);
  }
  const runMission = pyodide.globals.get("run_mission");
  try {
    return JSON.parse(runMission(code, checks, hidden)) as RunResult;
  } finally {
    runMission.destroy();
  }
}

test("mission ids are unique", () => {
  expect(new Set(allMissions.map((m) => m.id)).size).toBe(allMissions.length);
});

// A region still being written may not have its final mission yet.
test.each(REGIONS.map((r) => r.id))("%s has at most one assessment: its last mission, in a system of its own", (region) => {
  const inRegion = missions.filter((m) => m.region === region);
  expect(inRegion.length).toBeGreaterThan(0);
  const assessments = inRegion.filter((m) => m.assessment);
  expect(assessments.length).toBeLessThanOrEqual(1);
  if (assessments.length === 1) {
    expect(assessments[0]).toBe(inRegion.at(-1));
    expect(systemsIn(region).at(-1)!.missions).toEqual([inRegion.at(-1)]);
  }
});

test("Kestrel Ridge ends with its assessment", () => {
  expect(missions.filter((m) => m.region === REGIONS[0].id).at(-1)!.assessment).toBe(true);
});

test("systems don't span regions", () => {
  for (const system of systems) expect(new Set(system.missions.map((m) => m.region))).toEqual(new Set([system.region]));
});

test("every system has a distinct name", () => {
  expect(new Set(systems.map((s) => s.name)).size).toBe(systems.length);
});

const codeMissions = allMissions.filter((m) => m.kind === "code");
const predictMissions = missions.filter((m) => m.kind === "predict");

describe.each(codeMissions)("$id", (mission) => {
  test("the reference solution passes every check, including hidden ones", async () => {
    const result = await run(mission.language, mission.solution, mission.checks, mission.hiddenChecks);
    expect(result.error).toBeNull();
    expect(result.checks.filter((c) => !c.passed)).toEqual([]);
    expect(passedAll(result)).toBe(true);
  });

  test.each(SUPPORT_LEVELS)("the %s starter code doesn't already pass", async (level) => {
    const result = await run(mission.language, mission.starters[level], mission.checks, mission.hiddenChecks);
    expect(passedAll(result)).toBe(false);
  });

  test("hidden checks are marked hidden", async () => {
    const result = await run(mission.language, mission.solution, mission.checks, mission.hiddenChecks);
    const hidden = result.checks.filter((c) => c.hidden).length;
    expect(hidden > 0).toBe(mission.hiddenChecks.trim() !== "");
  });
});

describe.each(predictMissions)("$id", (mission) => {
  test("the program runs and prints what the Output section says", async () => {
    const result = await run(mission.language, mission.program, "");
    expect(result.error).toBeNull();
    expect(outputLines(result.stdout)).toEqual(outputLines(mission.expectedOutput));
  });

  test("the expected output passes and an empty prediction doesn't", async () => {
    const { stdout } = await run(mission.language, mission.program, "");
    expect(comparePrediction(mission.expectedOutput, stdout).passed).toBe(true);
    expect(comparePrediction("", stdout).passed).toBe(false);
  });
});

// The relay machine plays these for real in relay-content.test.ts. These
// checks run even where the machine hasn't been built.
const terminalMissions = allMissions.filter((m) => m.kind === "terminal");

describe.each(terminalMissions)("$id", (mission) => {
  test("its checks and hidden checks are valid Python", () => {
    for (const code of [mission.checks, mission.hiddenChecks]) {
      expect(() => pyodide.runPython(`compile(${JSON.stringify(code)}, "checks", "exec")`)).not.toThrow();
    }
  });

  test("it has a solution, and a report has an answer", () => {
    expect(mission.solution.trim()).not.toBe("");
    if (mission.report) expect(mission.report.answer).not.toBe("");
  });

  test("it has no starter code", () => {
    expect(Object.values(mission.starters)).toEqual(["", "", ""]);
  });
});

test("maintenance pools contain distinct tasks with valid, consistent prerequisites", () => {
  for (const skill of new Set(reviewMissions.map((m) => m.reviewSkill))) {
    expect(skill).toBeTruthy();
    const pool = reviewMissions.filter((m) => m.reviewSkill === skill);
    expect(pool.length).toBeGreaterThanOrEqual(3);
    expect(new Set(pool.map((m) => m.prerequisite)).size).toBe(1);
    expect(missions.some((m) => m.id === pool[0].prerequisite)).toBe(true);
    expect(new Set(pool.map((m) => m.objective)).size).toBe(pool.length);
    for (const m of pool) {
      expect(m.assessment).toBe(false);
      expect(m.skills).toEqual([skill]);
    }
  }
});

import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Game } from "../src/components/Game";
import { SkillsDialog } from "../src/components/SkillsDialog";
import { missions, reviewMissions } from "../src/content";
import { calibrationSummary } from "../src/game/confidence";
import { DAY, maintenanceCalls } from "../src/game/maintenance";
import { emptySave, parseSave, reducer } from "../src/game/save";

test("old saves without confidenceLog parse cleanly and default to an empty list", () => {
  const legacy = { ...emptySave() } as Record<string, unknown>;
  delete legacy.confidenceLog;
  const parsed = parseSave(JSON.stringify(legacy));
  expect(parsed).not.toBeNull();
  expect(parsed!.confidenceLog).toEqual([]);
});

test("parseSave rejects malformed confidenceLog entries", () => {
  const bad = { ...emptySave(), confidenceLog: [{ missionId: "a", confidence: "100%", passed: true, at: "2026-11-20T00:00:00Z" }] };
  expect(parseSave(JSON.stringify(bad))).toBeNull();
});

test("submitted and review-submitted record optional confidence on both passes and failures", () => {
  let save = emptySave();
  save.profile = { experience: "tutorials", background: [], support: "standard" };
  save = reducer(save, {
    type: "submitted",
    missionId: "restore-power",
    passed: false,
    support: "standard",
    alsoRestores: [],
    confidence: "certain",
    now: "2026-11-18T10:00:00Z",
  });
  save = reducer(save, {
    type: "submitted",
    missionId: "restore-power",
    passed: true,
    support: "standard",
    alsoRestores: [],
    confidence: "likely",
    now: "2026-11-18T10:05:00Z",
  });
  // Omitting confidence leaves confidenceLog unchanged
  save = reducer(save, {
    type: "submitted",
    missionId: "restore-power",
    passed: true,
    support: "standard",
    alsoRestores: [],
    now: "2026-11-18T10:06:00Z",
  });
  expect(save.confidenceLog).toHaveLength(2);
  expect(save.confidenceLog[0]).toEqual({
    missionId: "restore-power",
    confidence: "certain",
    passed: false,
    at: "2026-11-18T10:00:00Z",
  });

  // Also works for maintenance calls
  const call = maintenanceCalls(missions, reviewMissions, save)[0];
  const dueTime = new Date(Date.parse("2026-11-18T10:05:00Z") + 2 * DAY).toISOString();
  save = reducer(save, { type: "review-start", skill: call.skill, missionId: call.mission.id, state: call.state, now: dueTime });
  save = reducer(save, {
    type: "review-submitted",
    skill: call.skill,
    missionId: call.mission.id,
    round: 0,
    passed: true,
    confidence: "unsure",
    now: dueTime,
  });
  expect(save.confidenceLog).toHaveLength(3);
  expect(save.confidenceLog[2].confidence).toBe("unsure");
  expect(save.confidenceLog[2].passed).toBe(true);
});

test("calibrationSummary computes pass rates per bucket and gentle non-grade notes", () => {
  const overconfident = calibrationSummary([
    { missionId: "m1", confidence: "certain", passed: false, at: "2026-11-18T10:00:00Z" },
    { missionId: "m2", confidence: "certain", passed: false, at: "2026-11-18T10:01:00Z" },
    { missionId: "m3", confidence: "certain", passed: true, at: "2026-11-18T10:02:00Z" },
  ]);
  expect(overconfident.total).toBe(3);
  expect(overconfident.buckets.find((b) => b.level === "certain")?.passed).toBe(1);
  expect(overconfident.note).toContain("1 of 3 times");

  const underconfident = calibrationSummary([
    { missionId: "m1", confidence: "unsure", passed: true, at: "2026-11-18T10:00:00Z" },
    { missionId: "m2", confidence: "unsure", passed: true, at: "2026-11-18T10:01:00Z" },
    { missionId: "m3", confidence: "unsure", passed: true, at: "2026-11-18T10:02:00Z" },
  ]);
  expect(underconfident.note).toContain("3 of 3 times");
});

test("confidence picker appears on standard/challenge missions, stays hidden on guided code missions, and calibration renders in Skills", () => {
  const guidedSave = emptySave();
  guidedSave.profile = { experience: "new", background: [], support: "guided" };
  guidedSave.currentMission = missions.find((m) => m.kind === "code" && !m.assessment)!.id;
  const guidedHtml = renderToStaticMarkup(<Game save={guidedSave} profile={guidedSave.profile} dispatch={() => {}} />);
  expect(guidedHtml).not.toContain("How sure?");

  const standardSave = emptySave();
  standardSave.profile = { experience: "tutorials", background: [], support: "standard" };
  standardSave.currentMission = guidedSave.currentMission;
  standardSave.confidenceLog = [
    { missionId: "m1", confidence: "likely", passed: true, at: "2026-11-18T10:00:00Z" },
    { missionId: "m2", confidence: "certain", passed: false, at: "2026-11-18T10:05:00Z" },
  ];
  const standardHtml = renderToStaticMarkup(<Game save={standardSave} profile={standardSave.profile} dispatch={() => {}} />);
  expect(standardHtml).toContain("How sure?");
  expect(standardHtml).toContain("Fairly sure");

  const skillsHtml = renderToStaticMarkup(
    <SkillsDialog open missions={missions} reviews={reviewMissions} save={standardSave} onClose={() => {}} onOpen={() => {}} />,
  );
  expect(skillsHtml).toContain("Calibration");
  expect(skillsHtml).toContain("Optional self-check, never a grade");
  expect(skillsHtml).toContain("1 of 1 passed (100%)");
  expect(skillsHtml).toContain("0 of 1 passed (0%)");
});

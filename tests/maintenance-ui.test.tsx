import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Game } from "../src/components/Game";
import { Maintenance } from "../src/components/Maintenance";
import { missions, reviewMissions } from "../src/content";
import { DAY, maintenanceCalls } from "../src/game/maintenance";
import { emptySave, reducer } from "../src/game/save";

function ready() {
  const now = Date.now();
  const save = emptySave();
  save.profile = { experience: "new", background: [], support: "guided" };
  save.completions["restore-power"] = [{ at: new Date(now - 2 * DAY).toISOString(), support: "guided", hintsUsed: 1, submits: 1, viaAssessment: false }];
  const call = maintenanceCalls(missions, reviewMissions, save)[0];
  return reducer(save, { type: "review-start", skill: call.skill, missionId: call.mission.id, state: call.state });
}

test("a maintenance mission renders in the full game with independent instructions and no concept label", () => {
  const save = ready();
  const html = renderToStaticMarkup(<Game save={save} profile={save.profile!} dispatch={() => {}} />);
  expect(html).toContain('id="mission-title">Split the reserve');
  expect(html).toContain("Return to campaign");
  expect(html).toContain("Resume call");
  expect(html).toContain("Need a reminder?");
  expect(html).not.toContain("Lesson:");
  expect(html).not.toContain("Replay this mission");
  expect(html).toMatch(/<select disabled="">/);
});

test("a completed maintenance call stays viewable after reload but cannot be resubmitted", () => {
  let save = ready();
  save = reducer(save, { type: "review-submitted", skill: "functions", missionId: save.currentMission!, round: 0, passed: true });
  const html = renderToStaticMarkup(<Game save={save} profile={save.profile!} dispatch={() => {}} />);
  expect(html).toContain("Maintenance complete. The next call");
  expect(html).toMatch(/class="submit" disabled=""/);
  expect(html).toMatch(/class="run" disabled=""/);
  expect(html).not.toContain("Resume call");
});

test("the queue explains an empty state without requiring a calendar wait to continue the campaign", () => {
  const html = renderToStaticMarkup(<Maintenance calls={[]} now={Date.now()} dispatch={() => {}} onOpen={() => {}} />);
  expect(html).toContain("none due");
  expect(html).toContain("Calls never block your campaign");
});

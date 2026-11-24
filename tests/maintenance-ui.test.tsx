import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Brief } from "../src/components/Brief";
import { Game } from "../src/components/Game";
import { Maintenance } from "../src/components/Maintenance";
import { missions, regionOf, reviewMissions } from "../src/content";
import { trackOfRegion } from "../src/content/regions";
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
  expect(html).toContain("Your first maintenance call arrives a day after you restore a system that unlocks spaced review.");
  expect(html).toContain("Calls never block your campaign");
});

test("maintenance queue shows act badges and Return to campaign opens the call's active track", () => {
  const now = Date.now();
  const readySave = ready();
  const dueCalls = maintenanceCalls(missions, reviewMissions, readySave);
  const queueHtml = renderToStaticMarkup(<Maintenance calls={dueCalls} now={now} dispatch={() => {}} onOpen={() => {}} />);
  expect(queueHtml).toContain('class="act-plate"');
  expect(queueHtml).toContain("Act I");

  const jsReview = reviewMissions.find((m) => trackOfRegion(regionOf(m)) === "javascript")!;
  let jsSave = emptySave();
  jsSave.profile = { experience: "new", background: [], support: "guided" };
  jsSave.reviews[jsReview.reviewSkill!] = {
    dueAt: new Date(now - DAY).toISOString(),
    step: 0,
    round: 0,
    active: true,
    missionId: jsReview.id,
  };

  let returnedTo = "";
  const findReturnButton = (node: ReactNode): { onClick?: () => void } | null => {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const child of node) {
        const hit = findReturnButton(child);
        if (hit) return hit;
      }
      return null;
    }
    const el = node as { type?: unknown; props?: { className?: string; onClick?: () => void; children?: ReactNode } };
    if (typeof el.type === "function") {
      return findReturnButton((el.type as (p: unknown) => ReactNode)(el.props));
    }
    if (el.type === "button" && el.props?.className?.includes("return-button")) return el.props;
    return findReturnButton(el.props?.children);
  };

  const tree = Brief({
    mission: jsReview,
    missions,
    system: { name: jsReview.system, region: "", symbol: jsReview.symbol, missions: [jsReview] },
    save: jsSave,
    support: { level: "challenge", source: "maintenance", step: null },
    assessment: undefined,
    dispatch: () => {},
    onOpen: (id) => {
      returnedTo = id;
    },
    onOpenAtlas: () => {},
    onReplay: () => {},
  });
  findReturnButton(tree)?.onClick?.();
  const targetMission = missions.find((m) => m.id === returnedTo);
  expect(targetMission).toBeDefined();
  expect(trackOfRegion(targetMission!.region)).toBe("javascript");
});

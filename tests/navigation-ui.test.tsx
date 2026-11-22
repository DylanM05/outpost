import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { AtlasDialog } from "../src/components/AtlasDialog";
import { ControlRoomTour, TOUR_STEPS } from "../src/components/ControlRoomTour";
import { Game } from "../src/components/Game";
import { Plant } from "../src/components/Plant";
import { SkillsDialog } from "../src/components/SkillsDialog";
import { missions, reviewMissions, systemsIn } from "../src/content";
import { regionMeta, regionsInTrack } from "../src/content/regions";
import { emptySave } from "../src/game/save";

test("topbar uses a compact region switcher and track switcher instead of inline region buttons", () => {
  const save = emptySave();
  save.profile = { experience: "experienced", background: [], support: "challenge" };
  save.currentMission = missions[0].id;
  const html = renderToStaticMarkup(<Game save={save} profile={save.profile} dispatch={() => {}} />);

  expect(html).toContain("track-switcher");
  expect(html).toContain("Python");
  expect(html).toContain("JS");
  expect(html).toContain("region-switcher");
  expect(html).toContain("Act I");
  expect(html).toContain("Kestrel Ridge");
  expect(html).toContain("Mission 1 of");
  expect(html).toContain("mobile-tabs");
  expect(html).toContain("Display shift");
});

test("AtlasDialog scopes regions by learning track and exposes track tabs", () => {
  const save = emptySave();
  save.profile = { experience: "experienced", background: [], support: "challenge" };
  const pyHtml = renderToStaticMarkup(
    <AtlasDialog
      open
      currentRegion="act14"
      currentMissionId={missions[0].id}
      missions={missions}
      save={save}
      onClose={() => {}}
      onOpen={() => {}}
    />,
  );

  expect(pyHtml).toContain("Station atlas");
  expect(pyHtml).toContain("Python &amp; Systems");
  expect(pyHtml).toContain("JavaScript");
  for (const region of regionsInTrack("python")) {
    expect(pyHtml).toContain(region.act);
    expect(pyHtml).toContain(region.name);
    expect(pyHtml).toContain(region.summary);
  }
  expect(pyHtml).toContain("Journal desk");
  expect(pyHtml).toContain("Vault audit");

  const jsRegion = regionsInTrack("javascript")[0];
  const jsHtml = renderToStaticMarkup(
    <AtlasDialog
      open
      currentRegion={jsRegion.id}
      currentMissionId={missions.find((m) => m.region === jsRegion.id)!.id}
      missions={missions}
      save={save}
      onClose={() => {}}
      onOpen={() => {}}
    />,
  );
  expect(jsHtml).toContain("JS I");
  expect(jsHtml).toContain("The script annex");
});

test("SkillsDialog renders status filter pills with counts and act plates", () => {
  const save = emptySave();
  save.profile = { experience: "tutorials", background: [], support: "standard" };
  save.completions["restore-power"] = [
    { at: "2026-11-20T10:00:00Z", support: "standard", hintsUsed: 0, submits: 1, viaAssessment: false },
  ];
  const html = renderToStaticMarkup(
    <SkillsDialog open missions={missions} reviews={reviewMissions} save={save} onClose={() => {}} onOpen={() => {}} />,
  );

  expect(html).toContain("Filter skills by status");
  expect(html).toContain("Demonstrated");
  expect(html).toContain("Retained");
  expect(html).toContain("Act I");
  expect(html).toContain("Act XIV");
});

test("Plant puts live scenes ahead of the mimic board and keeps the board first on standard code missions", () => {
  const save = emptySave();
  save.profile = { experience: "experienced", background: [], support: "challenge" };

  const gridMission = missions.find((m) => m.scene === "grid")!;
  const gridHtml = renderToStaticMarkup(
    <Plant
      missions={missions}
      systems={systemsIn(gridMission.region)}
      region={regionMeta(gridMission.region)}
      save={save}
      mission={gridMission}
      energized={null}
      run={null}
      onOpen={() => {}}
    />,
  );
  expect(gridHtml.indexOf("Ridge map")).toBeLessThan(gridHtml.indexOf('class="mimic"'));

  const codeMission = missions.find((m) => m.scene === "tests")!;
  const codeHtml = renderToStaticMarkup(
    <Plant
      missions={missions}
      systems={systemsIn(codeMission.region)}
      region={regionMeta(codeMission.region)}
      save={save}
      mission={codeMission}
      energized={null}
      run={null}
      onOpen={() => {}}
    />,
  );
  expect(codeHtml.indexOf('class="mimic"')).toBeLessThan(codeHtml.indexOf("Station log"));
});


test("ControlRoomTour renders step guidance and Game exposes Guide trigger and data-tour targets", () => {
  const save = emptySave();
  save.profile = { experience: "new", background: [], support: "guided" };
  save.currentMission = missions[0].id;
  const gameHtml = renderToStaticMarkup(<Game save={save} profile={save.profile} dispatch={() => {}} />);

  expect(gameHtml).toContain("Guide");
  expect(gameHtml).toContain("Replay control room guide");
  for (const step of TOUR_STEPS) {
    expect(gameHtml).toContain(`data-tour="${step.target}"`);
  }

  const tourHtml = renderToStaticMarkup(<ControlRoomTour open onClose={() => {}} />);
  expect(tourHtml).toContain(`Step 1 of ${TOUR_STEPS.length}`);
  expect(tourHtml).toContain(TOUR_STEPS[0].title);
  expect(tourHtml).toContain("Skip tour");
});


test("debug mode unlocks every act and renders the Debug control strip with act jumper and helpers", () => {
  const save = emptySave();
  save.profile = { experience: "new", background: [], support: "guided" };
  save.currentMission = missions[0].id;

  const normalHtml = renderToStaticMarkup(<Game save={save} profile={save.profile} dispatch={() => {}} initialDebugMode={false} />);
  expect(normalHtml).not.toContain('aria-label="Debug controls"');
  expect(normalHtml).toContain("Debug mode: Off");

  const debugHtml = renderToStaticMarkup(<Game save={save} profile={save.profile} dispatch={() => {}} initialDebugMode={true} />);
  expect(debugHtml).toContain('aria-label="Debug controls"');
  expect(debugHtml).toContain("Debug mode: On");
  expect(debugHtml).toContain("Fill solution");
  expect(debugHtml).toContain("Pass mission");
  expect(debugHtml).toContain("Complete act");
  expect(debugHtml).toContain("Act XV: The signal tower");
});

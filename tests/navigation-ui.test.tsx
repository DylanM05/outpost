import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { AtlasDialog } from "../src/components/AtlasDialog";
import { ControlRoomTour, TOUR_STEPS, tourStepsFor } from "../src/components/ControlRoomTour";
import { Game } from "../src/components/Game";
import { Plant } from "../src/components/Plant";
import { Output, Tests } from "../src/components/Results";
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
  expect(html).toContain("TS");
  expect(html).toContain("SQL");
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

  const sqlRegion = regionsInTrack("sql")[0];
  const sqlHtml = renderToStaticMarkup(
    <AtlasDialog
      open
      currentRegion={sqlRegion.id}
      currentMissionId={missions.find((m) => m.region === sqlRegion.id)!.id}
      missions={missions}
      save={save}
      onClose={() => {}}
      onOpen={() => {}}
    />,
  );
  expect(sqlHtml).toContain("SQL &amp; Databases");
  expect(sqlHtml).toContain("SQL I");
  expect(sqlHtml).toContain("The query vault");

  const tsRegion = regionsInTrack("typescript")[0];
  const tsHtml = renderToStaticMarkup(
    <AtlasDialog
      open
      currentRegion={tsRegion.id}
      currentMissionId={missions.find((m) => m.region === tsRegion.id)!.id}
      missions={missions}
      save={save}
      onClose={() => {}}
      onOpen={() => {}}
    />,
  );
  expect(tsHtml).toContain("TypeScript");
  expect(tsHtml).toContain("TS I");
  expect(tsHtml).toContain("The type foundry");
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

test("ControlRoomTour names the active mission file per language and SkillsDialog exposes track filter pills", () => {
  expect(tourStepsFor("python")[1].body).toContain("main.py");
  expect(tourStepsFor("javascript")[1].body).toContain("main.js");
  expect(tourStepsFor("typescript")[1].body).toContain("main.ts");
  expect(tourStepsFor("sql")[1].body).toContain("query.sql");

  const save = emptySave();
  save.profile = { experience: "new", background: [], support: "guided" };
  const skillsHtml = renderToStaticMarkup(
    <SkillsDialog open missions={missions} reviews={reviewMissions} save={save} onClose={() => {}} onOpen={() => {}} />,
  );
  expect(skillsHtml).toContain("skills-track-filters");
  expect(skillsHtml).toContain("All tracks");
  expect(skillsHtml).toContain("Python");
  expect(skillsHtml).toContain("JS");
  expect(skillsHtml).toContain("TS");
  expect(skillsHtml).toContain("SQL");
  // Shared skills like reading-code are counted in every track where they appear (e.g. TS >= 4: 3 TS skills + reading-code).
  expect(skillsHtml).toMatch(/TS <span class="filter-count">([4-9]|\d{2,})<\/span>/);

  // Per-track trackSupport starting levels should not falsely report adaptive drift before any completion.
  const partialExpSave = emptySave();
  partialExpSave.profile = {
    experience: "experienced",
    background: ["python"],
    support: "challenge",
    trackSupport: { python: "challenge", javascript: "standard", typescript: "standard", sql: "standard" },
  };
  const noDriftHtml = renderToStaticMarkup(
    <SkillsDialog open missions={missions} reviews={reviewMissions} save={partialExpSave} onClose={() => {}} onOpen={() => {}} />,
  );
  expect(noDriftHtml).not.toContain("Missions for this skill now start at");
});

test("Output renders sql_table events as HTML tables with empty/truncated/multi-table states and Tests formats diffs safely", () => {
  const sqlResult = {
    stdout: "id | note\nN-1 | NULL\n",
    stdoutTruncated: true,
    error: null,
    checks: [
      { label: "matches pairs", passed: false, detail: "Expected [1, 2], got [1, 3]. Check loop bounds", hidden: false },
      { label: "js assertion", passed: false, detail: "expected 42, got 99", hidden: false },
      { label: "apostrophe", passed: false, detail: "Expected player's score 10, got 0", hidden: false },
      { label: "ellipsis", passed: false, detail: "Expected 'ok', got ...", hidden: false },
      { label: "passed check", passed: true, detail: "Expected 1, got 1", hidden: false },
    ],
    events: [
      {
        kind: "sql_table",
        data: { columns: ["id", "note"], rows: [["N-1", null]], totalRows: 205, truncated: true, hidden: false },
      },
      {
        kind: "sql_table",
        data: { columns: ["id"], rows: [], totalRows: 0, truncated: false, hidden: false },
      },
    ],
  };

  const outHtml = renderToStaticMarkup(<Output result={sqlResult} />);
  expect(outHtml).toContain("sql-table-wrap");
  expect(outHtml).toContain("sql-result-table");
  expect(outHtml).toContain("sql-table-meta");
  expect(outHtml).toContain("Showing 1 of 205 rows");
  expect(outHtml).toContain("0 rows returned");
  expect(outHtml).toContain('aria-label="Output table 1"');
  expect(outHtml).toContain('aria-label="Output table 2"');
  expect(outHtml).toContain("sql-null");
  expect(outHtml).toContain("NULL");
  expect(outHtml).not.toContain("20,000 characters");

  const plainHtml = renderToStaticMarkup(<Output result={sqlResult} title="The program printed" plain />);
  expect(plainHtml).not.toContain("sql-result-table");
  expect(plainHtml).toContain("<pre>id | note");
  expect(plainHtml).toContain("20,000 characters");

  const testsHtml = renderToStaticMarkup(<Tests result={sqlResult} />);
  expect(testsHtml).toContain("test-diff");
  expect(testsHtml).toContain("<dt>Expected</dt><dd><code>[1, 2]</code></dd>");
  expect(testsHtml).toContain("<dt>Got</dt><dd><code>[1, 3]</code></dd>");
  expect(testsHtml).toContain("Check loop bounds");
  expect(testsHtml).toContain("<dt>Expected</dt><dd><code>42</code></dd>");
  expect(testsHtml).toContain("<dt>Got</dt><dd><code>99</code></dd>");
  expect(testsHtml).toContain("<dt>Expected</dt><dd><code>player&#x27;s score 10</code></dd>");
  expect(testsHtml).toContain("<dt>Got</dt><dd><code>...</code></dd>");
  expect(testsHtml).not.toContain("<dt>Expected</dt><dd><code>1</code></dd>");
});

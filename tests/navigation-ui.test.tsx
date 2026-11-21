import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { AtlasDialog } from "../src/components/AtlasDialog";
import { Game } from "../src/components/Game";
import { Plant } from "../src/components/Plant";
import { SkillsDialog } from "../src/components/SkillsDialog";
import { missions, reviewMissions, systemsIn } from "../src/content";
import { REGIONS, regionMeta } from "../src/content/regions";
import { emptySave } from "../src/game/save";

test("topbar uses a compact region switcher instead of 14 inline region buttons", () => {
  const save = emptySave();
  save.profile = { experience: "experienced", background: [], support: "challenge" };
  save.currentMission = missions[0].id;
  const html = renderToStaticMarkup(<Game save={save} profile={save.profile} dispatch={() => {}} />);

  expect(html).toContain("region-switcher");
  expect(html).toContain("Act I");
  expect(html).toContain("Kestrel Ridge");
  expect(html).toContain("Mission 1 of");
  expect(html).toContain("mobile-tabs");
  expect(html).toContain("Display shift");
});

test("AtlasDialog lists all 14 acts with metadata, progress, and systems", () => {
  const save = emptySave();
  save.profile = { experience: "experienced", background: [], support: "challenge" };
  const html = renderToStaticMarkup(
    <AtlasDialog
      open
      currentRegion="act14"
      currentMissionId={missions[missions.length - 1].id}
      missions={missions}
      save={save}
      onClose={() => {}}
      onOpen={() => {}}
    />,
  );

  expect(html).toContain("Station atlas");
  for (const region of REGIONS) {
    expect(html).toContain(region.act);
    expect(html).toContain(region.name);
    expect(html).toContain(region.summary);
  }
  expect(html).toContain("Journal desk");
  expect(html).toContain("Vault audit");
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

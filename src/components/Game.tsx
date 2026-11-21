import { useEffect, useRef, useState, type Dispatch } from "react";
import { allMissions, missions, regionOf, reviewMissions, systemOf, systemsIn } from "../content";
import { regionMeta } from "../content/regions";
import { SUPPORT_LEVELS, type SupportLevel } from "../content/parse";
import { comparePrediction } from "../game/predict";
import {
  codeFor,
  easierStart,
  isRestored,
  nextMission,
  skillReport,
  SUPPORT_LABEL,
  supportChoice,
  supportFor,
  systemProgress,
} from "../game/rules";
import { parseSave, type Action, type Confidence, type Profile, type SaveData } from "../game/save";
import { applyTheme, loadTheme, type ThemePreference } from "../game/theme";
import { passedAll } from "../python/harness";
import { PythonRunner, type RunnerStatus } from "../python/runner";
import { relay } from "../relay/session";
import { AtlasDialog } from "./AtlasDialog";
import { Bench, type RunMode, type RunRecord } from "./Bench";
import { Brief } from "./Brief";
import { Maintenance } from "./Maintenance";
import { Plant } from "./Plant";
import { MOD_KEY } from "./Results";
import { SkillsDialog } from "./SkillsDialog";
import { maintenanceCalls } from "../game/maintenance";

// One interpreter for the whole session. Created lazily, outside React state,
// so StrictMode's double render doesn't start a second worker.
let sharedRunner: PythonRunner | null = null;
const getRunner = () => (sharedRunner ??= new PythonRunner());

let runCount = 0;

type MobilePane = "brief" | "bench" | "plant";

interface Props {
  save: SaveData;
  profile: Profile;
  dispatch: Dispatch<Action>;
}

export function Game({ save, profile, dispatch }: Props) {
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>("loading");
  const [busy, setBusy] = useState<RunMode | null>(null);
  const [lastRun, setLastRun] = useState<RunRecord | null>(null);
  const [energized, setEnergized] = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("brief");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => getRunner().subscribe(setRunnerStatus), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSkillsOpen(false);
        setAtlasOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const index = Math.max(0, missions.findIndex((m) => m.id === save.currentMission));
  const selected = allMissions.find((m) => m.id === save.currentMission);
  const mission = selected?.reviewSkill && save.reviews[selected.reviewSkill]?.missionId !== selected.id
    ? missions[index] : selected ?? missions[index];
  const calls = maintenanceCalls(missions, reviewMissions, save);
  const review = mission.reviewSkill ? save.reviews[mission.reviewSkill] : undefined;
  const support = supportChoice(mission, save, allMissions);
  const code = codeFor(mission, save, allMissions);
  const system = mission.reviewSkill
    ? { name: mission.system, region: regionOf(mission), symbol: mission.symbol, missions: [mission] }
    : systemOf(mission);
  const run = lastRun?.missionId === mission.id ? lastRun : null;
  const region = regionOf(mission);
  const currentRegionMeta = regionMeta(region);
  const regionSystems = systemsIn(region);
  const online = regionSystems.filter((s) => systemProgress(missions, s, save).state === "online").length;
  const assessment = missions.find((m) => m.region === region && m.assessment);
  const provenSkills = skillReport([...missions, ...reviewMissions], save).filter(
    (s) => s.evidence === "demonstrated" || s.evidence === "retained",
  ).length;

  const open = (missionId: string) => {
    setLastRun(null);
    setConfidence(null);
    dispatch({ type: "open", missionId });
  };

  async function execute(requested: RunMode) {
    if (busy || (mission.reviewSkill && !review?.active)) return;
    const target = mission;
    // Predict missions only ever check: running the program would give the answer away.
    const predicting = target.kind === "predict";
    const mode: RunMode = predicting ? "submit" : requested;
    const prediction = predicting ? code : undefined;
    const chosenConfidence = mode === "submit" ? confidence : null;
    setBusy(mode);
    const outcome =
      target.kind === "terminal"
        ? await relay.check(target, mode, code)
        : predicting
          ? await getRunner().run(target.program, "")
          : await getRunner().run(code, target.checks, mode === "submit" ? target.hiddenChecks : "");
    setBusy(null);
    setLastRun({ missionId: target.id, mode, outcome, key: ++runCount, prediction });
    if (mode !== "submit") return;
    setConfidence(null);

    const passed =
      outcome.kind === "finished" &&
      (predicting
        ? outcome.result.error === null && comparePrediction(code, outcome.result.stdout).passed
        : passedAll(outcome.result));
    // Passing a region's final mission restores the rest of that region.
    const alsoRestores =
      passed && target.assessment
        ? missions.filter((m) => m !== target && m.region === target.region && !isRestored(save, m.id)).map((m) => m.id)
        : [];
    if (target.reviewSkill && review) {
      dispatch({
        type: "review-submitted",
        skill: target.reviewSkill,
        missionId: target.id,
        round: review.round,
        passed,
        confidence: chosenConfidence ?? undefined,
      });
      setNow(Date.now());
      return;
    }
    dispatch({
      type: "submitted",
      missionId: target.id,
      passed,
      support: supportFor(target, save, allMissions),
      alsoRestores,
      confidence: chosenConfidence ?? undefined,
    });

    if (passed && !isRestored(save, target.id)) {
      const targetSystem = systemOf(target);
      const finishesSystem = targetSystem.missions.every((m) => m === target || isRestored(save, m.id));
      if (finishesSystem) setEnergized(targetSystem.name);
    }
  }

  return (
    <div className="game">
      <header className="topbar">
        <div className="brand">
          <span className="wordmark">Outpost</span>
          <button
            className="region-switcher"
            onClick={() => setAtlasOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Open station atlas. Currently in ${currentRegionMeta.act}, ${currentRegionMeta.name}, ${online} of ${regionSystems.length} systems online.`}
          >
            <span className="act-plate">{currentRegionMeta.act}</span>
            <span className="region-switcher-name">{currentRegionMeta.name}</span>
            <span className="region-switcher-count">
              {online}/{regionSystems.length} online
            </span>
            <kbd>{MOD_KEY}+K</kbd>
          </button>
        </div>
        <div className="topbar-actions">
          <label className="support-picker">
            <span>Support</span>
            <select
              value={mission.reviewSkill || mission.assessment ? "challenge" : (profile.fixedSupport ?? "adaptive")}
              disabled={!!mission.reviewSkill || mission.assessment}
              onChange={(e) => dispatch({ type: "set-support", support: e.target.value as SupportLevel | "adaptive" })}
            >
              <option value="adaptive">Adaptive</option>
              {SUPPORT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {SUPPORT_LABEL[level]}
                </option>
              ))}
            </select>
          </label>
          <button className="quiet skills-trigger" onClick={() => setSkillsOpen(true)}>
            Skills
            {provenSkills > 0 && <span className="topbar-badge">{provenSkills}</span>}
          </button>
          <ProgressMenu save={save} dispatch={dispatch} />
        </div>
      </header>

      <Maintenance calls={calls} now={now} dispatch={dispatch} onOpen={() => setLastRun(null)} />

      <div className="mobile-tabs" role="tablist" aria-label="Workspace panels">
        <button
          role="tab"
          aria-selected={mobilePane === "brief"}
          className={mobilePane === "brief" ? "active" : undefined}
          onClick={() => setMobilePane("brief")}
        >
          Briefing
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === "bench"}
          className={mobilePane === "bench" ? "active" : undefined}
          onClick={() => setMobilePane("bench")}
        >
          {mission.kind === "terminal" ? "Terminal" : mission.kind === "predict" ? "Predict" : "Code"}
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === "plant"}
          className={mobilePane === "plant" ? "active" : undefined}
          onClick={() => setMobilePane("plant")}
        >
          Board ({online}/{regionSystems.length})
        </button>
      </div>

      <main className="deck" data-mobile-pane={mobilePane}>
        <Brief
          key={mission.id}
          mission={mission}
          missions={missions}
          system={system}
          save={save}
          support={support}
          assessment={assessment}
          dispatch={dispatch}
          onOpen={open}
          onOpenAtlas={() => setAtlasOpen(true)}
          onReplay={() => {
            dispatch({ type: "replay", missionId: mission.id });
            setLastRun(null);
          }}
        />
        <Bench
          mission={mission}
          code={code}
          edited={mission.id in save.drafts}
          support={support}
          busy={busy}
          runnerStatus={runnerStatus}
          run={run}
          completed={!!mission.reviewSkill && !review?.active}
          systemOnline={!mission.reviewSkill && systemProgress(missions, system, save).state === "online"}
          next={nextMission(missions, save, mission.reviewSkill ? -1 : index)}
          onEdit={(updated) => dispatch({ type: "edit", missionId: mission.id, code: updated })}
          onReset={() => dispatch({ type: "reset-code", missionId: mission.id })}
          onExecute={(mode) => void execute(mode)}
          onOpen={open}
          confidence={confidence}
          onConfidence={setConfidence}
          easierStart={easierStart(mission, save, support)}
          onEasierStart={() => {
            const level = easierStart(mission, save, support);
            if (level) dispatch({ type: "pin-support", missionId: mission.id, support: level });
          }}
        />
        <Plant
          missions={missions}
          systems={regionSystems}
          region={currentRegionMeta}
          save={save}
          mission={mission}
          energized={energized}
          run={run}
          onOpen={(id) => {
            open(id);
            setMobilePane("brief");
          }}
        />
      </main>

      <AtlasDialog
        open={atlasOpen}
        currentRegion={region}
        currentMissionId={mission.id}
        missions={missions}
        save={save}
        onClose={() => setAtlasOpen(false)}
        onOpen={(id) => {
          open(id);
          setMobilePane("brief");
        }}
      />

      <SkillsDialog
        open={skillsOpen}
        missions={missions}
        reviews={reviewMissions}
        save={save}
        onClose={() => setSkillsOpen(false)}
        onOpen={(id) => {
          open(id);
          setMobilePane("brief");
        }}
      />
    </div>
  );
}

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: "system", label: "Auto" },
  { id: "light", label: "Day" },
  { id: "dark", label: "Night" },
];

function ProgressMenu({ save, dispatch }: { save: SaveData; dispatch: Dispatch<Action> }) {
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(() => loadTheme());
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) detailsRef.current.open = false;
    };
    document.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const chooseTheme = (next: ThemePreference) => {
    setTheme(next);
    applyTheme(next);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `outpost-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Backup downloaded.");
  };

  const restore = async (file: File) => {
    const backup = parseSave(await file.text());
    if (!backup) {
      setMessage("That file isn't an Outpost backup, so nothing was changed.");
      return;
    }
    if (!window.confirm("Replace your current progress with this backup?")) return;
    dispatch({ type: "load", save: backup });
    setMessage("Backup restored.");
  };

  return (
    <details className="menu" ref={detailsRef}>
      <summary>Progress</summary>
      <div className="menu-panel">
        <div className="menu-section">
          <span className="menu-label">Display shift</span>
          <div className="theme-toggle" role="group" aria-label="Display theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={theme === option.id ? "active" : undefined}
                aria-pressed={theme === option.id}
                onClick={() => chooseTheme(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <hr className="menu-divider" />
        <button onClick={download}>Download a backup</button>
        <button onClick={() => fileInput.current?.click()}>Restore from a backup</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void restore(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => {
            if (detailsRef.current) detailsRef.current.open = false;
            dispatch({ type: "change-profile" });
          }}
        >
          Change my experience answers
        </button>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm("Erase all progress and start over? This can't be undone.")) dispatch({ type: "erase" });
          }}
        >
          Erase all progress
        </button>
        {message && (
          <p className="menu-message" role="status">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}

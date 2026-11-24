import { useEffect, useRef, useState, type Dispatch } from "react";
import { allMissions, missions, regionOf, reviewMissions, systemOf, systemsIn } from "../content";
import { REGIONS, regionMeta, regionsInTrack, TRACKS, type TrackId } from "../content/regions";
import { SUPPORT_LEVELS, type SupportLevel } from "../content/parse";
import { comparePrediction } from "../game/predict";
import {
  codeFor,
  easierStart,
  isRestored,
  nextMission,
  regionEntry,
  skillReport,
  SUPPORT_LABEL,
  supportChoice,
  supportFor,
  systemProgress,
  trackEntry,
} from "../game/rules";
import { loadDebugMode, storeDebugMode } from "../game/debug";
import { parseSave, type Action, type Confidence, type Profile, type SaveData } from "../game/save";
import { applyTheme, loadTheme, type ThemePreference } from "../game/theme";
import { passedAll } from "../python/harness";
import { PythonRunner, type RunnerStatus } from "../python/runner";
import { JsRunner } from "../js/runner";
import { TsRunner } from "../ts/runner";
import { relay } from "../relay/session";
import { AtlasDialog } from "./AtlasDialog";
import { Bench, type RunMode, type RunRecord } from "./Bench";
import { Brief } from "./Brief";
import { ControlRoomTour, hasSeenTour } from "./ControlRoomTour";
import { Maintenance } from "./Maintenance";
import { Plant } from "./Plant";
import { MOD_KEY } from "./Results";
import { SkillsDialog } from "./SkillsDialog";
import { maintenanceCalls } from "../game/maintenance";

// One interpreter per language for the whole session. Created lazily, outside
// React state, so StrictMode's double render doesn't start a second worker.
let sharedRunner: PythonRunner | null = null;
const getRunner = () => (sharedRunner ??= new PythonRunner());
let sharedJsRunner: JsRunner | null = null;
const getJsRunner = () => (sharedJsRunner ??= new JsRunner());
let sharedTsRunner: TsRunner | null = null;
const getTsRunner = () => (sharedTsRunner ??= new TsRunner());

let runCount = 0;

type MobilePane = "brief" | "bench" | "plant";

interface Props {
  save: SaveData;
  profile: Profile;
  dispatch: Dispatch<Action>;
  initialDebugMode?: boolean;
}

export function Game({ save, profile, dispatch, initialDebugMode }: Props) {
  const [pyRunnerStatus, setPyRunnerStatus] = useState<RunnerStatus>("loading");
  const [jsRunnerStatus, setJsRunnerStatus] = useState<RunnerStatus>("ready");
  const [tsRunnerStatus, setTsRunnerStatus] = useState<RunnerStatus>("ready");
  const [busy, setBusy] = useState<RunMode | null>(null);
  const [lastRun, setLastRun] = useState<RunRecord | null>(null);
  const [energized, setEnergized] = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [debugMode, setDebugMode] = useState<boolean>(() => initialDebugMode ?? loadDebugMode());
  const [mobilePane, setMobilePane] = useState<MobilePane>("brief");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [now, setNow] = useState(Date.now);

  const toggleDebugMode = (next: boolean) => {
    setDebugMode(next);
    storeDebugMode(next);
  };

  useEffect(() => {
    if (Object.keys(save.completions).length === 0 && !hasSeenTour()) {
      setTourOpen(true);
    }
    // Only auto-start on initial entry into the control room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => getRunner().subscribe(setPyRunnerStatus), []);

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
  const isJsMission = mission.language === "javascript";
  const isTsMission = mission.language === "typescript";
  useEffect(() => {
    if (!isJsMission) return;
    return getJsRunner().subscribe(setJsRunnerStatus);
  }, [isJsMission]);
  useEffect(() => {
    if (!isTsMission) return;
    return getTsRunner().subscribe(setTsRunnerStatus);
  }, [isTsMission]);
  const runnerStatus = isJsMission ? jsRunnerStatus : isTsMission ? tsRunnerStatus : pyRunnerStatus;
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
  const currentTrack = currentRegionMeta.track;
  const lastMissionByTrack = useRef<Partial<Record<TrackId, string>>>({});
  lastMissionByTrack.current[currentTrack] = mission.id;
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

  const switchTrack = (track: TrackId) => {
    if (track === currentTrack) return;
    const remembered = lastMissionByTrack.current[track];
    if (remembered && allMissions.some((m) => m.id === remembered)) {
      open(remembered);
      return;
    }
    const entry = trackEntry(missions, track, save, debugMode);
    if (entry) open(entry.id);
  };

  const regionIndex = Math.max(0, REGIONS.findIndex((r) => r.id === region));
  const jumpToRegion = (regionId: string) => {
    const entry = regionEntry(missions, regionId, save, true);
    if (entry) open(entry.id);
  };

  const fillableSolution =
    mission.kind === "code"
      ? mission.solution
      : mission.kind === "predict"
        ? mission.expectedOutput
        : mission.report?.answer ?? null;

  const debugPassMission = () => {
    if (mission.reviewSkill && review) {
      dispatch({ type: "review-submitted", skill: mission.reviewSkill, missionId: mission.id, round: review.round, passed: true });
      setNow(Date.now());
      return;
    }
    const targetSystem = systemOf(mission);
    const finishesSystem = !isRestored(save, mission.id) && targetSystem.missions.every((m) => m === mission || isRestored(save, m.id));
    dispatch({
      type: "submitted",
      missionId: mission.id,
      passed: true,
      support: supportFor(mission, save, allMissions),
      alsoRestores: [],
    });
    if (finishesSystem) setEnergized(targetSystem.name);
  };

  const debugCompleteRegion = () => {
    const inRegion = missions.filter((m) => m.region === region);
    const target = inRegion.find((m) => !isRestored(save, m.id)) ?? inRegion[0];
    if (!target) return;
    const rest = inRegion.filter((m) => m !== target && !isRestored(save, m.id)).map((m) => m.id);
    dispatch({
      type: "submitted",
      missionId: target.id,
      passed: true,
      support: "challenge",
      alsoRestores: rest,
    });
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
        : target.language === "javascript"
          ? predicting
            ? await getJsRunner().run(target.program, "")
            : await getJsRunner().run(code, target.checks, mode === "submit" ? target.hiddenChecks : "")
          : target.language === "typescript"
            ? predicting
              ? await getTsRunner().run(target.program, "")
              : await getTsRunner().run(code, target.checks, mode === "submit" ? target.hiddenChecks : "")
            : predicting
            ? await getRunner().run(target.program, "", "", target.language === "sql" ? { mode: "sql", setup: target.setup } : undefined)
            : await getRunner().run(
                code,
                target.checks,
                mode === "submit" ? target.hiddenChecks : "",
                target.language === "sql" ? { mode: "sql", setup: target.setup } : undefined,
              );
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
      solutionViewed: Boolean(save.solutionsViewed?.[target.id]),
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
          <div className="track-switcher" role="group" aria-label="Learning path">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                className={track.id === currentTrack ? "active" : undefined}
                aria-pressed={track.id === currentTrack}
                title={`Switch to the ${track.name} path`}
                onClick={() => switchTrack(track.id)}
              >
                {track.shortName}
              </button>
            ))}
          </div>
          <button
            className="region-switcher"
            data-tour="region-switcher"
            onClick={() => setAtlasOpen(true)}
            title={`Open the Station Atlas to browse all ${REGIONS.length} acts or search missions`}
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
        <div className="topbar-actions" data-tour="topbar-tools">
          <label className="support-picker" title="Controls how much starter code and lesson guidance you get">
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
          <button
            className="quiet skills-trigger"
            title="Inspect skills you've practiced, demonstrated, or retained"
            onClick={() => setSkillsOpen(true)}
          >
            Skills
            {provenSkills > 0 && <span className="topbar-badge">{provenSkills}</span>}
          </button>
          <button
            className="quiet"
            title="Walk through the control room panels and shortcuts"
            onClick={() => setTourOpen(true)}
          >
            Guide
          </button>
          <ProgressMenu
            save={save}
            dispatch={dispatch}
            debugMode={debugMode}
            onToggleDebug={() => toggleDebugMode(!debugMode)}
            onStartTour={() => setTourOpen(true)}
          />
        </div>
      </header>

      {debugMode && (
        <div className="debug-bar" role="region" aria-label="Debug controls">
          <span className="debug-badge">Debug</span>
          <div className="debug-group">
            <button
              type="button"
              className="quiet"
              disabled={regionIndex <= 0}
              onClick={() => regionIndex > 0 && jumpToRegion(REGIONS[regionIndex - 1].id)}
            >
              Prev act
            </button>
            <label className="sr-only" htmlFor="debug-act-select">
              Jump to act
            </label>
            <select
              id="debug-act-select"
              value={region}
              onChange={(e) => jumpToRegion(e.target.value)}
            >
              {TRACKS.map((track) => (
                <optgroup key={track.id} label={track.name}>
                  {regionsInTrack(track.id).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.act}: {r.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              className="quiet"
              disabled={regionIndex >= REGIONS.length - 1}
              onClick={() => regionIndex < REGIONS.length - 1 && jumpToRegion(REGIONS[regionIndex + 1].id)}
            >
              Next act
            </button>
          </div>
          <div className="debug-group">
            <button
              type="button"
              className="quiet"
              disabled={!fillableSolution}
              title="Insert the reference solution into the editor or answer box"
              onClick={() => fillableSolution && dispatch({ type: "edit", missionId: mission.id, code: fillableSolution })}
            >
              Fill solution
            </button>
            <button
              type="button"
              className="quiet"
              title="Mark the current mission complete immediately"
              onClick={debugPassMission}
            >
              Pass mission
            </button>
            <button
              type="button"
              className="quiet"
              title="Mark every mission in this act online"
              onClick={debugCompleteRegion}
            >
              Complete act
            </button>
          </div>
          <button type="button" className="quiet debug-exit" onClick={() => toggleDebugMode(false)}>
            Exit debug
          </button>
        </div>
      )}

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
          unlockAll={debugMode}
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
          systemOnline={!mission.reviewSkill && systemProgress(missions, system, save, debugMode).state === "online"}
          next={nextMission(missions, save, mission.reviewSkill ? -1 : index, debugMode)}
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
          unlockAll={debugMode}
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
        unlockAll={debugMode}
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
        unlockAll={debugMode}
        onClose={() => setSkillsOpen(false)}
        onOpen={(id) => {
          open(id);
          setMobilePane("brief");
        }}
      />

      <ControlRoomTour
        open={tourOpen}
        language={mission.language}
        onClose={() => setTourOpen(false)}
        onFocusPane={setMobilePane}
      />
    </div>
  );
}

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: "system", label: "Auto" },
  { id: "light", label: "Day" },
  { id: "dark", label: "Night" },
];

function ProgressMenu({
  save,
  dispatch,
  debugMode,
  onToggleDebug,
  onStartTour,
}: {
  save: SaveData;
  dispatch: Dispatch<Action>;
  debugMode: boolean;
  onToggleDebug(): void;
  onStartTour(): void;
}) {
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
            onStartTour();
          }}
        >
          Replay control room guide
        </button>
        <button
          onClick={() => {
            if (detailsRef.current) detailsRef.current.open = false;
            onToggleDebug();
          }}
        >
          Debug mode: {debugMode ? "On" : "Off"}
        </button>
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

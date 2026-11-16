import { useEffect, useRef, useState, type Dispatch } from "react";
import { allMissions, missions, regionOf, reviewMissions, systemOf, systemsIn } from "../content";
import { REGIONS } from "../content/regions";
import { SUPPORT_LEVELS, type SupportLevel } from "../content/parse";
import { comparePrediction } from "../game/predict";
import {
  codeFor,
  easierStart,
  isRestored,
  nextMission,
  regionEntry,
  SUPPORT_LABEL,
  supportChoice,
  supportFor,
  systemProgress,
} from "../game/rules";
import { parseSave, type Action, type Profile, type SaveData } from "../game/save";
import { passedAll } from "../python/harness";
import { PythonRunner, type RunnerStatus } from "../python/runner";
import { relay } from "../relay/session";
import { Bench, type RunMode, type RunRecord } from "./Bench";
import { Brief } from "./Brief";
import { Plant } from "./Plant";
import { maintenanceCalls } from "../game/maintenance";
import { Maintenance } from "./Maintenance";
import { SkillsDialog } from "./SkillsDialog";

// One interpreter for the whole session. Created lazily, outside React state,
// so StrictMode's double render doesn't start a second worker.
let sharedRunner: PythonRunner | null = null;
const getRunner = () => (sharedRunner ??= new PythonRunner());

let runCount = 0;

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
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);

  useEffect(() => getRunner().subscribe(setRunnerStatus), []);

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
  const regionSystems = systemsIn(region);
  const online = regionSystems.filter((s) => systemProgress(missions, s, save).state === "online").length;
  const assessment = missions.find((m) => m.assessment);

  const open = (missionId: string) => { setLastRun(null); dispatch({ type: "open", missionId }); };

  async function execute(requested: RunMode) {
    if (busy || (mission.reviewSkill && !review?.active)) return;
    const target = mission;
    // Predict missions only ever check: running the program would give the answer away.
    const predicting = target.kind === "predict";
    const mode: RunMode = predicting ? "submit" : requested;
    const prediction = predicting ? code : undefined;
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
      dispatch({ type: "review-submitted", skill: target.reviewSkill, missionId: target.id, round: review.round, passed });
      setNow(Date.now());
      return;
    }
    dispatch({ type: "submitted", missionId: target.id, passed, support: supportFor(target, save, allMissions), alsoRestores });

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
          <nav className="regions" aria-label="Regions">
            {REGIONS.map((r, i) => {
              const entry = regionEntry(missions, r.id, save);
              const here = r.id === region;
              return (
                <button
                  key={r.id}
                  className={`region${here ? " current" : ""}`}
                  aria-current={here ? "page" : undefined}
                  disabled={!entry}
                  title={entry ? undefined : `Opens when ${REGIONS[i - 1]?.name ?? "the previous region"} is fully online`}
                  onClick={() => entry && !here && open(entry.id)}
                >
                  {r.name}
                </button>
              );
            })}
          </nav>
          <span className="online-count">
            {online} of {regionSystems.length} systems online
          </span>
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
          <button className="quiet" onClick={() => setSkillsOpen(true)}>
            Skills
          </button>
          <ProgressMenu save={save} dispatch={dispatch} />
        </div>
      </header>

      <Maintenance calls={calls} now={now} dispatch={dispatch} onOpen={() => setLastRun(null)} />

      <main className="deck">
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
          easierStart={easierStart(mission, save, support)}
          onEasierStart={() => {
            const level = easierStart(mission, save, support);
            if (level) dispatch({ type: "pin-support", missionId: mission.id, support: level });
          }}
        />
        <Plant
          missions={missions}
          systems={regionSystems}
          save={save}
          mission={mission}
          energized={energized}
          run={run}
          onOpen={open}
        />
      </main>

      <SkillsDialog open={skillsOpen} missions={missions} reviews={reviewMissions} save={save} onClose={() => setSkillsOpen(false)} onOpen={open} />
    </div>
  );
}

function ProgressMenu({ save, dispatch }: { save: SaveData; dispatch: Dispatch<Action> }) {
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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
    <details className="menu">
      <summary>Progress</summary>
      <div className="menu-panel">
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
        <button onClick={() => dispatch({ type: "change-profile" })}>Change my experience answers</button>
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

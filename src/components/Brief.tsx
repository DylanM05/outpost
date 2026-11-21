import type { Dispatch } from "react";
import { allMissions } from "../content";
import type { Mission, System } from "../content/parse";
import { regionMeta } from "../content/regions";
import { SKILLS } from "../content/skills";
import {
  canSkipAhead,
  easierStart,
  hintsUnlocked,
  isRestored,
  isUnlocked,
  lessonStartsOpen,
  SUPPORT_LABEL,
  systemProgress,
  type SupportChoice,
} from "../game/rules";
import type { Action, SaveData } from "../game/save";
import { dueIn } from "../game/time";
import { EasierStartOffer } from "./EasierStartOffer";
import { Markdown } from "./Markdown";

interface Props {
  mission: Mission;
  missions: Mission[];
  system: System;
  save: SaveData;
  support: SupportChoice;
  assessment: Mission | undefined;
  dispatch: Dispatch<Action>;
  onOpen(missionId: string): void;
  onOpenAtlas(): void;
  onReplay(): void;
}

// Says why adaptive support moved, in terms of the mission that moved it.
function adaptation({ level, step }: SupportChoice): string | null {
  if (!step) return null;
  const from = allMissions.find((m) => m.id === step.missionId)?.title ?? "An earlier mission";
  return step.reason === "clean"
    ? `You solved ${from} without help, so this mission gives you less to start from: ${SUPPORT_LABEL[level]} support.`
    : `${from} took a few tries, so this mission gives you more to start from: ${SUPPORT_LABEL[level]} support.`;
}

export function Brief({
  mission,
  missions,
  system,
  save,
  support: choice,
  assessment,
  dispatch,
  onOpen,
  onOpenAtlas,
  onReplay,
}: Props) {
  if (mission.reviewSkill) return <MaintenanceBrief mission={mission} save={save} dispatch={dispatch} onOpen={onOpen} missions={missions} />;
  const support = choice.level;
  const restored = isRestored(save, mission.id);
  const progress = systemProgress(missions, system, save);
  const revealed = Math.min(save.hintsRevealed[mission.id] ?? 0, mission.hints.length);
  const submits = save.submits[mission.id] ?? 0;
  const nothingRestoredYet = Object.keys(save.completions).length === 0;
  const offerSkip = canSkipAhead(save.profile) && nothingRestoredYet && assessment && !mission.assessment;
  const adapted = mission.kind === "code" && choice.source === "adaptive" && !restored ? adaptation(choice) : null;
  const offerEasier = easierStart(mission, save, choice);
  const lessonOpen = lessonStartsOpen(mission, save, support);

  const region = regionMeta(mission.region);
  const regionMissions = missions.filter((m) => m.region === mission.region);
  const positionInRegion = regionMissions.indexOf(mission) + 1;
  const globalIndex = missions.indexOf(mission);
  const prevMission = globalIndex > 0 && isUnlocked(missions, save, globalIndex - 1) ? missions[globalIndex - 1] : null;
  const nextStep =
    globalIndex >= 0 && globalIndex + 1 < missions.length && isUnlocked(missions, save, globalIndex + 1)
      ? missions[globalIndex + 1]
      : null;

  return (
    <section className="brief" aria-labelledby="mission-title">
      <div className="brief-context">
        <button className="brief-region-link" onClick={onOpenAtlas}>
          <span className="act-plate">{region.act}</span>
          <span>{region.name}</span>
        </button>
        {positionInRegion > 0 && (
          <span className="brief-step-count">
            Mission {positionInRegion} of {regionMissions.length}
          </span>
        )}
      </div>

      <h1 id="mission-title">{mission.title}</h1>
      <p className="system-state">
        <span className={`dot ${progress.state}`} aria-hidden="true" />
        {progress.state === "online"
          ? `${system.name} is online`
          : progress.done > 0
            ? `${system.name} is offline, ${progress.done} of ${progress.total} repairs done`
            : `${system.name} is offline`}
      </p>

      {system.missions.length > 1 && (
        <ol className="repairs" aria-label={`${system.name} repairs`}>
          {system.missions.map((step) => {
            const state = isRestored(save, step.id)
              ? "done"
              : isUnlocked(missions, save, missions.indexOf(step))
                ? "open"
                : "locked";
            const here = step === mission;
            return (
              <li key={step.id} className={`repair ${state}${here ? " current" : ""}`} aria-current={here ? "step" : undefined}>
                {here || state === "locked" ? (
                  <span>{step.title}</span>
                ) : (
                  <button className="link" onClick={() => onOpen(step.id)}>
                    {step.title}
                  </button>
                )}
                {step.kind === "predict" && <span className="tag">Predict</span>}
                <span className="sr-only">{state === "done" ? ", done" : state === "locked" ? ", locked" : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      {offerSkip && (
        <div className="skip-ahead">
          <p>
            You said you can already program. You can go straight to the final mission. Passing it brings every system online
            at once.
          </p>
          <button onClick={() => onOpen(assessment.id)}>Open {assessment.title}</button>
        </div>
      )}

      {adapted && <p className="adapt-note">{adapted}</p>}

      {restored && (
        <div className="restored-note">
          <p>You've finished this repair. Replay it to solve it again from the start, with your hints cleared.</p>
          <button className="quiet" onClick={onReplay}>
            Replay this mission
          </button>
        </div>
      )}

      <Markdown source={mission.briefing} />

      <details className="lesson" key={`${mission.id}-${support}`} open={lessonOpen}>
        <summary>
          <span className="lesson-title">
            {mission.assessment ? "Reference" : "Lesson"}: {mission.skills.map((s) => SKILLS[s].name.toLowerCase()).join(", ")}
          </span>
          <span className="lesson-hint">
            {lessonOpen ? "Read this first, then take on the objective below." : "Open it if you'd like a refresher."}
          </span>
        </summary>
        <Markdown source={mission.concept} className="lesson-body" />
      </details>

      <div className="objective">
        <h2>Objective</h2>
        <Markdown source={mission.objective} />
      </div>

      <section className="hints" aria-labelledby="hints-title">
        <h2 id="hints-title">Hints</h2>
        {revealed > 0 && (
          <ol>
            {mission.hints.slice(0, revealed).map((hint) => (
              <li key={hint}>
                <Markdown source={hint} />
              </li>
            ))}
          </ol>
        )}
        {!hintsUnlocked(mission, save) ? (
          <p className="note">
            Hints unlock after your second submission{submits === 1 ? ". One more to go." : "."}
          </p>
        ) : revealed < mission.hints.length ? (
          <button className="quiet" onClick={() => dispatch({ type: "reveal-hint", missionId: mission.id })}>
            Show hint {revealed + 1} of {mission.hints.length}
          </button>
        ) : (
          <p className="note">That's every hint for this mission.</p>
        )}
        {offerEasier && (
          <EasierStartOffer
            level={offerEasier}
            onSwitch={() => dispatch({ type: "pin-support", missionId: mission.id, support: offerEasier })}
          />
        )}
        <p className="note">
          {support === "guided"
            ? "Guided missions count as practice. To demonstrate a skill, solve a mission at Standard or Challenge support without hints."
            : revealed > 0
              ? "This attempt counts as practice now. Replay the mission later without hints to demonstrate the skill."
              : "Hints are always fine to use. Solving this without them demonstrates the skill."}
        </p>
      </section>

      {(prevMission || nextStep) && (
        <nav className="mission-pager" aria-label="Adjacent missions">
          {prevMission ? (
            <button className="pager-btn prev" onClick={() => onOpen(prevMission.id)}>
              <span className="pager-dir">Previous</span>
              <span className="pager-title">{prevMission.title}</span>
            </button>
          ) : (
            <span />
          )}
          {nextStep && (
            <button className="pager-btn next" onClick={() => onOpen(nextStep.id)}>
              <span className="pager-dir">Next</span>
              <span className="pager-title">{nextStep.title}</span>
            </button>
          )}
        </nav>
      )}
    </section>
  );
}

function MaintenanceBrief({
  mission,
  save,
  dispatch,
  onOpen,
  missions,
}: Pick<Props, "mission" | "save" | "dispatch" | "onOpen" | "missions">) {
  const state = save.reviews[mission.reviewSkill!];
  const revealed = Math.min(save.hintsRevealed[mission.id] ?? 0, mission.hints.length);
  const campaign = missions.find((m) => !isRestored(save, m.id)) ?? missions[0];

  return (
    <section className="brief" aria-labelledby="mission-title">
      <h1 id="mission-title">{mission.title}</h1>
      <p className="system-state">
        <span className={`dot ${state?.active ? "underway" : "online"}`} aria-hidden="true" />
        Maintenance call at the {mission.system.toLowerCase()}
      </p>

      {state?.active ? (
        <p className="call-note">Solve this new fault from what you remember. There's no lesson here, but documentation is welcome.</p>
      ) : (
        <div className="restored-note" role="status">
          <p>
            Maintenance complete. The next call for this skill arrives {state ? dueIn(state.dueAt, Date.now()) : "later"}. Open
            Skills to see your evidence.
          </p>
        </div>
      )}
      <button className="quiet return-button" onClick={() => onOpen(campaign.id)}>
        Return to campaign
      </button>

      <Markdown source={mission.briefing} />
      <div className="objective">
        <h2>Objective</h2>
        <Markdown source={mission.objective} />
      </div>

      <section className="hints" aria-labelledby="hints-title">
        <h2 id="hints-title">Need a reminder?</h2>
        {revealed > 0 && (
          <ol>
            {mission.hints.slice(0, revealed).map((hint) => (
              <li key={hint}>
                <Markdown source={hint} />
              </li>
            ))}
          </ol>
        )}
        {revealed < mission.hints.length && (
          <button
            className="quiet"
            disabled={!state?.active}
            onClick={() => dispatch({ type: "reveal-hint", missionId: mission.id })}
          >
            Show hint {revealed + 1} of {mission.hints.length}
          </button>
        )}
        <p className="note">
          Hints make this call practice, and so do three or more submissions. Either way, the call comes back sooner. Nothing you've
          already earned is taken away.
        </p>
      </section>
    </section>
  );
}

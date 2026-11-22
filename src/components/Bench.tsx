import { lazy, Suspense } from "react";
import type { Mission, SupportLevel } from "../content/parse";
import { comparePrediction } from "../game/predict";
import { SUPPORT_LABEL, type SupportChoice } from "../game/rules";
import type { Confidence } from "../game/save";
import { passedAll, type RunResult } from "../python/harness";
import type { RunnerStatus, RunOutcome } from "../python/runner";
import { CodeEditor } from "./CodeEditor";
import { ConfidencePicker } from "./ConfidencePicker";
import { EasierStartOffer } from "./EasierStartOffer";
import { ErrorBox, MOD_KEY, Output, RestoredBanner, RunProblem, Tests } from "./Results";

// The terminal and its emulator load only when a terminal mission opens.
const TerminalBench = lazy(() => import("./TerminalBench").then((module) => ({ default: module.TerminalBench })));

export type RunMode = "run" | "submit";

export interface RunRecord {
  missionId: string;
  mode: RunMode;
  outcome: RunOutcome;
  key: number;
  // Predict missions: what the player had typed when they checked.
  prediction?: string;
}

export interface BenchProps {
  mission: Mission;
  code: string;
  edited: boolean;
  completed?: boolean;
  support: SupportChoice;
  busy: RunMode | null;
  runnerStatus: RunnerStatus;
  run: RunRecord | null;
  // Whether this mission's system is fully online after the latest submit.
  systemOnline: boolean;
  next: Mission | null;
  onEdit(code: string): void;
  onReset(): void;
  onExecute(mode: RunMode): void;
  onOpen(missionId: string): void;
  confidence: Confidence | null;
  onConfidence(confidence: Confidence | null): void;
  // Set after several failed submissions, when a more complete starter exists.
  easierStart: SupportLevel | null;
  onEasierStart(): void;
}

export function shouldShowConfidence(mission: Mission, support: SupportChoice, completed?: boolean): boolean {
  if (completed) return false;
  return support.level !== "guided" || Boolean(mission.reviewSkill) || mission.assessment || mission.kind === "predict";
}

export function Bench(props: BenchProps) {
  switch (props.mission.kind) {
    case "predict":
      return <PredictBench {...props} />;
    case "terminal":
      return (
        <Suspense fallback={<section className="bench" aria-label="Relay terminal" aria-busy="true" />}>
          <TerminalBench {...props} />
        </Suspense>
      );
    case "code":
      return <CodeBench {...props} />;
  }
}

function CodeBench(props: BenchProps) {
  const { mission, run, busy } = props;
  const error = run?.outcome.kind === "finished" ? run.outcome.result.error : null;
  const fileName = mission.language === "javascript" ? "main.js" : "main.py";

  return (
    <section className="bench" aria-label="Code">
      <div className="bench-head">
        <span className="file-tab">{fileName}</span>
        <span className="support-note">
          {supportNote(props.support)}
        </span>
        <button
          className="quiet"
          title="Restore this mission's starter code"
          onClick={props.onReset}
          disabled={!props.edited || props.completed}
        >
          Reset code
        </button>
      </div>

      <CodeEditor
        docKey={mission.id}
        value={props.code}
        language={mission.language}
        label={`${fileName} for ${mission.title}`}
        errorLine={error?.line ?? null}
        runKey={run?.key}
        onChange={props.onEdit}
        onRun={() => props.onExecute("run")}
        onSubmit={() => props.onExecute("submit")}
      />

      <div className="controls" data-tour="bench-controls">
        <button
          className="run"
          disabled={busy !== null || props.completed}
          title="Try your code against the visible examples without recording a submission"
          onClick={() => props.onExecute("run")}
        >
          Run <kbd>{MOD_KEY}+Enter</kbd>
        </button>
        <button
          className="submit"
          disabled={busy !== null || props.completed}
          title="Run all tests including hidden edge cases to finish the repair"
          onClick={() => props.onExecute("submit")}
        >
          Submit <kbd>{MOD_KEY}+Shift+Enter</kbd>
        </button>
        {shouldShowConfidence(mission, props.support, props.completed) && (
          <ConfidencePicker value={props.confidence} disabled={busy !== null} onChange={props.onConfidence} />
        )}
        <RunnerNote status={props.runnerStatus} busy={busy} language={mission.language} />
      </div>

      <div className="results" aria-live="polite">
        <CodeResults {...props} />
      </div>
    </section>
  );
}

function PredictBench(props: BenchProps) {
  const { mission, busy } = props;
  const check = () => props.onExecute("submit");
  const fileName = mission.language === "javascript" ? "main.js" : "main.py";

  return (
    <section className="bench" aria-label="Program and prediction">
      <div className="bench-head">
        <span className="file-tab">{fileName}</span>
        <span className="support-note">Read only</span>
      </div>

      <CodeEditor
        className="compact"
        readOnly
        docKey={mission.id}
        value={mission.program}
        language={mission.language}
        label={`Program for ${mission.title}, read only`}
        errorLine={null}
        runKey={undefined}
        onChange={() => {}}
        onRun={check}
        onSubmit={check}
      />

      <div className="prediction">
        <div className="prediction-head">
          <label htmlFor="prediction">Your prediction</label>
          <button className="quiet" onClick={props.onReset} disabled={!props.edited || props.completed}>
            Clear
          </button>
        </div>
        <textarea
          id="prediction"
          rows={6}
          value={props.code}
          placeholder="Type exactly what the program prints, one line at a time."
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          onChange={(e) => props.onEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              check();
            }
          }}
        />
        <p className="note">Capital letters, spaces within a line, and blank lines all count.</p>
      </div>

      <div className="controls" data-tour="bench-controls">
        <button className="submit" onClick={check} disabled={busy !== null || props.completed}>
          Check prediction <kbd>{MOD_KEY}+Enter</kbd>
        </button>
        {shouldShowConfidence(mission, props.support, props.completed) && (
          <ConfidencePicker value={props.confidence} disabled={busy !== null} onChange={props.onConfidence} />
        )}
        <RunnerNote status={props.runnerStatus} busy={busy} language={mission.language} />
      </div>

      <div className="results" aria-live="polite">
        <PredictResults {...props} />
      </div>
    </section>
  );
}

function supportNote({ level, source }: SupportChoice): string {
  switch (source) {
    case "assessment":
      return "Independent mission";
    case "maintenance":
      return "Maintenance call";
    case "adaptive":
      return `${SUPPORT_LABEL[level]} support, adapted to your progress`;
    case "mission":
      return `${SUPPORT_LABEL[level]} support for this mission`;
    case "fixed":
      return `${SUPPORT_LABEL[level]} support`;
  }
}

function RunnerNote({ status, busy, language }: { status: RunnerStatus; busy: RunMode | null; language: Mission["language"] }) {
  const runtime = language === "javascript" ? "JavaScript" : "Python";
  if (status === "loading" && busy === null) return <span className="runner-state">{runtime} is starting…</span>;
  if (status === "unavailable") {
    return <span className="runner-state fault">{runtime} couldn't start. Reload the page to try again.</span>;
  }
  return null;
}

function CodeResults({ mission, run, busy, runnerStatus, systemOnline, next, onOpen, easierStart, onEasierStart }: BenchProps) {
  const runtime = mission.language === "javascript" ? "JavaScript" : "Python";
  if (busy) {
    return (
      <p className="status">
        {runnerStatus === "loading"
          ? `Starting ${runtime}. The first run takes a few seconds.`
          : busy === "submit"
            ? "Running every test, including the hidden ones…"
            : "Running your code…"}
      </p>
    );
  }

  if (!run) {
    return (
      <p className="status muted">
        Press Run to try your code against the examples. Press Submit when you're ready to finish the repair.
      </p>
    );
  }

  const { outcome, mode } = run;
  if (outcome.kind !== "finished") return <RunProblem outcome={outcome} language={mission.language} />;

  const { result } = outcome;
  const testsFirst = mission.scene !== "console";

  return (
    <>
      {mode === "submit" && passedAll(result) ? (
        <RestoredBanner mission={mission} systemOnline={systemOnline} next={next} onOpen={onOpen} />
      ) : (
        <p className="status">{summary(mission, mode, result)}</p>
      )}
      {mode === "submit" && easierStart && <EasierStartOffer level={easierStart} onSwitch={onEasierStart} />}
      {result.error && <ErrorBox error={result.error} language={mission.language} />}
      {testsFirst && <Tests result={result} />}
      <Output result={result} />
      {!testsFirst && <Tests result={result} />}
    </>
  );
}

function PredictResults({ mission, run, busy, runnerStatus, systemOnline, next, onOpen }: BenchProps) {
  const runtime = mission.language === "javascript" ? "JavaScript" : "Python";
  if (busy) {
    return (
      <p className="status">
        {runnerStatus === "loading" ? `Starting ${runtime}. The first check takes a few seconds.` : "Running the program…"}
      </p>
    );
  }

  if (!run) {
    return (
      <p className="status muted">
        Work out what the program prints, type it above, then check your prediction. There's no Run button here: tracing
        the code in your head is the exercise.
      </p>
    );
  }

  const { outcome } = run;
  if (outcome.kind !== "finished") return <RunProblem outcome={outcome} language={mission.language} />;

  const { result } = outcome;
  if (result.error) {
    return (
      <>
        <p className="status">The program itself failed, so this mission has a fault. Please report it.</p>
        <ErrorBox error={result.error} language={mission.language} />
      </>
    );
  }

  const comparison = comparePrediction(run.prediction ?? "", result.stdout);
  if (comparison.passed) {
    return (
      <>
        <RestoredBanner mission={mission} systemOnline={systemOnline} next={next} onOpen={onOpen} />
        <Output result={result} title="The program printed" />
      </>
    );
  }

  const { matched, expectedCount, predictedCount } = comparison;
  const lineWord = (n: number) => (n === 1 ? "line" : "lines");
  return (
    <>
      <p className="status">
        {predictedCount === 0
          ? "Type your prediction above, then check it."
          : `${matched} of ${expectedCount} ${lineWord(expectedCount)} match.` +
            (predictedCount !== expectedCount
              ? ` The program prints ${expectedCount} ${lineWord(expectedCount)}, and your prediction has ${predictedCount}.`
              : "")}
      </p>
      {predictedCount > 0 && (
        <section className="tests">
          <h3>Your prediction, line by line</h3>
          <ul>
            {comparison.lines.map((line, i) => (
              <li key={i} className={line.matches ? "pass" : "fail"}>
                <span className="lamp-dot" aria-hidden="true" />
                <div>
                  <span className="sr-only">{line.matches ? "Matches: " : "Doesn't match: "}</span>
                  {line.predicted === null ? (
                    <span className="muted">A line is missing here.</span>
                  ) : line.predicted === "" ? (
                    <span className="muted">(blank line)</span>
                  ) : (
                    <code>{line.predicted}</code>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function summary(mission: Mission, mode: RunMode, result: RunResult): string {
  if (result.error) return "Your code stopped before the tests could run.";
  const passed = result.checks.filter((c) => c.passed).length;
  const total = result.checks.length;
  if (passed === total) {
    return mission.hiddenChecks.trim()
      ? "The examples pass. Submit to run the hidden tests and finish the repair."
      : "That works. Submit to finish the repair.";
  }
  const counted = `${passed} of ${total} tests passed.`;
  return mode === "submit" ? `${counted} The repair isn't finished yet.` : counted;
}

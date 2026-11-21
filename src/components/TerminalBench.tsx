import { useEffect, useSyncExternalStore } from "react";
import type { Mission } from "../content/parse";
import { passedAll, type RunResult } from "../python/harness";
import { relay, type RelayStatus } from "../relay/session";
import { shouldShowConfidence, type BenchProps, type RunMode } from "./Bench";
import { ConfidencePicker } from "./ConfidencePicker";
import { RelayTerminal } from "./RelayTerminal";
import { MOD_KEY, RestoredBanner, RunProblem, Tests } from "./Results";

const megabytes = (bytes: number) => (bytes / 1e6).toFixed(1);

// A terminal mission: the player works in the relay terminal, a real Linux
// shell, and Check looks at what they've done to the machine.
export function TerminalBench(props: BenchProps) {
  const { mission, busy } = props;
  const status = useSyncExternalStore(relay.subscribe, relay.getStatus);
  useEffect(() => void relay.open(mission), [mission]);

  // Until this mission's files are in place, the terminal still shows the last one.
  const ready = status.kind === "ready" && status.missionId === mission.id;
  const blocked = busy !== null || !ready || props.completed;
  const check = () => !blocked && props.onExecute("run");
  const submit = () => !blocked && props.onExecute("submit");
  const startOver = () => {
    if (window.confirm("Start this mission over? Every file goes back to how it began, and the terminal restarts.")) {
      void relay.reset(mission);
    }
  };

  return (
    <section className="bench" aria-label="Relay terminal">
      <div className="bench-head">
        <span className="file-tab">ranger@relay</span>
        <span className="support-note">{mission.reviewSkill ? "Maintenance call" : "Relay terminal"}</span>
        <button className="quiet" onClick={startOver} disabled={busy !== null || status.kind === "loading" || status.kind === "preparing" || props.completed}>
          Start over
        </button>
      </div>

      <div className="relay-terminal">
        <RelayTerminal label={`Relay terminal for ${mission.title}`} onCheck={check} onSubmit={submit} />
        {!ready && (
          <TerminalStatus status={status.kind === "ready" ? { kind: "preparing" } : status} onRetry={() => void relay.open(mission)} />
        )}
      </div>

      {mission.report && (
        <div className="report">
          <label htmlFor="report">{mission.report.question}</label>
          <input
            id="report"
            value={props.code}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => props.onEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey || e.metaKey || e.ctrlKey) submit();
                else check();
              }
            }}
          />
        </div>
      )}

      <div className="controls" data-tour="bench-controls">
        <button
          className="run"
          disabled={blocked}
          title="Check what you've done on the relay machine without recording a submission"
          onClick={check}
        >
          Check <kbd>{MOD_KEY}+Enter</kbd>
        </button>
        <button
          className="submit"
          disabled={blocked}
          title="Run all checks including hidden ones to finish the mission"
          onClick={submit}
        >
          Submit <kbd>{MOD_KEY}+Shift+Enter</kbd>
        </button>
        {shouldShowConfidence(mission, props.support, props.completed) && (
          <ConfidencePicker value={props.confidence} disabled={blocked} onChange={props.onConfidence} />
        )}
      </div>

      <div className="results" aria-live="polite">
        <TerminalResults {...props} />
      </div>
    </section>
  );
}

function TerminalStatus({ status, onRetry }: { status: RelayStatus; onRetry(): void }) {
  if (status.kind === "failed") {
    return (
      <div className="relay-status fault" role="alert">
        <p>{status.message}</p>
        <button onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (status.kind === "preparing") {
    return (
      <div className="relay-status" role="status">
        <p>Setting up the relay…</p>
      </div>
    );
  }
  const loading = status.kind === "loading" ? status : { loaded: 0, total: 0 };
  return (
    <div className="relay-status" role="status">
      <p>Connecting to the relay…</p>
      {loading.total > 0 && (
        <>
          <progress max={loading.total} value={loading.loaded} />
          <p className="note">
            {megabytes(loading.loaded)} of {megabytes(loading.total)} MB
          </p>
        </>
      )}
      <p className="note">
        The relay terminal is a small Linux computer that runs inside this page. It downloads once, then starts in a few
        seconds.
      </p>
    </div>
  );
}

function TerminalResults({ mission, run, busy, systemOnline, next, onOpen }: BenchProps) {
  if (busy) {
    return <p className="status">{busy === "submit" ? "Running every check, including the hidden ones…" : "Checking the relay…"}</p>;
  }
  if (!run) {
    return (
      <p className="status muted">
        Type commands in the terminal and press Enter to run them. Press Check to see how the job is going, and Submit
        when it's done.
      </p>
    );
  }
  const { outcome, mode } = run;
  if (outcome.kind !== "finished") return <RunProblem outcome={outcome} relay />;
  const { result } = outcome;
  if (result.error) {
    return (
      <div className="fault-box">
        <h3>This mission's checks couldn't run</h3>
        <p className="mono">{result.error.message}</p>
        <p>That's a fault in the mission, not in your work. Please report it.</p>
      </div>
    );
  }
  return (
    <>
      {mode === "submit" && passedAll(result) ? (
        <RestoredBanner mission={mission} systemOnline={systemOnline} next={next} onOpen={onOpen} />
      ) : (
        <p className="status">{summary(mission, mode, result)}</p>
      )}
      <Tests result={result} checks />
    </>
  );
}

function summary(mission: Mission, mode: RunMode, result: RunResult): string {
  const passed = result.checks.filter((c) => c.passed).length;
  const total = result.checks.length;
  if (passed === total) {
    return mission.hiddenChecks.trim()
      ? "Everything checks out so far. Submit to run the hidden checks and finish the job."
      : "Everything checks out. Submit to finish the job.";
  }
  const counted = `${passed} of ${total} checks passed.`;
  return mode === "submit" ? `${counted} The job isn't finished yet.` : counted;
}

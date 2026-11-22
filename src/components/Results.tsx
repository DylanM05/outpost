import type { Mission } from "../content/parse";
import { explainError } from "../game/errors";
import type { RunError, RunResult } from "../python/harness";
import type { RunOutcome } from "../python/runner";
import { Markdown } from "./Markdown";

// Pieces of the results panel that code, predict, and terminal missions share.

export const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

export function RestoredBanner({
  mission,
  systemOnline,
  next,
  onOpen,
}: {
  mission: Mission;
  systemOnline: boolean;
  next: Mission | null;
  onOpen(missionId: string): void;
}) {
  return (
    <div className="restored-box" role="status">
      <h3>{mission.reviewSkill ? "Maintenance complete" : systemOnline ? `${mission.system} is back online` : "Repair done"}</h3>
      <Markdown source={mission.restored} />
      {next ? (
        <button className="primary" onClick={() => onOpen(next.id)}>
          Next mission: {next.title}
        </button>
      ) : mission.reviewSkill ? (
        <p>Choose another ready maintenance call, or return to the campaign.</p>
      ) : (
        <p>
          Every system is online. Open Skills to see what you've demonstrated, and replay any mission
          without help to prove the rest.
        </p>
      )}
    </div>
  );
}

export function RunProblem({
  outcome,
  relay = false,
  language = "python",
}: {
  outcome: Exclude<RunOutcome, { kind: "finished" }>;
  relay?: boolean;
  language?: Mission["language"];
}) {
  if (outcome.kind === "timeout") {
    return (
      <div className="fault-box">
        <h3>Stopped after {outcome.seconds} seconds</h3>
        <p>
          Your program didn't finish, so the terminal stopped it. This usually means a loop that never ends, or one that does
          far more work than it needs to. Check that every
          loop has a way to finish.
        </p>
      </div>
    );
  }
  const runtimeLabel = relay ? "The relay terminal" : language === "javascript" ? "JavaScript" : "Python";
  return (
    <div className="fault-box">
      <h3>{runtimeLabel} stopped unexpectedly</h3>
      <p className="mono">{outcome.message}</p>
      <p>Try again to restart it.</p>
    </div>
  );
}

export function ErrorBox({ error, language = "python" }: { error: RunError; language?: Mission["language"] }) {
  return (
    <div className="fault-box">
      <h3>
        {error.type}
        {error.line ? ` on line ${error.line}` : ""}
      </h3>
      <p className="mono">{error.message}</p>
      <p>{explainError(error.type, language)}</p>
    </div>
  );
}

// Code missions have tests, labelled with the code they run. Terminal
// missions have checks, labelled with what they look for.
export function Tests({ result, checks = false }: { result: RunResult; checks?: boolean }) {
  if (result.checks.length === 0) return null;
  return (
    <section className="tests">
      <h3>{checks ? "Checks" : "Tests"}</h3>
      <ul>
        {result.checks.map((check, i) => (
          <li key={i} className={check.passed ? "pass" : "fail"}>
            <span className="lamp-dot" aria-hidden="true" />
            <div>
              <span className="sr-only">{check.passed ? "Passed: " : "Failed: "}</span>
              {checks ? <span className="check-label">{check.label}</span> : <code>{check.label}</code>}
              {check.hidden && <span className="tag">{checks ? "Hidden check" : "Hidden test"}</span>}
              {check.detail && <p className="detail">{check.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Output({ result, title = "Output" }: { result: RunResult; title?: string }) {
  return (
    <section className="output">
      <h3>{title}</h3>
      {result.stdout ? <pre>{result.stdout}</pre> : <p className="muted">Your program didn't print anything.</p>}
      {result.stdoutTruncated && <p className="muted">The output was cut off after 20,000 characters.</p>}
    </section>
  );
}

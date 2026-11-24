import type { Mission } from "../content/parse";
import { explainError } from "../game/errors";
import type { RunError, RunResult, TelemetryEvent } from "../python/harness";
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
  const runtimeLabel = relay
    ? "The relay terminal"
    : language === "javascript"
      ? "JavaScript"
      : language === "typescript"
        ? "TypeScript"
        : language === "sql"
          ? "SQLite"
          : "Python";
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
interface ParsedDiff {
  expected: string;
  got: string;
  note: string;
}

function advanceScan(text: string, i: number, stack: string[], quote: string | null): string | null {
  const ch = text[i];
  if (quote) return ch === quote ? null : quote;
  if (ch === "'" || ch === '"' || ch === "`") {
    if (ch === "'" && i > 0 && /[A-Za-z0-9]/.test(text[i - 1])) return null;
    return ch;
  }
  if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
  else if ((ch === ")" && stack.at(-1) === "(") || (ch === "]" && stack.at(-1) === "[") || (ch === "}" && stack.at(-1) === "{")) {
    stack.pop();
  }
  return null;
}

function parseExpectedGot(detail: string): ParsedDiff | null {
  const prefix = detail.match(/^[Ee]xpected /);
  if (!prefix) return null;
  let stack: string[] = [];
  let quote: string | null = null;
  let splitAt = -1;
  for (let i = prefix[0].length; i < detail.length; i++) {
    if (!quote && stack.length === 0 && detail.startsWith(", got ", i)) {
      splitAt = i;
      break;
    }
    if (quote && detail[i] === "\\" && i + 1 < detail.length) {
      i++;
      continue;
    }
    quote = advanceScan(detail, i, stack, quote);
  }
  if (splitAt === -1) return null;
  const expected = detail.slice(prefix[0].length, splitAt).trim();
  const restStart = splitAt + ", got ".length;
  stack = [];
  quote = null;
  let endGot = detail.length;
  for (let i = restStart; i < detail.length; i++) {
    if (!quote && stack.length === 0 && detail[i] === ".") {
      const next = detail[i + 1];
      const isEllipsis = next === "." || (i > restStart && detail[i - 1] === ".");
      if (!isEllipsis && (next === undefined || next === " ")) {
        endGot = i;
        break;
      }
    }
    if (quote && detail[i] === "\\" && i + 1 < detail.length) {
      i++;
      continue;
    }
    quote = advanceScan(detail, i, stack, quote);
  }
  const got = detail.slice(restStart, endGot).trim();
  if (!expected || !got) return null;
  const note = endGot < detail.length ? detail.slice(endGot + 1).trim() : "";
  return { expected, got, note };
}

interface SqlTableData {
  columns: string[];
  rows: unknown[][];
  totalRows: number;
  truncated: boolean;
}

function sqlTablesFrom(events: TelemetryEvent[]): SqlTableData[] {
  const out: SqlTableData[] = [];
  for (const ev of events) {
    if (ev.kind !== "sql_table") continue;
    const { columns, rows, totalRows, truncated } = ev.data;
    if (!Array.isArray(columns) || columns.length === 0 || !Array.isArray(rows)) continue;
    out.push({
      columns: columns as string[],
      rows: rows as unknown[][],
      totalRows: typeof totalRows === "number" ? totalRows : rows.length,
      truncated: Boolean(truncated),
    });
  }
  return out;
}

export function Tests({ result, checks = false }: { result: RunResult; checks?: boolean }) {
  if (result.checks.length === 0) return null;
  return (
    <section className="tests">
      <h3>{checks ? "Checks" : "Tests"}</h3>
      <ul>
        {result.checks.map((check, i) => {
          const diff = !check.passed && check.detail ? parseExpectedGot(check.detail) : null;
          return (
            <li key={i} className={check.passed ? "pass" : "fail"}>
              <span className="lamp-dot" aria-hidden="true" />
              <div>
                <span className="sr-only">{check.passed ? "Passed: " : "Failed: "}</span>
                {checks ? <span className="check-label">{check.label}</span> : <code>{check.label}</code>}
                {check.hidden && <span className="tag">{checks ? "Hidden check" : "Hidden test"}</span>}
                {diff ? (
                  <>
                    <dl className="test-diff">
                      <div>
                        <dt>Expected</dt>
                        <dd>
                          <code>{diff.expected}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Got</dt>
                        <dd>
                          <code>{diff.got}</code>
                        </dd>
                      </div>
                    </dl>
                    {diff.note && <p className="detail">{diff.note}</p>}
                  </>
                ) : (
                  check.detail && <p className="detail">{check.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Output({
  result,
  title = "Output",
  plain = false,
}: {
  result: RunResult;
  title?: string;
  plain?: boolean;
}) {
  const tables = plain ? [] : sqlTablesFrom(result.events);
  return (
    <section className="output">
      <h3>{title}</h3>
      {tables.length > 0 ? (
        tables.map((table, t) => (
          <div
            key={t}
            className="sql-table-wrap"
            role="region"
            tabIndex={0}
            aria-label={tables.length > 1 ? `${title} table ${t + 1}` : title}
          >
            <table className="sql-result-table">
              <caption className="sql-table-meta">
                {table.truncated
                  ? `Showing ${table.rows.length} of ${table.totalRows} rows`
                  : `${table.totalRows} ${table.totalRows === 1 ? "row" : "rows"}`}
              </caption>
              <thead>
                <tr>
                  {table.columns.map((col, i) => (
                    <th key={i} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.length === 0 ? (
                  <tr>
                    <td className="sql-empty" colSpan={table.columns.length}>
                      0 rows returned
                    </td>
                  </tr>
                ) : (
                  table.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>
                          {cell === null || cell === undefined ? <span className="sql-null">NULL</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <>
          {result.stdout ? <pre>{result.stdout}</pre> : <p className="muted">Your program didn't print anything.</p>}
          {result.stdoutTruncated && <p className="muted">The output was cut off after 20,000 characters.</p>}
        </>
      )}
    </section>
  );
}

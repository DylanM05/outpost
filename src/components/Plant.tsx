import { useEffect, useState, useSyncExternalStore } from "react";
import type { Mission, System } from "../content/parse";
import type { Region } from "../content/regions";
import type { TelemetryEvent } from "../python/harness";
import type { SaveData } from "../game/save";
import { relay, type FileEntry } from "../relay/session";
import type { RunRecord } from "./Bench";
import { Markdown } from "./Markdown";
import { RepoScene } from "./RepoScene";
import { Schematic } from "./Schematic";

interface Props {
  missions: Mission[];
  systems: System[];
  region: Region;
  save: SaveData;
  mission: Mission;
  energized: string | null;
  run: RunRecord | null;
  onOpen(missionId: string): void;
}

export function Plant({ missions, systems, region, save, mission, energized, run, onOpen }: Props) {
  const events = run?.outcome.kind === "finished" ? run.outcome.result.events : [];
  const hasLiveScene =
    mission.scene === "drone" ||
    mission.scene === "sort" ||
    mission.scene === "calls" ||
    mission.scene === "grid" ||
    mission.scene === "files" ||
    mission.scene === "repo" ||
    mission.scene === "work";

  const liveScene = (
    <>
      {mission.scene === "drone" && <DroneTelemetry events={events} />}
      {mission.scene === "sort" && <SortBars events={events} />}
      {mission.scene === "calls" && <CallTree events={events} />}
      {mission.scene === "grid" && <GridScene events={events} />}
      {mission.scene === "files" && <FilesScene />}
      {mission.scene === "repo" && <RepoScene />}
      {(mission.scene === "work" || mission.scene === "sort" || mission.scene === "calls" || mission.scene === "grid") && (
        <WorkMeter events={events} hideWhenEmpty={mission.scene !== "work"} />
      )}
    </>
  );

  const board = (
    <Schematic
      missions={missions}
      systems={systems}
      save={save}
      act={region.act}
      title={region.name}
      currentSystem={mission.system}
      energized={energized}
      onOpen={onOpen}
    />
  );

  return (
    <aside className="plant" aria-label="Outpost">
      {hasLiveScene ? (
        <>
          {liveScene}
          {board}
        </>
      ) : (
        board
      )}
      <StationLog missions={systems.flatMap((s) => s.missions)} save={save} />
    </aside>
  );
}

const count = new Intl.NumberFormat("en");

// Reads, or comparisons, against the budget for each work-budget test. Bars
// use a log scale so a budget of 40 is still visible next to a million reads;
// the text gives the real numbers.
function WorkMeter({ events, hideWhenEmpty = false }: { events: TelemetryEvent[]; hideWhenEmpty?: boolean }) {
  const rows = events.filter((e) => e.kind === "work" || (e.kind === "sort" && typeof e.data.budget === "number"));
  if (hideWhenEmpty && rows.length === 0) return null;
  return (
    <section className="work" aria-labelledby="work-title">
      <h2 id="work-title" className="panel-title">
        Work meter
      </h2>
      {rows.length === 0 ? (
        <p className="muted">Run your code to see how many items it reads, compared with the budget.</p>
      ) : (
        <ul className="work-rows">
          {rows.map((event, i) => {
            const looks = Number(event.data.looks);
            const budget = Number(event.data.budget);
            const scale = (n: number) => Math.log10(n + 1);
            const top = Math.max(scale(looks), scale(budget)) || 1;
            const over = looks > budget;
            const times = looks / Math.max(budget, 1);
            return (
              <li key={i} className={over ? "over" : "within"}>
                <code>{String(event.data.label)}</code>
                <div className="meter" aria-hidden="true">
                  <span className="meter-fill" style={{ width: `${(scale(looks) / top) * 100}%` }} />
                  <span className="meter-limit" style={{ left: `${(scale(budget) / top) * 100}%` }} />
                </div>
                <span className="meter-text">
                  {count.format(looks)} {String(event.data.unit ?? "reads")}, budget {count.format(budget)}
                  {over && `: ${times >= 10 ? count.format(Math.round(times)) : times.toFixed(1)} times over`}
                </span>
                {event.data.hidden && <span className="tag">Hidden test</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// The grid each visible test explored: cells light up in the order the code
// first read them, and a route the code returned is drawn on top at the end.
function GridScene({ events }: { events: TelemetryEvent[] }) {
  const grids = events.filter((e) => e.kind === "grid" && !e.data.hidden && Array.isArray(e.data.rows));
  return (
    <section className="ridge" aria-labelledby="ridge-title">
      <h2 id="ridge-title" className="panel-title">
        Ridge map
      </h2>
      {grids.length === 0 ? (
        <p className="muted">Run your code to see which cells it reads, in order, and any route it returns.</p>
      ) : (
        grids.map((event, i) => <GridReplay key={i} data={event.data} />)
      )}
    </section>
  );
}

function asPath(value: unknown, rows: string[]): Point[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const points = value.map(asPoint);
  if (points.some((p) => p === null)) return null;
  const inside = (points as Point[]).every(([r, c]) => r >= 0 && r < rows.length && c >= 0 && c < rows[r].length);
  return inside ? (points as Point[]) : null;
}

function GridReplay({ data }: { data: TelemetryEvent["data"] }) {
  const rows = data.rows as string[];
  const order = (Array.isArray(data.order) ? data.order : []) as Point[];
  const path = asPath(data.result, rows);
  const last = order.length;
  const [step, setStep] = useState(last);
  const [playing, setPlaying] = useState(false);
  // About three seconds however big the map: big maps light several cells a frame.
  const stride = Math.max(1, Math.ceil(last / 180));
  const delay = Math.min(120, Math.max(16, 3000 / Math.max(Math.ceil(last / stride), 1)));

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setStep(reduce ? last : 0);
    setPlaying(!reduce && last > 0);
  }, [data, last]);

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((s) => Math.min(s + stride, last)), delay);
    return () => window.clearTimeout(timer);
  }, [playing, step, last, delay, stride]);

  const shown = Math.min(step, last);
  const done = shown >= last;
  const seen = new Map(order.slice(0, shown).map(([r, c], i) => [`${r},${c}`, i]));
  const columns = Math.max(...rows.map((row) => row.length), 1);
  const size = Math.max(10, Math.min(30, Math.floor(340 / columns)));
  const center = ([r, c]: Point) => `${c * size + size / 2},${r * size + size / 2}`;
  const looks = Number(data.looks);
  const verdict = data.passed
    ? "Passed."
    : data.error
      ? "Your code raised an error."
      : `Your code returned ${JSON.stringify(data.result)}.`;

  return (
    <figure className={`grid-replay${done ? (data.passed ? " pass" : " fail") : ""}`}>
      <svg
        viewBox={`0 0 ${columns * size} ${rows.length * size}`}
        width={columns * size + 12}
        role="img"
        aria-label={`${rows.length} by ${columns} grid. ${shown} of ${last} cells read so far.`}
      >
        {rows.flatMap((row, r) =>
          [...row].map((cell, c) => {
            const index = seen.get(`${r},${c}`);
            const kind = cell === "#" ? "wall" : cell === "~" ? "ice" : "open";
            const classes = ["cell", kind, index !== undefined && "seen", index === shown - 1 && !done && "now"];
            return (
              <g key={`${r},${c}`}>
                <rect className={classes.filter(Boolean).join(" ")} x={c * size + 1} y={r * size + 1} width={size - 2} height={size - 2} rx={2} />
                {/[A-Za-z0-9]/.test(cell) && (
                  <text className="cell-label" x={c * size + size / 2} y={r * size + size / 2} fontSize={size * 0.55}>
                    {cell}
                  </text>
                )}
              </g>
            );
          }),
        )}
        {done && path && <polyline className="grid-path" points={path.map(center).join(" ")} />}
      </svg>
      <figcaption>
        <code>{String(data.label)}</code>
        <span>
          {done
            ? `${count.format(looks)} cell reads${data.budget != null ? `, budget ${count.format(Number(data.budget))}` : ""}. ${verdict}`
            : `Cell ${shown} of ${last}`}
        </span>
        <span className="sort-controls">
          <button
            className="quiet"
            onClick={() => {
              setStep(0);
              setPlaying(last > 0);
            }}
            disabled={last === 0}
          >
            Replay
          </button>
          <input
            type="range"
            min={0}
            max={last}
            value={shown}
            disabled={last === 0}
            aria-label="Cells read"
            onChange={(event) => {
              setPlaying(false);
              setStep(Number(event.target.value));
            }}
          />
        </span>
      </figcaption>
    </figure>
  );
}

interface Call {
  depth: number;
  call: string;
  result: string | null;
  error: boolean;
}

// Every call a recursive function made during the visible tests, indented
// under the call that made it, with what each one returned. Runaway recursion
// stops indenting after a while, so the panel stays readable.
const MAX_INDENT = 10;

function CallTree({ events }: { events: TelemetryEvent[] }) {
  const traces = events.filter((e) => e.kind === "calls" && !e.data.hidden && Array.isArray(e.data.calls));
  return (
    <section className="call-tree" aria-labelledby="calls-title">
      <h2 id="calls-title" className="panel-title">
        Call tree
      </h2>
      {traces.length === 0 ? (
        <p className="muted">Run your code to see every call your function makes, and what each one returns.</p>
      ) : (
        traces.map((trace, i) => {
          const calls = trace.data.calls as Call[];
          const total = Number(trace.data.total);
          const more = total - calls.length;
          return (
            <figure key={i} className={`calls${trace.data.passed ? " pass" : " fail"}`}>
              <ol aria-label={`Calls made by ${String(trace.data.label)}`}>
                {calls.map((call, j) => (
                  <li key={j} style={{ paddingLeft: `${Math.min(call.depth, MAX_INDENT) * 14}px` }}>
                    <code>{call.call}</code>
                    <span className={call.error ? "returns error" : "returns"}>
                      {call.error ? "raised an error" : `returns ${call.result}`}
                    </span>
                  </li>
                ))}
              </ol>
              <figcaption>
                {total === 1 ? "1 call" : `${count.format(total)} calls`}
                {more > 0 && `, of which the first ${calls.length} are shown`}
                {trace.data.error ? ". It never finished." : "."}
              </figcaption>
            </figure>
          );
        })
      )}
    </section>
  );
}

// Replays the first recorded sort, one move per frame: a swap, or an item
// dropped into place. Bars are scaled between the smallest and largest value.
function SortBars({ events }: { events: TelemetryEvent[] }) {
  const replay = events.find((e) => e.kind === "sort" && Array.isArray(e.data.frames));
  const frames = (replay?.data.frames ?? []) as number[][];
  const last = Math.max(frames.length - 1, 0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const delay = Math.min(400, Math.max(60, 3000 / Math.max(last, 1)));

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setStep(reduce ? last : 0);
    setPlaying(!reduce && last > 0);
  }, [replay, last]);

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((s) => s + 1), delay);
    return () => window.clearTimeout(timer);
  }, [playing, step, last, delay]);

  const numeric = frames.length > 0 && frames.every((f) => Array.isArray(f) && f.every((v) => typeof v === "number"));
  if (!replay || !numeric) {
    return (
      <section className="sorter" aria-labelledby="sorter-title">
        <h2 id="sorter-title" className="panel-title">
          Sorting bars
        </h2>
        <p className="muted">
          {replay?.data.error ? "Your code raised an error before the rack was sorted." : "Run your code to watch it sort the first test rack."}
        </p>
      </section>
    );
  }

  // A new run can arrive with fewer frames before the effect above resets step.
  const shown = Math.min(step, last);
  const frame = frames[shown];
  const before = shown > 0 ? frames[shown - 1] : frame;
  const low = Math.min(...frames[0]);
  const high = Math.max(...frames[0]);
  const BAR = 14;
  const GAP = 4;
  const HEIGHT = 96;
  const height = (v: number) => 10 + ((v - low) / (high - low || 1)) * (HEIGHT - 10);
  const done = shown >= last;
  const moves = last === 1 ? "1 move" : `${last} moves`;

  return (
    <section className="sorter" aria-labelledby="sorter-title">
      <h2 id="sorter-title" className="panel-title">
        Sorting bars
      </h2>
      <figure className={`sort-replay${done ? (replay.data.passed ? " pass" : " fail") : ""}`}>
        <svg
          viewBox={`0 0 ${frame.length * (BAR + GAP) - GAP} ${HEIGHT}`}
          role="img"
          aria-label={`The rack after move ${shown} of ${last}: ${frame.join(", ")}`}
        >
          {frame.map((value, i) => (
            <rect
              key={i}
              className={value !== before[i] ? "bar moved" : "bar"}
              x={i * (BAR + GAP)}
              y={HEIGHT - height(value)}
              width={BAR}
              height={height(value)}
              rx={2}
            />
          ))}
        </svg>
        <figcaption>
          <code>{String(replay.data.label)}</code>
          <span>
            {last === 0
              ? "Your code didn't move anything."
              : done
                ? `${moves}. ${replay.data.passed ? "Sorted." : "Not sorted yet."}`
                : `Move ${shown} of ${last}`}
          </span>
          <span className="sort-controls">
            <button
              className="quiet"
              onClick={() => {
                setStep(0);
                setPlaying(last > 0);
              }}
              disabled={last === 0}
            >
              Replay
            </button>
            <input
              type="range"
              min={0}
              max={last}
              value={shown}
              disabled={last === 0}
              aria-label="Move"
              onChange={(event) => {
                setPlaying(false);
                setStep(Number(event.target.value));
              }}
            />
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

type Point = [number, number];
const STEP: Record<string, Point> = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] };
const CELL = 22;

function trace(moves: unknown[], start: Point): Point[] {
  const path: Point[] = [start];
  for (const move of moves) {
    const [x, y] = path[path.length - 1];
    const [dx, dy] = STEP[String(move)] ?? [0, 0];
    path.push([x + dx, y + dy]);
  }
  return path;
}

function asPoint(value: unknown): Point | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [x, y] = value;
  return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function DroneTelemetry({ events }: { events: TelemetryEvent[] }) {
  const routes = events.filter((e) => e.kind === "reading" && Array.isArray(e.data.moves));
  return (
    <section className="drone" aria-labelledby="drone-title">
      <h2 id="drone-title" className="panel-title">
        Drone telemetry
      </h2>
      {routes.length === 0 ? (
        <p className="muted">Run your code to see each flight drawn on the ridge grid.</p>
      ) : (
        <div className="drone-routes">
          {routes.map((event, i) => (
            <Route key={i} data={event.data} />
          ))}
        </div>
      )}
    </section>
  );
}

// Two kinds of flight: from the pad along known moves (where does it land?),
// or from a given start along the player's own route (does it reach the pad?).
function Route({ data }: { data: TelemetryEvent["data"] }) {
  const moves = data.moves as unknown[];
  const start = asPoint(data.start);
  const path = trace(moves, start ?? [0, 0]);
  const target = asPoint(data.expected) ?? path[path.length - 1];
  const reported = asPoint(data.got);
  // Plot the reported position only if it's near the flight; a wild answer
  // would shrink the grid to nothing.
  const plotted = reported && path.some(([x, y]) => Math.abs(x - reported[0]) + Math.abs(y - reported[1]) <= 8) ? reported : null;

  const points: Point[] = [...path, target, [0, 0], ...(plotted ? [plotted] : [])];
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  let [minX, maxX, minY, maxY] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 1];
  while (maxX - minX < 4) [minX, maxX] = [minX - 0.5, maxX + 0.5];
  while (maxY - minY < 3) [minY, maxY] = [minY - 0.5, maxY + 0.5];
  const px = (x: number) => (x - minX) * CELL;
  const py = (y: number) => (maxY - y) * CELL;

  const dots: Point[] = [];
  for (let x = Math.ceil(minX); x <= maxX; x++) for (let y = Math.ceil(minY); y <= maxY; y++) dots.push([x, y]);

  const at = ([x, y]: Point) => `(${x}, ${y})`;
  const lead = start ? `From ${at(start)}.` : `Lands at ${at(target)}.`;
  const verdict = data.passed
    ? start
      ? "Lands on the pad."
      : "Your code agrees."
    : data.error
      ? "Your code raised an error."
      : reported
        ? start
          ? `Lands at ${at(reported)}.`
          : `Your code says ${at(reported)}.`
        : start
          ? "That route can't be flown."
          : `Your code returned ${JSON.stringify(data.got)}.`;

  return (
    <figure className={`route${data.passed ? " pass" : " fail"}`}>
      <svg viewBox={`0 0 ${(maxX - minX) * CELL} ${(maxY - minY) * CELL}`} role="img" aria-label={`Flight ${moves.join(" ") || "with no moves"}`}>
        {dots.map(([x, y]) => (
          <circle key={`${x},${y}`} className="grid-dot" cx={px(x)} cy={py(y)} r={1.6} />
        ))}
        <rect className="start-pad" x={px(0) - 6} y={py(0) - 6} width={12} height={12} />
        <polyline className="flight" points={path.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")} />
        {start && <circle className="start-dot" cx={px(start[0])} cy={py(start[1])} r={3.5} />}
        <circle className="target" cx={px(target[0])} cy={py(target[1])} r={5} />
        {plotted && <circle className={`reported${data.passed ? "" : " wrong"}`} cx={px(plotted[0])} cy={py(plotted[1])} r={9} />}
      </svg>
      <figcaption>
        <code>{moves.length ? moves.join(" ") : "no moves"}</code>
        <span>
          {lead} {verdict}
        </span>
        {data.hidden && <span className="tag">Hidden test</span>}
      </figcaption>
    </figure>
  );
}

function StationLog({ missions, save }: { missions: Mission[]; save: SaveData }) {
  const entries = missions
    .flatMap((mission) => {
      const first = save.completions[mission.id]?.[0];
      return first ? [{ mission, at: first.at }] : [];
    })
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="station-log" aria-labelledby="log-title">
      <h2 id="log-title" className="panel-title">
        Station log
      </h2>
      {entries.length === 0 ? (
        <p className="muted">Nothing here is running yet. Finish a repair to start the log.</p>
      ) : (
        <ul>
          {entries.map(({ mission }) => (
            <li key={mission.id}>
              <span className="log-system">{mission.system}</span>
              <Markdown source={mission.restored} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// The player's home directory in the relay machine, with the terminal's
// current directory marked. It refreshes after every command.
function FilesScene() {
  const view = useSyncExternalStore(relay.subscribe, relay.getView);
  if (!view) return null;
  const outside = view.cwd !== null && view.cwd !== view.root && !view.cwd.startsWith(view.root + "/");
  return (
    <figure className="files" aria-label="Files in your home directory">
      <ul>
        <FileTree entries={[[view.root, view.entries]]} path="" cwd={view.cwd} />
      </ul>
      <figcaption>
        {view.cwd === null
          ? "The shell is starting."
          : outside
            ? `The terminal is in ${view.cwd}, outside your home directory.`
            : `The terminal is in ${view.cwd}.`}
        {view.cut && " Some files aren't shown."}
      </figcaption>
    </figure>
  );
}

function FileTree({ entries, path, cwd }: { entries: FileEntry[]; path: string; cwd: string | null }) {
  return (
    <>
      {entries.map(([name, children]) => {
        const full = path ? `${path}/${name}` : name;
        const here = children !== null && full === cwd;
        return (
          <li key={name} className={here ? "here" : undefined}>
            <span className={children ? "dir" : undefined}>{children ? `${name}/` : name}</span>
            {here && <span className="marker">you are here</span>}
            {children && children.length > 0 && (
              <ul>
                <FileTree entries={children} path={full} cwd={cwd} />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
}

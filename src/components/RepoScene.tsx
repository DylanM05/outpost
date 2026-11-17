import { useSyncExternalStore } from "react";
import { layoutGraph, type GraphLayout } from "../relay/graph";
import { relay, type RepoRef, type RepoView } from "../relay/session";

const ROW = 24;
const LANE = 14;
const PAD = 9;
const LANE_COLORS = 5;

// The Git repository the terminal is working in: its history as a graph,
// with branches and HEAD marked, and the files that have changed since the
// last commit. It refreshes after every command.
export function RepoScene() {
  const view = useSyncExternalStore(relay.subscribe, relay.getRepoView);
  if (!view) return null;
  if (view.repo === null) {
    return (
      <figure className="repo" aria-label="Git repository">
        <p className="repo-empty">No repository here yet.</p>
        <figcaption>
          {view.cwd === null ? "The shell is starting." : `The terminal is in ${view.cwd}, which isn't inside a Git repository.`}
        </figcaption>
      </figure>
    );
  }
  const inside = view.cwd !== null && (view.cwd === view.repo || view.cwd.startsWith(view.repo + "/"));
  return (
    <figure className="repo" aria-label={`Git repository ${view.repo}`}>
      <header>
        <code>{view.repo}</code>
        <span>{view.branch ? `on ${view.branch}` : view.head ? `HEAD at ${view.head.slice(0, 7)}, on no branch` : ""}</span>
      </header>
      {view.commits.length === 0 ? (
        <p className="repo-empty">No commits yet{view.branch ? ` on ${view.branch}` : ""}.</p>
      ) : (
        <History view={view} layout={layoutGraph(view.commits)} />
      )}
      <Changes view={view} />
      <figcaption>
        {view.cwd === null
          ? "The shell is starting."
          : inside
            ? `The terminal is in ${view.cwd}.`
            : `The terminal is in ${view.cwd}, outside this repository.`}
      </figcaption>
    </figure>
  );
}

type Repo = Extract<RepoView, { repo: string }>;

function History({ view, layout }: { view: Repo; layout: GraphLayout }) {
  const x = (lane: number) => PAD + lane * LANE;
  const y = (row: number) => ROW / 2 + row * ROW;
  const width = PAD * 2 + Math.max(0, layout.lanes - 1) * LANE;
  const height = layout.rows.length * ROW + (view.cut ? ROW / 2 : 0);
  const refsAt = new Map<string, RepoRef[]>();
  for (const ref of view.refs) refsAt.set(ref.hash, [...(refsAt.get(ref.hash) ?? []), ref]);

  return (
    <div className="repo-history">
      <svg width={width} height={height} aria-hidden="true">
        {layout.lines.map(({ from: [fromLane, fromRow], to: [toLane, toRow], lane }, index) => {
          const [x1, y1, x2, y2] = [x(fromLane), y(fromRow), x(toLane), y(toRow)];
          const middle = (y1 + y2) / 2;
          const d = x1 === x2 ? `M${x1} ${y1}V${y2}` : `M${x1} ${y1}C${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`;
          return <path key={index} d={d} className={`lane-${lane % LANE_COLORS}`} />;
        })}
        {layout.rows.map(({ commit, lane }, row) => (
          <circle
            key={commit.hash}
            cx={x(lane)}
            cy={y(row)}
            r={commit.hash === view.head ? 5.5 : 4}
            className={`lane-${lane % LANE_COLORS}${commit.hash === view.head ? " head" : ""}`}
          />
        ))}
      </svg>
      <ol style={{ paddingLeft: width + 4 }}>
        {layout.rows.map(({ commit }) => (
          <li key={commit.hash} style={{ height: ROW }}>
            {commit.hash === view.head && !view.branch && <span className="ref head">HEAD</span>}
            {(refsAt.get(commit.hash) ?? []).map((ref) => (
              <span key={ref.kind + ref.name} className={`ref ${ref.kind}${ref.kind === "branch" && ref.name === view.branch ? " head" : ""}`}>
                {ref.kind === "branch" && ref.name === view.branch ? `HEAD → ${ref.name}` : ref.kind === "tag" ? `tag: ${ref.name}` : ref.name}
              </span>
            ))}
            <code className="hash">{commit.hash.slice(0, 7)}</code>
            <span className="subject">{commit.subject}</span>
          </li>
        ))}
      </ol>
      {view.cut && <p className="repo-more">Older commits aren't shown.</p>}
    </div>
  );
}

function Changes({ view }: { view: Repo }) {
  const groups = [
    { title: "Staged for the next commit", files: view.staged, kind: "staged" },
    { title: "Changed, not staged", files: view.changed, kind: "changed" },
    { title: "Untracked", files: view.untracked, kind: "untracked" },
  ].filter((group) => group.files.length > 0);
  if (groups.length === 0) {
    return <p className="repo-clean">{view.commits.length ? "No changes since the last commit." : "No files to commit yet."}</p>;
  }
  return (
    <dl className="repo-changes">
      {groups.map((group) => (
        <div key={group.kind} className={group.kind}>
          <dt>{group.title}</dt>
          {group.files.map((file) => (
            <dd key={file}>{file}</dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

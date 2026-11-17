// Lays out a repository's history for the repo scene, the way
// `git log --graph` does: one row per commit, newest first, each in a lane,
// with lines from every commit down to its parents.

export interface GraphCommit {
  hash: string;
  parents: string[];
  subject: string;
}

export interface GraphRow {
  commit: GraphCommit;
  lane: number;
}

// A line between two points, each a lane and a row, colored by the lane it
// runs in. A row past the last commit means the history carries on beyond
// what's shown.
export interface GraphLine {
  from: [lane: number, row: number];
  to: [lane: number, row: number];
  lane: number;
}

export interface GraphLayout {
  rows: GraphRow[];
  lines: GraphLine[];
  lanes: number;
}

export function layoutGraph(commits: GraphCommit[]): GraphLayout {
  // What each lane is waiting for: the hash of the next commit on its line.
  const waiting: (string | null)[] = [];
  // The lane each line left the row above from. A merge commit's second
  // parent starts a lane from the merge commit's own.
  const starts: number[] = [];
  // Lines from a merge commit into a lane that was already waiting for the
  // same parent.
  let joins: { from: number; lane: number }[] = [];
  const rows: GraphRow[] = [];
  const lines: GraphLine[] = [];

  const free = () => {
    const index = waiting.indexOf(null);
    return index === -1 ? waiting.length : index;
  };
  // Lines from the row above to this one: straight down, or into the commit.
  const connect = (row: number, target: (lane: number) => number) => {
    waiting.forEach((hash, index) => {
      if (hash !== null) lines.push({ from: [starts[index], row - 1], to: [target(index), row], lane: index });
    });
    for (const join of joins) lines.push({ from: [join.from, row - 1], to: [target(join.lane), row], lane: join.lane });
    joins = [];
  };

  commits.forEach((commit, row) => {
    let lane = waiting.indexOf(commit.hash);
    if (lane === -1) lane = free();
    connect(row, (index) => (waiting[index] === commit.hash ? lane : index));

    // Every lane waiting for this commit ends here, and the commit's own lane
    // goes on to its first parent.
    waiting.forEach((hash, index) => {
      starts[index] = index;
      if (hash === commit.hash) waiting[index] = null;
    });
    const [first, ...others] = commit.parents;
    waiting[lane] = first ?? null;
    starts[lane] = lane;
    for (const parent of others) {
      const existing = waiting.indexOf(parent);
      if (existing !== -1) {
        joins.push({ from: lane, lane: existing });
      } else {
        const next = free();
        waiting[next] = parent;
        starts[next] = lane;
      }
    }
    rows.push({ commit, lane });
  });

  // Lines still open lead to commits that aren't shown.
  connect(commits.length, (index) => index);

  const used = [...rows.map((r) => r.lane), ...lines.flatMap((l) => [l.from[0], l.to[0]])];
  return { rows, lines, lanes: used.length ? Math.max(...used) + 1 : 0 };
}

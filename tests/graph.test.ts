import { expect, test } from "vitest";
import { layoutGraph, type GraphCommit } from "../src/relay/graph";

// Commits newest first, as `git log --topo-order` gives them.
const commit = (hash: string, ...parents: string[]): GraphCommit => ({ hash, parents, subject: hash });
const lanes = (commits: GraphCommit[]) => layoutGraph(commits).rows.map((row) => row.lane);
const lines = (commits: GraphCommit[]) => layoutGraph(commits).lines.map(({ from, to }) => [from, to]);

test("a straight history stays in one lane", () => {
  const history = [commit("c", "b"), commit("b", "a"), commit("a")];
  expect(lanes(history)).toEqual([0, 0, 0]);
  expect(lines(history)).toEqual([
    [[0, 0], [0, 1]],
    [[0, 1], [0, 2]],
  ]);
  expect(layoutGraph(history).lanes).toBe(1);
});

test("two branches from one commit meet at it", () => {
  // main: a - b, feature: a - f
  const history = [commit("f", "a"), commit("b", "a"), commit("a")];
  expect(lanes(history)).toEqual([0, 1, 0]);
  expect(lines(history)).toEqual([
    [[0, 0], [0, 1]],
    [[0, 1], [0, 2]],
    [[1, 1], [0, 2]],
  ]);
});

test("a merge commit opens a lane for its second parent", () => {
  // m merges f into b; both come from a.
  const history = [commit("m", "b", "f"), commit("f", "a"), commit("b", "a"), commit("a")];
  expect(lanes(history)).toEqual([0, 1, 0, 0]);
  expect(lines(history)).toEqual([
    [[0, 0], [0, 1]],
    [[0, 0], [1, 1]],
    [[0, 1], [0, 2]],
    [[1, 1], [1, 2]],
    [[0, 2], [0, 3]],
    [[1, 2], [0, 3]],
  ]);
});

test("a merge into a lane that's already waiting joins it", () => {
  // n and m both have b as a parent; m also merges it in as its second.
  const history = [commit("n", "b"), commit("m", "a", "b"), commit("b", "a"), commit("a")];
  const layout = layoutGraph(history);
  expect(layout.rows.map((r) => r.lane)).toEqual([0, 1, 0, 0]);
  expect(layout.lines.map(({ from, to }) => [from, to])).toContainEqual([[1, 1], [0, 2]]);
});

test("a history cut short leads off the bottom", () => {
  const history = [commit("c", "b"), commit("b", "a")];
  expect(lines(history).at(-1)).toEqual([[0, 1], [0, 2]]);
});

test("an empty history has no lanes", () => {
  expect(layoutGraph([])).toEqual({ rows: [], lines: [], lanes: 0 });
});

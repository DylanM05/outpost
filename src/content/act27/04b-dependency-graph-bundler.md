---
id: dependency-graph-bundler
kind: code
language: javascript
title: Plan topological bundle order, detect import cycles, and prune dead modules
system: Module loader
symbol: controller
scene: tests
skills: js-testing-tooling
---

## Briefing

Static bundlers (like Rollup, esbuild, and Webpack) walk the module import graph from an entry point to determine a valid execution order (dependencies before dependents), flag circular dependency chains, and identify dead modules that are unreachable from the entry point.

## Concept

Implement `planBundle(entryId, graph)` where `graph` is an adjacency map `{ [moduleId]: string[] }` listing each module's direct imports in declaration order:
- Walk the graph starting at `entryId` using depth-first search (3-color marking: unvisited `0`, visiting/in-stack `1`, visited `2`):
  - Visit a module's dependencies in their listed array order `(graph[id] ?? [])`.
  - **Cycle detection:** if DFS encounters a dependency `dep` that is currently in the active recursion stack (`state === 1`), immediately return:
    - `{ ok: false, cycle: [...] }` where `cycle` is the slice of the active DFS path starting at `dep` and ending with `dep` repeated (e.g. `["a", "b", "c", "a"]` or `["b", "c", "b"]`).
  - **Post-order emission:** once all dependencies of `id` have finished, mark `id` as visited (`state = 2`) and push `id` onto `order` (so every dependency appears before the module that imports it).
- **Dead module detection:** when no cycle is reachable from `entryId`, compute `deadModules` as all keys of `graph` that were never visited from `entryId`, sorted lexicographically (`.sort()`), and return:
  - `{ ok: true, order, deadModules }`.

## Objective

Implement `planBundle(entryId, graph)` returning `{ ok: true, order, deadModules }` or `{ ok: false, cycle }`.

## Hints

1. Maintain an array `stack = []` of the current DFS call chain alongside `state = new Map()`. When entering `dfs(node)`, set `state.set(node, 1)` and `stack.push(node)`.
2. If a neighbor `dep` has `state.get(dep) === 1`, the cycle is `[...stack.slice(stack.indexOf(dep)), dep]`!

## Starter: guided

```javascript
function planBundle(entryId, graph) {
  const state = new Map(); // 1 = visiting, 2 = visited
  const stack = [];
  const order = [];

  function dfs(node) {
    state.set(node, 1);
    stack.push(node);
    for (const dep of graph[node] ?? []) {
      // Check if dep is currently visiting (cycle!) or unvisited (recurse)
    }
    stack.pop();
    state.set(node, 2);
    order.push(node);
    return null;
  }

  const cycle = dfs(entryId);
  if (cycle) return { ok: false, cycle };

  const deadModules = Object.keys(graph)
    .filter((k) => state.get(k) !== 2)
    .sort();
  return { ok: true, order, deadModules };
}
```

## Starter: standard

```javascript
function planBundle(entryId, graph) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("orders dependencies post-order and identifies unreachable dead modules", () => {
  const planBundle = get("planBundle");
  const graph = {
    main: ["ui", "net"],
    ui: ["dom", "shared"],
    net: ["shared"],
    dom: [],
    shared: [],
    legacyWidget: ["dom"],
    unusedHelper: [],
  };
  return planBundle("main", graph);
}, {
  ok: true,
  order: ["dom", "shared", "ui", "net", "main"],
  deadModules: ["legacyWidget", "unusedHelper"],
});

expect("detects reachable import cycle and returns the exact cycle loop", () => {
  const planBundle = get("planBundle");
  const graph = {
    main: ["auth"],
    auth: ["session"],
    session: ["crypto", "auth"],
    crypto: [],
  };
  return planBundle("main", graph);
}, {
  ok: false,
  cycle: ["auth", "session", "auth"],
});
```

## Hidden checks

```javascript
expect("ignores cycles inside dead unreachable subgraphs when entryId is acyclic", () => {
  const planBundle = get("planBundle");
  const graph = {
    app: ["util"],
    util: [],
    deadA: ["deadB"],
    deadB: ["deadA"],
  };
  return planBundle("app", graph);
}, {
  ok: true,
  order: ["util", "app"],
  deadModules: ["deadA", "deadB"],
});
```

## Solution

```javascript
function planBundle(entryId, graph) {
  const state = new Map();
  const stack = [];
  const order = [];

  function dfs(node) {
    state.set(node, 1);
    stack.push(node);

    for (const dep of graph[node] ?? []) {
      const depState = state.get(dep) ?? 0;
      if (depState === 1) {
        const startIdx = stack.indexOf(dep);
        return [...stack.slice(startIdx), dep];
      }
      if (depState === 0) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      }
    }

    stack.pop();
    state.set(node, 2);
    order.push(node);
    return null;
  }

  const cycle = dfs(entryId);
  if (cycle) {
    return { ok: false, cycle };
  }

  const deadModules = Object.keys(graph)
    .filter((id) => state.get(id) !== 2)
    .sort();

  return { ok: true, order, deadModules };
}
```

## Restored

The module bundler planner now computes deterministic post-order dependency bundles, isolates circular import chains, and flags dead code for tree-shaking.

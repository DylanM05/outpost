---
id: run-ci-pipeline
title: Run ci pipeline
system: Pipeline gate
symbol: equipment
scene: tests
skills: observability, shortest-paths
---

## Briefing

Write a real CI pipeline runner that handles jobs listed in *any* order: sort them in valid dependency order (topological sort), detect unknown dependencies or cycles before running anything, execute each ready job through `runner(name)`, and skip downstream jobs whenever an upstream dependency fails.

## Objective

Write `run_pipeline(jobs, runner)`.

- `jobs` is a list of dicts `{"name": str, "needs": [str, ...]}` (may be in any order!).
- `runner(name)` returns `True` if job `name` passes, `False` if it fails.
- First validate `jobs`:
  - If any `dep` in `needs` is not the name of a job in `jobs`, raise `ValueError`.
  - If there is a dependency cycle (or duplicate job name), raise `ValueError`.
- Execute jobs in **topological order** (when multiple jobs are ready at once, pick the alphabetically smallest name first):
  - If every dependency in `needs` has status `"passed"`, call `runner(name)` and record `"passed"` or `"failed"`.
  - Otherwise do **not** call `runner(name)` and record `"skipped"`.
- Return `{"passed": all(v == "passed" for v in results.values()), "order": executed_order, "results": results}`, where `executed_order` is the list of job names actually passed to `runner`.

```python
jobs = [
    {"name": "deploy", "needs": ["build"]},
    {"name": "build", "needs": ["lint", "test"]},
    {"name": "test", "needs": []},
    {"name": "lint", "needs": []},
]
run_pipeline(jobs, lambda name: name != "test")
# {
#   "passed": False,
#   "order": ["lint", "test"],
#   "results": {"lint": "passed", "test": "failed", "build": "skipped", "deploy": "skipped"},
# }
```

## Concept

**Kahn's algorithm** computes a deterministic topological order using a min-heap (or sorted ready list):

1. Count each job's `in_degree` (number of dependencies it `needs`) and build `dependents[dep] -> [jobs]`.
2. Push all jobs with `in_degree == 0` into a min-heap (`heapq`).
3. Pop the alphabetically smallest ready job, append it to `topo`, and decrement `in_degree` for each of its dependents — pushing any dependent whose `in_degree` reaches `0`.
4. If `len(topo) != len(jobs)`, a **cycle** prevented the remaining jobs from ever reaching `in_degree == 0` — raise `ValueError`!

Once you have `topo`, running or skipping each job in order is five lines of code.

## Hints

1. Check for duplicate names and missing `dep` names first, raising `ValueError`.
2. Use `heapq` for Kahn's algorithm so ready jobs always run in deterministic alphabetical order.
3. Only append a job name to `executed_order` when you actually call `runner(name)` (not when it's `"skipped"`).

## Starter: guided

```python
import heapq


def run_pipeline(jobs, runner):
    by_name = {}
    for job in jobs:
        if job["name"] in by_name:
            raise ValueError(f"duplicate job: {job['name']}")
        by_name[job["name"]] = job.get("needs", [])

    for name, needs in by_name.items():
        for dep in needs:
            if dep not in by_name:
                raise ValueError(f"unknown dependency: {dep}")

    # Compute deterministic topological order with Kahn's algorithm + heapq.
    # Raise ValueError if a cycle exists. Then run/skip each job in order.
    return {"passed": False, "order": [], "results": {}}
```

## Starter: standard

```python
import heapq


def run_pipeline(jobs, runner):
    return {"passed": False, "order": [], "results": {}}
```

## Starter: challenge

```python
```

## Checks

```python
jobs = [
    {"name": "deploy", "needs": ["build"]},
    {"name": "build", "needs": ["lint", "test"]},
    {"name": "test", "needs": []},
    {"name": "lint", "needs": []},
]
expect(
    "all-green pipeline runs in topological order",
    lambda: get("run_pipeline")(jobs, lambda n: True),
    {
        "passed": True,
        "order": ["lint", "test", "build", "deploy"],
        "results": {"lint": "passed", "test": "passed", "build": "passed", "deploy": "passed"},
    },
)
expect(
    "failing test skips build and deploy without calling runner on them",
    lambda: get("run_pipeline")(jobs, lambda n: n != "test"),
    {
        "passed": False,
        "order": ["lint", "test"],
        "results": {"lint": "passed", "test": "failed", "build": "skipped", "deploy": "skipped"},
    },
)
```

## Hidden checks

```python
def _raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True

check("unknown dependency raises ValueError", lambda: _raises(lambda: get("run_pipeline")([{"name": "a", "needs": ["ghost"]}], lambda n: True)))
check("cycle raises ValueError without running jobs", lambda: _raises(lambda: get("run_pipeline")([{"name": "a", "needs": ["b"]}, {"name": "b", "needs": ["a"]}], lambda n: True)))
expect("empty pipeline passes", lambda: get("run_pipeline")([], lambda n: True), {"passed": True, "order": [], "results": {}})

# Independent branch still runs even if another branch fails
split = [
    {"name": "sec", "needs": []},
    {"name": "test", "needs": []},
    {"name": "deploy", "needs": ["test"]},
]
expect(
    "independent job still runs when another fails",
    lambda: get("run_pipeline")(split, lambda n: n != "test"),
    {"passed": False, "order": ["sec", "test"], "results": {"sec": "passed", "test": "failed", "deploy": "skipped"}},
)
```

## Solution

```python
import heapq


def run_pipeline(jobs, runner):
    by_name = {}
    for job in jobs:
        if job["name"] in by_name:
            raise ValueError(f"duplicate job: {job['name']}")
        by_name[job["name"]] = list(job.get("needs", []))

    in_degree = {name: 0 for name in by_name}
    dependents = {name: [] for name in by_name}
    for name, needs in by_name.items():
        for dep in needs:
            if dep not in by_name:
                raise ValueError(f"unknown dependency: {dep}")
            dependents[dep].append(name)
            in_degree[name] += 1

    ready = [name for name, deg in in_degree.items() if deg == 0]
    heapq.heapify(ready)
    topo = []
    while ready:
        cur = heapq.heappop(ready)
        topo.append(cur)
        for nxt in dependents[cur]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                heapq.heappush(ready, nxt)

    if len(topo) != len(by_name):
        raise ValueError("dependency cycle")

    results = {}
    order = []
    for name in topo:
        if any(results[dep] != "passed" for dep in by_name[name]):
            results[name] = "skipped"
        else:
            order.append(name)
            results[name] = "passed" if runner(name) else "failed"

    return {
        "passed": all(status == "passed" for status in results.values()),
        "order": order,
        "results": results,
    }
```

## Restored

The pipeline gate resolves job graphs deterministically, catches bad workflows before starting, and blocks broken releases from reaching the grid.

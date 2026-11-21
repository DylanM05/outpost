---
id: gate-the-release
kind: predict
title: Gate the release
system: Pipeline gate
symbol: equipment
scene: console
skills: observability, reading-code
---

## Briefing

Continuous Integration (CI) runs automated checks — formatting, linting, unit tests, security scans, and image builds — on every pull request before anything deploys. Each job declares which earlier jobs it `needs`, forming a dependency graph: if `test` fails, `build` and `deploy` never run, while independent jobs like `lint` still report their own results. Trace this pipeline run.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A CI workflow is a directed acyclic graph (DAG):

- Jobs with no unmet `needs` run right away (`format`, `lint`, `test`).
- A job whose dependency failed (or was skipped) is **skipped** — preventing broken builds from ever reaching production.
- Seeing all independent failures (`lint` AND `test`) in one run saves engineers from fixing one error at a time.

## Hints

1. `"format"` passes; `"lint"` passes; `"test"` fails.
2. `"build"` needs both `"lint"` and `"test"` — since `"test"` failed, `"build"` is `"skipped"`.
3. `"deploy"` needs `"build"` — since `"build"` didn't pass, `"deploy"` is also `"skipped"`.

## Program

```python
jobs = [
    ("format", []),
    ("lint", []),
    ("test", []),
    ("build", ["lint", "test"]),
    ("deploy", ["build"]),
]

outcomes = {"format": True, "lint": True, "test": False, "build": True, "deploy": True}
results = {}

for name, needs in jobs:
    if any(results[dep] != "passed" for dep in needs):
        results[name] = "skipped"
    else:
        results[name] = "passed" if outcomes[name] else "failed"

for name, _ in jobs:
    print(f"{name}: {results[name]}")
```

## Output

```text
format: passed
lint: passed
test: failed
build: skipped
deploy: skipped
```

## Restored

You traced how CI gates block `build` and `deploy` the instant `test` fails while letting independent checks finish.

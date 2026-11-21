---
id: reconcile-loop
kind: predict
title: Declarative reconciliation loops
system: Desired state
symbol: controller
scene: console
skills: orchestration, reading-code
---

## Briefing

Instead of running imperative commands like *"start 3 containers on server A"*, orchestrators like Kubernetes work **declaratively**: you declare the **desired state** (`replicas = 3`), and a controller continuously compares `actual` against `desired`, creating or deleting pods until they match — even when pods crash unexpectedly!

## Objective

Trace the reconciliation loop across three ticks (including a pod crash on tick 2) and predict **every line it prints**.

## Concept

A reconciliation controller doesn't care *why* actual state drifted from desired state (a deploy, a scale-up, or a hardware crash all look identical):

- If `actual < desired`: create `desired - actual` pods.
- If `actual > desired`: terminate `actual - desired` pods.
- If `actual == desired`: do nothing (idempotent!).

## Hints

1. Tick 1: `desired = 3`, `running = 0` -> creates `3`, now `3` running.
2. Tick 2: a node crash drops `running` from `3` to `1` -> controller sees `1 < 3`, creates `2`, back to `3`.
3. Tick 3: operator scales `desired` down to `2` -> controller sees `3 > 2`, deletes `1`, now `2`.

## Program

```python
running = 0
events = [
    ("deploy", 3, 0),
    ("node-crash", 3, -2),
    ("scale-down", 2, 0),
]

for label, desired, shock in events:
    running = max(0, running + shock)
    diff = desired - running
    action = f"+{diff}" if diff > 0 else f"{diff}"
    running += diff
    print(label, action, running)
```

## Output

```text
deploy +3 3
node-crash +2 3
scale-down -1 2
```

## Restored

One simple `desired - actual` loop handles initial deployment, crash recovery, and scale-down with the exact same code.

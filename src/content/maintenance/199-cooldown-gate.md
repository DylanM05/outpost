---
id: maintenance-cooldown-gate
title: Compute clamped target replicas for a cloud autoscaler
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
reviewSkill: cloud-runtime
prerequisite: serverless-cold-start
---

## Briefing

Target-tracking autoscalers compute the exact integer replica count needed to hit a target utilization while never breaching configured minimum or maximum bounds.

## Objective

Write `desired_replicas(current, util, target_util, min_rep, max_rep)` raising `ValueError` if `current < 1`, `target_util <= 0`, `min_rep < 1`, or `max_rep < min_rep`. Return `min_rep` if `util <= 0`, else `math.ceil(current * (util / target_util))` clamped to `[min_rep, max_rep]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `max(min_rep, min(max_rep, math.ceil(current * (util / target_util))))`.

## Starter

```python
```

## Checks

```python
expect("scales up proportionally with ceiling", lambda: get("desired_replicas")(2, 80.0, 50.0, 1, 10), 4)
expect("clamps to max_rep on extreme spike", lambda: get("desired_replicas")(4, 500.0, 50.0, 1, 8), 8)
expect("clamps to min_rep on zero load", lambda: get("desired_replicas")(4, 0.0, 50.0, 2, 8), 2)
```

## Hidden checks

```python
def _bad():
    try:
        get("desired_replicas")(2, 50.0, 0.0, 1, 5)
        return False
    except ValueError:
        return True
expect("non-positive target_util raises ValueError", _bad, True)
```

## Solution

```python
import math


def desired_replicas(current, util, target_util, min_rep, max_rep):
    if current < 1 or target_util <= 0 or min_rep < 1 or max_rep < min_rep:
        raise ValueError("invalid autoscaler parameters")
    if util <= 0:
        return min_rep
    raw = math.ceil(current * (util / target_util))
    return max(min_rep, min(max_rep, raw))
```

## Restored

Target replica calculation now scales smoothly within safe capacity limits.

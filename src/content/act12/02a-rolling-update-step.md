---
id: rolling-update-step
kind: code
title: Zero-downtime rolling update step
system: Rollout bay
symbol: equipment
scene: tests
skills: orchestration
---

## Briefing

Replacing all 4 relay pods at once causes an instant outage. A **Kubernetes RollingUpdate** replaces old pods gradually using two safety knobs:
- `max_surge`: how many *extra* pods above `desired` may exist simultaneously (`total <= desired + max_surge`).
- `max_unavailable`: how many pods below `desired` may be unavailable (`available >= desired - max_unavailable`).

With `max_surge=1, max_unavailable=0`, the cluster spins up 1 new pod first, waits until it's Ready, and *only then* terminates 1 old pod — zero downtime!

## Objective

Write `next_rollout_step(desired, old_ready, new_ready, max_surge=1, max_unavailable=0)`:

- All arguments are non-negative integers. Currently there are `total = old_ready + new_ready` ready pods.
- Compute `(create_new, terminate_old)` for one safe rollout step:
  1. First, how many **old** pods can be terminated *right now* while keeping remaining ready pods `>= desired - max_unavailable` (and never terminating more than `old_ready`)?
     - Wait: if `new_ready >= desired`, we can terminate all remaining `old_ready` pods!
     - Otherwise, `min_available = max(0, desired - max_unavailable)`, so we can safely terminate `terminate_old = min(old_ready, max(0, (old_ready + new_ready) - min_available))`.
  2. Next, after accounting for those `terminate_old` pods leaving (`remaining_total = old_ready - terminate_old + new_ready`), how many **new** pods should we create right now so:
     - `new_ready + create_new <= desired` (never create more new pods than `desired`!), and
     - `remaining_total + create_new <= desired + max_surge` (never exceed max total capacity!)?
     - `create_new = max(0, min(desired - new_ready, (desired + max_surge) - remaining_total))`.
- Return `(create_new, terminate_old)`.

## Concept

Trace what happens with `desired=4, max_surge=1, max_unavailable=0`:
- Start `(old=4, new=0)` -> `terminate_old = 0`, `create_new = 1` (surge up to 5 total!).
- Once new pod is Ready `(old=4, new=1)` -> `terminate_old = 1` (drops to 4), `create_new = 1` (surges back to 5!).
- Eventually `(old=1, new=4)` -> `terminate_old = 1`, `create_new = 0` -> `(old=0, new=4)` complete with **4 healthy pods serving at every single second**!

## Hints

1. Compute `min_avail = max(0, desired - max_unavailable)`.
2. `terminate_old = min(old_ready, max(0, old_ready + new_ready - min_avail))`.
3. `remaining = old_ready - terminate_old + new_ready`, then `create_new = max(0, min(desired - new_ready, desired + max_surge - remaining))`.

## Starter: guided

```python
def next_rollout_step(desired, old_ready, new_ready, max_surge=1, max_unavailable=0):
    min_avail = max(0, desired - max_unavailable)
    terminate_old = min(old_ready, max(0, (old_ready + new_ready) - min_avail))
    # TODO: compute remaining total and create_new within both desired and desired + max_surge
    pass
```

## Starter: standard

```python
def next_rollout_step(desired, old_ready, new_ready, max_surge=1, max_unavailable=0):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Zero-downtime rollout: desired=4, max_surge=1, max_unavailable=0
expect("start of zero-downtime rollout surges 1 new, kills 0 old", lambda: get("next_rollout_step")(4, 4, 0, 1, 0), (1, 0))
expect("once 1 new is ready, terminates 1 old and surges next new", lambda: get("next_rollout_step")(4, 4, 1, 1, 0), (1, 1))
expect("final step cleans up last old pod", lambda: get("next_rollout_step")(4, 1, 4, 1, 0), (0, 1))
expect("completed rollout is a no-op", lambda: get("next_rollout_step")(4, 0, 4, 1, 0), (0, 0))
```

## Hidden checks

```python
# Simulate full rollout to convergence
def simulate(desired, max_surge, max_unavailable):
    old_r, new_r = desired, 0
    steps = 0
    while (old_r > 0 or new_r < desired) and steps < 50:
        c, t = get("next_rollout_step")(desired, old_r, new_r, max_surge, max_unavailable)
        assert c > 0 or t > 0
        old_r -= t
        assert old_r + new_r >= desired - max_unavailable
        new_r += c
        assert old_r + new_r <= desired + max_surge
        steps += 1
    return (old_r, new_r)

expect("full simulation with surge=2, unavail=1 converges safely", lambda: simulate(6, 2, 1), (0, 6))
expect("full simulation with surge=0, unavail=1 (in-place)", lambda: simulate(3, 0, 1), (0, 3))
```

## Solution

```python
def next_rollout_step(desired, old_ready, new_ready, max_surge=1, max_unavailable=0):
    min_avail = max(0, desired - max_unavailable)
    terminate_old = min(old_ready, max(0, (old_ready + new_ready) - min_avail))
    remaining = (old_ready - terminate_old) + new_ready
    create_new = max(0, min(desired - new_ready, (desired + max_surge) - remaining))
    return create_new, terminate_old
```

## Restored

Rolling updates now sweep across the cluster without ever dropping below minimum availability or blowing past surge limits.

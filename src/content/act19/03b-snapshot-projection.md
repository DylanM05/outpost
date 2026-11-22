---
id: snapshot-projection
title: Rebuild state from snapshots plus delta events
system: Event spine
symbol: controller
scene: tests
skills: event-sourcing
---

## Briefing

Replaying a million events from version `1` on every request would crawl. **Event-sourcing snapshots** store a periodic checkpoint `(snap_version, snap_state)` so hydration starts from the newest snapshot and replays ONLY events with `version > snap_version`!

## Concept

Given:
- `initial_state`: starting state if no snapshot exists
- `snapshots`: list of `(version, state)` tuples (possibly empty or unsorted)
- `events`: list of `(version, event)` tuples (ordered ascending by `version`)
- `apply_fn(state, event)` -> returns updated state

Steps:
1. If `snapshots` is non-empty, pick the snapshot with the **largest `version`** (remember to shallow-copy dicts/lists if needed — pass `copy.deepcopy(snap_state)` so the stored snapshot is never mutated!). Otherwise start at `(0, copy.deepcopy(initial_state))`.
2. Replay ONLY events with `ev_version > base_version` in ascending version order, counting `replayed += 1`.
3. Return `{"version": final_version, "state": state, "replayed": replayed}`.

## Objective

Write `hydrate_state(initial_state, snapshots, events, apply_fn)` returning `{"version": int, "state": any, "replayed": int}` without mutating `initial_state` or any snapshot.

## Hints

1. Use `copy.deepcopy` on the chosen base state so `apply_fn` never corrupts the saved snapshot.
2. Track `final_version = base_version` and update `final_version = ev_version` for each replayed event.

## Starter: guided

```python
import copy


def hydrate_state(initial_state, snapshots, events, apply_fn):
    if snapshots:
        base_ver, base_state = max(snapshots, key=lambda s: s[0])
    else:
        base_ver, base_state = 0, initial_state
    state = copy.deepcopy(base_state)
    version = base_ver
    replayed = 0
    # Replay events with ev_ver > base_ver in ascending order
    return {"version": version, "state": state, "replayed": replayed}
```

## Starter: standard

```python
import copy


def hydrate_state(initial_state, snapshots, events, apply_fn):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _snap():
    snaps = [(2, {"bal": 150}), (4, {"bal": 220})]
    events = [(1, 100), (2, 50), (3, 100), (4, -30), (5, 80), (6, -20)]
    def apply(st, delta):
        st["bal"] += delta
        return st
    res = get("hydrate_state")({"bal": 0}, snaps, events, apply)
    return (res, snaps[1][1]["bal"])
expect("hydrates from latest snapshot and replays only delta events without mutating snapshot", _snap, (
    {"version": 6, "state": {"bal": 280}, "replayed": 2},
    220,
))
```

## Hidden checks

```python
def _no_snap():
    res = get("hydrate_state")(0, [], [(1, 10), (2, 25)], lambda s, d: s + d)
    return res
expect("replays all events when no snapshots exist", _no_snap, {"version": 2, "state": 35, "replayed": 2})
```

## Solution

```python
import copy


def hydrate_state(initial_state, snapshots, events, apply_fn):
    if snapshots:
        base_ver, base_state = max(snapshots, key=lambda s: s[0])
    else:
        base_ver, base_state = 0, initial_state
    state = copy.deepcopy(base_state)
    version = base_ver
    replayed = 0
    for ev_ver, ev in sorted(events, key=lambda item: item[0]):
        if ev_ver > base_ver:
            state = apply_fn(state, ev)
            version = ev_ver
            replayed += 1
    return {"version": version, "state": state, "replayed": replayed}
```

## Restored

Stream projections now jump straight to the newest snapshot and replay only trailing deltas.

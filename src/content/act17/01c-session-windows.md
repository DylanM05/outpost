---
id: session-windows
title: Group bursts into inactivity-gap session windows
system: Window desk
symbol: instrument
scene: tests
skills: stream-processing
---

## Briefing

Operators don't work on rigid 10-minute clock boundaries — they log in, run a burst of commands, then go quiet. **Session windows** group a key's events into one session whenever consecutive events are separated by `<= gap` seconds, starting a new session after any longer idle gap.

## Concept

For a single user/sensor key, sort its event timestamps ascending: `[t_0, t_1, ..., t_n]`:
- Start the first session with `start = t_0`, `end = t_0`, `count = 1`.
- For each next timestamp `t`:
  - If `t - end <= gap`: extend the current session (`end = t`, `count += 1`).
  - Otherwise close the current session and start a new one (`start = t`, `end = t`, `count = 1`).

## Objective

Write `build_sessions(events, gap)` where `events` is a list of `(key, ts)` tuples and `gap >= 0` (raise `ValueError` if `gap < 0`).

Return a dict mapping each `key` to its chronological list of session dicts:
`{"start": int, "end": int, "count": int}`.

## Hints

1. Group timestamps by `key` first, then sort each key's timestamps ascending.
2. Walk each sorted list merging adjacent timestamps where `ts - cur_end <= gap`.

## Starter: guided

```python
def build_sessions(events, gap):
    if gap < 0:
        raise ValueError("gap must be >= 0")
    by_key = {}
    for key, ts in events:
        by_key.setdefault(key, []).append(ts)
    result = {}
    for key, times in by_key.items():
        times.sort()
        sessions = []
        # Merge timestamps separated by <= gap into {"start", "end", "count"}
        result[key] = sessions
    return result
```

## Starter: standard

```python
def build_sessions(events, gap):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "merges bursts within gap and splits across longer pauses",
    lambda: get("build_sessions")([("u1", 10), ("u1", 15), ("u1", 12), ("u1", 30), ("u2", 5)], gap=5),
    {
        "u1": [{"start": 10, "end": 15, "count": 3}, {"start": 30, "end": 30, "count": 1}],
        "u2": [{"start": 5, "end": 5, "count": 1}],
    },
)
expect("exact gap boundary stays in the same session", lambda: get("build_sessions")([("s", 100), ("s", 110)], gap=10), {"s": [{"start": 100, "end": 110, "count": 2}]})
```

## Hidden checks

```python
expect("empty events returns empty dict", lambda: get("build_sessions")([], gap=5), {})
def _bad():
    try:
        get("build_sessions")([], gap=-1)
        return False
    except ValueError:
        return True
expect("negative gap raises ValueError", _bad, True)
```

## Solution

```python
def build_sessions(events, gap):
    if gap < 0:
        raise ValueError("gap must be >= 0")
    by_key = {}
    for key, ts in events:
        by_key.setdefault(key, []).append(ts)
    out = {}
    for key, times in by_key.items():
        times.sort()
        sessions = []
        start = end = times[0]
        count = 1
        for ts in times[1:]:
            if ts - end <= gap:
                end = ts
                count += 1
            else:
                sessions.append({"start": start, "end": end, "count": count})
                start = end = ts
                count = 1
        sessions.append({"start": start, "end": end, "count": count})
        out[key] = sessions
    return out
```

## Restored

Activity bursts are stitched into per-key session windows across out-of-order arrivals.

---
id: maintenance-fix-drift-ignore
title: Fix a drift check that flags ignored dynamic attributes
system: Drift vault
symbol: equipment
scene: tests
skills: infra-as-code
reviewSkill: infra-as-code
prerequisite: state-locking
---

## Briefing

A drift checker is waking on-call engineers every five minutes because it forgot to skip `ignore_keys` like `"last_heartbeat"` when comparing recorded vs. live attributes!

## Objective

Fix `drifted_keys(recorded, live, ignore_keys=())` so it returns a sorted list of attribute keys that differ between `recorded` and `live` (including keys present in only one dict), EXCLUDING any key in `ignore_keys`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Subtract `set(ignore_keys)` from `set(recorded) | set(live)` and use a sentinel for missing keys.

## Starter

```python
def drifted_keys(recorded, live, ignore_keys=()):
    keys = set(recorded) | set(live)
    return sorted(k for k in keys if recorded.get(k) != live.get(k))
```

## Checks

```python
expect("skips ignored dynamic keys", lambda: get("drifted_keys")({"port": 80, "ts": 1}, {"port": 80, "ts": 2}, ignore_keys=["ts"]), [])
expect("reports real drifted keys", lambda: get("drifted_keys")({"port": 80, "ts": 1}, {"port": 443, "ts": 2}, ignore_keys=["ts"]), ["port"])
```

## Hidden checks

```python
expect("detects added None key as drift when not ignored", lambda: get("drifted_keys")({"a": 1}, {"a": 1, "b": None}, ignore_keys=[]), ["b"])
```

## Solution

```python
_MISSING = object()


def drifted_keys(recorded, live, ignore_keys=()):
    ignored = set(ignore_keys)
    keys = (set(recorded) | set(live)) - ignored
    return sorted(k for k in keys if recorded.get(k, _MISSING) != live.get(k, _MISSING))
```

## Restored

Drift checks now ignore noisy runtime metadata without missing real configuration changes.

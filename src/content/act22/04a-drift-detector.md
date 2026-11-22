---
id: drift-detector
title: Detect live cloud configuration drift against recorded state
system: Drift vault
symbol: equipment
scene: tests
skills: infra-as-code
---

## Briefing

When someone hotfixes a firewall rule directly in the cloud console, real infrastructure diverges from your IaC state file. A **drift detector** compares recorded state against live cloud telemetry — flagging missing resources, unmanaged (shadow) resources, and modified attributes while skipping explicitly ignored dynamic fields.

## Concept

Write `detect_drift(state, live, ignore_keys=())`:
- `state` and `live` map `resource_id -> dict_of_attrs`.
- `ignore_keys` is an iterable of attribute names to ignore (e.g. `("updated_at", "cpu_load")`).
- Classify every resource ID across `state` and `live`:
  - In `state` but missing from `live` -> `"missing"` (sorted list of IDs).
  - In `live` but missing from `state` -> `"unmanaged"` (sorted list of IDs).
  - In both: compare all keys NOT in `ignore_set`; if any value differs (or a key was added/removed), record `modified[rid] = {k: (state_val_or_None, live_val_or_None)}` for each drifted key!
- Return `{"missing": [...], "unmanaged": [...], "modified": {...}, "drifted": bool}` where `"drifted"` is `True` iff any of `missing`, `unmanaged`, or `modified` is non-empty.

## Objective

Implement `detect_drift(state, live, ignore_keys=())`.

## Hints

1. Use a sentinel `_MISSING = object()` to detect added/removed keys accurately, then store `(state_attrs.get(k), live_attrs.get(k))` in the diff dict.

## Starter: guided

```python
_MISSING = object()


def detect_drift(state, live, ignore_keys=()):
    ignored = set(ignore_keys)
    missing = sorted(rid for rid in state if rid not in live)
    unmanaged = sorted(rid for rid in live if rid not in state)
    modified = {}
    # Compare shared resources across non-ignored keys.
    return {
        "missing": missing,
        "unmanaged": unmanaged,
        "modified": modified,
        "drifted": bool(missing or unmanaged or modified),
    }
```

## Starter: standard

```python
def detect_drift(state, live, ignore_keys=()):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _drift():
    state = {
        "sg-web": {"port": 443, "open": False, "updated_at": 100},
        "db-1": {"tier": "large"},
    }
    live = {
        "sg-web": {"port": 443, "open": True, "updated_at": 999},
        "shadow-vm": {"size": "xl"},
    }
    return get("detect_drift")(state, live, ignore_keys=["updated_at"])
expect("flags missing, unmanaged, and modified resources while skipping ignored keys", _drift, {
    "missing": ["db-1"],
    "unmanaged": ["shadow-vm"],
    "modified": {"sg-web": {"open": (False, True)}},
    "drifted": True,
})
```

## Hidden checks

```python
def _clean():
    s = {"r1": {"a": 1, "ts": 10}}
    l = {"r1": {"a": 1, "ts": 99}}
    return get("detect_drift")(s, l, ignore_keys=("ts",))
expect("returns drifted=False when only ignored keys differ", _clean, {
    "missing": [],
    "unmanaged": [],
    "modified": {},
    "drifted": False,
})
```

## Solution

```python
_MISSING = object()


def detect_drift(state, live, ignore_keys=()):
    ignored = set(ignore_keys)
    missing = sorted(rid for rid in state if rid not in live)
    unmanaged = sorted(rid for rid in live if rid not in state)
    modified = {}
    for rid in sorted(set(state) & set(live)):
        sa, la = state[rid], live[rid]
        diffs = {}
        for k in sorted((set(sa) | set(la)) - ignored):
            if sa.get(k, _MISSING) != la.get(k, _MISSING):
                diffs[k] = (sa.get(k), la.get(k))
        if diffs:
            modified[rid] = diffs
    return {
        "missing": missing,
        "unmanaged": unmanaged,
        "modified": modified,
        "drifted": bool(missing or unmanaged or modified),
    }
```

## Restored

The drift vault now spots manual console edits and shadow resources without tripping over noisy runtime timestamps.

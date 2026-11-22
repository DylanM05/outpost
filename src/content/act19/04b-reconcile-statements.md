---
id: reconcile-statements
title: Reconcile internal ledgers against external statements
system: Saga rail
symbol: controller
scene: tests
skills: financial-ledgers
---

## Briefing

At end of day, the outpost compares its internal ledger against the valley bank's settlement feed. Every single discrepancy — missing settlements, unexpected external charges, or penny mismatches — must surface cleanly for audit.

## Concept

Compare `internal` (`{tx_id: cents}`) against `external` (`{tx_id: cents}`):
- `"matched"`: sorted `tx_id`s present in BOTH with identical `cents`.
- `"missing_external"`: sorted `tx_id`s in `internal` but NOT in `external`.
- `"missing_internal"`: sorted `tx_id`s in `external` but NOT in `internal`.
- `"mismatched"`: sorted list of `(tx_id, internal_cents, external_cents)` for `tx_id`s present in BOTH with differing amounts.

## Objective

Write `reconcile(internal, external)` returning:
`{"matched": [...], "missing_external": [...], "missing_internal": [...], "mismatched": [...]}`.

## Hints

1. Walk `sorted(set(internal) | set(external))` so every output list is naturally sorted by `tx_id`!
2. Four clean mutually exclusive branches cover every key.

## Starter: guided

```python
def reconcile(internal, external):
    matched = []
    missing_external = []
    missing_internal = []
    mismatched = []
    for tx_id in sorted(set(internal) | set(external)):
        # Classify tx_id into matched, missing_external, missing_internal, or mismatched
        pass
    return {
        "matched": matched,
        "missing_external": missing_external,
        "missing_internal": missing_internal,
        "mismatched": mismatched,
    }
```

## Starter: standard

```python
def reconcile(internal, external):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "classifies matched, missing, and mismatched settlement entries",
    lambda: get("reconcile")(
        {"t1": 100, "t2": 250, "t3": 400},
        {"t1": 100, "t2": 249, "t4": 999},
    ),
    {
        "matched": ["t1"],
        "missing_external": ["t3"],
        "missing_internal": ["t4"],
        "mismatched": [("t2", 250, 249)],
    },
)
expect("empty feeds reconcile cleanly", lambda: get("reconcile")({}, {}), {"matched": [], "missing_external": [], "missing_internal": [], "mismatched": []})
```

## Hidden checks

```python
expect("handles negative refunds accurately", lambda: get("reconcile")({"r1": -50}, {"r1": -50})["matched"], ["r1"])
```

## Solution

```python
def reconcile(internal, external):
    matched = []
    missing_external = []
    missing_internal = []
    mismatched = []
    for tx_id in sorted(set(internal) | set(external)):
        in_int = tx_id in internal
        in_ext = tx_id in external
        if in_int and not in_ext:
            missing_external.append(tx_id)
        elif in_ext and not in_int:
            missing_internal.append(tx_id)
        elif internal[tx_id] == external[tx_id]:
            matched.append(tx_id)
        else:
            mismatched.append((tx_id, internal[tx_id], external[tx_id]))
    return {
        "matched": matched,
        "missing_external": missing_external,
        "missing_internal": missing_internal,
        "mismatched": mismatched,
    }
```

## Restored

End-of-day reconciliation flags every missing settlement and penny discrepancy automatically.

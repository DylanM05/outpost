---
id: zone-map-prune
title: Prune Parquet row groups using min/max zone maps
system: Column vault
symbol: equipment
scene: tests
skills: analytical-storage
---

## Briefing

Why can a columnar database scan a billion rows in milliseconds? Because every **row group** stores tiny **zone-map statistics** (`min` and `max` per column). If a query asks for `temp > 80` and a row group's `max(temp)` is `42`, the engine skips reading that entire block from disk!

## Concept

Each row group dict looks like:
`{"id": "rg-0", "stats": {"temp": (10, 42), "ts": (1000, 2000)}}`
where `(col_min, col_max)` are inclusive bounds of non-null values in that row group.

Predicate tuple `(col, op, val)` where `op` is one of `"=="`, `"<"`, `"<="`, `">"`, `">="`:
A row group **CANNOT** match (so prune it!) when:
- `"=="`: `val < lo or val > hi`
- `"<"`: `lo >= val` (even the smallest value isn't `< val`)
- `"<="`: `lo > val`
- `">"`: `hi <= val` (even the largest value isn't `> val`)
- `">="`: `hi < val`

If `col` has no stats in the row group, be **conservative** and do NOT prune (it might match!). A row group survives a list of ANDed predicates iff it could match **every** predicate.

## Objective

Write `select_row_groups(row_groups, predicates)` returning the list of surviving row-group `"id"` values in their original order. Raise `ValueError` on an unsupported operator.

## Hints

1. Write `_may_match(stats, col, op, val)` returning `True` if `col not in stats` or the range `[lo, hi]` overlaps the predicate.
2. Return `[rg["id"] for rg in row_groups if all(_may_match(rg["stats"], c, op, v) for c, op, v in predicates)]`.

## Starter: guided

```python
def _may_match(stats, col, op, val):
    if op not in ("==", "<", "<=", ">", ">="):
        raise ValueError(f"unsupported operator: {op}")
    if col not in stats:
        return True
    lo, hi = stats[col]
    # Return True if [lo, hi] can satisfy `x <op> val`
    return True


def select_row_groups(row_groups, predicates):
    return [
        rg["id"]
        for rg in row_groups
        if all(_may_match(rg["stats"], col, op, val) for col, op, val in predicates)
    ]
```

## Starter: standard

```python
def select_row_groups(row_groups, predicates):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _prune():
    rgs = [
        {"id": "rg-0", "stats": {"temp": (10, 40), "ts": (100, 200)}},
        {"id": "rg-1", "stats": {"temp": (35, 85), "ts": (201, 300)}},
        {"id": "rg-2", "stats": {"temp": (80, 95), "ts": (301, 400)}},
    ]
    fn = get("select_row_groups")
    q1 = fn(rgs, [("temp", ">", 80)])
    q2 = fn(rgs, [("temp", ">=", 80), ("ts", "<=", 250)])
    q3 = fn(rgs, [("temp", "==", 38)])
    return (q1, q2, q3)
expect("skips row groups whose min/max cannot satisfy predicates", _prune, (["rg-1", "rg-2"], ["rg-1"], ["rg-0", "rg-1"]))
```

## Hidden checks

```python
def _missing_and_edge():
    rgs = [
        {"id": "rg-no-stat", "stats": {}},
        {"id": "rg-exact", "stats": {"x": (5, 5)}},
    ]
    fn = get("select_row_groups")
    return (fn(rgs, [("x", "<", 5)]), fn(rgs, [("x", "<=", 5)]))
expect("keeps row groups missing stats and checks strict vs inclusive bounds", _missing_and_edge, (["rg-no-stat"], ["rg-no-stat", "rg-exact"]))
```

## Solution

```python
def _may_match(stats, col, op, val):
    if op not in ("==", "<", "<=", ">", ">="):
        raise ValueError(f"unsupported operator: {op}")
    if col not in stats:
        return True
    lo, hi = stats[col]
    if op == "==":
        return lo <= val <= hi
    if op == "<":
        return lo < val
    if op == "<=":
        return lo <= val
    if op == ">":
        return hi > val
    return hi >= val


def select_row_groups(row_groups, predicates):
    out = []
    for rg in row_groups:
        if all(_may_match(rg["stats"], col, op, val) for col, op, val in predicates):
            out.append(rg["id"])
    return out
```

## Restored

Zone-map predicate pushdown now skips non-matching row groups before touching a single compressed page.

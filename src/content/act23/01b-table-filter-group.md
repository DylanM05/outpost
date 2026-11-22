---
id: table-filter-group
title: Filter and aggregate tabular datasets with groupby
system: Census bench
symbol: instrument
scene: tests
skills: tabular-wrangling
---

## Briefing

Data analysts spend half their day filtering messy rows and computing multi-metric group summaries (`count`, `sum`, `mean`, `min`, `max`) while ignoring `None` values inside numeric columns — just like `pandas.DataFrame.groupby().agg()`.

## Concept

Write `group_aggregate(rows, group_col, value_col, where=None)`:
- `rows` is a list of dicts.
- If `where` is provided (a callable `where(row) -> bool`), keep only rows where `where(row)` is truthy.
- Group surviving rows by `row[group_col]`.
- For each group, inspect all values of `row.get(value_col)` that are **not `None`**:
  - `"rows"`: total filtered rows in this group (including rows where `value_col` is `None`).
  - `"count"`: number of non-`None` values.
  - `"sum"`: sum of non-`None` values (or `0` if `count == 0`).
  - `"mean"`: `round(sum / count, 4)` if `count > 0` else `None`.
  - `"min"` / `"max"`: minimum / maximum non-`None` value, or `None` if `count == 0`.
- Return a dict keyed by group value (sorted keys).

## Objective

Implement `group_aggregate(rows, group_col, value_col, where=None)`.

## Hints

1. Group filtered rows first so even a group whose `value_col` values are all `None` still appears with `"rows": n, "count": 0, "sum": 0, "mean": None, "min": None, "max": None`.

## Starter: guided

```python
def group_aggregate(rows, group_col, value_col, where=None):
    buckets = {}
    for row in rows:
        if where is not None and not where(row):
            continue
        key = row[group_col]
        buckets.setdefault(key, []).append(row.get(value_col))
    result = {}
    for key in sorted(buckets):
        # Compute rows, count, sum, mean, min, max ignoring None values.
        pass
    return result
```

## Starter: standard

```python
def group_aggregate(rows, group_col, value_col, where=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_ROWS = [
    {"site": "north", "kw": 10, "ok": True},
    {"site": "north", "kw": None, "ok": True},
    {"site": "north", "kw": 20, "ok": True},
    {"site": "south", "kw": 5, "ok": False},
    {"site": "south", "kw": None, "ok": True},
]
expect("filters rows, groups cleanly, and ignores None in numeric stats", lambda: get("group_aggregate")(_ROWS, "site", "kw", where=lambda r: r["ok"]), {
    "north": {"rows": 3, "count": 2, "sum": 30, "mean": 15.0, "min": 10, "max": 20},
    "south": {"rows": 1, "count": 0, "sum": 0, "mean": None, "min": None, "max": None},
})
```

## Hidden checks

```python
expect("handles empty input", lambda: get("group_aggregate")([], "site", "kw"), {})
expect("rounds mean to 4 decimals without filter", lambda: get("group_aggregate")([{"g": "a", "v": 1}, {"g": "a", "v": 2}, {"g": "a", "v": 2}], "g", "v")["a"]["mean"], 1.6667)
```

## Solution

```python
def group_aggregate(rows, group_col, value_col, where=None):
    buckets = {}
    for row in rows:
        if where is not None and not where(row):
            continue
        buckets.setdefault(row[group_col], []).append(row.get(value_col))
    result = {}
    for key in sorted(buckets):
        all_vals = buckets[key]
        nums = [v for v in all_vals if v is not None]
        if nums:
            total = sum(nums)
            result[key] = {
                "rows": len(all_vals),
                "count": len(nums),
                "sum": total,
                "mean": round(total / len(nums), 4),
                "min": min(nums),
                "max": max(nums),
            }
        else:
            result[key] = {
                "rows": len(all_vals),
                "count": 0,
                "sum": 0,
                "mean": None,
                "min": None,
                "max": None,
            }
    return result
```

## Restored

The census bench now summarizes grouped telemetry cleanly while handling missing values gracefully.

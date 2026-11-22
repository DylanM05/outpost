---
id: pivot-and-melt
title: Reshape tables between long and wide formats with pivot and melt
system: Reshape rack
symbol: equipment
scene: tests
skills: tabular-wrangling
---

## Briefing

Charts and reporting spreadsheets want **wide** tables (one column per metric or month), while SQL databases and statistical models want **long (tidy)** tables (one observation per row). Implementing `pivot_table` and `melt_table` gives you both directions on demand.

## Concept

1. **`pivot_table(rows, index_col, pivot_col, value_col, agg="sum", fill_value=0)`:**
   - `agg` is `"sum"`, `"mean"`, or `"count"` (raise `ValueError` otherwise).
   - Collect all unique sorted index values (`row[index_col]`) and all unique sorted pivot column values (`row[pivot_col]`).
   - Group values by `(idx_val, piv_val)`:
     - If no rows exist for `(idx_val, piv_val)`: use `fill_value`.
     - Else if `agg == "sum"`: `sum(vals)`.
     - Else if `agg == "count"`: `len(vals)`.
     - Else if `agg == "mean"`: `round(sum(vals) / len(vals), 4)`.
   - Return a list of dicts (one per sorted `idx_val`): `{index_col: idx_val, piv_1: ..., piv_2: ...}`.
2. **`melt_table(rows, id_col, value_cols, var_name="variable", value_name="value")`:**
   - Unpivots each wide row in order: for each `row` in `rows`, for each `col` in `value_cols`, emit `{id_col: row[id_col], var_name: col, value_name: row[col]}`.

## Objective

Implement `pivot_table(rows, index_col, pivot_col, value_col, agg="sum", fill_value=0)` and `melt_table(rows, id_col, value_cols, var_name="variable", value_name="value")`.

## Hints

1. Collect `idx_vals = sorted({r[index_col] for r in rows})` and `piv_vals = sorted({r[pivot_col] for r in rows})` so every output row has the exact same set of columns!

## Starter: guided

```python
def pivot_table(rows, index_col, pivot_col, value_col, agg="sum", fill_value=0):
    if agg not in ("sum", "mean", "count"):
        raise ValueError("agg must be 'sum', 'mean', or 'count'")
    # Collect sorted index values & pivot columns, aggregate cells, return wide rows.
    pass


def melt_table(rows, id_col, value_cols, var_name="variable", value_name="value"):
    pass
```

## Starter: standard

```python
def pivot_table(rows, index_col, pivot_col, value_col, agg="sum", fill_value=0):
    pass


def melt_table(rows, id_col, value_cols, var_name="variable", value_name="value"):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_LONG = [
    {"site": "A", "month": "Jan", "kwh": 10},
    {"site": "A", "month": "Jan", "kwh": 5},
    {"site": "A", "month": "Feb", "kwh": 20},
    {"site": "B", "month": "Jan", "kwh": 8},
]
expect("pivots long rows into wide summary table with fill_value", lambda: get("pivot_table")(_LONG, "site", "month", "kwh", agg="sum", fill_value=0), [
    {"site": "A", "Feb": 20, "Jan": 15},
    {"site": "B", "Feb": 0, "Jan": 8},
])

_WIDE = [{"site": "A", "Jan": 15, "Feb": 20}, {"site": "B", "Jan": 8, "Feb": 0}]
expect("melts wide table back into tidy long observations", lambda: get("melt_table")(_WIDE, "site", ["Jan", "Feb"], var_name="month", value_name="kwh"), [
    {"site": "A", "month": "Jan", "kwh": 15},
    {"site": "A", "month": "Feb", "kwh": 20},
    {"site": "B", "month": "Jan", "kwh": 8},
    {"site": "B", "month": "Feb", "kwh": 0},
])
```

## Hidden checks

```python
_LONG2 = [{"g": "x", "k": "m", "v": 2}, {"g": "x", "k": "m", "v": 5}]
expect("supports mean and count aggregations", lambda: (
    get("pivot_table")(_LONG2, "g", "k", "v", agg="mean"),
    get("pivot_table")(_LONG2, "g", "k", "v", agg="count"),
), (
    [{"g": "x", "m": 3.5}],
    [{"g": "x", "m": 2}],
))
```

## Solution

```python
def pivot_table(rows, index_col, pivot_col, value_col, agg="sum", fill_value=0):
    if agg not in ("sum", "mean", "count"):
        raise ValueError("agg must be 'sum', 'mean', or 'count'")
    if not rows:
        return []
    idx_vals = sorted({r[index_col] for r in rows})
    piv_vals = sorted({r[pivot_col] for r in rows})
    cells = {}
    for r in rows:
        cells.setdefault((r[index_col], r[pivot_col]), []).append(r[value_col])

    out = []
    for iv in idx_vals:
        rec = {index_col: iv}
        for pv in piv_vals:
            vals = cells.get((iv, pv))
            if not vals:
                rec[pv] = fill_value
            elif agg == "sum":
                rec[pv] = sum(vals)
            elif agg == "count":
                rec[pv] = len(vals)
            else:
                rec[pv] = round(sum(vals) / len(vals), 4)
        out.append(rec)
    return out


def melt_table(rows, id_col, value_cols, var_name="variable", value_name="value"):
    out = []
    for r in rows:
        for col in value_cols:
            out.append({id_col: r[id_col], var_name: col, value_name: r[col]})
    return out
```

## Restored

The reshape rack now converts effortlessly between wide reporting grids and tidy long datasets.

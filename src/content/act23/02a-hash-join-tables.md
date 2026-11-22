---
id: hash-join-tables
title: Combine datasets with O(N + M) inner and left hash joins
system: Reshape rack
symbol: equipment
scene: tests
skills: tabular-wrangling
---

## Briefing

Joining two tables by scanning the right table for every left row takes $O(N \times M)$ time. A **hash join** builds an index over the right table's join key in $O(M)$ time and probes it in $O(1)$ per left row — supporting both `"inner"` and `"left"` joins with automatic column suffixing on collisions.

## Concept

Write `hash_join(left_rows, right_rows, on, how="inner", right_suffix="_r")`:
- `how` must be `"inner"` or `"left"` (raise `ValueError` otherwise).
- Index `right_rows` into `right_index[row[on]].append(row)` (preserving right-table order for 1-to-many matches).
- Collect the ordered union of all non-join column names appearing in `right_rows` so unmatched `"left"` rows receive `None` for every right column!
- For each `lrow` in `left_rows`:
  - Look up `matches = right_index.get(lrow[on], [])`.
  - If `matches`: for each `rrow` in `matches`, merge `lrow` and `rrow`:
    - Start with `dict(lrow)`.
    - For every `(k, v)` in `rrow.items()` where `k != on`:
      - Output key is `f"{k}{right_suffix}"` if `k in lrow` else `k`.
      - Set `merged[out_key] = v`.
  - Else if `how == "left"`:
    - Start with `dict(lrow)`.
    - For each right non-join column `k`: set `f"{k}{right_suffix}" if k in lrow else k` to `None`.
- Return the list of merged row dicts.

## Objective

Implement `hash_join(left_rows, right_rows, on, how="inner", right_suffix="_r")`.

## Hints

1. Preserve the order of `left_rows` (and within each left row, the order of matching `right_rows`).
2. Skip the join key `on` when copying columns from `rrow` so you don't create a duplicate `id_r` column!

## Starter: guided

```python
def hash_join(left_rows, right_rows, on, how="inner", right_suffix="_r"):
    if how not in ("inner", "left"):
        raise ValueError("how must be 'inner' or 'left'")
    right_index = {}
    right_cols = []
    seen_rcols = set()
    for r in right_rows:
        right_index.setdefault(r[on], []).append(r)
        for k in r:
            if k != on and k not in seen_rcols:
                seen_rcols.add(k)
                right_cols.append(k)
    # Probe right_index for each left row; handle inner vs left and suffix colliding keys.
    pass
```

## Starter: standard

```python
def hash_join(left_rows, right_rows, on, how="inner", right_suffix="_r"):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_USERS = [{"id": 1, "name": "Ada"}, {"id": 2, "name": "Lin"}]
_ORDERS = [{"id": 1, "name": "Sensor", "amt": 50}, {"id": 1, "name": "Cable", "amt": 10}]
expect("inner hash join handles 1-to-many matches and suffixes colliding columns", lambda: get("hash_join")(_USERS, _ORDERS, on="id", how="inner"), [
    {"id": 1, "name": "Ada", "name_r": "Sensor", "amt": 50},
    {"id": 1, "name": "Ada", "name_r": "Cable", "amt": 10},
])
expect("left hash join preserves unmatched left rows with None right columns", lambda: get("hash_join")(_USERS, _ORDERS, on="id", how="left"), [
    {"id": 1, "name": "Ada", "name_r": "Sensor", "amt": 50},
    {"id": 1, "name": "Ada", "name_r": "Cable", "amt": 10},
    {"id": 2, "name": "Lin", "name_r": None, "amt": None},
])
```

## Hidden checks

```python
def _bad_how():
    try:
        get("hash_join")([], [], on="id", how="outer")
        return False
    except ValueError:
        return True
expect("rejects unsupported join mode", _bad_how, True)
expect("empty right table on left join keeps all left rows", lambda: get("hash_join")([{"id": 1, "x": 9}], [], on="id", how="left"), [{"id": 1, "x": 9}])
```

## Solution

```python
def hash_join(left_rows, right_rows, on, how="inner", right_suffix="_r"):
    if how not in ("inner", "left"):
        raise ValueError("how must be 'inner' or 'left'")
    right_index = {}
    right_cols = []
    seen_rcols = set()
    for r in right_rows:
        right_index.setdefault(r[on], []).append(r)
        for k in r:
            if k != on and k not in seen_rcols:
                seen_rcols.add(k)
                right_cols.append(k)

    out = []
    for lrow in left_rows:
        matches = right_index.get(lrow[on])
        if matches:
            for rrow in matches:
                merged = dict(lrow)
                for k, v in rrow.items():
                    if k == on:
                        continue
                    key = f"{k}{right_suffix}" if k in lrow else k
                    merged[key] = v
                out.append(merged)
        elif how == "left":
            merged = dict(lrow)
            for k in right_cols:
                key = f"{k}{right_suffix}" if k in lrow else k
                merged[key] = None
            out.append(merged)
    return out
```

## Restored

The reshape rack now joins multi-table datasets in linear time with clean conflict suffixing.

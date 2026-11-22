---
id: maintenance-fix-left-join-nulls
title: Fix a left join that drops unmatched left rows
system: Reshape rack
symbol: equipment
scene: tests
skills: tabular-wrangling
reviewSkill: tabular-wrangling
prerequisite: pivot-and-melt
---

## Briefing

A reporting script calls `left_join_lookup(left_rows, right_by_key, key_col, right_col)` expecting every left row to survive, but unmatched left rows are silently disappearing as if it were an inner join!

## Objective

Fix `left_join_lookup(left_rows, right_by_key, key_col, right_col)` so EVERY row in `left_rows` is emitted in order, with `right_col` set to `right_by_key[row[key_col]]` when found or `None` when unmatched (without mutating the input dicts!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Emit a copy `{**row, right_col: right_by_key.get(row[key_col])}` for every row instead of `if k in right_by_key:`!

## Starter

```python
def left_join_lookup(left_rows, right_by_key, key_col, right_col):
    out = []
    for row in left_rows:
        k = row[key_col]
        if k in right_by_key:
            out.append({**row, right_col: right_by_key[k]})
    return out
```

## Checks

```python
expect("preserves unmatched left rows with None", lambda: get("left_join_lookup")([{"id": 1}, {"id": 2}], {1: "ok"}, "id", "status"), [
    {"id": 1, "status": "ok"},
    {"id": 2, "status": None},
])
```

## Hidden checks

```python
def _no_mutate():
    src = [{"id": 1}]
    res = get("left_join_lookup")(src, {1: "a"}, "id", "val")
    return ("val" not in src[0], res[0]["val"])
expect("does not mutate input rows", _no_mutate, (True, "a"))
```

## Solution

```python
def left_join_lookup(left_rows, right_by_key, key_col, right_col):
    return [{**row, right_col: right_by_key.get(row[key_col])} for row in left_rows]
```

## Restored

Left joins now retain every primary row with clean `None` padding for missing lookups.

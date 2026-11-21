---
id: maintenance-null-rate-check
title: Flag columns exceeding a data-quality null threshold
system: Schema gate
symbol: controller
scene: tests
skills: data-pipelines
reviewSkill: data-pipelines
prerequisite: join-asof
---

## Briefing

A sensor firmware update silently started emitting `None` for half of its pressure readings! Add a data-quality check that reports every column whose missing/null fraction exceeds `max_null_rate`.

## Objective

Write `failing_columns(rows, columns, max_null_rate)` where:
- `rows` is a list of record dicts
- `columns` is a list of column names to check
- `max_null_rate` is a float in `[0.0, 1.0]` (raise `ValueError` if outside `[0.0, 1.0]`)

A cell is null if the key is missing from a row OR its value is `None`. Return a **sorted** list of column names whose `null_count / len(rows) > max_null_rate` (strictly greater!). If `rows` is empty, return `[]`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `0.0 <= max_null_rate <= 1.0`. If `not rows`, return `[]`.
2. For each `col` in `columns`, count `sum(1 for r in rows if r.get(col) is None)` and compare `nulls / len(rows) > max_null_rate`.

## Starter

```python
```

## Checks

```python
expect(
    "flags columns with null rate strictly above threshold",
    lambda: get("failing_columns")(
        [{"a": 1, "b": None}, {"a": 2, "b": None}, {"a": None}, {"a": 4, "b": 1}],
        ["a", "b"],
        0.25,
    ),
    ["b"],
)
expect("empty rows returns empty list", lambda: get("failing_columns")([], ["a"], 0.0), [])
```

## Hidden checks

```python
expect("missing key counts as null", lambda: get("failing_columns")([{}, {"x": 1}], ["x"], 0.4), ["x"])
def _bad():
    try:
        get("failing_columns")([], ["a"], 1.5)
        return False
    except ValueError:
        return True
expect("threshold outside [0, 1] raises ValueError", _bad, True)
```

## Solution

```python
def failing_columns(rows, columns, max_null_rate):
    if not (0.0 <= max_null_rate <= 1.0):
        raise ValueError("max_null_rate must be between 0.0 and 1.0")
    if not rows:
        return []
    n = len(rows)
    bad = []
    for col in columns:
        nulls = sum(1 for row in rows if row.get(col) is None)
        if (nulls / n) > max_null_rate:
            bad.append(col)
    return sorted(bad)
```

## Restored

Data-quality gates catch sudden null spikes before corrupted partitions publish downstream.

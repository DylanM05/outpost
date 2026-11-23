---
id: maintenance-sql-fix-check-constraint
language: sql
title: Fix a CREATE TABLE CHECK constraint that rejected 0% and 100% throttle values
system: Schema forge
symbol: equipment
scene: tests
skills: sql-schema-dml
reviewSkill: sql-schema-dml
prerequisite: sql-correlated-update-delete
---

## Briefing

`thruster_settings` is supposed to allow `throttle_pct` values from `0` through `100` inclusive (`0 <= throttle_pct <= 100`) and default `mode` to `'auto'`. The current `CREATE TABLE` definition uses strict inequalities (`throttle_pct > 0 AND throttle_pct < 100`), causing idle (`0`) and full-thrust (`100`) updates to crash with `IntegrityError`!

## Objective

Fix the `CREATE TABLE thruster_settings` statement so `throttle_pct` allows `0` and `100` while still rejecting `< 0` or `> 100`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change the `CHECK` constraint to `CHECK (throttle_pct >= 0 AND throttle_pct <= 100)` (or `CHECK (throttle_pct BETWEEN 0 AND 100)`).

## Setup

```sql
-- thruster_settings will be created by your script.
```

## Starter

```sql
CREATE TABLE thruster_settings (
  thruster_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'auto',
  throttle_pct INTEGER NOT NULL CHECK (throttle_pct > 0 AND throttle_pct < 100)
);
```

## Checks

```python
def _test_boundary_values():
    conn.execute("INSERT INTO thruster_settings (thruster_id, throttle_pct) VALUES ('TH-1', 0), ('TH-2', 100)")
    return query("SELECT thruster_id, mode, throttle_pct FROM thruster_settings ORDER BY thruster_id ASC")

expect(
    "accepts boundary throttle_pct values 0 and 100 with default mode 'auto'",
    _test_boundary_values,
    [
        ["TH-1", "auto", 0],
        ["TH-2", "auto", 100],
    ],
)
```

## Hidden checks

```python
def _test_out_of_range():
    rejected = []
    for label, val in [("neg", -1), ("over", 101)]:
        try:
            conn.execute("INSERT INTO thruster_settings (thruster_id, throttle_pct) VALUES (?, ?)", (label, val))
        except Exception:
            rejected.append(label)
    return rejected

expect(
    "still rejects negative (-1) and over-100 (101) throttle_pct values",
    _test_out_of_range,
    ["neg", "over"],
)
```

## Solution

```sql
CREATE TABLE thruster_settings (
  thruster_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'auto',
  throttle_pct INTEGER NOT NULL CHECK (throttle_pct >= 0 AND throttle_pct <= 100)
);
```

## Restored

Schema forge boundary `CHECK` constraint fixed — `0%` idle and `100%` full-throttle states now pass validation while out-of-range inputs are blocked.

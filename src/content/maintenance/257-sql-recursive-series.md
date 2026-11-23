---
id: maintenance-sql-recursive-series
language: sql
title: Backfill missing hourly telemetry slots with a WITH RECURSIVE sequence
system: CTE spire
symbol: controller
scene: tests
skills: sql-windows-ctes
reviewSkill: sql-windows-ctes
prerequisite: sql-recursive-cte-graph
---

## Briefing

`hourly_pings` only stores rows for hours when a ping arrived, leaving gaps for silent hours. By generating a complete integer sequence from hour `1` through `5` with a `WITH RECURSIVE` CTE and `LEFT JOIN`ing `hourly_pings`, the CTE spire can display `0` for silent hours.

## Objective

Write a `WITH RECURSIVE` query that generates `hour_slot` from `1` to `5` inclusive, `LEFT JOIN`s `hourly_pings` on `hour_slot`, and projects `hour_slot` and `ping_count` (`COALESCE(pings, 0)`), ordered by `hour_slot ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `WITH RECURSIVE slots(hour_slot) AS (SELECT 1 UNION ALL SELECT hour_slot + 1 FROM slots WHERE hour_slot < 5)`.
2. `LEFT JOIN hourly_pings hp ON slots.hour_slot = hp.hour_slot` and select `slots.hour_slot, COALESCE(hp.pings, 0) AS ping_count`.

## Setup

```sql
CREATE TABLE hourly_pings (
  hour_slot INTEGER PRIMARY KEY,
  pings INTEGER NOT NULL
);

INSERT INTO hourly_pings (hour_slot, pings) VALUES
  (1, 14),
  (3, 22),
  (5, 9);
```

## Starter

```sql
SELECT
  hour_slot,
  pings AS ping_count
FROM hourly_pings
ORDER BY hour_slot ASC;
```

## Checks

```python
expect(
    "projects hour_slot and ping_count",
    lambda: columns,
    ["hour_slot", "ping_count"],
)

expect(
    "fills missing hour slots 2 and 4 with ping_count = 0",
    lambda: rows,
    [
        [1, 14],
        [2, 0],
        [3, 22],
        [4, 0],
        [5, 9],
    ],
)
```

## Hidden checks

```python
def _test_fill_slot_2():
    conn.execute("INSERT INTO hourly_pings VALUES (2, 7)")
    return run_user_sql()

expect(
    "reflects newly logged pings in hour_slot 2 while keeping slot 4 at 0",
    _test_fill_slot_2,
    [
        [1, 14],
        [2, 7],
        [3, 22],
        [4, 0],
        [5, 9],
    ],
)
```

## Solution

```sql
WITH RECURSIVE slots(hour_slot) AS (
  SELECT 1
  UNION ALL
  SELECT hour_slot + 1
  FROM slots
  WHERE hour_slot < 5
)
SELECT
  s.hour_slot,
  COALESCE(hp.pings, 0) AS ping_count
FROM slots s
LEFT JOIN hourly_pings hp
  ON s.hour_slot = hp.hour_slot
ORDER BY s.hour_slot ASC;
```

## Restored

CTE spire time-series generator online — recursive slot generation fills telemetry gaps with zero counts.

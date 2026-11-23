---
id: maintenance-sql-fix-running-sum
language: sql
title: Fix a window SUM() OVER clause that repeated the partition grand total
system: Window tower
symbol: instrument
scene: tests
skills: sql-windows-ctes
reviewSkill: sql-windows-ctes
prerequisite: sql-recursive-cte-graph
---

## Briefing

An engineer wrote `SUM(charge_wh) OVER (PARTITION BY battery_id)` expecting a running cumulative total ordered by `step`. Because `OVER (PARTITION BY battery_id)` has no `ORDER BY` or row frame, SQL computes the **grand total** of the entire partition on every row!

## Objective

Fix the `OVER (...)` specification so `running_wh` computes the running cumulative sum of `charge_wh` partitioned by `battery_id` and ordered by `step ASC` (`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`), with final rows ordered by `battery_id ASC, step ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change the window clause to `SUM(charge_wh) OVER (PARTITION BY battery_id ORDER BY step ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_wh`.

## Setup

```sql
CREATE TABLE charge_steps (
  battery_id TEXT NOT NULL,
  step INTEGER NOT NULL,
  charge_wh INTEGER NOT NULL,
  PRIMARY KEY (battery_id, step)
);

INSERT INTO charge_steps (battery_id, step, charge_wh) VALUES
  ('BAT-1', 1, 100),
  ('BAT-1', 2, 150),
  ('BAT-1', 3, 50),
  ('BAT-2', 1, 200),
  ('BAT-2', 2, 120);
```

## Starter

```sql
SELECT
  battery_id,
  step,
  charge_wh,
  SUM(charge_wh) OVER (PARTITION BY battery_id) AS running_wh
FROM charge_steps
ORDER BY battery_id ASC, step ASC;
```

## Checks

```python
expect(
    "computes step-by-step running cumulative sum per battery",
    lambda: rows,
    [
        ["BAT-1", 1, 100, 100],
        ["BAT-1", 2, 150, 250],
        ["BAT-1", 3, 50, 300],
        ["BAT-2", 1, 200, 200],
        ["BAT-2", 2, 120, 320],
    ],
)
```

## Hidden checks

```python
def _test_extra_step():
    conn.execute("INSERT INTO charge_steps VALUES ('BAT-2', 3, 80)")
    return run_user_sql()

expect(
    "accumulates step 3 on BAT-2 to 400 Wh",
    _test_extra_step,
    [
        ["BAT-1", 1, 100, 100],
        ["BAT-1", 2, 150, 250],
        ["BAT-1", 3, 50, 300],
        ["BAT-2", 1, 200, 200],
        ["BAT-2", 2, 120, 320],
        ["BAT-2", 3, 80, 400],
    ],
)
```

## Solution

```sql
SELECT
  battery_id,
  step,
  charge_wh,
  SUM(charge_wh) OVER (
    PARTITION BY battery_id
    ORDER BY step ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_wh
FROM charge_steps
ORDER BY battery_id ASC, step ASC;
```

## Restored

Window tower running total fixed — adding `ORDER BY step ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` restores step-by-step accumulation.

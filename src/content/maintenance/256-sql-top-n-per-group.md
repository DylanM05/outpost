---
id: maintenance-sql-top-n-per-group
language: sql
title: Select the highest-output turbine per sector using ROW_NUMBER() OVER
system: Window tower
symbol: instrument
scene: tests
skills: sql-windows-ctes
reviewSkill: sql-windows-ctes
prerequisite: sql-recursive-cte-graph
---

## Briefing

The window tower needs the single highest-output turbine (`rn = 1`) in each `sector` from `turbines`, breaking ties by `turbine_id ASC`.

## Objective

Write a query (using a CTE or subquery with `ROW_NUMBER() OVER (PARTITION BY sector ORDER BY kw DESC, turbine_id ASC)`) that returns `sector`, `turbine_id`, and `kw` for the top turbine in each sector, ordered by `sector ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compute `ROW_NUMBER() OVER (PARTITION BY sector ORDER BY kw DESC, turbine_id ASC) AS rn` inside a `WITH ranked AS (...)` CTE, then filter `WHERE rn = 1` in the outer `SELECT`.

## Setup

```sql
CREATE TABLE turbines (
  turbine_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  kw INTEGER NOT NULL
);

INSERT INTO turbines (turbine_id, sector, kw) VALUES
  ('TB-1', 'east',  420),
  ('TB-2', 'east',  510),
  ('TB-3', 'north', 600),
  ('TB-4', 'north', 600),
  ('TB-5', 'south', 390);
```

## Starter

```sql
SELECT sector, turbine_id, kw
FROM turbines
ORDER BY sector ASC;
```

## Checks

```python
expect(
    "projects sector, turbine_id, kw",
    lambda: columns,
    ["sector", "turbine_id", "kw"],
)

expect(
    "returns top-1 turbine per sector breaking ties by turbine_id ASC",
    lambda: rows,
    [
        ["east", "TB-2", 510],
        ["north", "TB-3", 600],
        ["south", "TB-5", 390],
    ],
)
```

## Hidden checks

```python
def _test_new_leader():
    conn.execute("INSERT INTO turbines VALUES ('TB-6', 'south', 450)")
    return run_user_sql()

expect(
    "promotes TB-6 as south sector leader when inserted with 450 kW",
    _test_new_leader,
    [
        ["east", "TB-2", 510],
        ["north", "TB-3", 600],
        ["south", "TB-6", 450],
    ],
)
```

## Solution

```sql
WITH ranked AS (
  SELECT
    sector,
    turbine_id,
    kw,
    ROW_NUMBER() OVER (
      PARTITION BY sector
      ORDER BY kw DESC, turbine_id ASC
    ) AS rn
  FROM turbines
)
SELECT
  sector,
  turbine_id,
  kw
FROM ranked
WHERE rn = 1
ORDER BY sector ASC;
```

## Restored

Window tower top-N per sector filter restored — partitioned `ROW_NUMBER()` isolates each sector's leader cleanly.

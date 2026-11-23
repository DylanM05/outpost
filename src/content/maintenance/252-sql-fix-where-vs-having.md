---
id: maintenance-sql-fix-where-vs-having
language: sql
title: Fix a rollup query that filtered individual rows with WHERE instead of group sums with HAVING
system: Rollup bay
symbol: instrument
scene: tests
skills: sql-aggregations
reviewSkill: sql-aggregations
prerequisite: sql-multi-join-rollup
---

## Briefing

A rollup query on `battery_banks` is supposed to return every sector whose **combined** capacity (`SUM(capacity_kwh)`) is at least `300`. Instead, the author wrote `WHERE capacity_kwh >= 300`, which drops all individual batteries under `300` kWh before grouping!

## Objective

Fix the query so it includes all rows in `battery_banks`, groups by `sector`, and filters the grouped sums using `HAVING SUM(capacity_kwh) >= 300`, ordered by `total_kwh DESC, sector ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Remove `WHERE capacity_kwh >= 300` and place `HAVING SUM(capacity_kwh) >= 300` after `GROUP BY sector`.

## Setup

```sql
CREATE TABLE battery_banks (
  bank_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  capacity_kwh INTEGER NOT NULL
);

INSERT INTO battery_banks (bank_id, sector, capacity_kwh) VALUES
  ('BB-1', 'north', 150),
  ('BB-2', 'north', 180),
  ('BB-3', 'east',  120),
  ('BB-4', 'east',  140),
  ('BB-5', 'south', 310);
```

## Starter

```sql
SELECT
  sector,
  SUM(capacity_kwh) AS total_kwh
FROM battery_banks
WHERE capacity_kwh >= 300
GROUP BY sector
ORDER BY total_kwh DESC, sector ASC;
```

## Checks

```python
expect(
    "returns sectors whose combined total_kwh is at least 300",
    lambda: rows,
    [
        ["north", 330],
        ["south", 310],
    ],
)
```

## Hidden checks

```python
def _test_east_expansion():
    conn.execute("INSERT INTO battery_banks VALUES ('BB-6', 'east', 100)")
    return run_user_sql()

expect(
    "includes east sector once a third battery pushes its combined total_kwh to 360",
    _test_east_expansion,
    [
        ["east", 360],
        ["north", 330],
        ["south", 310],
    ],
)
```

## Solution

```sql
SELECT
  sector,
  SUM(capacity_kwh) AS total_kwh
FROM battery_banks
GROUP BY sector
HAVING SUM(capacity_kwh) >= 300
ORDER BY total_kwh DESC, sector ASC;
```

## Restored

Rollup bay aggregation filter fixed — `HAVING SUM(capacity_kwh) >= 300` evaluates the sector total rather than individual bank capacities.

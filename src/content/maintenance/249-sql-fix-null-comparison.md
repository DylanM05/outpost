---
id: maintenance-sql-fix-null-comparison
language: sql
title: Fix a query that compares NULL with = instead of IS NULL
system: Filter rack
symbol: equipment
scene: tests
skills: sql-queries
reviewSkill: sql-queries
prerequisite: sql-set-operations
---

## Briefing

An audit query intended to find all uncalibrated sensors in `sensors` (`calibrated_on` is `NULL`) is returning zero rows because the author wrote `WHERE calibrated_on = NULL`. In SQL's three-valued logic, `= NULL` always evaluates to `UNKNOWN`, never `TRUE`!

## Objective

Fix the `WHERE` clause so the query returns `sensor_id` and `sector` for every row where `calibrated_on` is `NULL`, ordered by `sensor_id ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Replace `WHERE calibrated_on = NULL` with `WHERE calibrated_on IS NULL`.

## Setup

```sql
CREATE TABLE sensors (
  sensor_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  calibrated_on TEXT
);

INSERT INTO sensors (sensor_id, sector, calibrated_on) VALUES
  ('S-10', 'north', '2026-10-01'),
  ('S-11', 'south', NULL),
  ('S-12', 'east',  '2026-10-15'),
  ('S-13', 'west',  NULL);
```

## Starter

```sql
SELECT
  sensor_id,
  sector
FROM sensors
WHERE calibrated_on = NULL
ORDER BY sensor_id ASC;
```

## Checks

```python
expect(
    "returns uncalibrated sensors where calibrated_on IS NULL",
    lambda: rows,
    [
        ["S-11", "south"],
        ["S-13", "west"],
    ],
)
```

## Hidden checks

```python
def _test_new_uncalibrated():
    conn.execute("INSERT INTO sensors VALUES ('S-09', 'north', NULL)")
    return run_user_sql()

expect(
    "includes newly inserted uncalibrated sensor S-09",
    _test_new_uncalibrated,
    [
        ["S-09", "north"],
        ["S-11", "south"],
        ["S-13", "west"],
    ],
)
```

## Solution

```sql
SELECT
  sensor_id,
  sector
FROM sensors
WHERE calibrated_on IS NULL
ORDER BY sensor_id ASC;
```

## Restored

Filter rack `NULL` predicate fixed — `IS NULL` properly surfaces uncalibrated sensors.

---
id: maintenance-sql-filter-between
language: sql
title: Filter valve pressure logs within an inclusive range by sector
system: Filter rack
symbol: equipment
scene: tests
skills: sql-queries
reviewSkill: sql-queries
prerequisite: sql-set-operations
---

## Briefing

The filter rack needs a clean list of normal-operating valve readings from `valve_logs`: only valves in sectors `'north'` or `'east'` whose pressure (`psi`) is between `120` and `180` inclusive.

## Objective

Write a `SELECT` query against `valve_logs` returning `valve_id`, `sector`, and `psi` for rows where `sector IN ('north', 'east')` and `psi BETWEEN 120 AND 180`, ordered by `psi DESC, valve_id ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Combine `WHERE sector IN ('north', 'east') AND psi BETWEEN 120 AND 180` and end with `ORDER BY psi DESC, valve_id ASC;`.

## Setup

```sql
CREATE TABLE valve_logs (
  valve_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  psi INTEGER NOT NULL
);

INSERT INTO valve_logs (valve_id, sector, psi) VALUES
  ('V-01', 'north', 150),
  ('V-02', 'north', 180),
  ('V-03', 'east',  120),
  ('V-04', 'east',  195),
  ('V-05', 'south', 160),
  ('V-06', 'north', 110);
```

## Starter

```sql
-- Return valve_id, sector, psi for north/east valves with psi between 120 and 180
SELECT valve_id, sector, psi
FROM valve_logs;
```

## Checks

```python
expect(
    "projects valve_id, sector, psi",
    lambda: columns,
    ["valve_id", "sector", "psi"],
)

expect(
    "filters north and east valves with psi between 120 and 180 inclusive",
    lambda: rows,
    [
        ["V-02", "north", 180],
        ["V-01", "north", 150],
        ["V-03", "east", 120],
    ],
)
```

## Hidden checks

```python
def _test_extra_valve():
    conn.execute("INSERT INTO valve_logs (valve_id, sector, psi) VALUES ('V-00', 'east', 150)")
    return run_user_sql()

expect(
    "orders tied psi readings by valve_id ASC",
    _test_extra_valve,
    [
        ["V-02", "north", 180],
        ["V-00", "east", 150],
        ["V-01", "north", 150],
        ["V-03", "east", 120],
    ],
)
```

## Solution

```sql
SELECT
  valve_id,
  sector,
  psi
FROM valve_logs
WHERE sector IN ('north', 'east')
  AND psi BETWEEN 120 AND 180
ORDER BY psi DESC, valve_id ASC;
```

## Restored

Filter rack range query restored — inclusive pressure thresholds and sector filters are back online.

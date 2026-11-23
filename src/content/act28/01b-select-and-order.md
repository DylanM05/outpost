---
id: sql-select-and-order
kind: code
language: sql
title: Query active relays ordered by priority and signal strength
system: Catalog desk
symbol: instrument
scene: tests
skills: sql-queries
---

## Briefing

The catalog desk tracks every communications relay on the ridge in the `relays` table. Dispatch needs a ranked feed of all active relays showing each relay's ID, sector, priority tier, and signal strength in decibel-milliwatts (`dbm`).

## Objective

Write a `SELECT` query against `relays` that:
1. Includes only rows where `status = 'active'`.
2. Projects four columns in exact order:
   - `relay_id`
   - `sector`
   - `priority`
   - `signal_dbm AS dbm`
3. Orders rows by `priority ASC` (tier `1` before tier `2`), then `signal_dbm DESC` (strongest signal first), then `relay_id ASC`.

## Concept

- Use `SELECT col1, col2, expr AS alias FROM table_name` to pick and rename columns.
- Use `WHERE status = 'active'` to filter rows before sorting.
- Multi-key `ORDER BY priority ASC, signal_dbm DESC, relay_id ASC` sorts by the first column, breaking ties with the second column, and then the third.

## Hints

1. Filter with `WHERE status = 'active'`.
2. Alias `signal_dbm` as `dbm` using `signal_dbm AS dbm`.
3. End the query with `ORDER BY priority ASC, signal_dbm DESC, relay_id ASC;`.

## Setup

```sql
CREATE TABLE relays (
  relay_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  priority INTEGER NOT NULL,
  signal_dbm INTEGER NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO relays (relay_id, sector, priority, signal_dbm, status) VALUES
  ('R-10', 'north', 2, -62, 'active'),
  ('R-11', 'south', 1, -55, 'active'),
  ('R-12', 'east',  1, -48, 'offline'),
  ('R-13', 'north', 1, -50, 'active'),
  ('R-14', 'west',  2, -58, 'active'),
  ('R-15', 'south', 1, -55, 'active'),
  ('R-16', 'east',  3, -70, 'maintenance');
```

## Starter: guided

```sql
-- Select relay_id, sector, priority, and signal_dbm AS dbm
-- from active relays, ordered by priority ASC, signal_dbm DESC, relay_id ASC.
SELECT
  relay_id,
  sector
FROM relays;
```

## Starter: standard

```sql
-- Query active relays ordered by priority ASC, signal_dbm DESC, relay_id ASC
SELECT * FROM relays;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects expected column headers",
    lambda: columns,
    ["relay_id", "sector", "priority", "dbm"],
)

expect(
    "returns active relays ordered by priority ASC, signal_dbm DESC, relay_id ASC",
    lambda: rows,
    [
        ["R-13", "north", 1, -50],
        ["R-11", "south", 1, -55],
        ["R-15", "south", 1, -55],
        ["R-14", "west", 2, -58],
        ["R-10", "north", 2, -62],
    ],
)
```

## Hidden checks

```python
def _test_dynamic():
    conn.execute(
        "INSERT INTO relays (relay_id, sector, priority, signal_dbm, status) VALUES ('R-09', 'east', 1, -45, 'active'), ('R-99', 'west', 1, -40, 'offline')"
    )
    return run_user_sql()

expect(
    "re-query includes newly inserted active relay in sorted position and ignores offline relay",
    _test_dynamic,
    [
        ["R-09", "east", 1, -45],
        ["R-13", "north", 1, -50],
        ["R-11", "south", 1, -55],
        ["R-15", "south", 1, -55],
        ["R-14", "west", 2, -58],
        ["R-10", "north", 2, -62],
    ],
)
```

## Solution

```sql
SELECT
  relay_id,
  sector,
  priority,
  signal_dbm AS dbm
FROM relays
WHERE status = 'active'
ORDER BY priority ASC, signal_dbm DESC, relay_id ASC;
```

## Restored

The catalog desk now streams active relay telemetry in strict priority and signal-strength order.

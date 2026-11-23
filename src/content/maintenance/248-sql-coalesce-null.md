---
id: maintenance-sql-coalesce-null
language: sql
title: Fall back across nullable beacon callsigns and wattage columns with COALESCE
system: Filter rack
symbol: equipment
scene: tests
skills: sql-queries
reviewSkill: sql-queries
prerequisite: sql-set-operations
---

## Briefing

Field beacons in `beacon_status` sometimes have a `NULL` `custom_label` or a `NULL` `measured_watts`. Reports must display `'UNNAMED'` when `custom_label` is missing and fall back to `rated_watts` (or `0` if both are `NULL`) for power output.

## Objective

Write a `SELECT` query against `beacon_status` ordered by `beacon_id ASC` that projects:
1. `beacon_id`
2. `display_label` — `COALESCE(custom_label, 'UNNAMED')`
3. `effective_watts` — `COALESCE(measured_watts, rated_watts, 0)`

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `COALESCE(custom_label, 'UNNAMED') AS display_label` and `COALESCE(measured_watts, rated_watts, 0) AS effective_watts`.

## Setup

```sql
CREATE TABLE beacon_status (
  beacon_id TEXT PRIMARY KEY,
  custom_label TEXT,
  measured_watts INTEGER,
  rated_watts INTEGER
);

INSERT INTO beacon_status (beacon_id, custom_label, measured_watts, rated_watts) VALUES
  ('B-1', 'Ridge Eye', 85,  100),
  ('B-2', NULL,        NULL, 60),
  ('B-3', 'East Horn', NULL, NULL),
  ('B-4', NULL,        45,   50);
```

## Starter

```sql
SELECT
  beacon_id,
  custom_label AS display_label,
  measured_watts AS effective_watts
FROM beacon_status
ORDER BY beacon_id ASC;
```

## Checks

```python
expect(
    "projects beacon_id, display_label, effective_watts",
    lambda: columns,
    ["beacon_id", "display_label", "effective_watts"],
)

expect(
    "replaces NULL labels and wattages using COALESCE chains",
    lambda: rows,
    [
        ["B-1", "Ridge Eye", 85],
        ["B-2", "UNNAMED", 60],
        ["B-3", "East Horn", 0],
        ["B-4", "UNNAMED", 45],
    ],
)
```

## Hidden checks

```python
def _test_extra_beacon():
    conn.execute("INSERT INTO beacon_status VALUES ('B-5', NULL, NULL, NULL)")
    return run_user_sql()[-1]

expect(
    "returns UNNAMED and 0 when all nullable columns are NULL",
    _test_extra_beacon,
    ["B-5", "UNNAMED", 0],
)
```

## Solution

```sql
SELECT
  beacon_id,
  COALESCE(custom_label, 'UNNAMED') AS display_label,
  COALESCE(measured_watts, rated_watts, 0) AS effective_watts
FROM beacon_status
ORDER BY beacon_id ASC;
```

## Restored

Beacon status feed restored — missing callsigns and telemetry wattages now fall back cleanly via `COALESCE`.

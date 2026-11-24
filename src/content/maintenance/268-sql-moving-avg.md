---
id: maintenance-sql-moving-avg
language: sql
title: Compute a 2-day trailing moving average per sensor with ROWS BETWEEN
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
reviewSkill: sql-time-series
prerequisite: sql-temporal-overlap-guard
---

## Briefing

The time ledger needs a 2-row trailing moving average (`ma2`) of `temp` for each sensor in `sensor_temps`.

## Objective

Write a `SELECT` query returning `sensor_id`, `day`, and `ROUND(AVG(temp) OVER (PARTITION BY sensor_id ORDER BY day ASC ROWS BETWEEN 1 PRECEDING AND CURRENT ROW), 2) AS ma2`, ordered by `sensor_id ASC, day ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW` inside `AVG(temp) OVER (PARTITION BY sensor_id ORDER BY day ASC ...)`.

## Setup

```sql
CREATE TABLE sensor_temps (
  sensor_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  temp REAL NOT NULL,
  PRIMARY KEY (sensor_id, day)
);

INSERT INTO sensor_temps (sensor_id, day, temp) VALUES
  ('S-1', 1, 10.0),
  ('S-1', 2, 14.0),
  ('S-1', 3, 20.0),
  ('S-2', 1, 5.0),
  ('S-2', 2, 9.0);
```

## Starter

```sql
-- Return sensor_id, day, ma2 (2-day trailing moving average) ordered by sensor_id ASC, day ASC
```

## Checks

```python
expect(
    "computes 2-day trailing moving average per sensor",
    lambda: [columns, rows],
    [
        ["sensor_id", "day", "ma2"],
        [
            ["S-1", 1, 10.0],
            ["S-1", 2, 12.0],
            ["S-1", 3, 17.0],
            ["S-2", 1, 5.0],
            ["S-2", 2, 7.0],
        ],
    ],
)
```

## Hidden checks

```python
def _test_extra():
    conn.execute("INSERT INTO sensor_temps VALUES ('S-2', 3, 15.0)")
    return [r for r in run_user_sql() if r[0] == "S-2" and r[1] == 3]

expect(
    "slides the 2-day window onto new readings dynamically",
    _test_extra,
    [["S-2", 3, 12.0]],
)
```

## Solution

```sql
SELECT
  sensor_id,
  day,
  ROUND(
    AVG(temp) OVER (
      PARTITION BY sensor_id
      ORDER BY day ASC
      ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS ma2
FROM sensor_temps
ORDER BY sensor_id ASC, day ASC;
```

## Restored

Time ledger 2-day moving average restored.

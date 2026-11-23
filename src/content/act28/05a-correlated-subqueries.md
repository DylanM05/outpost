---
id: sql-correlated-subqueries
kind: code
language: sql
title: Find sensors exceeding their sector average with a correlated subquery
system: Subquery loom
symbol: controller
scene: tests
skills: sql-joins, sql-aggregations
---

## Briefing

A global threshold misses localized anomalies: a 70°C reading is normal in the furnace bay but critical in the cryo vault. The subquery loom compares each sensor in `sensor_readings` against the average reading of **its own sector**, flagging any sensor strictly above its sector's average.

## Objective

Write a `SELECT` query against `sensor_readings` that finds every sensor whose `reading` is strictly greater (`>`) than the average `reading` of all sensors in the same `sector`, projecting:
1. `sensor_id`
2. `sector`
3. `reading`
4. `sector_avg` — that sector's average reading rounded to 2 decimal places (`ROUND(..., 2)`)

Order the result by `sector ASC, reading DESC, sensor_id ASC`.

## Concept

- A **correlated subquery** references a column from the outer query:
  ```sql
  WHERE s.reading > (
    SELECT AVG(s2.reading)
    FROM sensor_readings s2
    WHERE s2.sector = s.sector
  )
  ```
- You can also use a scalar correlated subquery in the `SELECT` list (or join against a grouped subquery) to project `ROUND((SELECT AVG(s2.reading) FROM sensor_readings s2 WHERE s2.sector = s.sector), 2) AS sector_avg`.

## Hints

1. Alias the outer table as `sensor_readings s`.
2. Filter with `WHERE s.reading > (SELECT AVG(s2.reading) FROM sensor_readings s2 WHERE s2.sector = s.sector)`.
3. Project `ROUND((SELECT AVG(s2.reading) FROM sensor_readings s2 WHERE s2.sector = s.sector), 2) AS sector_avg` and order by `s.sector ASC, s.reading DESC, s.sensor_id ASC`.

## Setup

```sql
CREATE TABLE sensor_readings (
  sensor_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  reading REAL NOT NULL
);

INSERT INTO sensor_readings (sensor_id, sector, reading) VALUES
  ('S-01', 'cryo',    12.0),
  ('S-02', 'cryo',    18.0),
  ('S-03', 'cryo',    24.0),
  ('S-04', 'furnace', 80.0),
  ('S-05', 'furnace', 95.0),
  ('S-06', 'furnace', 110.0),
  ('S-07', 'furnace', 115.0),
  ('S-08', 'turbine', 45.0),
  ('S-09', 'turbine', 55.0);
```

## Starter: guided

```sql
-- Find sensors where reading > the average reading in the same sector.
-- Project sensor_id, sector, reading, and sector_avg (rounded to 2 decimal places).
SELECT
  s.sensor_id,
  s.sector,
  s.reading
FROM sensor_readings s
ORDER BY s.sector ASC, s.reading DESC, s.sensor_id ASC;
```

## Starter: standard

```sql
SELECT sensor_id, sector, reading
FROM sensor_readings;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects sensor_id, sector, reading, sector_avg",
    lambda: columns,
    ["sensor_id", "sector", "reading", "sector_avg"],
)

expect(
    "returns only sensors strictly exceeding their own sector's average reading",
    lambda: rows,
    [
        ["S-03", "cryo", 24.0, 18.0],
        ["S-07", "furnace", 115.0, 100.0],
        ["S-06", "furnace", 110.0, 100.0],
        ["S-09", "turbine", 55.0, 50.0],
    ],
)
```

## Hidden checks

```python
def _test_shift_average():
    conn.execute("INSERT INTO sensor_readings (sensor_id, sector, reading) VALUES ('S-10', 'cryo', 6.0)")
    return run_user_sql()

expect(
    "recomputes sector average dynamically when new cryo reading lowers cryo mean to 15.0",
    _test_shift_average,
    [
        ["S-03", "cryo", 24.0, 15.0],
        ["S-02", "cryo", 18.0, 15.0],
        ["S-07", "furnace", 115.0, 100.0],
        ["S-06", "furnace", 110.0, 100.0],
        ["S-09", "turbine", 55.0, 50.0],
    ],
)
```

## Solution

```sql
SELECT
  s.sensor_id,
  s.sector,
  s.reading,
  ROUND(
    (SELECT AVG(s2.reading) FROM sensor_readings s2 WHERE s2.sector = s.sector),
    2
  ) AS sector_avg
FROM sensor_readings s
WHERE s.reading > (
  SELECT AVG(s2.reading)
  FROM sensor_readings s2
  WHERE s2.sector = s.sector
)
ORDER BY s.sector ASC, s.reading DESC, s.sensor_id ASC;
```

## Restored

Subquery loom anomaly detector online — each sensor is benchmarked dynamically against its own sector's baseline.

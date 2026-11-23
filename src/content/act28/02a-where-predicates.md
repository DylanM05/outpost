---
id: sql-where-predicates
kind: code
language: sql
title: Filter telemetry logs with IN, BETWEEN, LIKE, and IS NOT NULL
system: Filter rack
symbol: equipment
scene: tests
skills: sql-queries
---

## Briefing

The filter rack ingests raw diagnostic events into `telemetry_logs`. Noise from uncalibrated probes (`calibrated_by IS NULL`), low-voltage hum, and test benches must be stripped out so engineers see only actionable surge events from `'SNR-%'` thermal and power sensors.

## Objective

Write a `SELECT` query against `telemetry_logs` that returns `log_id`, `sensor_code`, `category`, and `reading_mv` for rows satisfying **all** of these conditions:
1. `category` is in `('thermal', 'power')` (`IN`).
2. `reading_mv` is between `250` and `900` inclusive (`BETWEEN 250 AND 900`).
3. `sensor_code` starts with `'SNR-'` (`LIKE 'SNR-%'`).
4. `calibrated_by` is not `NULL` (`IS NOT NULL`).

Order the results by `reading_mv DESC, log_id ASC`.

## Concept

- `col IN ('a', 'b')` matches any value in the set.
- `col BETWEEN low AND high` is inclusive on both ends (`col >= low AND col <= high`).
- `col LIKE 'SNR-%'` matches strings starting with `'SNR-'` (`%` matches zero or more characters; `_` matches a single character).
- In SQL, `NULL` is never equal or unequal to anything with `=` or `!=` — always test for presence or absence with `IS NOT NULL` or `IS NULL`.

## Hints

1. Combine all four predicates in `WHERE` using `AND`.
2. Remember that `reading_mv BETWEEN 250 AND 900` includes both `250` and `900`.
3. Use `calibrated_by IS NOT NULL` (not `calibrated_by != NULL`) and sort with `ORDER BY reading_mv DESC, log_id ASC`.

## Setup

```sql
CREATE TABLE telemetry_logs (
  log_id INTEGER PRIMARY KEY,
  sensor_code TEXT NOT NULL,
  category TEXT NOT NULL,
  reading_mv INTEGER,
  calibrated_by TEXT
);

INSERT INTO telemetry_logs (log_id, sensor_code, category, reading_mv, calibrated_by) VALUES
  (101, 'SNR-N01', 'thermal', 420, 'vera'),
  (102, 'SNR-N02', 'thermal', 900, 'lin'),
  (103, 'SNR-E01', 'power',   250, 'vera'),
  (104, 'SNR-E02', 'power',   610, NULL),
  (105, 'TMP-N03', 'thermal', 500, 'vera'),
  (106, 'SNR-S01', 'airflow', 480, 'lin'),
  (107, 'SNR-W01', 'power',   180, 'lin'),
  (108, 'SNR-N04', 'thermal', 950, 'vera'),
  (109, 'SNR-E03', 'power',   715, 'mira');
```

## Starter: guided

```sql
-- Filter telemetry_logs using IN, BETWEEN, LIKE, and IS NOT NULL.
-- Project log_id, sensor_code, category, reading_mv ordered by reading_mv DESC, log_id ASC.
SELECT
  log_id,
  sensor_code,
  category,
  reading_mv
FROM telemetry_logs
WHERE category IN ('thermal', 'power');
```

## Starter: standard

```sql
SELECT log_id, sensor_code, category, reading_mv
FROM telemetry_logs;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects log_id, sensor_code, category, reading_mv",
    lambda: columns,
    ["log_id", "sensor_code", "category", "reading_mv"],
)

expect(
    "filters rows matching IN, BETWEEN 250 AND 900, LIKE 'SNR-%', and calibrated_by IS NOT NULL",
    lambda: rows,
    [
        [102, "SNR-N02", "thermal", 900],
        [109, "SNR-E03", "power", 715],
        [101, "SNR-N01", "thermal", 420],
        [103, "SNR-E01", "power", 250],
    ],
)
```

## Hidden checks

```python
def _test_edge_cases():
    conn.execute(
        """
        INSERT INTO telemetry_logs (log_id, sensor_code, category, reading_mv, calibrated_by) VALUES
          (110, 'SNR-W09', 'thermal', 250, 'kade'),
          (111, 'SNR-W10', 'thermal', NULL, 'kade')
        """
    )
    return run_user_sql()

expect(
    "handles boundary value 250 with tie-breaker log_id ASC and excludes NULL reading_mv",
    _test_edge_cases,
    [
        [102, "SNR-N02", "thermal", 900],
        [109, "SNR-E03", "power", 715],
        [101, "SNR-N01", "thermal", 420],
        [103, "SNR-E01", "power", 250],
        [110, "SNR-W09", "thermal", 250],
    ],
)
```

## Solution

```sql
SELECT
  log_id,
  sensor_code,
  category,
  reading_mv
FROM telemetry_logs
WHERE category IN ('thermal', 'power')
  AND reading_mv BETWEEN 250 AND 900
  AND sensor_code LIKE 'SNR-%'
  AND calibrated_by IS NOT NULL
ORDER BY reading_mv DESC, log_id ASC;
```

## Restored

Filter rack predicates online — uncalibrated probes, out-of-range voltages, and non-`SNR-` test channels are cleanly excluded.

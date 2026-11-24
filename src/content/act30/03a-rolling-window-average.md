---
id: sql-rolling-window-average
kind: code
language: sql
title: Compute trailing 3-day moving averages and day-over-day deltas with window frames
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
---

## Briefing

Raw daily wind-turbine readings in `daily_output` swing wildly with gusts. Smooth each sector's curve with a 3-day trailing moving average and calculate the change from the previous day.

## Objective

Write a `SELECT` query against `daily_output` returning:
- `sector`
- `day`
- `kw`
- `ma3`: the trailing 3-row moving average (`ROUND(AVG(kw) OVER (PARTITION BY sector ORDER BY day ASC ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2)`)
- `delta`: `kw - LAG(kw) OVER (PARTITION BY sector ORDER BY day ASC)` (`NULL` on the first day of each sector)

Order the final result by `sector ASC, day ASC`.

## Concept

- A window frame `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` includes at most 3 rows (the current row plus up to 2 preceding rows inside the same `PARTITION BY` group).
- Unlike `RANGE`, `ROWS` counts exact physical rows in the partition order — essential for predictable moving averages.
- `LAG(col)` with no 3rd argument returns `NULL` on the first row of each partition so callers can distinguish "no prior day" from a `0` change.

## Hints

1. Use `ROUND(AVG(kw) OVER (PARTITION BY sector ORDER BY day ASC ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS ma3`.
2. Use `kw - LAG(kw) OVER (PARTITION BY sector ORDER BY day ASC) AS delta`.

## Setup

```sql
CREATE TABLE daily_output (
  sector TEXT NOT NULL,
  day INTEGER NOT NULL,
  kw INTEGER NOT NULL,
  PRIMARY KEY (sector, day)
);

INSERT INTO daily_output (sector, day, kw) VALUES
  ('east',  1, 100),
  ('east',  2, 130),
  ('east',  3, 160),
  ('east',  4, 100),
  ('north', 1,  80),
  ('north', 2,  95),
  ('north', 3, 110);
```

## Starter: guided

```sql
SELECT
  sector,
  day,
  kw,
  0.0 AS ma3,
  NULL AS delta
FROM daily_output
ORDER BY sector ASC, day ASC;
```

## Starter: standard

```sql
-- Compute sector, day, kw, 3-day trailing moving average ma3, and day-over-day delta
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects sector, day, kw, ma3, delta",
    lambda: columns,
    ["sector", "day", "kw", "ma3", "delta"],
)

expect(
    "computes 3-day trailing moving averages and day-over-day deltas per sector",
    lambda: rows,
    [
        ["east", 1, 100, 100.0, None],
        ["east", 2, 130, 115.0, 30],
        ["east", 3, 160, 130.0, 30],
        ["east", 4, 100, 130.0, -60],
        ["north", 1, 80, 80.0, None],
        ["north", 2, 95, 87.5, 15],
        ["north", 3, 110, 95.0, 15],
    ],
)
```

## Hidden checks

```python
def _test_extra_day():
    conn.execute("INSERT INTO daily_output (sector, day, kw) VALUES ('north', 4, 140)")
    return [r for r in run_user_sql() if r[0] == "north" and r[1] == 4]

expect(
    "slides the 3-day window forward dynamically on new data",
    _test_extra_day,
    [["north", 4, 140, 115.0, 30]],
)
```

## Solution

```sql
SELECT
  sector,
  day,
  kw,
  ROUND(
    AVG(kw) OVER (
      PARTITION BY sector
      ORDER BY day ASC
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ),
    2
  ) AS ma3,
  kw - LAG(kw) OVER (
    PARTITION BY sector
    ORDER BY day ASC
  ) AS delta
FROM daily_output
ORDER BY sector ASC, day ASC;
```

## Restored

Time ledger moving-average pipeline online — noisy daily output is now smoothed cleanly across sliding 3-day frames.

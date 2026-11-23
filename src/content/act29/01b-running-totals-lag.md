---
id: sql-running-totals-lag
kind: code
language: sql
title: Compute per-sector running totals and step deltas with SUM() OVER and LAG()
system: Window tower
symbol: instrument
scene: tests
skills: sql-windows-ctes
---

## Briefing

The window tower tracks sequential energy readings in `grid_samples`. For each sample, analysts need the cumulative running total within its sector up to that sample, the previous sample's reading in the same sector (`0` for the first sample), and the step delta from that previous reading.

## Objective

Write a `SELECT` query against `grid_samples` that projects six columns ordered by `sector ASC, seq ASC`:
1. `sample_id`
2. `sector`
3. `seq`
4. `reading`
5. `running_total` — cumulative sum of `reading` within `sector` ordered by `seq ASC` (`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`)
6. `delta` — `reading - LAG(reading, 1, 0) OVER (PARTITION BY sector ORDER BY seq ASC)`

## Concept

- `SUM(reading) OVER (PARTITION BY sector ORDER BY seq ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` accumulates `reading` from the first row of the sector partition through the current row.
- `LAG(col, offset, default_val) OVER (PARTITION BY sector ORDER BY seq ASC)` peeks `offset` rows back within the partition, returning `default_val` (`0`) when no prior row exists.

## Hints

1. Partition both window functions by `sector` and order by `seq ASC`.
2. Use `SUM(reading) OVER (PARTITION BY sector ORDER BY seq ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total`.
3. Use `reading - LAG(reading, 1, 0) OVER (PARTITION BY sector ORDER BY seq ASC) AS delta`.

## Setup

```sql
CREATE TABLE grid_samples (
  sample_id INTEGER PRIMARY KEY,
  sector TEXT NOT NULL,
  seq INTEGER NOT NULL,
  reading INTEGER NOT NULL
);

INSERT INTO grid_samples (sample_id, sector, seq, reading) VALUES
  (1, 'east',  1, 100),
  (2, 'east',  2, 130),
  (3, 'east',  3, 115),
  (4, 'north', 1, 200),
  (5, 'north', 2, 250);
```

## Starter: guided

```sql
-- Compute running_total and delta per sector ordered by sector ASC, seq ASC.
SELECT
  sample_id,
  sector,
  seq,
  reading
FROM grid_samples
ORDER BY sector ASC, seq ASC;
```

## Starter: standard

```sql
SELECT sample_id, sector, seq, reading
FROM grid_samples;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects sample_id, sector, seq, reading, running_total, delta",
    lambda: columns,
    ["sample_id", "sector", "seq", "reading", "running_total", "delta"],
)

expect(
    "computes per-sector running totals and LAG deltas accurately",
    lambda: rows,
    [
        [1, "east", 1, 100, 100, 100],
        [2, "east", 2, 130, 230, 30],
        [3, "east", 3, 115, 345, -15],
        [4, "north", 1, 200, 200, 200],
        [5, "north", 2, 250, 450, 50],
    ],
)

check(
    "uses OVER and LAG window constructs",
    lambda: sql_uses("OVER") and sql_uses("LAG"),
    "Use SUM(...) OVER (...) and LAG(...) OVER (...) window functions.",
)
```

## Hidden checks

```python
def _test_append_sample():
    conn.execute("INSERT INTO grid_samples (sample_id, sector, seq, reading) VALUES (6, 'north', 3, 220)")
    return run_user_sql()

expect(
    "updates north partition running_total and delta when seq 3 is inserted",
    _test_append_sample,
    [
        [1, "east", 1, 100, 100, 100],
        [2, "east", 2, 130, 230, 30],
        [3, "east", 3, 115, 345, -15],
        [4, "north", 1, 200, 200, 200],
        [5, "north", 2, 250, 450, 50],
        [6, "north", 3, 220, 670, -30],
    ],
)
```

## Solution

```sql
SELECT
  sample_id,
  sector,
  seq,
  reading,
  SUM(reading) OVER (
    PARTITION BY sector
    ORDER BY seq ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  reading - LAG(reading, 1, 0) OVER (
    PARTITION BY sector
    ORDER BY seq ASC
  ) AS delta
FROM grid_samples
ORDER BY sector ASC, seq ASC;
```

## Restored

Window tower telemetry stream restored — cumulative sector energy and sample-to-sample deltas are computed in a single window pass.

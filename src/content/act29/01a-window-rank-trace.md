---
id: sql-window-rank-trace
kind: predict
language: sql
title: Trace ROW_NUMBER(), RANK(), and DENSE_RANK() over partitioned ties
system: Window tower
symbol: instrument
scene: console
skills: sql-windows-ctes, reading-code
---

## Briefing

Unlike `GROUP BY`, which collapses rows into one summary row per group, SQL **window functions** (`OVER (PARTITION BY ... ORDER BY ...)`) compute rankings and aggregates across a sliding window while keeping every individual row intact.

## Objective

Trace the window ranking query in `## Program` against `turbine_trials` and predict **every line of output**.

## Concept

- `PARTITION BY sector` divides rows into independent window partitions per sector; rankings restart at `1` in each partition.
- Within each partition, the three ranking functions handle ties differently:
  - `ROW_NUMBER()` assigns distinct sequential integers (`1, 2, 3, ...`), breaking ties using the window's `ORDER BY` tie-breaker (`unit_id ASC`).
  - `RANK()` assigns the **same** rank to tied values and leaves a gap after ties (`1, 1, 3`).
  - `DENSE_RANK()` assigns the **same** rank to tied values with **no gap** after ties (`1, 1, 2`).

## Hints

1. In partition `'alpha'`, `T-1` and `T-2` tie at `efficiency = 90`, followed by `T-3` at `80`:
   - `ROW_NUMBER()` gives `1, 2, 3`.
   - `RANK()` gives `1, 1, 3`.
   - `DENSE_RANK()` gives `1, 1, 2`.
2. In partition `'beta'`, rankings reset to `1`: `T-4` (`95`) gets `1 | 1 | 1`, and `T-5` (`75`) gets `2 | 2 | 2`.

## Setup

```sql
CREATE TABLE turbine_trials (
  unit_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  efficiency INTEGER NOT NULL
);

INSERT INTO turbine_trials (unit_id, sector, efficiency) VALUES
  ('T-1', 'alpha', 90),
  ('T-2', 'alpha', 90),
  ('T-3', 'alpha', 80),
  ('T-4', 'beta',  95),
  ('T-5', 'beta',  75);
```

## Program

```sql
SELECT
  unit_id,
  sector,
  efficiency,
  ROW_NUMBER() OVER (PARTITION BY sector ORDER BY efficiency DESC, unit_id ASC) AS rn,
  RANK() OVER (PARTITION BY sector ORDER BY efficiency DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY sector ORDER BY efficiency DESC) AS drnk
FROM turbine_trials
ORDER BY sector ASC, rn ASC;
```

## Output

```text
unit_id | sector | efficiency | rn | rnk | drnk
T-1 | alpha | 90 | 1 | 1 | 1
T-2 | alpha | 90 | 2 | 1 | 1
T-3 | alpha | 80 | 3 | 3 | 2
T-4 | beta | 95 | 1 | 1 | 1
T-5 | beta | 75 | 2 | 2 | 2
```

## Restored

Window tower ranking trace verified — `ROW_NUMBER`, `RANK`, and `DENSE_RANK` preserve row granularity while distinguishing tie-handling semantics.

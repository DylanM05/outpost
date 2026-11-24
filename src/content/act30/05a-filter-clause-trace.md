---
id: sql-filter-clause-trace
kind: predict
language: sql
title: Trace SQL aggregate FILTER (WHERE ...) pivot expressions
system: Pivot gallery
symbol: instrument
scene: console
skills: sql-fulltext-analytics, reading-code
---

## Briefing

Instead of verbose `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` expressions, modern SQL (PostgreSQL and SQLite 3.30+) supports the cleaner standard **`FILTER (WHERE ...)`** clause directly on any aggregate function!

## Objective

Trace the `GROUP BY` query with `FILTER (WHERE ...)` below and predict **every line of output** (header row followed by sorted sector rows).

## Concept

- `COUNT(*) FILTER (WHERE level = 'err')` counts only rows in the current group that satisfy `level = 'err'` (returning `0` when no rows match).
- `COALESCE(SUM(ms) FILTER (WHERE level = 'err'), 0)` sums `ms` only for error rows and turns `NULL` (when a group has zero errors) into `0`.

## Hints

1. Group `'east'` has 2 rows: one `'ok'` (`10 ms`) and one `'err'` (`50 ms`) -> `total=2, errs=1, err_ms=50`.
2. Group `'north'` has 3 rows: two `'ok'` and zero `'err'`? Look closely at the seed rows! Two `'ok'` rows (`20`, `30`) and one `'warn'` (`40`) -> `total=3, errs=0, err_ms=0` (thanks to `COALESCE`).
3. `ORDER BY sector ASC` outputs `'east'` before `'north'`.

## Setup

```sql
CREATE TABLE rpc_logs (
  id INTEGER PRIMARY KEY,
  sector TEXT NOT NULL,
  level TEXT NOT NULL,
  ms INTEGER NOT NULL
);

INSERT INTO rpc_logs (id, sector, level, ms) VALUES
  (1, 'north', 'ok',   20),
  (2, 'north', 'ok',   30),
  (3, 'north', 'warn', 40),
  (4, 'east',  'ok',   10),
  (5, 'east',  'err',  50);
```

## Program

```sql
SELECT
  sector,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE level = 'err') AS errs,
  COALESCE(SUM(ms) FILTER (WHERE level = 'err'), 0) AS err_ms
FROM rpc_logs
GROUP BY sector
ORDER BY sector ASC;
```

## Output

```text
sector | total | errs | err_ms
east | 2 | 1 | 50
north | 3 | 0 | 0
```

## Restored

Pivot gallery `FILTER (WHERE ...)` trace verified — conditional aggregates pivot status counts and sums cleanly in a single scan.

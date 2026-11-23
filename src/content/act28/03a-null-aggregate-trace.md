---
id: sql-null-aggregate-trace
kind: predict
language: sql
title: Trace COUNT(*), COUNT(col), and AVG(col) with NULL values
system: Rollup bay
symbol: instrument
scene: console
skills: sql-aggregations, reading-code
---

## Briefing

In SQL, aggregate functions treat `NULL` values in a specific way that surprises engineers who expect `NULL` to count as zero. Before writing rollup queries in the rollup bay, trace how `COUNT(*)`, `COUNT(col)`, `COUNT(DISTINCT col)`, `SUM(col)`, and `AVG(col)` behave when some rows contain `NULL`.

## Objective

Trace the `GROUP BY` query in `## Program` against the seeded `probes` table and predict **every line of output**.

## Concept

- `COUNT(*)` counts **every row** in the group, regardless of `NULL` values.
- `COUNT(col)` counts only rows where `col IS NOT NULL`.
- `COUNT(DISTINCT col)` counts distinct non-`NULL` values of `col`.
- `SUM(col)` and `AVG(col)` ignore `NULL` rows completely! In particular, `AVG(col)` divides `SUM(col)` by `COUNT(col)` — **not** by `COUNT(*)`.

## Hints

1. For `north`, the 3 rows have `reading` values `10`, `20`, and `NULL`. `COUNT(*)` is `3`, `COUNT(reading)` is `2`, `SUM(reading)` is `30`, and `AVG(reading)` is `30 / 2 = 15.0`.
2. For `south`, the 3 rows have `reading` values `40`, `40`, and `10`. `COUNT(*)` is `3`, `COUNT(reading)` is `3`, `COUNT(DISTINCT reading)` is `2`, `SUM(reading)` is `90`, and `AVG(reading)` is `90 / 3 = 30.0`.
3. Note the `ORDER BY sector ASC` ordering (`north` on line 2, `south` on line 3).

## Setup

```sql
CREATE TABLE probes (
  probe_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  reading INTEGER
);

INSERT INTO probes (probe_id, sector, reading) VALUES
  ('P-1', 'north', 10),
  ('P-2', 'north', 20),
  ('P-3', 'north', NULL),
  ('P-4', 'south', 40),
  ('P-5', 'south', 40),
  ('P-6', 'south', 10);
```

## Program

```sql
SELECT
  sector,
  COUNT(*) AS total_rows,
  COUNT(reading) AS valid_rows,
  COUNT(DISTINCT reading) AS unique_vals,
  SUM(reading) AS total_sum,
  ROUND(AVG(reading), 1) AS mean_val
FROM probes
GROUP BY sector
ORDER BY sector ASC;
```

## Output

```text
sector | total_rows | valid_rows | unique_vals | total_sum | mean_val
north | 3 | 2 | 2 | 30 | 15.0
south | 3 | 3 | 2 | 90 | 30.0
```

## Restored

Rollup bay `NULL` aggregation behavior verified — `COUNT(col)` and `AVG(col)` skip `NULL` entries rather than treating them as `0`.

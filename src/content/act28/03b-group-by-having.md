---
id: sql-group-by-having
kind: code
language: sql
title: Aggregate sector power output with GROUP BY and HAVING
system: Rollup bay
symbol: instrument
scene: tests
skills: sql-aggregations
---

## Briefing

The rollup bay summarizes generator telemetry from `generators`. Station command wants a per-sector rollup covering **only online generators** (`online = 1`), and wants to filter the resulting sector groups down to sectors that have at least 2 online generators and a combined output of at least `250` kW.

## Objective

Write a `SELECT` query against `generators` that:
1. Filters individual rows to `online = 1` (`WHERE`).
2. Groups by `sector` (`GROUP BY sector`).
3. Filters groups (`HAVING`) to sectors with `COUNT(*) >= 2` **and** `SUM(output_kw) >= 250`.
4. Projects four columns:
   - `sector`
   - `unit_count` (`COUNT(*)`)
   - `total_kw` (`SUM(output_kw)`)
   - `avg_kw` (`ROUND(AVG(output_kw), 2)`)
5. Orders results by `total_kw DESC, sector ASC`.

## Concept

- `WHERE` filters individual rows **before** grouping and aggregation.
- `GROUP BY sector` collapses all surviving rows with the same `sector` into one summary row.
- `HAVING` filters groups **after** aggregation using aggregate predicates like `COUNT(*) >= 2 AND SUM(output_kw) >= 250`.

## Hints

1. Put `WHERE online = 1` before `GROUP BY sector`.
2. Put `HAVING COUNT(*) >= 2 AND SUM(output_kw) >= 250` after `GROUP BY sector`.
3. Use `ROUND(AVG(output_kw), 2) AS avg_kw` and sort with `ORDER BY total_kw DESC, sector ASC`.

## Setup

```sql
CREATE TABLE generators (
  gen_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  output_kw INTEGER NOT NULL,
  online INTEGER NOT NULL
);

INSERT INTO generators (gen_id, sector, output_kw, online) VALUES
  ('G-01', 'north', 140, 1),
  ('G-02', 'north', 160, 1),
  ('G-03', 'north', 200, 0),
  ('G-04', 'east',  110, 1),
  ('G-05', 'east',   95, 1),
  ('G-06', 'south', 300, 1),
  ('G-07', 'south', 180, 0),
  ('G-08', 'west',  120, 1),
  ('G-09', 'west',  130, 1),
  ('G-10', 'west',  140, 1);
```

## Starter: guided

```sql
-- Aggregate online generators by sector, keeping groups with
-- COUNT(*) >= 2 and SUM(output_kw) >= 250.
SELECT
  sector,
  COUNT(*) AS unit_count,
  SUM(output_kw) AS total_kw,
  ROUND(AVG(output_kw), 2) AS avg_kw
FROM generators
WHERE online = 1
GROUP BY sector;
```

## Starter: standard

```sql
SELECT sector, COUNT(*) AS unit_count
FROM generators
GROUP BY sector;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects sector, unit_count, total_kw, avg_kw",
    lambda: columns,
    ["sector", "unit_count", "total_kw", "avg_kw"],
)

expect(
    "filters online rows with WHERE and sector aggregates with HAVING",
    lambda: rows,
    [
        ["west", 3, 390, 130.0],
        ["north", 2, 300, 150.0],
    ],
)

check(
    "query uses GROUP BY and HAVING clauses",
    lambda: sql_uses("GROUP") and sql_uses("HAVING"),
    "Use both GROUP BY and HAVING in your SQL query.",
)
```

## Hidden checks

```python
def _test_having_update():
    conn.execute(
        "INSERT INTO generators (gen_id, sector, output_kw, online) VALUES ('G-11', 'east', 75, 1)"
    )
    return run_user_sql()

expect(
    "includes east sector once a third online generator pushes its total_kw to 280",
    _test_having_update,
    [
        ["west", 3, 390, 130.0],
        ["north", 2, 300, 150.0],
        ["east", 3, 280, 93.33],
    ],
)
```

## Solution

```sql
SELECT
  sector,
  COUNT(*) AS unit_count,
  SUM(output_kw) AS total_kw,
  ROUND(AVG(output_kw), 2) AS avg_kw
FROM generators
WHERE online = 1
GROUP BY sector
HAVING COUNT(*) >= 2
   AND SUM(output_kw) >= 250
ORDER BY total_kw DESC, sector ASC;
```

## Restored

Rollup bay sector summaries restored — offline units are excluded before grouping and under-threshold sectors are filtered out by `HAVING`.

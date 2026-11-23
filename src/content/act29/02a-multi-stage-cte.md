---
id: sql-multi-stage-cte
kind: code
language: sql
title: Find top-2 peak load days per substation with a multi-stage CTE
system: CTE spire
symbol: controller
scene: tests
skills: sql-windows-ctes
---

## Briefing

Raw substation readings arrive multiple times per day in `substation_loads`. Because SQL evaluates `WHERE` before window functions, you cannot filter a window function like `ROW_NUMBER()` directly in the same `SELECT`'s `WHERE` clause. A multi-stage Common Table Expression (`WITH daily_totals AS (...), ranked AS (...)`) decomposes the pipeline cleanly: first aggregate daily totals, then rank days within each substation, then filter to the top 2 days.

## Objective

Write a multi-stage CTE query against `substation_loads` that:
1. Aggregates `SUM(load_mw) AS daily_mw` grouped by `substation_id, day_date`.
2. Ranks each day within its `substation_id` using `ROW_NUMBER() OVER (PARTITION BY substation_id ORDER BY daily_mw DESC, day_date ASC) AS day_rank`.
3. Returns `substation_id`, `day_date`, `daily_mw`, and `day_rank` for rows where `day_rank <= 2`, ordered by `substation_id ASC, day_rank ASC`.

## Concept

- A `WITH` clause defines one or more named temporary result sets (CTEs) separated by commas:
  ```sql
  WITH daily_totals AS (
    SELECT ...
  ),
  ranked AS (
    SELECT ..., ROW_NUMBER() OVER (...) AS day_rank
    FROM daily_totals
  )
  SELECT ... FROM ranked WHERE day_rank <= 2;
  ```
- Later CTEs in the same `WITH` clause can query earlier CTEs by name.

## Hints

1. In `daily_totals`, group `substation_loads` by `substation_id, day_date` and compute `SUM(load_mw) AS daily_mw`.
2. In `ranked`, select from `daily_totals` and add `ROW_NUMBER() OVER (PARTITION BY substation_id ORDER BY daily_mw DESC, day_date ASC) AS day_rank`.
3. In the outer query, filter `WHERE day_rank <= 2` and order by `substation_id ASC, day_rank ASC`.

## Setup

```sql
CREATE TABLE substation_loads (
  log_id INTEGER PRIMARY KEY,
  substation_id TEXT NOT NULL,
  day_date TEXT NOT NULL,
  load_mw INTEGER NOT NULL
);

INSERT INTO substation_loads (log_id, substation_id, day_date, load_mw) VALUES
  (1,  'SUB-A', '2026-11-01', 120),
  (2,  'SUB-A', '2026-11-01', 130),
  (3,  'SUB-A', '2026-11-02', 310),
  (4,  'SUB-A', '2026-11-03', 190),
  (5,  'SUB-A', '2026-11-04', 280),
  (6,  'SUB-B', '2026-11-01', 400),
  (7,  'SUB-B', '2026-11-02', 150),
  (8,  'SUB-B', '2026-11-02', 200),
  (9,  'SUB-B', '2026-11-03', 220);
```

## Starter: guided

```sql
-- Use WITH daily_totals AS (...), ranked AS (...)
-- to return the top 2 peak load days per substation.
WITH daily_totals AS (
  SELECT
    substation_id,
    day_date,
    SUM(load_mw) AS daily_mw
  FROM substation_loads
  GROUP BY substation_id, day_date
)
SELECT * FROM daily_totals;
```

## Starter: standard

```sql
SELECT substation_id, day_date, load_mw
FROM substation_loads;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects substation_id, day_date, daily_mw, day_rank",
    lambda: columns,
    ["substation_id", "day_date", "daily_mw", "day_rank"],
)

expect(
    "returns top-2 daily total loads per substation",
    lambda: rows,
    [
        ["SUB-A", "2026-11-02", 310, 1],
        ["SUB-A", "2026-11-04", 280, 2],
        ["SUB-B", "2026-11-01", 400, 1],
        ["SUB-B", "2026-11-02", 350, 2],
    ],
)

check(
    "uses a WITH common table expression",
    lambda: sql_uses("WITH"),
    "Use a WITH CTE pipeline.",
)
```

## Hidden checks

```python
def _test_new_peak():
    conn.execute(
        "INSERT INTO substation_loads (log_id, substation_id, day_date, load_mw) VALUES (10, 'SUB-A', '2026-11-01', 100)"
    )
    return run_user_sql()

expect(
    "promotes 2026-11-01 to rank 1 for SUB-A when an extra 100 MW log pushes its daily total to 350",
    _test_new_peak,
    [
        ["SUB-A", "2026-11-01", 350, 1],
        ["SUB-A", "2026-11-02", 310, 2],
        ["SUB-B", "2026-11-01", 400, 1],
        ["SUB-B", "2026-11-02", 350, 2],
    ],
)
```

## Solution

```sql
WITH daily_totals AS (
  SELECT
    substation_id,
    day_date,
    SUM(load_mw) AS daily_mw
  FROM substation_loads
  GROUP BY substation_id, day_date
),
ranked AS (
  SELECT
    substation_id,
    day_date,
    daily_mw,
    ROW_NUMBER() OVER (
      PARTITION BY substation_id
      ORDER BY daily_mw DESC, day_date ASC
    ) AS day_rank
  FROM daily_totals
)
SELECT
  substation_id,
  day_date,
  daily_mw,
  day_rank
FROM ranked
WHERE day_rank <= 2
ORDER BY substation_id ASC, day_rank ASC;
```

## Restored

CTE spire multi-stage pipeline restored — daily aggregations feed directly into partitioned window rankings.

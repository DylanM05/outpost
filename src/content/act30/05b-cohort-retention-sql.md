---
id: sql-cohort-retention-sql
kind: code
language: sql
title: Build a pure-SQL monthly retention cohort matrix using CTEs and FILTER
system: Pivot gallery
symbol: instrument
scene: tests
skills: sql-fulltext-analytics, sql-time-series
---

## Briefing

Operations tracks crew equipment sign-ins in `crew_activity` (`crew_id`, `month_num` where `1` = Jan, `2` = Feb, `3` = Mar, ...). Build a **cohort retention matrix** showing, for each crew's signup cohort month (`MIN(month_num)`), how many distinct crews stayed active at month offsets `+0`, `+1`, and `+2`!

## Objective

Write a `SELECT` query returning one row per `cohort_month` (ordered by `cohort_month ASC`) with exact columns:
- `cohort_month`: each crew's first active `month_num`
- `m0`: distinct crews active at `month_num - cohort_month = 0` (the cohort size)
- `m1`: distinct crews active at `month_num - cohort_month = 1`
- `m2`: distinct crews active at `month_num - cohort_month = 2`

## Concept

- First CTE `cohorts`: find each crew's signup month via `SELECT crew_id, MIN(month_num) AS cohort_month FROM crew_activity GROUP BY crew_id`.
- Join `crew_activity` back to `cohorts` on `crew_id` to compute `offset = a.month_num - c.cohort_month`.
- Aggregate by `c.cohort_month` using `COUNT(DISTINCT a.crew_id) FILTER (WHERE a.month_num - c.cohort_month = 0) AS m0` (and likewise for `1` and `2`)! Note that a crew may log multiple rows in the same month, so `COUNT(DISTINCT ...)` is essential.

## Hints

1. Create `WITH cohorts AS (SELECT crew_id, MIN(month_num) AS cohort_month FROM crew_activity GROUP BY crew_id)`.
2. Join `cohorts c JOIN crew_activity a ON a.crew_id = c.crew_id` and group by `c.cohort_month`.
3. Use `COUNT(DISTINCT a.crew_id) FILTER (WHERE a.month_num - c.cohort_month = 0) AS m0` (and `= 1`, `= 2`).

## Setup

```sql
CREATE TABLE crew_activity (
  crew_id TEXT NOT NULL,
  month_num INTEGER NOT NULL
);

INSERT INTO crew_activity (crew_id, month_num) VALUES
  ('C-1', 1), ('C-1', 1), ('C-1', 2), ('C-1', 3),
  ('C-2', 1), ('C-2', 2),
  ('C-3', 1),
  ('C-4', 2), ('C-4', 3),
  ('C-5', 2);
```

## Starter: guided

```sql
WITH cohorts AS (
  SELECT crew_id, MIN(month_num) AS cohort_month
  FROM crew_activity
  GROUP BY crew_id
)
-- Join cohorts to crew_activity and pivot COUNT(DISTINCT ...) for offsets 0, 1, 2
SELECT cohort_month, 0 AS m0, 0 AS m1, 0 AS m2
FROM cohorts
GROUP BY cohort_month;
```

## Starter: standard

```sql
-- Compute cohort_month, m0, m1, m2 retention counts ordered by cohort_month ASC
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects cohort_month, m0, m1, m2",
    lambda: columns,
    ["cohort_month", "m0", "m1", "m2"],
)

expect(
    "computes distinct retained crews at offsets 0, 1, and 2 per cohort",
    lambda: rows,
    [
        [1, 3, 2, 1],
        [2, 2, 1, 0],
    ],
)
```

## Hidden checks

```python
def _test_late_return():
    conn.execute("INSERT INTO crew_activity (crew_id, month_num) VALUES ('C-3', 3), ('C-6', 3)")
    return run_user_sql()

expect(
    "recomputes cohorts dynamically when a crew returns in month 3 and a new cohort joins",
    _test_late_return,
    [
        [1, 3, 2, 2],
        [2, 2, 1, 0],
        [3, 1, 0, 0],
    ],
)
```

## Solution

```sql
WITH cohorts AS (
  SELECT
    crew_id,
    MIN(month_num) AS cohort_month
  FROM crew_activity
  GROUP BY crew_id
)
SELECT
  c.cohort_month,
  COUNT(DISTINCT a.crew_id) FILTER (WHERE a.month_num - c.cohort_month = 0) AS m0,
  COUNT(DISTINCT a.crew_id) FILTER (WHERE a.month_num - c.cohort_month = 1) AS m1,
  COUNT(DISTINCT a.crew_id) FILTER (WHERE a.month_num - c.cohort_month = 2) AS m2
FROM cohorts c
JOIN crew_activity a ON a.crew_id = c.crew_id
GROUP BY c.cohort_month
ORDER BY c.cohort_month ASC;
```

## Restored

Pivot gallery cohort matrix online — monthly retention curves are now computed directly in SQL with duplicate-safe counts.

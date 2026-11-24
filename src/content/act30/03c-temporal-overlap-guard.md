---
id: sql-temporal-overlap-guard
kind: code
language: sql
title: Detect overlapping half-open maintenance windows with a temporal self-join
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
---

## Briefing

Repair crews reserve docking bays in `bay_windows` using half-open intervals `[start_hr, end_hr)` — meaning a reservation ending at hour `10` does **not** conflict with one starting at hour `10`. Find every pair of overlapping reservations on the same bay!

## Objective

Write a `SELECT` query against `bay_windows` returning:
- `bay_id`
- `res_a` (the smaller `res_id` of the conflicting pair)
- `res_b` (the larger `res_id` of the conflicting pair)
- `overlap_hrs` (the length of the overlap: `MIN(a.end_hr, b.end_hr) - MAX(a.start_hr, b.start_hr)`)

Order results by `bay_id ASC, res_a ASC, res_b ASC`.

## Concept

- Two half-open intervals `[a.start_hr, a.end_hr)` and `[b.start_hr, b.end_hr)` overlap if and only if:
  ```sql
  a.start_hr < b.end_hr AND b.start_hr < a.end_hr
  ```
- Adding `AND a.res_id < b.res_id` prevents matching a row with itself and avoids duplicate `(res_b, res_a)` mirror pairs!
- In SQLite, scalar `MIN(x, y)` and `MAX(x, y)` (with 2+ arguments) compute the element-wise minimum/maximum per row — perfect for overlap duration!

## Hints

1. Self-join `bay_windows a JOIN bay_windows b ON a.bay_id = b.bay_id AND a.res_id < b.res_id AND a.start_hr < b.end_hr AND b.start_hr < a.end_hr`.
2. Project `MIN(a.end_hr, b.end_hr) - MAX(a.start_hr, b.start_hr) AS overlap_hrs`.

## Setup

```sql
CREATE TABLE bay_windows (
  res_id INTEGER PRIMARY KEY,
  bay_id TEXT NOT NULL,
  start_hr INTEGER NOT NULL,
  end_hr INTEGER NOT NULL,
  CHECK (end_hr > start_hr)
);

INSERT INTO bay_windows (res_id, bay_id, start_hr, end_hr) VALUES
  (1, 'BAY-A',  8, 12),
  (2, 'BAY-A', 10, 14),
  (3, 'BAY-A', 12, 16),
  (4, 'BAY-B',  9, 11),
  (5, 'BAY-B', 11, 13),
  (6, 'BAY-B', 10, 15);
```

## Starter: guided

```sql
SELECT
  a.bay_id,
  a.res_id AS res_a,
  b.res_id AS res_b,
  0 AS overlap_hrs
FROM bay_windows a
JOIN bay_windows b
  ON a.bay_id = b.bay_id
  -- Add a.res_id < b.res_id and the half-open overlap condition
ORDER BY a.bay_id ASC, res_a ASC, res_b ASC;
```

## Starter: standard

```sql
-- Find all overlapping half-open reservation pairs per bay with overlap_hrs
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects bay_id, res_a, res_b, overlap_hrs",
    lambda: columns,
    ["bay_id", "res_a", "res_b", "overlap_hrs"],
)

expect(
    "finds exact half-open overlaps without false positives on back-to-back windows",
    lambda: rows,
    [
        ["BAY-A", 1, 2, 2],
        ["BAY-A", 2, 3, 2],
        ["BAY-B", 4, 6, 1],
        ["BAY-B", 5, 6, 2],
    ],
)
```

## Hidden checks

```python
def _test_nested_window():
    conn.execute("INSERT INTO bay_windows (res_id, bay_id, start_hr, end_hr) VALUES (7, 'BAY-A', 9, 10)")
    return [r for r in run_user_sql() if r[2] == 7]

expect(
    "detects completely contained windows dynamically",
    _test_nested_window,
    [["BAY-A", 1, 7, 1]],
)
```

## Solution

```sql
SELECT
  a.bay_id,
  a.res_id AS res_a,
  b.res_id AS res_b,
  MIN(a.end_hr, b.end_hr) - MAX(a.start_hr, b.start_hr) AS overlap_hrs
FROM bay_windows a
JOIN bay_windows b
  ON a.bay_id = b.bay_id
  AND a.res_id < b.res_id
  AND a.start_hr < b.end_hr
  AND b.start_hr < a.end_hr
ORDER BY a.bay_id ASC, res_a ASC, res_b ASC;
```

## Restored

Time ledger overlap guard online — docking bay scheduling collisions are detected accurately without flagging adjacent shifts.

---
id: sql-gaps-and-islands
kind: code
language: sql
title: Collapse consecutive uptime days into contiguous streaks (Gaps and Islands)
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
---

## Briefing

`uptime_days` stores one row for every day a relay stayed online. Reporting wants contiguous uptime streaks collapsed into `(relay_id, start_day, end_day, streak_len)` ranges — the classic SQL **Gaps and Islands** problem!

## Objective

Write a `SELECT` query (using a CTE and `ROW_NUMBER()`) that groups consecutive `day_num` values per `relay_id` into islands and returns:
- `relay_id`
- `start_day` (`MIN(day_num)`)
- `end_day` (`MAX(day_num)`)
- `streak_len` (`COUNT(*)`)

Order results by `relay_id ASC, start_day ASC`.

## Concept

- For a streak of consecutive integers like `day_num = 10, 11, 12`, `ROW_NUMBER()` assigns `1, 2, 3`.
- Subtracting the two — `day_num - ROW_NUMBER() OVER (PARTITION BY relay_id ORDER BY day_num ASC) AS grp` — yields the **exact same constant** (`9, 9, 9`) for every row in the streak!
- When a gap occurs (say, jumping to `day_num = 15`, row number `4`), `15 - 4 = 11` starts a brand-new group key!
- Grouping by `(relay_id, grp)` collapses every contiguous island in a single pass.

## Hints

1. In a CTE `numbered`, compute `day_num - ROW_NUMBER() OVER (PARTITION BY relay_id ORDER BY day_num ASC) AS grp`.
2. In the outer query, `SELECT relay_id, MIN(day_num) AS start_day, MAX(day_num) AS end_day, COUNT(*) AS streak_len FROM numbered GROUP BY relay_id, grp ORDER BY relay_id ASC, start_day ASC;`.

## Setup

```sql
CREATE TABLE uptime_days (
  relay_id TEXT NOT NULL,
  day_num INTEGER NOT NULL,
  PRIMARY KEY (relay_id, day_num)
);

INSERT INTO uptime_days (relay_id, day_num) VALUES
  ('R-1', 1), ('R-1', 2), ('R-1', 3),
  ('R-1', 6), ('R-1', 7),
  ('R-1', 10),
  ('R-2', 4), ('R-2', 5),
  ('R-2', 9), ('R-2', 10), ('R-2', 11);
```

## Starter: guided

```sql
WITH numbered AS (
  SELECT
    relay_id,
    day_num,
    day_num - ROW_NUMBER() OVER (PARTITION BY relay_id ORDER BY day_num ASC) AS grp
  FROM uptime_days
)
-- Group numbered by relay_id, grp to return relay_id, start_day, end_day, streak_len
SELECT relay_id, day_num AS start_day, day_num AS end_day, 1 AS streak_len
FROM numbered;
```

## Starter: standard

```sql
-- Collapse consecutive day_num rows per relay_id into (relay_id, start_day, end_day, streak_len)
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects relay_id, start_day, end_day, streak_len",
    lambda: columns,
    ["relay_id", "start_day", "end_day", "streak_len"],
)

expect(
    "collapses contiguous days into exact uptime islands",
    lambda: rows,
    [
        ["R-1", 1, 3, 3],
        ["R-1", 6, 7, 2],
        ["R-1", 10, 10, 1],
        ["R-2", 4, 5, 2],
        ["R-2", 9, 11, 3],
    ],
)
```

## Hidden checks

```python
def _test_bridge_gap():
    conn.execute("INSERT INTO uptime_days (relay_id, day_num) VALUES ('R-1', 4), ('R-1', 5)")
    return [r for r in run_user_sql() if r[0] == "R-1"]

expect(
    "merges two islands dynamically when bridging days are inserted",
    _test_bridge_gap,
    [
        ["R-1", 1, 7, 7],
        ["R-1", 10, 10, 1],
    ],
)
```

## Solution

```sql
WITH numbered AS (
  SELECT
    relay_id,
    day_num,
    day_num - ROW_NUMBER() OVER (
      PARTITION BY relay_id
      ORDER BY day_num ASC
    ) AS grp
  FROM uptime_days
)
SELECT
  relay_id,
  MIN(day_num) AS start_day,
  MAX(day_num) AS end_day,
  COUNT(*) AS streak_len
FROM numbered
GROUP BY relay_id, grp
ORDER BY relay_id ASC, start_day ASC;
```

## Restored

Time ledger gaps-and-islands detector online — individual uptime logs now fold cleanly into contiguous streaks.

---
id: maintenance-sql-fix-island-key
language: sql
title: Fix a Gaps-and-Islands query that omitted PARTITION BY in ROW_NUMBER()
system: Time ledger
symbol: equipment
scene: tests
skills: sql-time-series
reviewSkill: sql-time-series
prerequisite: sql-temporal-overlap-guard
---

## Briefing

A Gaps-and-Islands query collapsing consecutive `hr` readings per `node` forgot `PARTITION BY node` inside `ROW_NUMBER()` — causing one node's row count to shift the grouping keys of another node!

## Objective

Fix the window clause in the `islands` CTE so `ROW_NUMBER()` partitions by `node` and orders by `hr ASC`, returning exact `(node, start_hr, end_hr)` islands ordered by `node ASC, start_hr ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change `ROW_NUMBER() OVER (ORDER BY hr ASC)` to `ROW_NUMBER() OVER (PARTITION BY node ORDER BY hr ASC)`.

## Setup

```sql
CREATE TABLE heartbeats (
  node TEXT NOT NULL,
  hr INTEGER NOT NULL,
  PRIMARY KEY (node, hr)
);

INSERT INTO heartbeats (node, hr) VALUES
  ('N-1', 1), ('N-1', 2), ('N-1', 5),
  ('N-2', 1), ('N-2', 2), ('N-2', 3);
```

## Starter

```sql
WITH islands AS (
  SELECT
    node,
    hr,
    hr - ROW_NUMBER() OVER (ORDER BY hr ASC) AS grp
  FROM heartbeats
)
SELECT
  node,
  MIN(hr) AS start_hr,
  MAX(hr) AS end_hr
FROM islands
GROUP BY node, grp
ORDER BY node ASC, start_hr ASC;
```

## Checks

```python
expect(
    "collapses contiguous hours independently for each node",
    lambda: [columns, rows],
    [
        ["node", "start_hr", "end_hr"],
        [
            ["N-1", 1, 2],
            ["N-1", 5, 5],
            ["N-2", 1, 3],
        ],
    ],
)
```

## Hidden checks

```python
def _test_interleaved():
    conn.execute("INSERT INTO heartbeats VALUES ('N-1', 3), ('N-2', 4)")
    return run_user_sql()

expect(
    "keeps interleaved hours across nodes cleanly separated",
    _test_interleaved,
    [
        ["N-1", 1, 3],
        ["N-1", 5, 5],
        ["N-2", 1, 4],
    ],
)
```

## Solution

```sql
WITH islands AS (
  SELECT
    node,
    hr,
    hr - ROW_NUMBER() OVER (PARTITION BY node ORDER BY hr ASC) AS grp
  FROM heartbeats
)
SELECT
  node,
  MIN(hr) AS start_hr,
  MAX(hr) AS end_hr
FROM islands
GROUP BY node, grp
ORDER BY node ASC, start_hr ASC;
```

## Restored

Time ledger island partitioning fixed — streaks no longer bleed across distinct nodes.

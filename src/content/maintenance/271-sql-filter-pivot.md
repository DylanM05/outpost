---
id: maintenance-sql-filter-pivot
language: sql
title: Pivot dispatch ticket counts by priority using FILTER (WHERE ...)
system: Pivot gallery
symbol: instrument
scene: tests
skills: sql-fulltext-analytics
reviewSkill: sql-fulltext-analytics
prerequisite: sql-cohort-retention-sql
---

## Briefing

Summarize open `tickets` per `team` into three pivoted columns (`high_cnt`, `med_cnt`, `low_cnt`) using `COUNT(*) FILTER (WHERE ...)`.

## Objective

Write a `SELECT` query against `tickets` grouped by `team` (ordered by `team ASC`) returning `team`, `high_cnt`, `med_cnt`, and `low_cnt`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `COUNT(*) FILTER (WHERE priority = 'high') AS high_cnt` (and likewise for `'med'` and `'low'`).

## Setup

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  team TEXT NOT NULL,
  priority TEXT NOT NULL
);

INSERT INTO tickets (id, team, priority) VALUES
  (1, 'ops',   'high'),
  (2, 'ops',   'high'),
  (3, 'ops',   'low'),
  (4, 'power', 'med'),
  (5, 'power', 'low');
```

## Starter

```sql
-- Return team, high_cnt, med_cnt, low_cnt using COUNT(*) FILTER (WHERE ...)
```

## Checks

```python
expect(
    "pivots ticket counts per team cleanly",
    lambda: [columns, rows],
    [
        ["team", "high_cnt", "med_cnt", "low_cnt"],
        [
            ["ops", 2, 0, 1],
            ["power", 0, 1, 1],
        ],
    ],
)
```

## Hidden checks

```python
check(
    "uses SQL FILTER clause",
    lambda: sql_uses("FILTER"),
    "Use COUNT(*) FILTER (WHERE priority = ...) for each pivoted column.",
)
```

## Solution

```sql
SELECT
  team,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_cnt,
  COUNT(*) FILTER (WHERE priority = 'med') AS med_cnt,
  COUNT(*) FILTER (WHERE priority = 'low') AS low_cnt
FROM tickets
GROUP BY team
ORDER BY team ASC;
```

## Restored

Pivot gallery ticket summary restored.

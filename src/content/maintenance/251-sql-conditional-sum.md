---
id: maintenance-sql-conditional-sum
language: sql
title: Pivot pass and fail inspection counts per bay with conditional aggregation
system: Rollup bay
symbol: instrument
scene: tests
skills: sql-aggregations
reviewSkill: sql-aggregations
prerequisite: sql-multi-join-rollup
---

## Briefing

`inspections` logs every hardware check with `outcome` set to either `'pass'` or `'fail'`. The rollup bay needs a single row per `bay` showing `total_checks`, `passed_checks`, and `failed_checks`.

## Objective

Write a `SELECT` query against `inspections` grouped by `bay` (ordered by `bay ASC`) that projects:
1. `bay`
2. `total_checks` (`COUNT(*)`)
3. `passed_checks` (`SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END)`)
4. `failed_checks` (`SUM(CASE WHEN outcome = 'fail' THEN 1 ELSE 0 END)`)

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END) AS passed_checks` and `SUM(CASE WHEN outcome = 'fail' THEN 1 ELSE 0 END) AS failed_checks`.

## Setup

```sql
CREATE TABLE inspections (
  insp_id INTEGER PRIMARY KEY,
  bay TEXT NOT NULL,
  outcome TEXT NOT NULL
);

INSERT INTO inspections (insp_id, bay, outcome) VALUES
  (1, 'Bay-A', 'pass'),
  (2, 'Bay-A', 'fail'),
  (3, 'Bay-A', 'pass'),
  (4, 'Bay-B', 'pass'),
  (5, 'Bay-B', 'pass'),
  (6, 'Bay-C', 'fail');
```

## Starter

```sql
SELECT
  bay,
  COUNT(*) AS total_checks
FROM inspections
GROUP BY bay
ORDER BY bay ASC;
```

## Checks

```python
expect(
    "projects bay, total_checks, passed_checks, failed_checks",
    lambda: columns,
    ["bay", "total_checks", "passed_checks", "failed_checks"],
)

expect(
    "pivots pass and fail counts accurately per bay",
    lambda: rows,
    [
        ["Bay-A", 3, 2, 1],
        ["Bay-B", 2, 2, 0],
        ["Bay-C", 1, 0, 1],
    ],
)
```

## Hidden checks

```python
def _test_extra_inspection():
    conn.execute("INSERT INTO inspections VALUES (7, 'Bay-C', 'pass')")
    return run_user_sql()

expect(
    "updates Bay-C counts when a passing inspection is added",
    _test_extra_inspection,
    [
        ["Bay-A", 3, 2, 1],
        ["Bay-B", 2, 2, 0],
        ["Bay-C", 2, 1, 1],
    ],
)
```

## Solution

```sql
SELECT
  bay,
  COUNT(*) AS total_checks,
  SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END) AS passed_checks,
  SUM(CASE WHEN outcome = 'fail' THEN 1 ELSE 0 END) AS failed_checks
FROM inspections
GROUP BY bay
ORDER BY bay ASC;
```

## Restored

Rollup bay inspection scorecard restored — pass and fail counts are pivoted in one grouped query.

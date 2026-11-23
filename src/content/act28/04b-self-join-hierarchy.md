---
id: sql-self-join-hierarchy
kind: code
language: sql
title: Resolve supervisor chains and direct-report counts with a self-join
system: Join bridge
symbol: equipment
scene: tests
skills: sql-joins
---

## Briefing

In `engineers`, each engineer has a `supervisor_id` pointing to another row's `emp_id` in the **same** table (`NULL` for the chief engineer at the root of the org chart). Command wants an org directory showing every engineer, their supervisor's name (`'COMMAND'` if they have no supervisor), and how many direct reports report to them.

## Objective

Write a `SELECT` query using self-joins on `engineers` that projects four columns ordered by `emp_id ASC`:
1. `emp_id`
2. `engineer_name` (`e.name`)
3. `supervisor_name` — the supervisor's `name`, or `'COMMAND'` when `e.supervisor_id IS NULL`
4. `direct_reports` — count of engineers whose `supervisor_id = e.emp_id` (`0` for leaf engineers with no direct reports)

## Concept

- A **self-join** joins a table to itself under distinct table aliases:
  - `LEFT JOIN engineers sup ON e.supervisor_id = sup.emp_id` looks up each engineer's supervisor.
  - `LEFT JOIN engineers rep ON rep.supervisor_id = e.emp_id` pairs each engineer with their direct reports (or `NULL` when they have none).
- Always qualify every column with its table alias (`e.emp_id`, `sup.name`, `rep.emp_id`) so SQL knows which role of the table you mean.

## Hints

1. Alias the primary table as `engineers e`.
2. `LEFT JOIN engineers sup ON e.supervisor_id = sup.emp_id` and use `COALESCE(sup.name, 'COMMAND') AS supervisor_name`.
3. `LEFT JOIN engineers rep ON rep.supervisor_id = e.emp_id`, group by `e.emp_id, e.name, sup.name`, and compute `COUNT(rep.emp_id) AS direct_reports`.

## Setup

```sql
CREATE TABLE engineers (
  emp_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  supervisor_id TEXT REFERENCES engineers(emp_id)
);

INSERT INTO engineers (emp_id, name, role, supervisor_id) VALUES
  ('E-01', 'Vera', 'Chief Engineer', NULL),
  ('E-02', 'Lin',  'Grid Lead',      'E-01'),
  ('E-03', 'Mira', 'Vault Lead',     'E-01'),
  ('E-04', 'Kade', 'Relay Tech',     'E-02'),
  ('E-05', 'Sora', 'Relay Tech',     'E-02'),
  ('E-06', 'Taro', 'Storage Tech',   'E-03');
```

## Starter: guided

```sql
-- Self-join engineers as e, sup (supervisor), and rep (direct reports).
-- Project emp_id, engineer_name, supervisor_name, and direct_reports ordered by emp_id ASC.
SELECT
  e.emp_id,
  e.name AS engineer_name
FROM engineers e
ORDER BY e.emp_id ASC;
```

## Starter: standard

```sql
SELECT emp_id, name, supervisor_id
FROM engineers
ORDER BY emp_id ASC;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects emp_id, engineer_name, supervisor_name, direct_reports",
    lambda: columns,
    ["emp_id", "engineer_name", "supervisor_name", "direct_reports"],
)

expect(
    "resolves supervisor names and direct report counts for every engineer",
    lambda: rows,
    [
        ["E-01", "Vera", "COMMAND", 2],
        ["E-02", "Lin", "Vera", 2],
        ["E-03", "Mira", "Vera", 1],
        ["E-04", "Kade", "Lin", 0],
        ["E-05", "Sora", "Lin", 0],
        ["E-06", "Taro", "Mira", 0],
    ],
)
```

## Hidden checks

```python
def _test_add_report():
    conn.execute(
        "INSERT INTO engineers (emp_id, name, role, supervisor_id) VALUES ('E-07', 'Nia', 'Junior Tech', 'E-04')"
    )
    return run_user_sql()

expect(
    "updates direct_reports when a leaf engineer gains a new direct report",
    _test_add_report,
    [
        ["E-01", "Vera", "COMMAND", 2],
        ["E-02", "Lin", "Vera", 2],
        ["E-03", "Mira", "Vera", 1],
        ["E-04", "Kade", "Lin", 1],
        ["E-05", "Sora", "Lin", 0],
        ["E-06", "Taro", "Mira", 0],
        ["E-07", "Nia", "Kade", 0],
    ],
)
```

## Solution

```sql
SELECT
  e.emp_id,
  e.name AS engineer_name,
  COALESCE(sup.name, 'COMMAND') AS supervisor_name,
  COUNT(rep.emp_id) AS direct_reports
FROM engineers e
LEFT JOIN engineers sup
  ON e.supervisor_id = sup.emp_id
LEFT JOIN engineers rep
  ON rep.supervisor_id = e.emp_id
GROUP BY e.emp_id, e.name, sup.name
ORDER BY e.emp_id ASC;
```

## Restored

Join bridge hierarchy directory online — supervisor links and direct-report counts resolve cleanly across self-joined personnel rows.

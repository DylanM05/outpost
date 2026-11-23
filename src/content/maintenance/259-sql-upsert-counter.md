---
id: maintenance-sql-upsert-counter
language: sql
title: Accumulate error counts per node with INSERT ... ON CONFLICT DO UPDATE
system: Mutation gate
symbol: equipment
scene: tests
skills: sql-schema-dml
reviewSkill: sql-schema-dml
prerequisite: sql-correlated-update-delete
---

## Briefing

`error_batches` holds new error tallies `(node_id, new_errors)` that need to be merged into `error_totals(node_id, total_errors)`. If `node_id` is not yet in `error_totals`, insert it with `total_errors = new_errors`; if it already exists, add `excluded.total_errors` to `error_totals.total_errors`.

## Objective

Write an upsert statement (`INSERT INTO error_totals ... SELECT ... FROM error_batches WHERE true ON CONFLICT(node_id) DO UPDATE SET ...`) followed by `SELECT node_id, total_errors FROM error_totals ORDER BY node_id ASC;`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `ON CONFLICT(node_id) DO UPDATE SET total_errors = error_totals.total_errors + excluded.total_errors;`.

## Setup

```sql
CREATE TABLE error_totals (
  node_id TEXT PRIMARY KEY,
  total_errors INTEGER NOT NULL
);

CREATE TABLE error_batches (
  batch_id INTEGER PRIMARY KEY,
  node_id TEXT NOT NULL,
  new_errors INTEGER NOT NULL
);

INSERT INTO error_totals (node_id, total_errors) VALUES
  ('N-01', 5),
  ('N-02', 2);

INSERT INTO error_batches (batch_id, node_id, new_errors) VALUES
  (1, 'N-01', 3),
  (2, 'N-03', 4);
```

## Starter

```sql
SELECT node_id, total_errors
FROM error_totals
ORDER BY node_id ASC;
```

## Checks

```python
expect(
    "accumulates existing node error totals and inserts new nodes",
    lambda: rows,
    [
        ["N-01", 8],
        ["N-02", 2],
        ["N-03", 4],
    ],
)
```

## Hidden checks

```python
def _test_rerun_accumulation():
    return run_user_sql()

expect(
    "re-running the batch adds another 3 to N-01 and 4 to N-03",
    _test_rerun_accumulation,
    [
        ["N-01", 11],
        ["N-02", 2],
        ["N-03", 8],
    ],
)
```

## Solution

```sql
INSERT INTO error_totals (node_id, total_errors)
SELECT node_id, new_errors
FROM error_batches
WHERE true
ON CONFLICT(node_id) DO UPDATE SET
  total_errors = error_totals.total_errors + excluded.total_errors;

SELECT
  node_id,
  total_errors
FROM error_totals
ORDER BY node_id ASC;
```

## Restored

Mutation gate counter upsert restored — error batches merge atomically into `error_totals`.

---
id: maintenance-sql-returning-update
language: sql
title: Claim queued jobs atomically with UPDATE ... RETURNING
system: Transaction desk
symbol: controller
scene: tests
skills: sql-transactions
reviewSkill: sql-transactions
prerequisite: sql-safe-table-rebuild
---

## Briefing

Workers claim pending tasks from `job_queue` by updating `status` from `'pending'` to `'running'` for jobs in `queue = 'critical'` and returning the claimed `job_id` and `status` in a single atomic statement.

## Objective

Write an `UPDATE job_queue` statement that sets `status = 'running'` for all rows where `queue = 'critical' AND status = 'pending'` and uses `RETURNING job_id, status` to return the claimed rows.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `UPDATE job_queue SET status = 'running' WHERE queue = 'critical' AND status = 'pending' RETURNING job_id, status;`.

## Setup

```sql
CREATE TABLE job_queue (
  job_id INTEGER PRIMARY KEY,
  queue TEXT NOT NULL,
  status TEXT NOT NULL
);

INSERT INTO job_queue (job_id, queue, status) VALUES
  (1, 'critical', 'pending'),
  (2, 'normal',   'pending'),
  (3, 'critical', 'done'),
  (4, 'critical', 'pending');
```

## Starter

```sql
-- Update pending critical jobs to 'running' and return job_id, status via RETURNING
```

## Checks

```python
expect(
    "returns updated job_id and status via RETURNING",
    lambda: [columns, sorted(rows)],
    [["job_id", "status"], [[1, "running"], [4, "running"]]],
)

expect(
    "leaves non-critical and already-done jobs untouched",
    lambda: query("SELECT job_id, status FROM job_queue ORDER BY job_id ASC"),
    [[1, "running"], [2, "pending"], [3, "done"], [4, "running"]],
)
```

## Hidden checks

```python
check(
    "uses RETURNING clause",
    lambda: sql_uses("RETURNING") and sql_uses("UPDATE"),
    "Use UPDATE ... RETURNING job_id, status in a single statement.",
)
```

## Solution

```sql
UPDATE job_queue
SET status = 'running'
WHERE queue = 'critical'
  AND status = 'pending'
RETURNING job_id, status;
```

## Restored

Transaction desk job claiming restored — pending critical tasks are now updated and returned atomically.

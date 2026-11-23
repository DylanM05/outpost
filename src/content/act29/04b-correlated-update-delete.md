---
id: sql-correlated-update-delete
kind: code
language: sql
title: Archive and prune exhausted queue jobs with INSERT-SELECT, UPDATE, and DELETE
system: Mutation gate
symbol: equipment
scene: tests
skills: sql-schema-dml
---

## Briefing

When a maintenance sweep runs on `job_queue`, every currently `'failed'` job has its `retries` counter incremented by `1`. Any `'failed'` job whose updated `retries` reaches or exceeds its `max_retries` limit must be archived into `dead_letter_jobs` and deleted from `job_queue`.

## Objective

Write a multi-statement DML script that:
1. Updates `job_queue` so `retries = retries + 1` for all rows where `status = 'failed'`.
2. Copies all rows from `job_queue` where `status = 'failed' AND retries >= max_retries` into `dead_letter_jobs (job_id, queue_name, final_retries)` (mapping `retries` to `final_retries`).
3. Deletes all rows from `job_queue` where `status = 'failed' AND retries >= max_retries`.
4. Ends with `SELECT job_id, queue_name, retries, max_retries, status FROM job_queue ORDER BY job_id ASC;`.

## Concept

- Execute the three mutation steps in exact sequence:
  1. `UPDATE job_queue SET retries = retries + 1 WHERE status = 'failed';`
  2. `INSERT INTO dead_letter_jobs (job_id, queue_name, final_retries) SELECT job_id, queue_name, retries FROM job_queue WHERE status = 'failed' AND retries >= max_retries;`
  3. `DELETE FROM job_queue WHERE status = 'failed' AND retries >= max_retries;`
- Order matters: archiving before deleting preserves the exhausted rows in `dead_letter_jobs`!

## Hints

1. Run the `UPDATE` first so `retries` reflects the current failed attempt.
2. Run `INSERT INTO dead_letter_jobs ... SELECT ... FROM job_queue WHERE status = 'failed' AND retries >= max_retries;` before `DELETE`.
3. Finish with `SELECT job_id, queue_name, retries, max_retries, status FROM job_queue ORDER BY job_id ASC;`.

## Setup

```sql
CREATE TABLE job_queue (
  job_id INTEGER PRIMARY KEY,
  queue_name TEXT NOT NULL,
  retries INTEGER NOT NULL,
  max_retries INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE dead_letter_jobs (
  job_id INTEGER PRIMARY KEY,
  queue_name TEXT NOT NULL,
  final_retries INTEGER NOT NULL
);

INSERT INTO job_queue (job_id, queue_name, retries, max_retries, status) VALUES
  (101, 'telemetry', 0, 3, 'pending'),
  (102, 'telemetry', 1, 3, 'failed'),
  (103, 'dispatch',  2, 3, 'failed'),
  (104, 'archive',   4, 4, 'failed'),
  (105, 'dispatch',  2, 3, 'done');
```

## Starter: guided

```sql
-- 1. Increment retries for failed jobs
-- 2. Copy failed jobs with retries >= max_retries into dead_letter_jobs
-- 3. Delete those exhausted jobs from job_queue
-- 4. SELECT remaining job_queue rows ordered by job_id ASC
SELECT job_id, queue_name, retries, max_retries, status
FROM job_queue
ORDER BY job_id ASC;
```

## Starter: standard

```sql
SELECT job_id, queue_name, retries, max_retries, status
FROM job_queue;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "remaining job_queue has non-exhausted jobs with updated retry count on job 102",
    lambda: rows,
    [
        [101, "telemetry", 0, 3, "pending"],
        [102, "telemetry", 2, 3, "failed"],
        [105, "dispatch", 2, 3, "done"],
    ],
)

expect(
    "dead_letter_jobs archives jobs 103 and 104 with their incremented final_retries",
    lambda: query("SELECT job_id, queue_name, final_retries FROM dead_letter_jobs ORDER BY job_id ASC"),
    [
        [103, "dispatch", 3],
        [104, "archive", 5],
    ],
)
```

## Hidden checks

```python
def _test_second_sweep():
    return [
        run_user_sql(),
        query("SELECT job_id, queue_name, final_retries FROM dead_letter_jobs ORDER BY job_id ASC"),
    ]

expect(
    "a second sweep increments job 102 to 3/3 and moves it to dead_letter_jobs",
    _test_second_sweep,
    [
        [
            [101, "telemetry", 0, 3, "pending"],
            [105, "dispatch", 2, 3, "done"],
        ],
        [
            [102, "telemetry", 3],
            [103, "dispatch", 3],
            [104, "archive", 5],
        ],
    ],
)
```

## Solution

```sql
UPDATE job_queue
SET retries = retries + 1
WHERE status = 'failed';

INSERT INTO dead_letter_jobs (job_id, queue_name, final_retries)
SELECT job_id, queue_name, retries
FROM job_queue
WHERE status = 'failed'
  AND retries >= max_retries;

DELETE FROM job_queue
WHERE status = 'failed'
  AND retries >= max_retries;

SELECT
  job_id,
  queue_name,
  retries,
  max_retries,
  status
FROM job_queue
ORDER BY job_id ASC;
```

## Restored

Mutation gate dead-letter sweep restored — exhausted jobs are incremented, archived to `dead_letter_jobs`, and pruned from the active queue.

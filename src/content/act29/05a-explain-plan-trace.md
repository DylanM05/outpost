---
id: sql-explain-plan-trace
kind: predict
language: sql
title: Trace composite index column order and covering-index query plans
system: Index bench
symbol: instrument
scene: console
skills: sql-indexes-transactions, reading-code
---

## Briefing

A composite B-tree index `idx_logs_sector_ts_level` on `logs(sector, ts, level)` sorts entries first by `sector`, then by `ts`, then by `level`. Understanding how the query planner uses a composite index (`SCAN` vs `SEARCH ... USING INDEX` vs `SEARCH ... USING COVERING INDEX`) starts with tracing the index's column sequence in `pragma_index_info` and matching query shapes against the leftmost-prefix rule.

## Objective

Trace the query in `## Program` that inspects `pragma_index_info('idx_logs_sector_ts_level')` and classifies candidate queries in `query_catalog`, then predict **every line of output**.

## Concept

- A composite B-tree index on `(col0, col1, col2)` can only be searched (`SEARCH`) when a query filters on a **leftmost prefix** starting at `col0` (`sector`):
  - If the query does **not** constrain the leading column `sector` (`uses_leading_sector = 0`), the planner falls back to a full table scan (`SCAN logs`).
  - If the query constrains `sector` (`uses_leading_sector = 1`) and every column referenced anywhere in `SELECT`, `WHERE`, and `ORDER BY` is present inside the index (`needs_payload_col = 0`), SQLite satisfies the query entirely from the index B-tree without touching the base table (`SEARCH logs USING COVERING INDEX idx_logs_sector_ts_level`).
  - If the query constrains `sector` (`uses_leading_sector = 1`) but also fetches an unindexed column like `message` (`needs_payload_col = 1`), SQLite searches the index and then looks up the base table row (`SEARCH logs USING INDEX idx_logs_sector_ts_level`).

## Hints

1. Check `query_catalog` ordered by `qid ASC`:
   - `Q1` (`uses_leading_sector = 1`, `needs_payload_col = 0`) uses the **covering index**.
   - `Q2` (`uses_leading_sector = 1`, `needs_payload_col = 1`) uses the **index** (plus table lookup).
   - `Q3` (`uses_leading_sector = 0`, `needs_payload_col = 0`) filters only on `ts` (skipping leading `sector`), so it performs `SCAN logs`.
2. Notice the subquery counts `COUNT(*)` from `pragma_index_info('idx_logs_sector_ts_level')`, which is `3` indexed columns (`sector`, `ts`, `level`).

## Setup

```sql
CREATE TABLE logs (
  log_id INTEGER PRIMARY KEY,
  sector TEXT NOT NULL,
  ts INTEGER NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX idx_logs_sector_ts_level ON logs(sector, ts, level);

CREATE TABLE query_catalog (
  qid TEXT PRIMARY KEY,
  uses_leading_sector INTEGER NOT NULL,
  needs_payload_col INTEGER NOT NULL
);

INSERT INTO query_catalog (qid, uses_leading_sector, needs_payload_col) VALUES
  ('Q1', 1, 0),
  ('Q2', 1, 1),
  ('Q3', 0, 0);
```

## Program

```sql
SELECT
  qid,
  (SELECT COUNT(*) FROM pragma_index_info('idx_logs_sector_ts_level')) AS index_cols,
  CASE
    WHEN uses_leading_sector = 0 THEN 'SCAN logs'
    WHEN needs_payload_col = 0 THEN 'SEARCH logs USING COVERING INDEX idx_logs_sector_ts_level'
    ELSE 'SEARCH logs USING INDEX idx_logs_sector_ts_level'
  END AS expected_plan
FROM query_catalog
ORDER BY qid ASC;
```

## Output

```text
qid | index_cols | expected_plan
Q1 | 3 | SEARCH logs USING COVERING INDEX idx_logs_sector_ts_level
Q2 | 3 | SEARCH logs USING INDEX idx_logs_sector_ts_level
Q3 | 3 | SCAN logs
```

## Restored

Index bench query-plan trace verified — composite indexes require the leftmost leading column to avoid `SCAN` and avoid base-table lookups when all projected columns are covered.

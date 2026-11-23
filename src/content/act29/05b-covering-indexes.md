---
id: sql-covering-indexes
kind: code
language: sql
title: Create composite and partial covering indexes verified with EXPLAIN QUERY PLAN
system: Index bench
symbol: instrument
scene: tests
skills: sql-indexes-transactions
---

## Briefing

Two high-frequency queries on `grid_events` are currently performing full table scans (`SCAN grid_events`):
1. Sector time-range power lookup:
   ```sql
   SELECT mw FROM grid_events WHERE sector = 'north' AND ts >= 100 ORDER BY ts ASC;
   ```
2. Active fault lookup (which only ever queries rows where `status = 'fault'`):
   ```sql
   SELECT sector FROM grid_events WHERE status = 'fault' AND ts >= 100;
   ```

Create two targeted indexes — one composite covering index and one partial index — so SQLite's `EXPLAIN QUERY PLAN` uses `SEARCH grid_events USING ... INDEX ...` for both queries instead of a full table scan!

## Objective

Write two `CREATE INDEX` statements on `grid_events`:
1. `idx_events_sector_ts_mw`: a composite covering index on `grid_events(sector, ts, mw)` so Query 1 uses `SEARCH grid_events USING COVERING INDEX idx_events_sector_ts_mw`.
2. `idx_events_fault_ts_sector`: a **partial** index on `grid_events(ts, sector) WHERE status = 'fault'` so Query 2 uses `SEARCH grid_events USING ... INDEX idx_events_fault_ts_sector`.

## Concept

- Ordering a composite index as `(equality_col, range_or_sort_col, covered_output_col)` — here `(sector, ts, mw)` — lets SQLite seek directly to `sector = 'north'`, scan `ts >= 100` already in `ORDER BY ts ASC` order, and read `mw` straight from the index leaf without touching the table!
- A **partial index** (`CREATE INDEX ... ON table(cols...) WHERE status = 'fault'`) indexes only the subset of rows matching the `WHERE` clause, keeping the index compact while still covering queries that include `WHERE status = 'fault'`.

## Hints

1. Create `CREATE INDEX idx_events_sector_ts_mw ON grid_events(sector, ts, mw);`.
2. Create `CREATE INDEX idx_events_fault_ts_sector ON grid_events(ts, sector) WHERE status = 'fault';`.

## Setup

```sql
CREATE TABLE grid_events (
  event_id INTEGER PRIMARY KEY,
  sector TEXT NOT NULL,
  status TEXT NOT NULL,
  ts INTEGER NOT NULL,
  mw INTEGER NOT NULL
);

INSERT INTO grid_events (event_id, sector, status, ts, mw) VALUES
  (1, 'north', 'ok',    90,  110),
  (2, 'north', 'fault', 120, 180),
  (3, 'north', 'ok',    150, 140),
  (4, 'south', 'fault', 130, 210),
  (5, 'east',  'ok',    160, 125);
```

## Starter: guided

```sql
-- Create composite covering index idx_events_sector_ts_mw
-- and partial covering index idx_events_fault_ts_sector (WHERE status = 'fault').
```

## Starter: standard

```sql
-- Create the two covering indexes on grid_events
```

## Starter: challenge

```sql
```

## Checks

```python
def _plan_detail(sql):
    plan_rows = query("EXPLAIN QUERY PLAN " + sql)
    return " | ".join(str(r[-1]) for r in plan_rows)

check(
    "sector time-range query uses covering index idx_events_sector_ts_mw",
    lambda: "USING COVERING INDEX idx_events_sector_ts_mw"
    in _plan_detail("SELECT mw FROM grid_events WHERE sector = 'north' AND ts >= 100 ORDER BY ts ASC"),
    "Create idx_events_sector_ts_mw on grid_events(sector, ts, mw).",
)

check(
    "fault query uses partial index idx_events_fault_ts_sector",
    lambda: "INDEX idx_events_fault_ts_sector"
    in _plan_detail("SELECT sector FROM grid_events WHERE status = 'fault' AND ts >= 100"),
    "Create partial index idx_events_fault_ts_sector on grid_events(ts, sector) WHERE status = 'fault'.",
)
```

## Hidden checks

```python
def _verify_partial_clause():
    sql_rows = query(
        "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_events_fault_ts_sector'"
    )
    return bool(sql_rows and "WHERE" in (sql_rows[0][0] or "").upper())

check(
    "idx_events_fault_ts_sector is defined as a partial index with a WHERE clause",
    _verify_partial_clause,
    "Include WHERE status = 'fault' in CREATE INDEX idx_events_fault_ts_sector.",
)
```

## Solution

```sql
CREATE INDEX idx_events_sector_ts_mw
ON grid_events(sector, ts, mw);

CREATE INDEX idx_events_fault_ts_sector
ON grid_events(ts, sector)
WHERE status = 'fault';
```

## Restored

Index bench covering indexes online — both hot query paths now execute as zero-lookup index-only scans in `EXPLAIN QUERY PLAN`.

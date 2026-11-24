---
id: sql-build-sql-ops-warehouse
kind: code
language: sql
title: Build an end-to-end STRICT SQLite operations warehouse with FTS5, savepoints, and KPI pivots
system: Transaction audit
symbol: controller
scene: tests
assessment: true
skills: sql-transactions, sql-time-series, sql-fulltext-analytics
---

## Briefing

Tie **SQL III (*The transaction hall*)** together by building the outpost's production operations warehouse in pure SQL: a `STRICT` work-orders table with a `GENERATED ALWAYS` total cost column, a trigger-synced `FTS5` search index, a `SAVEPOINT`-guarded initial batch load, and a pivoted KPI reporting view!

## Objective

Write a single SQL script that creates and populates the following objects:
1. **`work_orders` (`STRICT` table):**
   - `order_id INT PRIMARY KEY`
   - `sector TEXT NOT NULL`
   - `status TEXT NOT NULL CHECK (status IN ('open', 'done'))`
   - `day INT NOT NULL`
   - `hours INT NOT NULL CHECK (hours > 0)`
   - `rate INT NOT NULL CHECK (rate > 0)`
   - `total_cost INT GENERATED ALWAYS AS (hours * rate) STORED`
   - `notes TEXT NOT NULL`
2. **`orders_fts` (`FTS5` virtual table):**
   - `CREATE VIRTUAL TABLE orders_fts USING fts5(notes);`
3. **`trg_orders_ai` (`AFTER INSERT` trigger on `work_orders`):**
   - Inserts `(NEW.order_id, NEW.notes)` into `orders_fts(rowid, notes)`.
4. **Transactional seed load (`BEGIN; ... SAVEPOINT ...; ... COMMIT;`):**
   - Inside `BEGIN; ... COMMIT;`, insert 3 valid orders:
     - `(1, 'north', 'done', 1, 2, 50, 'replace coolant seal')`
     - `(2, 'north', 'open', 2, 4, 50, 'inspect solar relay')`
     - `(3, 'east',  'done', 1, 3, 60, 'flush coolant pump')`
   - Inside a `SAVEPOINT dry_run;`, insert a speculative `(99, 'east', 'open', 3, 1, 10, 'temporary test order')`, then undo it with `ROLLBACK TO dry_run; RELEASE dry_run;` before `COMMIT;`.
5. **`sector_kpi_pivot` (`VIEW`):**
   - Groups `work_orders` by `sector` (ordered by `sector ASC`) and projects:
     - `sector`
     - `total_orders`: `COUNT(*)`
     - `done_orders`: `COUNT(*) FILTER (WHERE status = 'done')`
     - `done_cost`: `COALESCE(SUM(total_cost) FILTER (WHERE status = 'done'), 0)`
     - `open_cost`: `COALESCE(SUM(total_cost) FILTER (WHERE status = 'open'), 0)`

## Concept

Combine everything from **SQL III**:
- `STRICT` tables + `GENERATED ALWAYS AS (...) STORED` columns enforce invariants automatically at the storage layer.
- `AFTER INSERT` triggers keep `FTS5` indexes automatically fresh even for rows loaded inside transactions (and roll back cleanly when a `SAVEPOINT` rolls back!).
- `FILTER (WHERE ...)` turns multi-status order metrics into a clean single-pass reporting view.

## Hints

1. Create `work_orders (...) STRICT`, `orders_fts USING fts5(notes)`, and `trg_orders_ai` BEFORE the `BEGIN; ... COMMIT;` batch load so the trigger indexes rows `1`, `2`, `3` and rolls back row `99` automatically!
2. In `sector_kpi_pivot`, use `COALESCE(SUM(total_cost) FILTER (WHERE status = 'done'), 0) AS done_cost` and `COALESCE(SUM(total_cost) FILTER (WHERE status = 'open'), 0) AS open_cost`.

## Setup

```sql
-- Fresh database ready for the Outpost operations warehouse.
```

## Starter: guided

```sql
-- 1. CREATE TABLE work_orders (...) STRICT;
-- 2. CREATE VIRTUAL TABLE orders_fts USING fts5(notes);
-- 3. CREATE TRIGGER trg_orders_ai AFTER INSERT ON work_orders ...
-- 4. BEGIN; INSERT rows 1..3; SAVEPOINT dry_run; INSERT row 99; ROLLBACK TO dry_run; RELEASE dry_run; COMMIT;
-- 5. CREATE VIEW sector_kpi_pivot AS ...
```

## Starter: standard

```sql
-- Build work_orders (STRICT + GENERATED total_cost), orders_fts + trg_orders_ai, savepoint seed load, and sector_kpi_pivot view
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "seeds only orders 1..3 (rolling back dry_run 99) and computes stored total_cost",
    lambda: query("SELECT order_id, sector, status, total_cost FROM work_orders ORDER BY order_id ASC"),
    [
        [1, "north", "done", 100],
        [2, "north", "open", 200],
        [3, "east", "done", 180],
    ],
)

expect(
    "orders_fts trigger indexed coolant orders and rolled back dry_run",
    lambda: [
        query("SELECT rowid FROM orders_fts WHERE orders_fts MATCH 'coolant' ORDER BY rowid ASC"),
        query("SELECT rowid FROM orders_fts WHERE orders_fts MATCH 'temporary'"),
    ],
    [[[1], [3]], []],
)

expect(
    "sector_kpi_pivot summarizes counts and done/open costs per sector",
    lambda: query("SELECT sector, total_orders, done_orders, done_cost, open_cost FROM sector_kpi_pivot ORDER BY sector ASC"),
    [
        ["east", 1, 1, 180, 0],
        ["north", 2, 1, 100, 200],
    ],
)
```

## Hidden checks

```python
def _test_live_insert_and_strict():
    conn.execute("INSERT INTO work_orders (order_id, sector, status, day, hours, rate, notes) VALUES (4, 'east', 'open', 2, 5, 40, 'coolant sensor calibration')")
    fts_hits = query("SELECT rowid FROM orders_fts WHERE orders_fts MATCH 'coolant' ORDER BY rowid ASC")
    pivot = query("SELECT sector, total_orders, done_orders, done_cost, open_cost FROM sector_kpi_pivot WHERE sector = 'east'")
    strict_blocked = False
    try:
        conn.execute("INSERT INTO work_orders (order_id, sector, status, day, hours, rate, notes) VALUES (5, 'east', 'open', 3, 'two', 40, 'bad type')")
    except Exception:
        strict_blocked = True
    return [fts_hits, pivot, strict_blocked]

expect(
    "syncs FTS5 & KPI view on live inserts and enforces STRICT typing",
    _test_live_insert_and_strict,
    [[[1], [3], [4]], [["east", 2, 1, 180, 200]], True],
)

check(
    "uses STRICT, GENERATED, SAVEPOINT, fts5, and FILTER",
    lambda: all(sql_uses(k) for k in ("STRICT", "GENERATED", "SAVEPOINT", "fts5", "FILTER")),
    "Use STRICT, GENERATED ALWAYS, SAVEPOINT, fts5, and FILTER (WHERE ...) in your warehouse script.",
)
```

## Solution

```sql
CREATE TABLE work_orders (
  order_id INT PRIMARY KEY,
  sector TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'done')),
  day INT NOT NULL,
  hours INT NOT NULL CHECK (hours > 0),
  rate INT NOT NULL CHECK (rate > 0),
  total_cost INT GENERATED ALWAYS AS (hours * rate) STORED,
  notes TEXT NOT NULL
) STRICT;

CREATE VIRTUAL TABLE orders_fts USING fts5(notes);

CREATE TRIGGER trg_orders_ai
AFTER INSERT ON work_orders
BEGIN
  INSERT INTO orders_fts(rowid, notes)
  VALUES (NEW.order_id, NEW.notes);
END;

BEGIN;
INSERT INTO work_orders (order_id, sector, status, day, hours, rate, notes) VALUES
  (1, 'north', 'done', 1, 2, 50, 'replace coolant seal'),
  (2, 'north', 'open', 2, 4, 50, 'inspect solar relay'),
  (3, 'east',  'done', 1, 3, 60, 'flush coolant pump');
SAVEPOINT dry_run;
INSERT INTO work_orders (order_id, sector, status, day, hours, rate, notes) VALUES
  (99, 'east', 'open', 3, 1, 10, 'temporary test order');
ROLLBACK TO dry_run;
RELEASE dry_run;
COMMIT;

CREATE VIEW sector_kpi_pivot AS
SELECT
  sector,
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE status = 'done') AS done_orders,
  COALESCE(SUM(total_cost) FILTER (WHERE status = 'done'), 0) AS done_cost,
  COALESCE(SUM(total_cost) FILTER (WHERE status = 'open'), 0) AS open_cost
FROM work_orders
GROUP BY sector
ORDER BY sector ASC;
```

## Restored

The transaction hall is completely online — your SQLite operations warehouse unites `STRICT` generated schemas, trigger-synced `FTS5` search, `SAVEPOINT` transactions, and `FILTER` KPI views.

---
id: sql-safe-table-rebuild
kind: code
language: sql
title: Perform an atomic zero-data-loss SQLite table-rebuild schema migration
system: Migration bay
symbol: equipment
scene: tests
skills: sql-transactions
---

## Briefing

Legacy table `legacy_probes` has loose constraints, a nullable `sector`, and stores `temp_c` as `TEXT`. Because SQLite cannot alter column types or add `CHECK` constraints in place, production migrations use the **12-step table-rebuild pattern** inside an atomic transaction!

## Objective

Write a transactional migration (`BEGIN; ... COMMIT;`) that replaces `legacy_probes` with a hardened `STRICT` table of the same name (`legacy_probes`):
1. Create `legacy_probes_new` as a `STRICT` table with:
   - `probe_id TEXT PRIMARY KEY`
   - `sector TEXT NOT NULL`
   - `temp_c REAL NOT NULL CHECK (temp_c >= -273.15)`
2. Copy all rows from `legacy_probes` into `legacy_probes_new`, converting `NULL` sectors to `'unassigned'` via `COALESCE(sector, 'unassigned')` and casting `temp_c` with `CAST(temp_c AS REAL)`.
3. `DROP TABLE legacy_probes;`
4. `ALTER TABLE legacy_probes_new RENAME TO legacy_probes;`
5. `COMMIT;`

## Concept

- Wrapping `CREATE TABLE ..._new` → `INSERT INTO ... SELECT ...` → `DROP TABLE` → `ALTER TABLE ... RENAME TO` inside `BEGIN; ... COMMIT;` guarantees either the entire migration succeeds or the original table remains untouched.
- `CAST(temp_c AS REAL)` converts numeric text (`'21.5'`) cleanly before inserting into a `STRICT` `REAL` column.

## Hints

1. Start with `BEGIN;` and create `legacy_probes_new (...) STRICT;`.
2. Copy data with `INSERT INTO legacy_probes_new (probe_id, sector, temp_c) SELECT probe_id, COALESCE(sector, 'unassigned'), CAST(temp_c AS REAL) FROM legacy_probes;`.
3. Drop `legacy_probes`, rename `legacy_probes_new` to `legacy_probes`, and `COMMIT;`.

## Setup

```sql
CREATE TABLE legacy_probes (
  probe_id TEXT PRIMARY KEY,
  sector TEXT,
  temp_c TEXT
);

INSERT INTO legacy_probes (probe_id, sector, temp_c) VALUES
  ('P-1', 'north', '18.5'),
  ('P-2', NULL,    '-40.0'),
  ('P-3', 'south', '22.25');
```

## Starter: guided

```sql
BEGIN;
CREATE TABLE legacy_probes_new (
  probe_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  temp_c REAL NOT NULL CHECK (temp_c >= -273.15)
) STRICT;
-- Copy transformed rows, DROP legacy_probes, RENAME legacy_probes_new, and COMMIT
COMMIT;
```

## Starter: standard

```sql
-- Atomically rebuild legacy_probes into a STRICT table with COALESCE sector and REAL temp_c
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "preserves and transforms all legacy rows into the rebuilt legacy_probes table",
    lambda: query("SELECT probe_id, sector, temp_c FROM legacy_probes ORDER BY probe_id ASC"),
    [
        ["P-1", "north", 18.5],
        ["P-2", "unassigned", -40.0],
        ["P-3", "south", 22.25],
    ],
)

def _test_strict_and_check():
    bad_type = False
    try:
        conn.execute("INSERT INTO legacy_probes VALUES ('P-9', 'east', 'hot')")
    except Exception:
        bad_type = True
    below_zero = False
    try:
        conn.execute("INSERT INTO legacy_probes VALUES ('P-10', 'east', -300.0)")
    except Exception:
        below_zero = True
    return [bad_type, below_zero]

expect(
    "enforces STRICT REAL type and CHECK (temp_c >= -273.15) after migration",
    _test_strict_and_check,
    [True, True],
)
```

## Hidden checks

```python
expect(
    "no leftover legacy_probes_new staging table remains",
    lambda: query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'legacy_probes_new'"),
    [],
)

check(
    "wrapped migration inside BEGIN ... COMMIT with ALTER TABLE RENAME",
    lambda: sql_uses("BEGIN") and sql_uses("COMMIT") and sql_uses("RENAME"),
    "Wrap the table rebuild inside BEGIN; ... ALTER TABLE ... RENAME TO ...; COMMIT;.",
)
```

## Solution

```sql
BEGIN;

CREATE TABLE legacy_probes_new (
  probe_id TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  temp_c REAL NOT NULL CHECK (temp_c >= -273.15)
) STRICT;

INSERT INTO legacy_probes_new (probe_id, sector, temp_c)
SELECT
  probe_id,
  COALESCE(sector, 'unassigned'),
  CAST(temp_c AS REAL)
FROM legacy_probes;

DROP TABLE legacy_probes;
ALTER TABLE legacy_probes_new RENAME TO legacy_probes;

COMMIT;
```

## Restored

Migration bay table rebuild complete — `legacy_probes` is now a clean `STRICT` table with zero lost telemetry records.

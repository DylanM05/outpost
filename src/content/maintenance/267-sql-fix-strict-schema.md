---
id: maintenance-sql-fix-strict-schema
language: sql
title: Fix a SQLite table-rebuild migration that omitted STRICT and dropped rows with NULL labels
system: Migration bay
symbol: equipment
scene: tests
skills: sql-transactions
reviewSkill: sql-transactions
prerequisite: sql-safe-table-rebuild
---

## Briefing

A migration script rebuilding `valves` accidentally filters out rows where `label IS NULL` (dropping real hardware!) and forgets the `STRICT` keyword on `valves_new`.

## Objective

Fix the migration script so `valves_new` is `STRICT`, every row from `valves` is preserved (replacing `NULL` labels with `'default'` via `COALESCE`), and `valves` replaces the old table cleanly inside `BEGIN; ... COMMIT;`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Add `STRICT` to `CREATE TABLE valves_new (...) STRICT;`, remove `WHERE label IS NOT NULL`, and use `COALESCE(label, 'default')`.

## Setup

```sql
CREATE TABLE valves (
  valve_id TEXT PRIMARY KEY,
  label TEXT,
  psi TEXT
);

INSERT INTO valves (valve_id, label, psi) VALUES
  ('V-1', 'Main', '120'),
  ('V-2', NULL,   '95');
```

## Starter

```sql
BEGIN;
CREATE TABLE valves_new (
  valve_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  psi INT NOT NULL
);
INSERT INTO valves_new (valve_id, label, psi)
SELECT valve_id, label, CAST(psi AS INT)
FROM valves
WHERE label IS NOT NULL;
DROP TABLE valves;
ALTER TABLE valves_new RENAME TO valves;
COMMIT;
```

## Checks

```python
expect(
    "preserves all rows and fills NULL label with 'default'",
    lambda: query("SELECT valve_id, label, psi FROM valves ORDER BY valve_id ASC"),
    [["V-1", "Main", 120], ["V-2", "default", 95]],
)
```

## Hidden checks

```python
def _test_strict():
    try:
        conn.execute("INSERT INTO valves VALUES ('V-3', 'Aux', 'high')")
        return False
    except Exception:
        return True

check(
    "enforces STRICT INT type on rebuilt valves table",
    _test_strict,
    "Add STRICT to CREATE TABLE valves_new (...) STRICT;.",
)
```

## Solution

```sql
BEGIN;
CREATE TABLE valves_new (
  valve_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  psi INT NOT NULL
) STRICT;
INSERT INTO valves_new (valve_id, label, psi)
SELECT valve_id, COALESCE(label, 'default'), CAST(psi AS INT)
FROM valves;
DROP TABLE valves;
ALTER TABLE valves_new RENAME TO valves;
COMMIT;
```

## Restored

Migration bay rebuild script repaired — all valve records survive the migration under strict typing.

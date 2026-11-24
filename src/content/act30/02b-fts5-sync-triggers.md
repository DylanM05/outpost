---
id: sql-fts5-sync-triggers
kind: code
language: sql
title: Synchronize an FTS5 search index automatically using AFTER INSERT and AFTER DELETE triggers
system: Search vault
symbol: instrument
scene: tests
skills: sql-fulltext-analytics, sql-schema-dml
---

## Briefing

An FTS5 index drifts stale the moment new incidents are logged or resolved unless writes keep it in sync. Wire SQLite triggers onto `incidents` so every insert or delete automatically updates `incidents_fts`.

## Objective

Given the existing `incidents` table and `incidents_fts` external-row FTS5 table, create two triggers:
1. `trg_incidents_ai` (`AFTER INSERT ON incidents`): inserts `(NEW.id, NEW.summary)` into `incidents_fts(rowid, summary)`.
2. `trg_incidents_ad` (`AFTER DELETE ON incidents`): deletes the matching row from `incidents_fts` (`DELETE FROM incidents_fts WHERE rowid = OLD.id;`).

## Concept

- Every SQLite FTS5 table automatically has an integer `rowid` column. Matching `incidents_fts.rowid` to `incidents.id` makes insert/delete sync triggers clean and exact.
- Inside `AFTER INSERT`, use `NEW.col`; inside `AFTER DELETE`, use `OLD.col`.

## Hints

1. `CREATE TRIGGER trg_incidents_ai AFTER INSERT ON incidents BEGIN INSERT INTO incidents_fts(rowid, summary) VALUES (NEW.id, NEW.summary); END;`
2. `CREATE TRIGGER trg_incidents_ad AFTER DELETE ON incidents BEGIN DELETE FROM incidents_fts WHERE rowid = OLD.id; END;`

## Setup

```sql
CREATE TABLE incidents (
  id INTEGER PRIMARY KEY,
  summary TEXT NOT NULL
);

CREATE VIRTUAL TABLE incidents_fts USING fts5(summary);
```

## Starter: guided

```sql
CREATE TRIGGER trg_incidents_ai
AFTER INSERT ON incidents
BEGIN
  -- Insert (NEW.id, NEW.summary) into incidents_fts(rowid, summary)
END;

-- Also create trg_incidents_ad (AFTER DELETE ON incidents)
```

## Starter: standard

```sql
-- Create trg_incidents_ai and trg_incidents_ad to keep incidents_fts synced with incidents
```

## Starter: challenge

```sql
```

## Checks

```python
def _test_sync():
    conn.execute("INSERT INTO incidents (id, summary) VALUES (1, 'Relay overheating in sector north')")
    conn.execute("INSERT INTO incidents (id, summary) VALUES (2, 'Battery pack nominal')")
    conn.execute("INSERT INTO incidents (id, summary) VALUES (3, 'North antenna relay dropped')")
    before_del = query("SELECT rowid FROM incidents_fts WHERE incidents_fts MATCH 'relay' ORDER BY rowid ASC")
    conn.execute("DELETE FROM incidents WHERE id = 1")
    after_del = query("SELECT rowid FROM incidents_fts WHERE incidents_fts MATCH 'relay' ORDER BY rowid ASC")
    return [before_del, after_del]

expect(
    "syncs FTS5 index automatically on INSERT and DELETE",
    _test_sync,
    [[[1], [3]], [[3]]],
)
```

## Hidden checks

```python
def _test_phrase_and_cleanup():
    conn.execute("INSERT INTO incidents (id, summary) VALUES (4, 'primary relay fuse blown')")
    found = query("SELECT rowid FROM incidents_fts WHERE incidents_fts MATCH '\"relay fuse\"'")
    conn.execute("DELETE FROM incidents WHERE id = 4")
    gone = query("SELECT rowid FROM incidents_fts WHERE incidents_fts MATCH '\"relay fuse\"'")
    return [found, gone]

expect(
    "indexes exact phrases on insert and removes them on delete",
    _test_phrase_and_cleanup,
    [[[4]], []],
)
```

## Solution

```sql
CREATE TRIGGER trg_incidents_ai
AFTER INSERT ON incidents
BEGIN
  INSERT INTO incidents_fts(rowid, summary)
  VALUES (NEW.id, NEW.summary);
END;

CREATE TRIGGER trg_incidents_ad
AFTER DELETE ON incidents
BEGIN
  DELETE FROM incidents_fts
  WHERE rowid = OLD.id;
END;
```

## Restored

Search vault trigger sync online — `incidents_fts` now stays automatically consistent with every insert and deletion.

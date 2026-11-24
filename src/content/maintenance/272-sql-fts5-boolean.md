---
id: maintenance-sql-fts5-boolean
language: sql
title: Query an FTS5 index with boolean AND/NOT filters
system: Search vault
symbol: instrument
scene: tests
skills: sql-fulltext-analytics
reviewSkill: sql-fulltext-analytics
prerequisite: sql-cohort-retention-sql
---

## Briefing

`notes_fts` is an FTS5 table containing outpost log notes. Find all notes mentioning `'solar'` that do **not** mention `'test'`.

## Objective

Write a `SELECT` query against `notes_fts` returning `note_id` for rows matching `'solar NOT test'`, ordered by `note_id ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `WHERE notes_fts MATCH 'solar NOT test'` and `ORDER BY note_id ASC`.

## Setup

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(note_id UNINDEXED, body);

INSERT INTO notes_fts (note_id, body) VALUES
  ('N-1', 'Solar array voltage stable at 48V'),
  ('N-2', 'Solar inverter bench test completed'),
  ('N-3', 'Cryo pump seal replaced'),
  ('N-4', 'East solar bus reconnected after storm');
```

## Starter

```sql
-- Return note_id from notes_fts matching 'solar NOT test' ordered by note_id ASC
```

## Checks

```python
expect(
    "returns solar notes excluding test notes",
    lambda: [columns, rows],
    [["note_id"], [["N-1"], ["N-4"]]],
)
```

## Hidden checks

```python
check(
    "uses FTS5 MATCH operator",
    lambda: sql_uses("MATCH"),
    "Query notes_fts with WHERE notes_fts MATCH 'solar NOT test'.",
)
```

## Solution

```sql
SELECT note_id
FROM notes_fts
WHERE notes_fts MATCH 'solar NOT test'
ORDER BY note_id ASC;
```

## Restored

Search vault boolean FTS5 query restored.

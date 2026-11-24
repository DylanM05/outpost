---
id: maintenance-sql-fix-fts5-rank
language: sql
title: Fix an FTS5 BM25 query that sorted scores in the wrong direction
system: Search vault
symbol: instrument
scene: tests
skills: sql-fulltext-analytics
reviewSkill: sql-fulltext-analytics
prerequisite: sql-cohort-retention-sql
---

## Briefing

An FTS5 search query is sorting by `bm25(logs_fts) DESC`, putting the *least* relevant match at the top! Remember: SQLite's `bm25()` returns **negative** scores where more negative = better match.

## Objective

Fix the `ORDER BY` direction so the most relevant `'valve'` match appears first (tie-breaking by `log_id ASC`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change `ORDER BY bm25(logs_fts) DESC` to `ORDER BY bm25(logs_fts) ASC, log_id ASC`.

## Setup

```sql
CREATE VIRTUAL TABLE logs_fts USING fts5(log_id UNINDEXED, body);

INSERT INTO logs_fts (log_id, body) VALUES
  ('L-1', 'Checked perimeter fence, minor valve rattle near gate nine'),
  ('L-2', 'Valve pressure valve seal valve replaced urgently'),
  ('L-3', 'Routine battery sweep nominal');
```

## Starter

```sql
SELECT log_id
FROM logs_fts
WHERE logs_fts MATCH 'valve'
ORDER BY bm25(logs_fts) DESC, log_id ASC;
```

## Checks

```python
expect(
    "places the highest-relevance BM25 match first",
    lambda: [columns, rows],
    [["log_id"], [["L-2"], ["L-1"]]],
)
```

## Hidden checks

```python
check(
    "sorts by bm25(logs_fts) ASC",
    lambda: sql_uses("bm25") and sql_uses("ASC"),
    "Order SQLite FTS5 results by bm25(logs_fts) ASC (more negative = better match).",
)
```

## Solution

```sql
SELECT log_id
FROM logs_fts
WHERE logs_fts MATCH 'valve'
ORDER BY bm25(logs_fts) ASC, log_id ASC;
```

## Restored

Search vault BM25 ordering fixed — the strongest matches now surface first.

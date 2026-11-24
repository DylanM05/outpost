---
id: sql-fts5-fulltext-search
kind: code
language: sql
title: Build and query an FTS5 full-text search index ranked with BM25
system: Search vault
symbol: instrument
scene: tests
skills: sql-fulltext-analytics
---

## Briefing

Searching thousands of maintenance manuals with `LIKE '%coolant%'` forces a full table scan and cannot rank relevance. SQLite ships **FTS5**, a built-in inverted full-text search engine with boolean queries and Okapi BM25 ranking.

## Objective

Write a SQL script that:
1. Creates an FTS5 virtual table `manuals_fts` with columns `doc_id UNINDEXED, title, body`.
2. Populates `manuals_fts` from every row in `manuals`.
3. Runs a `SELECT` query against `manuals_fts` returning `doc_id` and `title` for documents matching `'coolant AND valve'` (using `WHERE manuals_fts MATCH 'coolant AND valve'`), ordered by `bm25(manuals_fts) ASC, doc_id ASC` (in SQLite FTS5, more-negative `bm25()` scores mean *better* relevance!).

## Concept

- `CREATE VIRTUAL TABLE t USING fts5(col1 UNINDEXED, col2, col3);` creates a full-text inverted index. Marking `doc_id UNINDEXED` stores the ID without tokenizing it.
- Query with `WHERE t MATCH 'term1 AND term2'` (supports `AND`, `OR`, `NOT`, `"exact phrase"`, and `prefix*`).
- `bm25(t)` returns a **negative** floating-point relevance score (lower / more negative = more relevant), so always `ORDER BY bm25(t) ASC`!

## Hints

1. `CREATE VIRTUAL TABLE manuals_fts USING fts5(doc_id UNINDEXED, title, body);`
2. `INSERT INTO manuals_fts (doc_id, title, body) SELECT doc_id, title, body FROM manuals;`
3. `SELECT doc_id, title FROM manuals_fts WHERE manuals_fts MATCH 'coolant AND valve' ORDER BY bm25(manuals_fts) ASC, doc_id ASC;`

## Setup

```sql
CREATE TABLE manuals (
  doc_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

INSERT INTO manuals (doc_id, title, body) VALUES
  ('M-1', 'Solar Panel Cleaning',   'Dust removal and voltage checks for ridge arrays.'),
  ('M-2', 'Reactor Coolant Loop',   'Inspect the primary coolant valve and secondary coolant valve seals daily.'),
  ('M-3', 'Cryo Valve Spec',        'Emergency shutoff valve maintenance for coolant bypass lines.'),
  ('M-4', 'Coolant Tank Refill',    'Refill coolant reservoir whenever level drops below 40 percent.');
```

## Starter: guided

```sql
CREATE VIRTUAL TABLE manuals_fts USING fts5(doc_id UNINDEXED, title, body);
-- Populate manuals_fts from manuals, then SELECT doc_id, title matching 'coolant AND valve' ordered by bm25(manuals_fts) ASC
```

## Starter: standard

```sql
-- Create manuals_fts, populate from manuals, and run BM25-ranked FTS5 search for 'coolant AND valve'
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects doc_id and title",
    lambda: columns,
    ["doc_id", "title"],
)

expect(
    "returns documents matching both coolant and valve ranked by BM25 relevance",
    lambda: rows,
    [
        ["M-2", "Reactor Coolant Loop"],
        ["M-3", "Cryo Valve Spec"],
    ],
)

check(
    "uses FTS5, MATCH, and bm25",
    lambda: sql_uses("fts5") and sql_uses("MATCH") and sql_uses("bm25"),
    "Create an fts5 virtual table and rank MATCH results with bm25(manuals_fts).",
)
```

## Hidden checks

```python
expect(
    "supports FTS5 boolean NOT queries on the created manuals_fts index",
    lambda: query("SELECT doc_id FROM manuals_fts WHERE manuals_fts MATCH 'coolant NOT valve' ORDER BY doc_id ASC"),
    [["M-4"]],
)
```

## Solution

```sql
CREATE VIRTUAL TABLE manuals_fts USING fts5(
  doc_id UNINDEXED,
  title,
  body
);

INSERT INTO manuals_fts (doc_id, title, body)
SELECT doc_id, title, body FROM manuals;

SELECT doc_id, title
FROM manuals_fts
WHERE manuals_fts MATCH 'coolant AND valve'
ORDER BY bm25(manuals_fts) ASC, doc_id ASC;
```

## Restored

Search vault FTS5 index online — full-text boolean queries now rank manuals directly by BM25 score.

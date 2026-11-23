---
id: sql-select-projection-trace
kind: predict
language: sql
title: Trace SELECT projection, column aliases, and ORDER BY LIMIT
system: Catalog desk
symbol: instrument
scene: console
skills: sql-queries, reading-code
---

## Briefing

The outpost's telemetry archive has been migrated from flat files into a relational SQL database inside the query vault. Before writing queries against live hardware tables, trace how a `SELECT` query filters rows with `WHERE`, renames projected columns with `AS`, sorts with `ORDER BY`, and caps results with `LIMIT`.

## Objective

Read the schema setup and the `SELECT` query in `## Program`, then predict **every line of output** (starting with the `" | "`-separated column header row, followed by each result row).

## Concept

- A SQL query executes logically in this order:
  1. `FROM beacons` — loads rows from the source table.
  2. `WHERE online = 1` — keeps only rows where the predicate is true.
  3. `SELECT code AS beacon, sector, kw * 2 AS boost_kw` — projects expressions and assigns output column names (`AS`).
  4. `ORDER BY kw DESC, code ASC` — sorts matching rows (highest `kw` first, breaking ties alphabetically by `code`).
  5. `LIMIT 3` — keeps only the first 3 rows after sorting.
- The SQL harness prints the column headers joined by `" | "` on line 1, followed by each row's values joined by `" | "`.

## Hints

1. Filter `beacons` to rows where `online = 1`: `B-01` (120), `B-03` (150), `B-04` (120), `B-05` (90). (`B-02` has `online = 0`.)
2. Sort those 4 rows by `kw DESC, code ASC`: `B-03` (150), then `B-01` (120), then `B-04` (120), then `B-05` (90).
3. `LIMIT 3` keeps the first 3 rows (`B-03`, `B-01`, `B-04`), and projects `beacon | sector | boost_kw` where `boost_kw` is `kw * 2`.

## Setup

```sql
CREATE TABLE beacons (
  code TEXT PRIMARY KEY,
  sector TEXT NOT NULL,
  kw INTEGER NOT NULL,
  online INTEGER NOT NULL
);

INSERT INTO beacons (code, sector, kw, online) VALUES
  ('B-01', 'north', 120, 1),
  ('B-02', 'south', 200, 0),
  ('B-03', 'east',  150, 1),
  ('B-04', 'north', 120, 1),
  ('B-05', 'west',   90, 1);
```

## Program

```sql
SELECT
  code AS beacon,
  sector,
  kw * 2 AS boost_kw
FROM beacons
WHERE online = 1
ORDER BY kw DESC, code ASC
LIMIT 3;
```

## Output

```text
beacon | sector | boost_kw
B-03 | east | 300
B-01 | north | 240
B-04 | north | 240
```

## Restored

Catalog desk projection trace verified — `WHERE` filters before `ORDER BY` and `LIMIT`, and `AS` aliases label the output columns.
